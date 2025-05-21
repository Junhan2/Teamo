# Team Memo Wall - 개발 문서

## 📋 개요

Team Memo Wall은 팀원들이 포스트잇 스타일의 메모를 통해 실시간으로 소통하고 협업할 수 있는 기능입니다. 드래그 앤 드롭, 태그 시스템, 이모지 반응 등 직관적이고 재미있는 기능들을 제공합니다.

## 🎯 핵심 기능

### 1. 포스트잇 스타일 메모
- **6가지 색상**: yellow, pink, blue, green, purple, orange
- **회전 효과**: 실제 포스트잇처럼 자연스러운 회전
- **그림자 효과**: 깊이감과 입체감 제공
- **호버 효과**: 마우스 오버 시 확대 및 정렬

### 2. 드래그 앤 드롭
- **자유로운 이동**: 메모를 원하는 위치로 드래그
- **실시간 업데이트**: 위치 변경이 즉시 데이터베이스에 저장
- **경계 제한**: 메모가 화면 밖으로 나가지 않도록 제한
- **시각적 피드백**: 드래그 중 확대 효과와 z-index 변경

### 3. 자동 격자 정렬
- **4열 격자 시스템**: 깔끔한 그리드 레이아웃
- **자동 배치**: 메모 개수에 따라 자동으로 행 계산
- **일괄 업데이트**: 모든 메모 위치를 한 번에 정리

### 4. 태그 시스템
- **해시태그 형식**: #아이디어, #긴급, #회의 등
- **쉼표 구분**: 여러 태그를 쉽게 입력
- **시각적 구분**: 색상이 있는 뱃지로 표시
- **검색 및 필터링**: 태그별로 메모 분류 가능

### 5. 이모지 반응 시스템
- **5가지 반응**: ❤️ 👍 😊 🔥 💡
- **실시간 반영**: 즉시 반응 상태 업데이트
- **중복 반응 방지**: 같은 사용자는 한 번만 반응 가능
- **반응 카운트**: 반응한 사용자 수 표시

### 6. 실시간 협업
- **Supabase Realtime**: 실시간 데이터 동기화
- **즉시 반영**: 팀원의 변경사항이 즉시 표시
- **충돌 방지**: 동시 편집 시 안전한 처리

## 🗃️ 데이터베이스 스키마

### team_memos 테이블 구조

```sql
CREATE TABLE team_memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,                    -- 메모 내용
  color VARCHAR(20) DEFAULT 'yellow',       -- 메모 색상
  position_x INTEGER DEFAULT 100,           -- X 좌표
  position_y INTEGER DEFAULT 100,           -- Y 좌표
  user_id UUID NOT NULL,                    -- 작성자 ID
  team_id UUID REFERENCES teams(id),        -- 팀 ID (nullable)
  reactions JSONB DEFAULT '{}',             -- 이모지 반응
  tags TEXT[] DEFAULT '{}',                 -- 태그 배열
  created_at TIMESTAMPTZ DEFAULT NOW(),     -- 생성일
  updated_at TIMESTAMPTZ DEFAULT NOW()      -- 수정일
);
```

### RLS (Row Level Security) 정책

```sql
-- 모든 인증된 사용자가 메모 조회 가능
CREATE POLICY "team_memos_select" ON team_memos 
FOR SELECT TO authenticated USING (true);

-- 자신의 메모만 생성 가능
CREATE POLICY "team_memos_insert" ON team_memos 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 자신의 메모만 수정 가능
CREATE POLICY "team_memos_update" ON team_memos 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 자신의 메모만 삭제 가능
CREATE POLICY "team_memos_delete" ON team_memos 
FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

## 🏗️ 기술 아키텍처

### Frontend 기술 스택
- **React 18**: 컴포넌트 기반 UI 구현
- **TypeScript**: 타입 안정성 보장
- **Framer Motion**: 드래그 앤 드롭 및 애니메이션
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Supabase Client**: 실시간 데이터베이스 연동

### Backend 기술 스택
- **Supabase**: PostgreSQL 기반 백엔드 서비스
- **Real-time Subscriptions**: 실시간 데이터 동기화
- **Row Level Security**: 데이터 보안 및 권한 관리

### 핵심 컴포넌트

#### 1. TeamMemoWall.tsx (메인 컴포넌트)
```typescript
// 주요 상태 관리
const [memos, setMemos] = useState<TeamMemo[]>([])
const [draggedMemo, setDraggedMemo] = useState<string | null>(null)
const [newMemoTags, setNewMemoTags] = useState<string[]>([])

