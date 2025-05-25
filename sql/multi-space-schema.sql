-- Teamo 멀티 스페이스 지원을 위한 데이터베이스 스키마
-- 작성일: 2025-05-25

-- ============================================
-- 1. 스페이스 (spaces) 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS public.spaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 스페이스 RLS 활성화
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. 사용자-스페이스 관계 (user_spaces) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_spaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    is_default BOOLEAN DEFAULT FALSE, -- 기본 스페이스 여부
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, space_id)
);

-- user_spaces RLS 활성화
ALTER TABLE public.user_spaces ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. 스페이스 초대 (space_invitations) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public.space_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    token TEXT UNIQUE NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- space_invitations RLS 활성화
ALTER TABLE public.space_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. teams 테이블 수정 (스페이스 연결)
-- ============================================
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE;

-- 기존 team을 기본 스페이스로 마이그레이션하기 위한 임시 처리
-- 실제 마이그레이션 시 별도 스크립트 필요

-- ============================================
-- 5. todos 테이블 수정 (공유 설정 추가)
-- ============================================
ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- team_id는 유지하되, space_id와 함께 사용
-- is_shared가 true일 때만 팀에서 볼 수 있음

-- ============================================
-- 6. 사용자 설정 (user_settings) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    default_space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_settings RLS 활성화
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. 인덱스 생성
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_spaces_user_id ON public.user_spaces(user_id);
CREATE INDEX IF NOT EXISTS idx_user_spaces_space_id ON public.user_spaces(space_id);
CREATE INDEX IF NOT EXISTS idx_todos_space_id ON public.todos(space_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_space ON public.todos(user_id, space_id);
CREATE INDEX IF NOT EXISTS idx_teams_space_id ON public.teams(space_id);
CREATE INDEX IF NOT EXISTS idx_space_invitations_token ON public.space_invitations(token);
CREATE INDEX IF NOT EXISTS idx_space_invitations_email ON public.space_invitations(email);

-- ============================================
-- 8. RLS 정책 설정
-- ============================================

-- Spaces RLS Policies
CREATE POLICY "Users can view spaces they belong to"
ON public.spaces FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_spaces
        WHERE user_spaces.space_id = spaces.id
        AND user_spaces.user_id = auth.uid()
    )
);

CREATE POLICY "Space owners can update their spaces"
ON public.spaces FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Anyone can create a space"
ON public.spaces FOR INSERT
WITH CHECK (created_by = auth.uid());

-- User Spaces RLS Policies
CREATE POLICY "Users can view their space memberships"
ON public.user_spaces FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Space admins can manage memberships"
ON public.user_spaces FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_spaces us
        WHERE us.space_id = user_spaces.space_id
        AND us.user_id = auth.uid()
        AND us.role IN ('owner', 'admin')
    )
);

-- Todos RLS Policies (수정)
DROP POLICY IF EXISTS "Users can view team todos" ON public.todos;
DROP POLICY IF EXISTS "Users can create todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON public.todos;

CREATE POLICY "Users can view their own todos and shared team todos"
ON public.todos FOR SELECT
USING (
    user_id = auth.uid() 
    OR (
        is_shared = TRUE 
        AND EXISTS (
            SELECT 1 FROM public.user_spaces us
            JOIN public.teams t ON t.space_id = us.space_id
            WHERE us.user_id = auth.uid()
            AND t.id = todos.team_id
        )
    )
);

CREATE POLICY "Users can create todos in their spaces"
ON public.todos FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.user_spaces
        WHERE user_spaces.user_id = auth.uid()
        AND user_spaces.space_id = todos.space_id
    )
);

CREATE POLICY "Users can update their own todos"
ON public.todos FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own todos"
ON public.todos FOR DELETE
USING (user_id = auth.uid());

-- Space Invitations RLS Policies
CREATE POLICY "Space admins can view invitations"
ON public.space_invitations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_spaces
        WHERE user_spaces.space_id = space_invitations.space_id
        AND user_spaces.user_id = auth.uid()
        AND user_spaces.role IN ('owner', 'admin')
    )
);

CREATE POLICY "Space admins can create invitations"
ON public.space_invitations FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_spaces
        WHERE user_spaces.space_id = space_invitations.space_id
        AND user_spaces.user_id = auth.uid()
        AND user_spaces.role IN ('owner', 'admin')
    )
);

-- User Settings RLS Policies
CREATE POLICY "Users can view their own settings"
ON public.user_settings FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
ON public.user_settings FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings"
ON public.user_settings FOR INSERT
WITH CHECK (user_id = auth.uid());
