-- 팀 스페이스 기능을 위한 데이터베이스 스키마 확장

-- 1. 팀 스페이스 테이블 생성
CREATE TABLE IF NOT EXISTS team_spaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  avatar_url TEXT,
  color_theme VARCHAR(20) DEFAULT 'blue' CHECK (color_theme IN ('blue', 'purple', 'green', 'orange', 'pink', 'indigo')),
  settings JSONB DEFAULT '{}',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 팀 멤버 테이블 생성
CREATE TABLE IF NOT EXISTS team_space_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_space_id UUID NOT NULL REFERENCES team_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_active_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(team_space_id, user_id)
);

-- 3. 팀 초대 테이블 생성
CREATE TABLE IF NOT EXISTS team_space_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_space_id UUID NOT NULL REFERENCES team_spaces(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token VARCHAR(255) UNIQUE NOT NULL,
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 4. 기존 todos 테이블에 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='team_space_id') THEN
        ALTER TABLE todos ADD COLUMN team_space_id UUID REFERENCES team_spaces(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='is_shared_to_team') THEN
        ALTER TABLE todos ADD COLUMN is_shared_to_team BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='assignee_id') THEN
        ALTER TABLE todos ADD COLUMN assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='labels') THEN
        ALTER TABLE todos ADD COLUMN labels JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='todos' AND column_name='estimated_hours') THEN
        ALTER TABLE todos ADD COLUMN estimated_hours INTEGER;
    END IF;
END $$;

-- 5. 팀 활동 로그 테이블 생성
CREATE TABLE IF NOT EXISTS team_space_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_space_id UUID NOT NULL REFERENCES team_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_team_spaces_owner_id ON team_spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_space_members_team_space_id ON team_space_members(team_space_id);
CREATE INDEX IF NOT EXISTS idx_team_space_members_user_id ON team_space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_space_activities_team_space_id ON team_space_activities(team_space_id);
CREATE INDEX IF NOT EXISTS idx_todos_team_space_id ON todos(team_space_id);
CREATE INDEX IF NOT EXISTS idx_todos_is_shared_to_team ON todos(is_shared_to_team);
CREATE INDEX IF NOT EXISTS idx_todos_assignee_id ON todos(assignee_id);

-- 7. RLS 정책 설정
ALTER TABLE team_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_space_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_space_activities ENABLE ROW LEVEL SECURITY;

-- 팀 스페이스 조회 정책
DROP POLICY IF EXISTS "Users can view their team spaces" ON team_spaces;
CREATE POLICY "Users can view their team spaces" ON team_spaces
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT team_space_id FROM team_space_members WHERE user_id = auth.uid()
    )
  );