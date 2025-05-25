# Teamo 데이터베이스 현황 분석

## 현재 테이블 구조

### 1. profiles (사용자 프로필)
- id (uuid, PK)
- email (text, unique)
- full_name (text)
- avatar_url (text)
- created_at, updated_at

### 2. teams (팀)
- id (uuid, PK)
- name (text)
- description (text)
- created_at, updated_at

### 3. team_members (팀 멤버)
- id (uuid, PK)
- team_id (uuid, FK → teams)
- user_id (uuid, FK → profiles)
- role (text: 'admin' | 'member')
- created_at, updated_at

### 4. todos (할일)
- id (uuid, PK)
- title (text)
- description (text)
- due_date (timestamptz)
- status (text: 'pending' | 'in_progress' | 'completed')
- user_id (uuid, FK → profiles)
- team_id (uuid, FK → teams)
- labels (jsonb)
- estimated_hours (int)
- created_at, updated_at

### 5. advanced_memos (개인 메모)
- 개인 메모 시스템 (팀과 무관)

### 6. team_memos (팀 메모)
- 팀 공유 메모 시스템

### 7. calendar_subscriptions
- 캘린더 구독 기능

## 현재 시스템의 문제점

1. **단일 팀 구조**: 현재는 하나의 팀(team_id)에만 속할 수 있는 구조
2. **공유 설정 부재**: todos가 무조건 팀에 공유되는 구조
3. **스페이스 개념 부재**: 여러 조직/팀을 구분할 수 있는 상위 개념 없음
4. **기본 스페이스 설정 불가**: 주로 사용하는 스페이스 설정 기능 없음

## 개선 방향

1. **멀티 스페이스 지원**: 사용자가 여러 스페이스에 속할 수 있도록
2. **선택적 공유**: 할일을 개인용/팀 공유용으로 구분
3. **스페이스 컨텍스트**: 현재 작업 중인 스페이스 개념 도입
4. **통합 뷰**: 모든 스페이스의 내 할일을 볼 수 있는 대시보드
