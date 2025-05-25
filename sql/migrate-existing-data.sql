-- 기존 데이터를 멀티 스페이스 구조로 마이그레이션
-- sql/migrate-existing-data.sql

-- 1. 기본 스페이스 생성
DO $$
DECLARE
    default_space_id UUID;
    default_team_id UUID;
BEGIN
    -- 기본 스페이스가 없으면 생성
    IF NOT EXISTS (SELECT 1 FROM public.spaces WHERE slug = 'default') THEN
        -- 첫 번째 사용자를 찾아서 스페이스 생성자로 설정
        INSERT INTO public.spaces (name, description, slug, created_by)
        SELECT 
            'Default Workspace',
            'Default workspace for all users',
            'default',
            id
        FROM auth.users
        LIMIT 1
        RETURNING id INTO default_space_id;
    ELSE
        SELECT id INTO default_space_id FROM public.spaces WHERE slug = 'default';
    END IF;

    -- 2. 모든 기존 사용자를 기본 스페이스에 추가
    INSERT INTO public.user_spaces (user_id, space_id, role, is_default)
    SELECT 
        p.id,
        default_space_id,
        'member',
        TRUE
    FROM public.profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_spaces us 
        WHERE us.user_id = p.id AND us.space_id = default_space_id
    );

    -- 3. 기존 teams를 기본 스페이스에 연결
    UPDATE public.teams
    SET space_id = default_space_id
    WHERE space_id IS NULL;

    -- 기본 팀 ID 가져오기
    SELECT id INTO default_team_id FROM public.teams LIMIT 1;

    -- 4. 기존 todos를 기본 스페이스에 연결하고 공유 설정
    UPDATE public.todos
    SET 
        space_id = default_space_id,
        is_shared = TRUE
    WHERE space_id IS NULL;

    -- 5. 모든 사용자에 대해 user_settings 생성
    INSERT INTO public.user_settings (user_id, default_space_id)
    SELECT p.id, default_space_id
    FROM public.profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_settings us WHERE us.user_id = p.id
    );

END $$;