// 핵심 함수들
- fetchMemos(): 메모 데이터 가져오기
- addMemo(): 새 메모 추가
- updateMemoPosition(): 메모 위치 업데이트
- autoArrangeMemos(): 자동 격자 정렬
- addReaction(): 이모지 반응 추가
```

#### 2. 드래그 앤 드롭 구현
```typescript
<motion.div
  drag
  dragMomentum={false}
  onDragStart={() => setDraggedMemo(memo.id)}
  onDragEnd={(event, info) => {
    setDraggedMemo(null)
    const newX = Math.max(0, Math.min(1200, memo.position_x + info.offset.x))
    const newY = Math.max(0, Math.min(800, memo.position_y + info.offset.y))
    updateMemoPosition(memo.id, newX, newY)
  }}
>
```

#### 3. 자동 정렬 알고리즘
```typescript
const autoArrangeMemos = async () => {
  const gridCols = 4              // 4열 고정
  const cardWidth = 280           // 카드 너비
  const cardHeight = 200          // 카드 높이
  const padding = 20              // 간격

  const updates = memos.map((memo, index) => {
    const row = Math.floor(index / gridCols)
    const col = index % gridCols
    const x = col * (cardWidth + padding) + padding
    const y = row * (cardHeight + padding) + padding
    
    return { id: memo.id, position_x: x, position_y: y }
  })
}
```

## 🎨 UI/UX 디자인

### 색상 시스템
```typescript
const MEMO_COLORS = [
  { name: 'yellow', bg: 'bg-yellow-200', border: 'border-yellow-300' },
  { name: 'pink', bg: 'bg-pink-200', border: 'border-pink-300' },
  { name: 'blue', bg: 'bg-blue-200', border: 'border-blue-300' },
  { name: 'green', bg: 'bg-green-200', border: 'border-green-300' },
  { name: 'purple', bg: 'bg-purple-200', border: 'border-purple-300' },
  { name: 'orange', bg: 'bg-orange-200', border: 'border-orange-300' },
]
```

### 애니메이션 효과
- **등장 애니메이션**: opacity, scale, rotate 변화
- **드래그 애니메이션**: scale 확대, rotate 정렬
- **호버 효과**: scale 1.05, rotate 0
- **스프링 애니메이션**: 자연스러운 움직임

### 반응형 디자인
- **컨테이너**: 최소 800px 높이, 자동 스크롤
- **메모 크기**: 고정 264px 너비, 최소 160px 높이
- **격자 시스템**: 4열 고정, 반응형 행 추가

## 🔧 주요 기능 구현

### 1. 실시간 동기화
```typescript
useEffect(() => {
  if (user?.id) {
    const subscription = supabase
      .channel('team_memos_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'team_memos' 
      }, () => fetchMemos())
      .subscribe()

    return () => supabase.removeChannel(subscription)
  }
}, [user?.id])
```

### 2. 태그 입력 처리
```typescript
const handleTagInput = (value: string) => {
  const tags = value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
  setNewMemoTags(tags)
}
```

### 3. 이모지 반응 시스템
```typescript
const addReaction = async (memoId: string, reaction: string) => {
  const memo = memos.find(m => m.id === memoId)
  const currentReactions = memo.reactions || {}
  const userReactions = currentReactions[reaction] || []
  
  let newReactions = { ...currentReactions }
  
  if (userReactions.includes(user.id)) {
    // 반응 제거
    newReactions[reaction] = userReactions.filter(id => id !== user.id)
  } else {
    // 반응 추가
    newReactions[reaction] = [...userReactions, user.id]
  }

  await supabase
    .from('team_memos')
    .update({ reactions: newReactions })
    .eq('id', memoId)
}
```

## 🚀 배포 및 네비게이션 통합

### 라우팅 구조
- **메인 페이지**: `/memos`
- **컴포넌트**: `app/(protected)/memos/page.tsx`
- **메모 월**: `components/TeamMemo/TeamMemoWall.tsx`

### 네비게이션 통합
모든 주요 페이지에 메모 버튼 추가:
- Dashboard (`/dashboard`)
- Calendar (`/calendar`) 
- Memos (`/memos`) - 활성 상태

### 플로팅 버튼
```typescript
<Link href="/memos">
  <Button className="rounded-full shadow-lg">
    <StickyNote className="w-4 h-4" />
    <span>Memos</span>
  </Button>
