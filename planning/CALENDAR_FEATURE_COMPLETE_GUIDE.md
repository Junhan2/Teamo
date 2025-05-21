# Team Todo 캘린더 기능 완전 가이드 📅

## 📖 목차
1. [개요](#개요)
2. [기능 명세](#기능-명세)
3. [기술 스택 및 아키텍처](#기술-스택-및-아키텍처)
4. [데이터베이스 스키마](#데이터베이스-스키마)
5. [컴포넌트 구조](#컴포넌트-구조)
6. [API 및 데이터 흐름](#api-및-데이터-흐름)
7. [UI/UX 디자인 가이드](#uiux-디자인-가이드)
8. [보안 및 권한 관리](#보안-및-권한-관리)
9. [배포 및 설정](#배포-및-설정)
10. [사용법 및 사용자 가이드](#사용법-및-사용자-가이드)
11. [개발자 가이드](#개발자-가이드)
12. [문제 해결](#문제-해결)
13. [향후 개발 계획](#향후-개발-계획)

---

## 개요

Team Todo 캘린더 기능은 기존의 할일 관리 시스템을 시각적인 월별 캘린더 형태로 확장한 기능입니다. 팀원들과의 협업을 위한 구독 시스템을 통해 팀 캘린더 관리와 개인 할일 관리를 동시에 제공합니다.

### 🎯 핵심 가치
- **시각적 할일 관리**: 달력 형태로 마감일과 일정을 한눈에 파악
- **팀 협업 강화**: 팀원들의 일정을 구독하여 협업 효율성 증대
- **실시간 동기화**: Supabase 실시간 기능을 통한 즉시 업데이트
- **일관된 사용자 경험**: 기존 할일 관리 시스템과 완벽한 통합

---

## 기능 명세

### ✨ 핵심 기능

#### 1. 캘린더 뷰
- **월별 캘린더**: 전통적인 달력 형태의 UI
- **날짜별 할일 표시**: 각 날짜 셀에 해당일의 할일들이 컴팩트하게 표시
- **상태별 색상 구분**: 
  - 🟡 대기중 (pending): 노란색 (#FFDA40)
  - 🟣 진행중 (in_progress): 핑크색 (#FF82C2)
  - 🟢 완료 (completed): 초록색 (#5AD363)
- **할일 개수 표시**: 하루에 여러 할일이 있을 때 개수 배지 표시

#### 2. 네비게이션 및 필터링
- **월 네비게이션**: 이전/다음 달, 오늘로 이동 버튼
- **상태 필터**: 전체, 대기중, 진행중, 완료 상태별 필터링
- **완료된 할일 토글**: 완료된 할일 표시/숨김 스위치

#### 3. 팀원 구독 시스템
- **구독 관리 패널**: 접었다 펼 수 있는 팀원 목록
- **선택적 구독**: 원하는 팀원만 선택하여 구독
- **일괄 선택**: "전체 선택" / "전체 해제" 기능
- **설정 저장**: 구독 설정을 데이터베이스에 영구 저장

#### 4. 할일 상세 관리
- **날짜 선택**: 특정 날짜 클릭으로 해당일 할일 상세 보기
- **상태 변경**: 내 할일의 상태를 캘린더에서 직접 변경
- **할일 정보**: 제목, 설명, 마감시간, 담당자 표시
- **팀원 구분**: 내 할일과 구독한 팀원의 할일을 시각적으로 구분

#### 5. 실시간 업데이트
- **Supabase 실시간**: 할일 추가/수정/삭제 시 즉시 캘린더 반영
- **구독 업데이트**: 팀원이 할일을 변경하면 구독자 캘린더에 반영
- **상태 동기화**: 할일 목록과 캘린더 간 실시간 동기화

### 🔄 사용자 워크플로우

1. **캘린더 접속**: 하단 플로팅 버튼 또는 `/calendar` URL로 접속
2. **팀원 구독**: 우측 패널에서 보고 싶은 팀원들 선택 및 저장
3. **할일 확인**: 캘린더에서 날짜별로 할일 시각적 확인
4. **상세 보기**: 원하는 날짜 클릭하여 상세 할일 목록 확인
5. **상태 관리**: 내 할일의 상태를 드롭다운으로 변경
6. **필터링**: 필요에 따라 상태별 필터링으로 집중해서 보기

---

## 기술 스택 및 아키텍처

### 🛠️ 기술 스택

**Frontend:**
- **Next.js 15.2.4**: React 기반 풀스택 프레임워크
- **TypeScript**: 타입 안정성 보장
- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **Framer Motion**: 부드러운 애니메이션 및 트랜지션
- **Radix UI**: 접근성이 보장된 헤드리스 UI 컴포넌트
- **date-fns**: 날짜 계산 및 포맷팅
- **Lucide React**: 아이콘 라이브러리

**Backend & Database:**
- **Supabase**: PostgreSQL 기반 백엔드 서비스
- **Row Level Security (RLS)**: 데이터 보안 정책
- **실시간 구독**: PostgreSQL 변경 사항 실시간 감지

**배포 & 호스팅:**
- **Vercel**: 프론트엔드 배포 플랫폼
- **GitHub Actions**: CI/CD 파이프라인 (자동 배포)

### 🏗️ 아키텍처 다이어그램

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   사용자 브라우저    │    │   Next.js Frontend   │    │   Supabase DB    │
│                 │    │                  │    │                 │
│ - 캘린더 UI      │◄──►│ - CalendarView   │◄──►│ - todos         │
│ - 구독 관리      │    │ - Subscription   │    │ - profiles      │
│ - 실시간 업데이트  │    │ - Real-time      │    │ - calendar_     │
│                 │    │   subscriptions  │    │   subscriptions │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 📁 파일 구조

```
Team1/
├── app/(protected)/calendar/
│   └── page.tsx                    # 캘린더 페이지 라우트
├── components/Calendar/
│   ├── CalendarView.tsx            # 메인 캘린더 컴포넌트
│   ├── CalendarPage.tsx            # 캘린더 페이지 래퍼
│   └── TeamMemberSubscription.tsx  # 구독 관리 컴포넌트
├── sql/
│   └── create_calendar_subscriptions.sql # DB 마이그레이션
└── docs/
    ├── CALENDAR_FEATURE.md         # 기능 명세서
    ├── CALENDAR_IMPLEMENTATION.md  # 구현 가이드
    └── CALENDAR_FEATURE_COMPLETE_GUIDE.md # 이 문서
```

---

## 데이터베이스 스키마

### 📊 테이블 구조

#### 1. calendar_subscriptions (신규)
```sql
CREATE TABLE calendar_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscribed_to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 제약 조건
  UNIQUE(user_id, subscribed_to_user_id),  -- 중복 구독 방지
  CHECK (user_id != subscribed_to_user_id) -- 자기 자신 구독 방지
);
```

#### 2. 기존 테이블 활용
- **todos**: 할일 데이터 (due_date 필드 활용)
- **profiles**: 사용자 프로필 정보
- **teams**: 팀 정보
- **team_members**: 팀 멤버십 관리

### 🔒 보안 정책 (RLS)

```sql
-- 조회 권한: 자신의 구독만 볼 수 있음
CREATE POLICY "Users can view their own calendar subscriptions" 
  ON calendar_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- 생성 권한: 자신의 구독만 만들 수 있음
CREATE POLICY "Users can create their own calendar subscriptions" 
  ON calendar_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 수정 권한: 자신의 구독만 수정할 수 있음
CREATE POLICY "Users can update their own calendar subscriptions" 
  ON calendar_subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);

-- 삭제 권한: 자신의 구독만 삭제할 수 있음
CREATE POLICY "Users can delete their own calendar subscriptions" 
  ON calendar_subscriptions FOR DELETE 
  USING (auth.uid() = user_id);
```

### ⚡ 성능 최적화

```sql
-- 성능을 위한 인덱스
CREATE INDEX idx_calendar_subscriptions_user_id 
  ON calendar_subscriptions(user_id);
CREATE INDEX idx_calendar_subscriptions_subscribed_to_user_id 
  ON calendar_subscriptions(subscribed_to_user_id);
CREATE INDEX idx_calendar_subscriptions_created_at 
  ON calendar_subscriptions(created_at);

-- 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_calendar_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_subscriptions_updated_at
  BEFORE UPDATE ON calendar_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_subscriptions_updated_at();
```

---

## 컴포넌트 구조

### 🧩 주요 컴포넌트

#### 1. CalendarView.tsx
**역할**: 메인 캘린더 UI 및 할일 표시
**주요 기능**:
- 월별 캘린더 그리드 생성
- 날짜별 할일 표시
- 상태 필터링
- 선택된 날짜의 할일 상세 보기
- 실시간 데이터 업데이트

**Props**:
```typescript
interface CalendarViewProps {
  userId?: string
  onTaskUpdate?: () => void
  showCompletedTasks?: boolean
  subscribedUserIds?: string[]
}
```

**주요 상태**:
```typescript
const [currentDate, setCurrentDate] = useState(new Date())
const [todos, setTodos] = useState<Todo[]>([])
const [selectedDate, setSelectedDate] = useState<Date | null>(null)
const [selectedTodos, setSelectedTodos] = useState<Todo[]>([])
const [statusFilter, setStatusFilter] = useState<string | null>(null)
```

#### 2. TeamMemberSubscription.tsx
**역할**: 팀원 구독 관리 인터페이스
**주요 기능**:
- 팀원 목록 표시
- 구독 상태 관리
- 일괄 선택/해제
- 서버에 구독 설정 저장

**Props**:
```typescript
interface TeamMemberSubscriptionProps {
  userId: string
  onSubscriptionChange: (subscribedUserIds: string[]) => void
}
```

#### 3. CalendarPage.tsx
**역할**: 캘린더 페이지 전체 레이아웃 및 상태 관리
**주요 기능**:
- 전체 페이지 레이아웃
- 완료된 할일 표시 토글
- 구독된 사용자 ID 상태 관리
- 캘린더뷰와 구독 컴포넌트 연결

### 🔄 컴포넌트 상호작용

```
CalendarPage (페이지 레벨)
├── 상태 관리: showCompletedTasks, subscribedUserIds
├── 이벤트 핸들링: handleSubscriptionChange, handleTaskUpdate
│
├── CalendarView (캘린더 메인)
│   ├── Props: userId, subscribedUserIds, showCompletedTasks
│   ├── 기능: 할일 표시, 상태 변경, 날짜 선택
│   └── 실시간 업데이트: Supabase 구독
│
└── TeamMemberSubscription (구독 관리)
    ├── Props: userId, onSubscriptionChange
    ├── 기능: 팀원 목록, 구독 설정
    └── 데이터: profiles, calendar_subscriptions
```

---

## API 및 데이터 흐름

### 🔌 Supabase 쿼리

#### 1. 할일 데이터 조회
```typescript
// 캘린더용 할일 조회 (마감일이 있는 것만)
const fetchTodos = async () => {
  let userIds = [userId]
  if (subscribedUserIds.length > 0) {
    userIds = [...userIds, ...subscribedUserIds]
  }
  
  let query = supabase
    .from('todos')
    .select(`
      *,
      user:profiles(full_name, email)
    `)
    .not('due_date', 'is', null)
    .in('user_id', userIds)
    .order('due_date', { ascending: true })
  
  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }
  
  if (!showCompletedTasks) {
    query = query.neq('status', 'completed')
  }
  
  const { data, error } = await query
  return data
}
```

#### 2. 구독 관리
```typescript
// 구독 목록 조회
const fetchSubscriptions = async () => {
  const { data, error } = await supabase
    .from('calendar_subscriptions')
    .select('*')
    .eq('user_id', userId)
  return data
}

// 구독 설정 저장
const saveSubscriptions = async (subscribedUserIds: string[]) => {
  // 기존 구독 삭제
  await supabase
    .from('calendar_subscriptions')
    .delete()
    .eq('user_id', userId)
  
  // 새 구독 추가
  if (subscribedUserIds.length > 0) {
    const newSubscriptions = subscribedUserIds.map(subUserId => ({
      user_id: userId,
      subscribed_to_user_id: subUserId,
    }))
    
    await supabase
      .from('calendar_subscriptions')
      .insert(newSubscriptions)
  }
}
```

#### 3. 실시간 구독
```typescript
// 할일 변경 실시간 감지
useEffect(() => {
  if (userId) {
    const calendarChannel = supabase
      .channel(`calendar-updates-${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'todos',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchTodos() // 데이터 새로고침
      })
      .subscribe()

    return () => {
      supabase.removeChannel(calendarChannel)
    }
  }
}, [userId, statusFilter, showCompletedTasks, subscribedUserIds])
```

### 📊 데이터 흐름 다이어그램

```
사용자 액션
    ↓
컴포넌트 상태 업데이트
    ↓
Supabase 쿼리 실행
    ↓
PostgreSQL 데이터베이스
    ↓
실시간 변경 감지 (Realtime)
    ↓
다른 사용자 UI 자동 업데이트
```

---

## UI/UX 디자인 가이드

### 🎨 디자인 시스템

#### 1. 색상 팔레트
```css
/* 기본 배경 및 컨테이너 */
--bg-primary: #292c33;      /* 메인 배경 */
--bg-secondary: #1F2125;    /* 카드 배경 */
--bg-tertiary: #3F4249;     /* 버튼 배경 */

/* 상태별 색상 */
--status-pending: #FFDA40;    /* 대기중 - 노란색 */
--status-progress: #FF82C2;   /* 진행중 - 핑크색 */
--status-completed: #5AD363;  /* 완료 - 초록색 */

/* 액센트 색상 */
--accent-primary: #FF82C2;    /* 메인 액센트 */
--accent-blue: #60a5fa;       /* 파란색 액센트 */

/* 텍스트 색상 */
--text-primary: #ffffff;      /* 기본 텍스트 */
--text-secondary: #8B949E;    /* 보조 텍스트 */
--text-muted: #6B7280;        /* 비활성 텍스트 */

/* 경계선 */
--border-primary: #464c58;    /* 기본 경계선 */
--border-secondary: #2a2a3c;  /* 보조 경계선 */
```

#### 2. 타이포그래피
```css
/* 폰트 시스템 */
font-family: 'Inter', system-ui, sans-serif;

/* 크기별 텍스트 */
.text-xl { font-size: 1.25rem; font-weight: 600; }     /* 페이지 제목 */
.text-lg { font-size: 1.125rem; font-weight: 500; }    /* 섹션 제목 */
.text-base { font-size: 1rem; font-weight: 400; }      /* 기본 텍스트 */
.text-sm { font-size: 0.875rem; font-weight: 400; }    /* 보조 텍스트 */
.text-xs { font-size: 0.75rem; font-weight: 400; }     /* 캡션 */

/* 특수 스타일 */
.text-uppercase {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 500;
}
```

#### 3. 컴포넌트 스타일

**캘린더 그리드**:
```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.calendar-day {
  min-height: 100px;
  padding: 0.25rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.375rem;
  background: var(--bg-primary);
  transition: all 0.2s ease;
}

.calendar-day:hover {
  border-color: var(--border-secondary);
  transform: scale(1.02);
}

.calendar-day.selected {
  border-color: var(--accent-primary);
  background: rgba(255, 130, 194, 0.05);
}
```

**할일 카드**:
```css
.todo-card {
  font-size: 0.75rem;
  padding: 0.25rem;
  border-radius: 0.25rem;
  background: var(--bg-secondary);
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.todo-card.completed {
  background: rgba(90, 211, 99, 0.1);
  opacity: 0.7;
}
```

### 📱 반응형 디자인

#### 1. 브레이크포인트
```css
/* 모바일 */
@media (max-width: 768px) {
  .calendar-grid {
    gap: 0.125rem;
  }
  
  .calendar-day {
    min-height: 80px;
    padding: 0.125rem;
  }
  
  .todo-card {
    font-size: 0.625rem;
  }
}

/* 태블릿 */
@media (min-width: 769px) and (max-width: 1024px) {
  .calendar-day {
    min-height: 90px;
  }
}

/* 데스크톱 */
@media (min-width: 1025px) {
  .calendar-day {
    min-height: 100px;
  }
}
```

#### 2. 모바일 최적화
- **터치 친화적**: 최소 44px 터치 영역 보장
- **스와이프 네비게이션**: 좌우 스와이프로 월 이동 (향후 구현 예정)
- **접을 수 있는 패널**: 화면 공간 최적화를 위한 아코디언 UI

### ✨ 애니메이션 가이드

#### 1. Framer Motion 설정
```typescript
const snappyTransition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 1,
}

const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: snappyTransition
}
```

#### 2. 주요 애니메이션
- **페이지 전환**: 부드러운 페이드인 효과
- **캘린더 셀 호버**: 미세한 확대 효과 (scale: 1.02)
- **할일 카드**: 나타날 때 아래에서 위로 슬라이드
- **패널 토글**: 높이 애니메이션으로 부드러운 확장/축소

---

## 보안 및 권한 관리

### 🔐 인증 및 권한

#### 1. 사용자 인증
```typescript
// 페이지 접근 시 인증 확인
useEffect(() => {
  const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      router.push('/auth/login')
      return
    }
    
    setUser(session.user)
  }
  
  checkSession()
}, [])
```

#### 2. 데이터 접근 권한
- **개인 할일**: 본인이 생성한 할일만 수정/삭제 가능
- **팀 할일**: 구독한 팀원의 할일은 읽기 전용
- **구독 관리**: 본인의 구독 설정만 관리 가능

#### 3. RLS 정책 상세

**calendar_subscriptions 테이블**:
```sql
-- 사용자는 자신의 구독 정보만 접근 가능
CREATE POLICY "calendar_subscriptions_policy" 
  ON calendar_subscriptions 
  USING (auth.uid() = user_id);

-- 구독 대상자는 실제 존재하는 사용자여야 함
CREATE POLICY "valid_subscription_target" 
  ON calendar_subscriptions 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = subscribed_to_user_id
    )
  );
```

### 🛡️ 데이터 검증

#### 1. 클라이언트 사이드 검증
```typescript
// 구독 대상 검증
const validateSubscription = (userId: string, targetUserId: string) => {
  if (userId === targetUserId) {
    throw new Error('자기 자신을 구독할 수 없습니다.')
  }
  
  if (!targetUserId || targetUserId.length === 0) {
    throw new Error('유효하지 않은 사용자입니다.')
  }
}

// 할일 상태 변경 권한 검증
const canUpdateTodo = (todo: Todo, currentUserId: string) => {
  return todo.user_id === currentUserId
}
```

#### 2. 서버 사이드 검증
- RLS 정책을 통한 자동 권한 검증
- CHECK 제약조건으로 데이터 무결성 보장
- Foreign Key 제약조건으로 참조 무결성 보장

---

## 배포 및 설정

### 🚀 배포 프로세스

#### 1. 환경 변수 설정
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 2. 데이터베이스 마이그레이션
```bash
# Supabase CLI 사용 (권장)
supabase db reset
supabase migration up

# 또는 SQL 스크립트 직접 실행
psql -h your_db_host -U postgres -d postgres -f sql/create_calendar_subscriptions.sql
```

#### 3. Vercel 배포
```bash
# 프로덕션 빌드 테스트
npm run build

# Git 커밋 및 푸시
git add .
git commit -m "feat: 캘린더 기능 구현"
git push origin main

# Vercel 자동 배포 확인
# 또는 수동 배포
vercel --prod
```

### ⚙️ 설정 체크리스트

**배포 전 확인사항**:
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 마이그레이션 실행
- [ ] RLS 정책 적용 확인
- [ ] 프로덕션 빌드 성공
- [ ] 기존 기능 회귀 테스트

**배포 후 확인사항**:
- [ ] 캘린더 페이지 접근 가능
- [ ] 할일 데이터 정상 표시
- [ ] 구독 기능 동작 확인
- [ ] 실시간 업데이트 확인
- [ ] 모바일 반응형 확인

### 🔧 성능 최적화

#### 1. 쿼리 최적화
```typescript
// 필요한 필드만 선택
.select('id, title, due_date, status, user_id, user:profiles(full_name)')

// 적절한 필터링
.not('due_date', 'is', null)  // 마감일 있는 것만
.in('user_id', relevantUserIds)  // 관련 사용자만

// 정렬과 제한
.order('due_date', { ascending: true })
.limit(100)  // 대량 데이터 제한
```

#### 2. 컴포넌트 최적화
```typescript
// 메모이제이션
const calendarDays = useMemo(() => {
  // 캘린더 날짜 계산 로직
}, [currentDate])

const filteredTodos = useMemo(() => {
  return todos.filter(todo => {
    // 필터링 로직
  })
}, [todos, statusFilter, showCompletedTasks])

// 불필요한 리렌더링 방지
const MemoizedCalendarDay = memo(CalendarDay)
```

#### 3. 번들 최적화
```typescript
// 동적 임포트
const CalendarView = dynamic(() => import('./CalendarView'), {
  loading: () => <CalendarSkeleton />,
  ssr: false
})

// 트리 쉐이킹
import { format, startOfMonth, endOfMonth } from 'date-fns'
// import * as dateFns from 'date-fns' (❌ 지양)
```

---

## 사용법 및 사용자 가이드

### 👤 사용자 매뉴얼

#### 1. 캘린더 접속 방법
1. **메인 네비게이션**: 하단 플로팅 버튼에서 "Calendar" 클릭
2. **직접 URL**: `https://your-domain.com/calendar`
3. **할일 페이지에서**: 하단 캘린더 버튼 클릭

#### 2. 캘린더 둘러보기
**월 네비게이션**:
- `<` 버튼: 이전 달로 이동
- `>` 버튼: 다음 달로 이동
- `Today` 버튼: 현재 날짜로 이동

**할일 확인**:
- 각 날짜 셀에 해당일의 할일이 작은 카드 형태로 표시
- 할일이 많은 날은 숫자 배지로 개수 표시
- 상태별로 다른 색상으로 구분

**상태별 색상 가이드**:
- 🟡 **노란색**: 아직 시작하지 않은 할일
- 🟣 **핑크색**: 진행 중인 할일  
- 🟢 **초록색**: 완료된 할일

#### 3. 할일 상세 보기
1. **날짜 선택**: 원하는 날짜를 클릭
2. **상세 패널**: 화면 하단에 해당 날짜의 할일 목록 표시
3. **할일 정보**: 제목, 설명, 시간, 담당자 확인 가능

#### 4. 내 할일 관리
**상태 변경**:
1. 내가 만든 할일의 상태 배지 클릭
2. 드롭다운 메뉴에서 원하는 상태 선택
   - "Not yet": 아직 시작하지 않음
   - "Doing": 진행중
   - "Complete": 완료됨

**주의사항**:
- 다른 팀원의 할일은 상태 변경 불가 (읽기 전용)
- 상태 변경 시 실시간으로 캘린더에 반영

#### 5. 팀원 캘린더 구독
**구독 설정**:
1. 우측 "Team Calendar Subscriptions" 패널 클릭
2. 보고 싶은 팀원들 체크박스 선택
3. "Select All" / "Deselect All"로 일괄 선택/해제
4. "Save Preferences" 버튼으로 설정 저장

**구독 효과**:
- 구독한 팀원의 할일이 내 캘린더에 표시
- 팀원별로 다른 색상의 세로 막대로 구분
- 팀원 이름이 할일 카드에 표시

#### 6. 필터링 기능
**상태 필터**:
- **All**: 모든 상태의 할일 표시
- **Not yet**: 대기중인 할일만 표시
- **Doing**: 진행중인 할일만 표시
- **Complete**: 완료된 할일만 표시

**완료된 할일 토글**:
- 우상단 스위치로 완료된 할일 표시/숨김 설정

### 🔄 일반적인 사용 시나리오

#### 시나리오 1: 주간 일정 확인
1. 캘린더 페이지 접속
2. 이번 주 날짜들을 살펴보며 할일 확인
3. 바쁜 날과 여유로운 날 파악
4. 필요시 할일 상태 조정

#### 시나리오 2: 팀 협업 일정 조율
1. 팀원들을 구독 설정
2. 팀 전체 일정이 한 눈에 보이는 캘린더 확인
3. 중요한 마감일이나 겹치는 일정 파악
4. 팀원들과 일정 조율 논의

#### 시나리오 3: 월말 성과 리뷰
1. "Complete" 필터로 완료된 할일만 표시
2. 한 달 동안의 성과 시각적으로 확인
3. 완료율이 낮은 날짜나 기간 분석
4. 다음 달 계획 수립에 활용

---

## 개발자 가이드

### 💻 개발 환경 설정

#### 1. 로컬 환경 구성
```bash
# 저장소 클론
git clone https://github.com/your-repo/team-todo.git
cd team-todo

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 Supabase 정보 입력

# 개발 서버 실행
npm run dev
```

#### 2. 데이터베이스 설정
```bash
# Supabase CLI 설치
npm install -g @supabase/cli

# 로컬 Supabase 시작 (선택사항)
supabase start

# 마이그레이션 실행
supabase db push

# 또는 프로덕션 DB에 직접 SQL 실행
# sql/create_calendar_subscriptions.sql 내용을 Supabase 대시보드에서 실행
```

### 🏗️ 코드 구조 이해

#### 1. 컴포넌트 계층
```
CalendarPage (최상위)
├── 상태: showCompletedTasks, subscribedUserIds
├── 핸들러: handleSubscriptionChange, handleTaskUpdate
│
├── Header Section
│   ├── 제목: "Calendar"
│   └── 완료된 할일 토글 스위치
│
├── Main Content (그리드 레이아웃)
│   ├── CalendarView (3/4 너비)
│   │   ├── 캘린더 헤더 (월/년, 네비게이션)
│   │   ├── 상태 필터 버튼들
│   │   ├── 캘린더 그리드 (7x6)
│   │   └── 선택된 날짜 할일 패널
│   │
│   └── Sidebar (1/4 너비)
│       ├── TeamMemberSubscription
│       └── Subscription Info Panel
│
└── Footer
    └── 플로팅 네비게이션 버튼
```

#### 2. 상태 관리 패턴
```typescript
// 페이지 레벨 상태
const [showCompletedTasks, setShowCompletedTasks] = useState(true)
const [subscribedUserIds, setSubscribedUserIds] = useState<string[]>([])

// 컴포넌트 간 통신
const handleSubscriptionChange = (userIds: string[]) => {
  setSubscribedUserIds(userIds)
  // CalendarView가 자동으로 리렌더링됨
}

// 자식 컴포넌트에 전달
<CalendarView 
  subscribedUserIds={subscribedUserIds}
  showCompletedTasks={showCompletedTasks}
  onTaskUpdate={handleTaskUpdate}
/>
```

#### 3. 데이터 페칭 패턴
```typescript
// 초기 로딩
useEffect(() => {
  fetchTodos()
}, [userId, statusFilter, showCompletedTasks, subscribedUserIds])

// 실시간 구독
useEffect(() => {
  const channel = supabase
    .channel(`calendar-${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'todos'
    }, handleRealtimeUpdate)
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [userId])

// 옵티미스틱 업데이트
const updateTodoStatus = async (id: string, status: string) => {
  // 1. UI 즉시 업데이트
  setTodos(prev => prev.map(todo => 
    todo.id === id ? { ...todo, status } : todo
  ))
  
  // 2. 서버 요청
  try {
    await supabase
      .from('todos')
      .update({ status })
      .eq('id', id)
  } catch (error) {
    // 3. 실패 시 롤백
    fetchTodos()
  }
}
```

### 🧪 테스트 가이드

#### 1. 단위 테스트
```typescript
// __tests__/Calendar/CalendarView.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import CalendarView from '@/components/Calendar/CalendarView'

describe('CalendarView', () => {
  test('캘린더 그리드가 렌더링된다', () => {
    render(<CalendarView userId="test-user" />)
    
    // 7일의 요일 헤더 확인
    expect(screen.getByText('Sun')).toBeInTheDocument()
    expect(screen.getByText('Mon')).toBeInTheDocument()
    // ... 나머지 요일들
  })
  
  test('날짜 클릭 시 상세 패널이 열린다', () => {
    render(<CalendarView userId="test-user" />)
    
    const dateCell = screen.getByText('15')
    fireEvent.click(dateCell)
    
    // 상세 패널이 나타나는지 확인
    expect(screen.getByText(/Tasks for/)).toBeInTheDocument()
  })
})
```

#### 2. 통합 테스트
```typescript
// __tests__/integration/calendar-flow.test.tsx
describe('캘린더 통합 플로우', () => {
  test('구독 설정 후 팀원 할일이 표시된다', async () => {
    // 1. 캘린더 페이지 렌더링
    render(<CalendarPage user={mockUser} />)
    
    // 2. 구독 패널 열기
    fireEvent.click(screen.getByText('Team Calendar Subscriptions'))
    
    // 3. 팀원 선택
    fireEvent.click(screen.getByLabelText('John Doe'))
    
    // 4. 저장
    fireEvent.click(screen.getByText('Save Preferences'))
    
    // 5. 팀원 할일이 캘린더에 표시되는지 확인
    await waitFor(() => {
      expect(screen.getByText('John\'s Task')).toBeInTheDocument()
    })
  })
})
```

#### 3. E2E 테스트 (Playwright)
```typescript
// e2e/calendar.spec.ts
import { test, expect } from '@playwright/test'

test('캘린더 전체 플로우 테스트', async ({ page }) => {
  // 로그인
  await page.goto('/auth/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  
  // 캘린더 페이지로 이동
  await page.click('[data-testid="calendar-button"]')
  await expect(page).toHaveURL('/calendar')
  
  // 캘린더 그리드 확인
  await expect(page.locator('.calendar-grid')).toBeVisible()
  
  // 날짜 클릭 및 상세 패널 확인
  await page.click('[data-date="2025-05-21"]')
  await expect(page.locator('.selected-date-panel')).toBeVisible()
  
  // 할일 상태 변경
  await page.click('.todo-status-dropdown')
  await page.click('[data-status="completed"]')
  
  // 상태 변경 확인
  await expect(page.locator('.todo-card.completed')).toBeVisible()
})
```

### 🔧 커스터마이징 가이드

#### 1. 새로운 뷰 추가 (주간 뷰)
```typescript
// components/Calendar/WeekView.tsx
const WeekView = ({ currentDate, todos, ...props }) => {
  const weekDays = useMemo(() => {
    const startOfWeekDate = startOfWeek(currentDate)
    return Array.from({ length: 7 }, (_, index) => 
      addDays(startOfWeekDate, index)
    )
  }, [currentDate])
  
  return (
    <div className="week-view">
      {weekDays.map(day => (
        <WeekDay 
          key={format(day, 'yyyy-MM-dd')}
          date={day}
          todos={getTodosForDay(day)}
        />
      ))}
    </div>
  )
}
```

#### 2. 새로운 필터 추가
```typescript
// 우선순위 필터 추가
const [priorityFilter, setPriorityFilter] = useState<string | null>(null)

const filteredTodos = useMemo(() => {
  return todos.filter(todo => {
    if (statusFilter && todo.status !== statusFilter) return false
    if (priorityFilter && todo.priority !== priorityFilter) return false
    if (!showCompletedTasks && todo.status === 'completed') return false
    return true
  })
}, [todos, statusFilter, priorityFilter, showCompletedTasks])
```

#### 3. 새로운 할일 속성 표시
```typescript
// 할일 카드에 태그 표시 추가
const TodoCard = ({ todo }) => (
  <div className="todo-card">
    <span className="todo-title">{todo.title}</span>
    {todo.tags && (
      <div className="todo-tags">
        {todo.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    )}
    <span className="todo-status">{getStatusIcon(todo.status)}</span>
  </div>
)
```

### 📊 성능 모니터링

#### 1. 메트릭 수집
```typescript
// lib/analytics.ts
export const trackCalendarMetrics = {
  pageView: () => {
    // 캘린더 페이지 방문 추적
  },
  
  subscriptionChange: (count: number) => {
    // 구독 변경 추적
  },
  
  todoStatusChange: (from: string, to: string) => {
    // 상태 변경 추적
  },
  
  performanceMetric: (metric: string, value: number) => {
    // 성능 메트릭 추적
  }
}
```

#### 2. 렌더링 성능 측정
```typescript
// 컴포넌트 렌더링 시간 측정
const CalendarView = memo(({ ...props }) => {
  useEffect(() => {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      console.log(`CalendarView 렌더링 시간: ${end - start}ms`)
    }
  })
  
  return <div>...</div>
})
```

---

## 문제 해결

### 🐛 자주 발생하는 문제들

#### 1. 캘린더가 로딩되지 않는 경우

**증상**: 캘린더 페이지에 접속하면 무한 로딩

**원인**:
- Supabase 연결 실패
- 인증 토큰 만료
- RLS 정책 오류

**해결방법**:
```typescript
// 1. 콘솔에서 에러 확인
console.log('Supabase client:', supabase)
console.log('User session:', session)

// 2. 인증 상태 확인
const { data: { session }, error } = await supabase.auth.getSession()
if (error) {
  console.error('Auth error:', error)
}

// 3. RLS 정책 확인 (Supabase 대시보드)
SELECT * FROM calendar_subscriptions WHERE user_id = auth.uid();
```

#### 2. 실시간 업데이트가 작동하지 않는 경우

**증상**: 할일을 변경해도 다른 사용자에게 즉시 반영되지 않음

**원인**:
- Realtime 구독 설정 오류
- 채널 중복 또는 메모리 누수
- 방화벽/프록시 이슈

**해결방법**:
```typescript
// 1. 구독 상태 확인
const subscription = supabase
  .channel('calendar-debug')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'todos'
  }, (payload) => {
    console.log('Realtime payload:', payload)
  })
  .subscribe((status) => {
    console.log('Subscription status:', status)
  })

// 2. 채널 정리 확인
useEffect(() => {
  return () => {
    console.log('Cleaning up subscription')
    supabase.removeChannel(subscription)
  }
}, [])

// 3. WebSocket 연결 확인
console.log('Supabase WebSocket:', supabase.realtime.isConnected())
```

#### 3. 구독 설정이 저장되지 않는 경우

**증상**: 팀원을 구독 설정해도 새로고침하면 초기화됨

**원인**:
- RLS 정책 권한 부족
- 데이터베이스 제약조건 위반
- 네트워크 오류

**해결방법**:
```typescript
// 1. 저장 과정 디버깅
const saveSubscriptions = async (userIds: string[]) => {
  console.log('Saving subscriptions:', userIds)
  
  try {
    // 기존 구독 삭제
    const { error: deleteError } = await supabase
      .from('calendar_subscriptions')
      .delete()
      .eq('user_id', userId)
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      return
    }
    
    // 새 구독 추가
    if (userIds.length > 0) {
      const { error: insertError } = await supabase
        .from('calendar_subscriptions')
        .insert(newSubscriptions)
      
      if (insertError) {
        console.error('Insert error:', insertError)
        return
      }
    }
    
    console.log('Subscriptions saved successfully')
  } catch (error) {
    console.error('Save error:', error)
  }
}

// 2. RLS 정책 확인
-- Supabase SQL Editor에서 실행
SELECT policy_name, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'calendar_subscriptions';
```

#### 4. 모바일에서 UI가 깨지는 경우

**증상**: 모바일 화면에서 캘린더 그리드가 제대로 표시되지 않음

**원인**:
- 반응형 CSS 미적용
- 뷰포트 설정 오류
- 터치 이벤트 문제

**해결방법**:
```typescript
// 1. 뷰포트 메타 태그 확인 (layout.tsx)
<meta name="viewport" content="width=device-width, initial-scale=1" />

// 2. 모바일 반응형 스타일 추가
const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  
  @media (max-width: 768px) {
    gap: 0.125rem;
    font-size: 0.75rem;
  }
  
  @media (max-width: 480px) {
    gap: 0.0625rem;
    font-size: 0.625rem;
  }
`

// 3. 터치 이벤트 개선
const handleTouchStart = (e: TouchEvent) => {
  e.preventDefault()
  // 터치 이벤트 처리
}
```

### 🔍 디버깅 도구

#### 1. 개발자 도구 확장
```typescript
// 캘린더 상태를 전역으로 노출 (개발 환경)
if (process.env.NODE_ENV === 'development') {
  (window as any).calendarDebug = {
    todos,
    subscribedUserIds,
    selectedDate,
    statusFilter,
    refreshData: fetchTodos,
    clearCache: () => setTodos([])
  }
}
```

#### 2. 로그 시스템
```typescript
// lib/logger.ts
export const logger = {
  calendar: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Calendar] ${message}`, data)
    }
  },
  
  subscription: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Subscription] ${message}`, data)
    }
  },
  
  realtime: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Realtime] ${message}`, data)
    }
  }
}
```

#### 3. 성능 프로파일링
```typescript
// 캘린더 렌더링 성능 측정
const useRenderPerformance = (componentName: string) => {
  useEffect(() => {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      if (end - start > 100) { // 100ms 이상이면 경고
        console.warn(`${componentName} 렌더링이 느림: ${end - start}ms`)
      }
    }
  })
}
```

---

## 향후 개발 계획

### 🚀 Phase 2: 고급 기능

#### 1. 다중 뷰 지원
- **주간 뷰**: 일주일 단위 상세 보기
- **일일 뷰**: 하루 단위 시간대별 보기
- **연간 뷰**: 1년 전체 개요

#### 2. 드래그 앤 드롭
```typescript
// react-beautiful-dnd 활용 예시
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

