# Teamo 멀티 스페이스 마이그레이션 전략

## 1. 마이그레이션 순서

### Phase 1: 스키마 추가 (Breaking Changes 없음)
1. 새로운 테이블 생성 (spaces, user_spaces, space_invitations, user_settings)
2. 기존 테이블에 컬럼 추가 (teams.space_id, todos.space_id, todos.is_shared)
3. 인덱스 및 RLS 정책 생성

### Phase 2: 데이터 마이그레이션
1. 기본 "Default Space" 생성
2. 모든 기존 사용자를 Default Space에 연결
3. 기존 team을 Default Space에 연결
4. 모든 todos를 Default Space에 연결하고 is_shared = true 설정

### Phase 3: 애플리케이션 코드 업데이트
1. 스페이스 컨텍스트 관리 로직 추가
2. API 엔드포인트 수정
3. UI 컴포넌트 업데이트

### Phase 4: 이전 로직 제거
1. 기존 단일 팀 기반 로직 제거
2. 불필요한 코드 정리

## 2. 데이터 마이그레이션 스크립트

```sql
-- 기본 스페이스 생성
INSERT INTO public.spaces (id, name, description, slug, created_by)
SELECT 
    gen_random_uuid(),
    'Default Workspace',
    'Default workspace for all users',
    'default',
    (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.spaces WHERE slug = 'default');

-- 모든 사용자를 기본 스페이스에 추가
INSERT INTO public.user_spaces (user_id, space_id, role, is_default)
SELECT 
    p.id,
    (SELECT id FROM public.spaces WHERE slug = 'default'),
    'member',
    TRUE
FROM public.profiles p
ON CONFLICT (user_id, space_id) DO NOTHING;

-- 기존 teams를 기본 스페이스에 연결
UPDATE public.teams
SET space_id = (SELECT id FROM public.spaces WHERE slug = 'default')
WHERE space_id IS NULL;

-- 기존 todos를 기본 스페이스에 연결하고 공유 설정
UPDATE public.todos
SET 
    space_id = (SELECT id FROM public.spaces WHERE slug = 'default'),
    is_shared = TRUE
WHERE space_id IS NULL;
```

## 3. 롤백 계획

모든 변경사항은 추가적인 것이므로 롤백이 필요한 경우:
1. 새로 추가된 테이블 DROP
2. 추가된 컬럼 DROP
3. 변경된 RLS 정책 복원

## 4. 테스트 시나리오

1. **기존 기능 유지 확인**
   - 기존 사용자 로그인
   - 기존 할일 조회/생성/수정/삭제
   - 팀 메모 기능

2. **새 기능 테스트**
   - 스페이스 생성
   - 스페이스 전환
   - 할일 공유/비공유 토글
   - 통합 대시보드

3. **권한 테스트**
   - 다른 스페이스 접근 차단
   - 비공유 할일 보안
   - 초대 기능