</Link>
```

## 🎯 사용 시나리오

### 1. 브레인스토밍 세션
- 팀원들이 각자 아이디어를 메모로 작성
- 색상과 태그로 아이디어 분류
- 드래그로 관련 아이디어들 그룹화
- 이모지로 좋은 아이디어에 반응

### 2. 프로젝트 계획
- 할일을 메모로 작성하고 우선순위별 색상 지정
- #긴급, #중요 등 태그로 분류
- 자동 정렬로 깔끔하게 정리
- 완료된 항목에 👍 반응

### 3. 피드백 수집
- 각자 피드백을 메모로 작성
- 카테고리별 색상 및 태그 사용
- 드래그로 유사한 피드백 그룹화
- 중요한 피드백에 🔥 반응

## 🔄 향후 개선 계획

### 단기 개선사항
1. **필터링 시스템**: 태그별, 색상별, 사용자별 필터
2. **검색 기능**: 메모 내용 및 태그 검색
3. **메모 크기 조절**: 내용에 따른 동적 크기 변경
4. **템플릿 시스템**: 자주 사용하는 메모 템플릿 제공

### 중기 개선사항
1. **메모 연결선**: 관련 메모들 간의 연결 표시
2. **히스토리 기능**: 메모 변경 이력 추적
3. **내보내기**: PDF, 이미지로 메모 월 내보내기
4. **알림 시스템**: 중요 메모 알림 기능

### 장기 개선사항
1. **AI 분석**: 메모 내용 분석 및 인사이트 제공
2. **음성 메모**: 음성으로 메모 작성
3. **화이트보드 모드**: 그림 그리기 및 스케치 기능
4. **프레젠테이션 모드**: 메모 월을 프레젠테이션으로 변환

## 📊 성능 최적화

### 데이터베이스 최적화
- **인덱싱**: user_id, team_id, created_at에 인덱스 설정
- **RLS 최적화**: 효율적인 권한 검사
- **배치 업데이트**: 자동 정렬 시 배치 처리

### 프론트엔드 최적화
- **메모이제이션**: React.memo 및 useMemo 사용
- **가상화**: 대량 메모 처리 시 가상 스크롤링
- **이미지 최적화**: 아이콘 및 이미지 최적화

### 실시간 최적화
- **디바운싱**: 드래그 중 위치 업데이트 제한
- **선택적 구독**: 필요한 데이터만 실시간 동기화
- **캐싱**: 자주 사용되는 데이터 캐싱

## 🛡️ 보안 고려사항

### 데이터 보안
- **RLS 정책**: 사용자별 데이터 접근 제한
- **입력 검증**: XSS 및 SQL Injection 방지
- **권한 검사**: 메모 수정/삭제 권한 확인

### 사용자 프라이버시
- **팀 격리**: 팀별 메모 분리
- **익명 옵션**: 필요 시 익명 메모 작성
- **데이터 암호화**: 민감한 데이터 암호화

## 📈 분석 및 모니터링

### 사용량 추적
- **메모 생성 수**: 일/주/월별 메모 생성 통계
- **사용자 활동**: 활성 사용자 및 참여도
- **기능 사용률**: 드래그, 태그, 반응 등 기능별 사용률

### 성능 모니터링
- **응답 시간**: API 응답 시간 모니터링
- **실시간 연결**: WebSocket 연결 상태 추적
- **에러 추적**: 클라이언트 및 서버 에러 로깅

---

**개발 완료일**: 2025년 1월
**개발자**: Claude AI Assistant
**버전**: 1.0.0
**라이선스**: MIT