const onDragEnd = (result: DropResult) => {
  if (!result.destination) return
  
  const todoId = result.draggableId
  const newDate = result.destination.droppableId
  
  // 할일 날짜 변경 API 호출
  updateTodoDueDate(todoId, newDate)
}
```

#### 3. 외부 캘린더 연동
- **Google Calendar** 동기화
- **Outlook Calendar** 동기화
- **iCal/ICS** 파일 내보내기

### 📱 Phase 3: 모바일 앱

#### 1. PWA 기능 강화
```typescript
// public/manifest.json
{
  "name": "Team Todo Calendar",
  "short_name": "TodoCal",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#292c33",
  "background_color": "#292c33",
  "start_url": "/calendar",
  "icons": [...]
}
```

#### 2. 오프라인 지원
```typescript
// service-worker.js 활용
const CACHE_NAME = 'team-todo-calendar-v1'
const urlsToCache = [
  '/calendar',
  '/dashboard',
  // 정적 자원들
]

// 오프라인 캘린더 데이터 캐싱
const cacheCalendarData = async (data: Todo[]) => {
  const cache = await caches.open(CACHE_NAME)
  await cache.put('/api/calendar-data', new Response(JSON.stringify(data)))
}
```

#### 3. 푸시 알림
```typescript
// 마감일 알림 시스템
const scheduleNotification = (todo: Todo) => {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(`할일 마감 알림: ${todo.title}`, {
        body: `${todo.due_date}까지 완료해주세요`,
        icon: '/icons/todo-icon.png',
        tag: `todo-${todo.id}`,
        requireInteraction: true
      })
    })
  }
}
```

### 🤖 Phase 4: AI 기능

#### 1. 스마트 스케줄링
```typescript
// AI 기반 할일 일정 제안
const suggestOptimalSchedule = async (todos: Todo[], preferences: UserPreferences) => {
  const response = await fetch('/api/ai/schedule-optimizer', {
    method: 'POST',
    body: JSON.stringify({
      todos,
      preferences,
      workingHours: preferences.workingHours,
      priority: preferences.priority
    })
  })
  
  return response.json() // 최적화된 일정 제안
}
```

#### 2. 자동 카테고리화
```typescript
// 할일 제목 기반 자동 태그/카테고리 제안
const autoCategorizeTodo = async (title: string, description?: string) => {
  const response = await openai.createCompletion({
    model: "gpt-3.5-turbo",
    prompt: `다음 할일을 적절한 카테고리로 분류해주세요: "${title}"`,
    max_tokens: 50
  })
  
  return extractCategories(response.data.choices[0].text)
}
```

#### 3. 생산성 인사이트
```typescript
// 사용자 생산성 패턴 분석
const analyzeProductivityPatterns = (completedTodos: Todo[]) => {
  const patterns = {
    mostProductiveHours: analyzeMostProductiveTime(completedTodos),
    completionRate: calculateCompletionRate(completedTodos),
    averageTaskDuration: calculateAverageTaskDuration(completedTodos),
    suggestions: generateProductivitySuggestions(completedTodos)
  }
  
  return patterns
}
```

### 🔄 Phase 5: 협업 강화

#### 1. 실시간 협업
- **공유 캘린더**: 팀 전체가 편집 가능한 캘린더
- **실시간 커서**: 다른 사용자가 보고 있는 위치 표시
- **동시 편집**: 충돌 방지를 위한 operational transform

#### 2. 고급 알림 시스템
```typescript
// 팀원 활동 알림
const notificationTypes = {
  TASK_ASSIGNED: 'task_assigned',
  DEADLINE_APPROACHING: 'deadline_approaching',
  TASK_COMPLETED: 'task_completed',
  CALENDAR_SHARED: 'calendar_shared'
}

