## RLS 정책 수정 완료

user_spaces 테이블의 무한 재귀 문제를 해결했습니다.

### 수정된 정책들:
1. Users can view own memberships - 사용자는 자신의 멤버십만 조회
2. Admins can view space memberships - 관리자는 스페이스의 모든 멤버십 조회
3. Admins can add members - 관리자는 멤버 추가 가능
4. Admins can update memberships - 관리자는 멤버십 업데이트 가능
5. Admins can remove members - 관리자는 멤버 제거 가능 (소유자 제외)
6. Users can leave spaces - 사용자는 스페이스 탈퇴 가능 (소유자 제외)

