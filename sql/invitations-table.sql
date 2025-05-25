-- invitations 테이블 생성
CREATE TABLE invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_space_id ON invitations(space_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

-- RLS 정책
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 스페이스 관리자는 초대 생성 가능
CREATE POLICY "Space admins can create invitations" ON invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = invitations.space_id
      AND space_members.user_id = auth.uid()
      AND space_members.role = 'admin'
      AND space_members.is_active = true
    )
  );

-- 스페이스 멤버는 자신의 스페이스 초대 목록 조회 가능
CREATE POLICY "Space members can view space invitations" ON invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = invitations.space_id
      AND space_members.user_id = auth.uid()
      AND space_members.is_active = true
    )
  );

-- 토큰으로 초대 조회 (공개)
CREATE POLICY "Anyone can view invitation by token" ON invitations
  FOR SELECT
  USING (token = current_setting('app.current_invitation_token', true));

-- 스페이스 관리자는 초대 취소 가능
CREATE POLICY "Space admins can cancel invitations" ON invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = invitations.space_id
      AND space_members.user_id = auth.uid()
      AND space_members.role = 'admin'
      AND space_members.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = invitations.space_id
      AND space_members.user_id = auth.uid()
      AND space_members.role = 'admin'
      AND space_members.is_active = true
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 만료된 초대 자동 업데이트 함수
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 초대 수락 함수
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token TEXT)
RETURNS jsonb AS $$
DECLARE
  v_invitation invitations;
  v_user_id UUID;
  v_result jsonb;
BEGIN
  -- 현재 사용자 ID 가져오기
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- 초대 찾기
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = invitation_token
  AND status = 'pending'
  AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- 이미 멤버인지 확인
  IF EXISTS (
    SELECT 1 FROM space_members
    WHERE space_id = v_invitation.space_id
    AND user_id = v_user_id
    AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member of this space');
  END IF;

  -- 초대 수락
  UPDATE invitations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by = v_user_id
  WHERE id = v_invitation.id;

  -- 스페이스 멤버로 추가
  INSERT INTO space_members (space_id, user_id, role, is_active)
  VALUES (v_invitation.space_id, v_user_id, v_invitation.role, true)
  ON CONFLICT (space_id, user_id) 
  DO UPDATE SET is_active = true, role = EXCLUDED.role;

  -- 결과 반환
  SELECT jsonb_build_object(
    'success', true,
    'space_id', v_invitation.space_id,
    'role', v_invitation.role
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