const sendTeamNotification = async (type: string, data: any) => {
  // 웹훅, 이메일, Slack 등 다중 채널 알림
}
```

#### 3. 회의 일정 연동
```typescript
// 캘린더에 회의 정보 통합
interface Meeting {
  id: string
  title: string
  startTime: Date
  endTime: Date
  participants: string[]
  meetingUrl?: string
  relatedTodos?: string[]
}

const integrateWithMeetings = (meetings: Meeting[], todos: Todo[]) => {
  // 회의와 관련된 할일들을 자동으로 연결
}
```

### 📊 Phase 6: 분석 및 리포트

#### 1. 대시보드 확장
- **팀 생산성 메트릭**: 완료율, 평균 소요시간 등
- **트렌드 분석**: 시간대별, 요일별 생산성 패턴
- **목표 추적**: OKR/KPI와 할일 연동

#### 2. 커스텀 리포트
```typescript
// 사용자 정의 리포트 생성
const generateCustomReport = (parameters: ReportParameters) => {
  const reportData = {
    period: parameters.period,
    metrics: calculateMetrics(parameters),
    charts: generateCharts(parameters),
    insights: generateInsights(parameters)
  }
  
  return exportReport(reportData, parameters.format) // PDF, Excel, etc.
}
```

### 🛠️ 기술적 개선 사항

#### 1. 성능 최적화
- **가상화**: 대량 데이터 처리를 위한 virtual scrolling
- **캐싱 전략**: Redis를 통한 서버사이드 캐싱
- **이미지 최적화**: Next.js Image 컴포넌트 활용

#### 2. 접근성 개선
- **스크린 리더** 지원 강화
- **키보드 네비게이션** 완전 지원
- **고대비 모드** 지원

#### 3. 국제화
```typescript
// i18n 지원
const translations = {
  ko: {
    'calendar.title': '캘린더',
    'todo.status.pending': '대기중',
    'todo.status.inProgress': '진행중',
    'todo.status.completed': '완료'
  },
  en: {
    'calendar.title': 'Calendar',
    'todo.status.pending': 'Pending',
    'todo.status.inProgress': 'In Progress',
    'todo.status.completed': 'Completed'
  }
}
```

---

## 📝 마무리

Team Todo 캘린더 기능은 단순한 할일 관리를 넘어 팀 협업과 생산성 향상을 위한 종합적인 솔루션을 제공합니다. 이 문서를 통해 기능의 모든 측면을 이해하고, 효과적으로 활용하며, 필요에 따라 확장할 수 있기를 바랍니다.

### 🎯 핵심 가치 재확인
- **시각적 명확성**: 복잡한 일정을 한눈에 파악
- **팀워크 강화**: 투명한 일정 공유를 통한 협업 촉진
- **실시간 동기화**: 즉시 반영되는 변경사항
- **확장 가능성**: 미래 요구사항에 유연하게 대응

### 📞 지원 및 문의
- **GitHub Issues**: 버그 리포트 및 기능 요청
- **Discord/Slack**: 실시간 개발자 커뮤니티
- **Wiki**: 추가 문서 및 튜토리얼

---

**문서 버전**: v1.0  
**최종 업데이트**: 2025년 5월 21일  
**작성자**: Claude Code & Development Team

*이 문서는 Team Todo 캘린더 기능의 모든 것을 담고 있습니다. 지속적으로 업데이트되며, 커뮤니티의 피드백을 반영하여 개선됩니다.*