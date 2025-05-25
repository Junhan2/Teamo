# Teamo 프로젝트 가이드라인 (Claude 참조용)

## 📋 프로젝트 개요
- **프로젝트명**: Teamo (구 Muung.)
- **경로**: `~/Teamo`
- **서비스**: 개인/팀 할일관리 웹 애플리케이션
- **기술스택**: Next.js 14, React 18, TypeScript, Supabase, Tailwind CSS
- **디자인철학**: 미니멀 무채색 기반 + 주요 액션만 컬러 강조

## 🎯 개발 원칙

### 1. 코드 품질 체크리스트
- [ ] **테스트 우선 개발 (TDD)**: 구현 전 반드시 테스트 파일 생성
  - Playwright 사용 (`@playwright/test` 설치됨)
  - 테스트 파일명: `*.test.ts` 또는 `*.spec.ts`
- [ ] **아키텍처 원칙**: Clean Architecture + SOLID 원칙 준수
  - UI 컴포넌트: `components/`
  - 비즈니스 로직: `lib/`
  - 타입 정의: `types/`
  - 커스텀 훅: `hooks/`
- [ ] **타입 안전성**: TypeScript strict mode 활용
  - 모든 데이터 모델은 `types/database.ts` 참조
  - any 타입 사용 금지
- [ ] **반응형 필수**: 320px ~ 1920px 전 구간 완벽 대응
- [ ] **DRY 원칙**: 3회 이상 반복 로직은 즉시 함수화/컴포넌트화

### 2. 코딩 컨벤션
```typescript
// 함수명: camelCase
function getTodoById(id: string) {}

// 컴포넌트명: PascalCase
function TodoListItem() {}

// 상수: UPPER_SNAKE_CASE
const MAX_TODO_LENGTH = 500;

// 타입/인터페이스: PascalCase
interface TodoItem {
  id: string;
  title: string;
}
```

### 3. 컴포넌트 작성 패턴
```typescript
// 서버 컴포넌트 (기본값)
// app/page.tsx
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// 클라이언트 컴포넌트 (상호작용 필요시)
// components/InteractiveComponent.tsx
'use client';
import { useState } from 'react';

export function InteractiveComponent() {
  const [state, setState] = useState();
  // ...
}
```

## 🏗️ 프로젝트 구조

```
Teamo/
├── app/                    # Next.js App Router
│   ├── (protected)/       # 인증 필요 라우트
│   │   ├── dashboard/     # 메인 대시보드
│   │   ├── calendar/      # 캘린더 뷰
│   │   └── memos/         # 팀 메모
│   ├── auth/              # 인증 관련
│   │   ├── login/         # 로그인 페이지
│   │   └── callback/      # OAuth 콜백
│   └── layout.tsx         # 루트 레이아웃
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 기반 UI 컴포넌트
│   ├── Calendar/         # 캘린더 관련 컴포넌트
│   ├── TeamMemo/         # 팀 메모 관련 컴포넌트
│   └── *.tsx            # 기능별 컴포넌트
├── lib/                  # 유틸리티 및 설정
│   ├── supabase/        # Supabase 클라이언트
│   │   ├── client.ts    # 브라우저용
│   │   └── server.ts    # 서버용
│   ├── auth/            # 인증 헬퍼
│   └── utils.ts         # 공통 유틸리티 (cn 함수 등)
├── hooks/               # 커스텀 React 훅
├── types/               # TypeScript 타입 정의
│   └── database.ts      # Supabase 스키마 타입
├── sql/                 # 데이터베이스 마이그레이션
└── middleware.ts        # Next.js 미들웨어 (인증 체크)
```

## 🗄️ 데이터베이스 스키마

### 핵심 테이블
```typescript
// todos: 할일 항목
{
  id: string (UUID)
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  user_id: string (FK)
  team_id: string | null (FK)
  created_at: string
  updated_at: string
}

// teams: 팀 정보
{
  id: string (UUID)
  name: string
  description: string | null
  owner_id: string (FK)
  created_at: string
  updated_at: string
}

// team_members: 팀 멤버십
{
  id: string (UUID)
  team_id: string (FK)
  user_id: string (FK)
  role: 'member' | 'admin'
  created_at: string
}

// team_memos: 팀 메모 (sql 파일에 정의)
// users: 사용자 프로필 (Supabase Auth 연동)
```

## 🎨 디자인 시스템

### 색상 체계 (Gray Cool 기반)
```css
/* 기본 무채색 팔레트 */
--gray-cool-25: #FCFCFD;   /* 가장 밝은 배경 */
--gray-cool-50: #F9F9FB;   /* 밝은 배경 */
--gray-cool-100: #EFF1F5;  /* 호버 상태 */
--gray-cool-200: #DCDFEA;  /* 활성 상태 */
--gray-cool-300: #B9C0D4;  /* 테두리, 보조 텍스트 */
--gray-cool-400: #7D89AF;  /* 뮤트 텍스트 */
--gray-cool-500: #5D6A97;  /* 기본 텍스트 */
--gray-cool-600: #4A5578;  /* 진한 텍스트 */
--gray-cool-700: #404968;  /* 헤딩 텍스트 */
--gray-cool-800: #30374E;  /* 선택/활성 다크 */
--gray-cool-900: #111322;  /* 가장 어두운 텍스트 */
```

### 액션 색상 규칙
- **주요 액션** (ADD TASK, 저장, 생성): Sky 팔레트 사용
  ```css
  background: #e0f2fe; /* sky-100 */
  color: #0369a1;      /* sky-700 */
  border: #0284c7;     /* sky-600 */
  ```
- **보조 기능** (필터, 드롭다운, 정렬): Gray Cool 팔레트
- **위험 액션** (삭제, 취소): Red 계열
- **상태 표시**:
  - Pending: Amber 계열 (Clock 아이콘)
  - In Progress: Blue 계열 (Play 아이콘)
  - Completed: Emerald 계열 (Check 아이콘)

### 반응형 브레이크포인트
```css
/* Tailwind CSS 기본값 */
sm: 640px   /* 모바일 → 태블릿 */
md: 768px   /* 태블릿 세로 */
lg: 1024px  /* 태블릿 가로 → 데스크톱 */
xl: 1280px  /* 대형 데스크톱 */
```

### 간격 시스템
- 4px 배수 사용: 4, 8, 12, 16, 24, 32, 48, 64px
- Tailwind 클래스: `p-1` (4px), `p-2` (8px), `p-4` (16px) 등

## 🔌 API 및 데이터 처리

### Supabase 클라이언트 사용 규칙
```typescript
// 서버 컴포넌트에서
import { createClient } from '@/lib/supabase/server';
const supabase = createClient();

// 클라이언트 컴포넌트에서
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

### 에러 처리 패턴
```typescript
try {
  const { data, error } = await supabase
    .from('todos')
    .select('*');
  
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Error fetching todos:', error);
  // 사용자 친화적 에러 메시지 표시
  toast.error('할일을 불러오는데 실패했습니다.');
}
```

### 실시간 구독 패턴
```typescript
useEffect(() => {
  const channel = supabase
    .channel('todos-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'todos' },
      (payload) => {
        // 변경사항 처리
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## ⚡ 성능 최적화 가이드

### 1. 서버 컴포넌트 우선
- 가능한 모든 곳에서 서버 컴포넌트 사용
- 클라이언트 컴포넌트는 상호작용이 필요한 경우만

### 2. 이미지 최적화
```tsx
import Image from 'next/image';

<Image 
  src="/hero.png"
  alt="Hero"
  width={800}
  height={600}
  priority // LCP 이미지에만 사용
/>
```

### 3. 동적 임포트
```typescript
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { loading: () => <PageLoading /> }
);
```

## 🚀 배포 및 환경설정

### 필수 환경변수 (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://zxjmtfyjxonkqhcpuimx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 개발 환경에서만
NODE_ENV=development
```

### GitHub 설정
```bash
# 토큰 (참고용)
GitHub Token: github_pat_11AYMKKCI0P4qVubHaSeKF_...

# 저장소
https://github.com/Junhan2/Teamo
```

## 📝 작업 흐름

### 1. 기능 개발 프로세스
```
계획 → 테스트 작성 → 구현 → 리팩토링 → 문서화 → 커밋
```

### 2. 커밋 메시지 규칙
```
Type: 간단한 설명

- 상세 변경사항 1
- 상세 변경사항 2

Types:
- feat: 새로운 기능
- fix: 버그 수정
- refactor: 코드 개선
- style: 스타일 변경
- docs: 문서 수정
- test: 테스트 추가/수정
- chore: 기타 작업
```

### 3. 브랜치 전략
- `main`: 프로덕션 배포
- `develop`: 개발 통합
- `feature/*`: 기능 개발
- `fix/*`: 버그 수정

## 🔄 연속성 관리 (채팅 세션 간)

### 작업 중단 시 상태 저장
```bash
cat > ~/Teamo/WORK_STATE.md << 'EOF'
## 현재 작업
- 진행중: [구체적 작업 내용]
- 완료: [완료된 마일스톤]
- 다음: [예정된 작업]
- 파일: [작업중인 파일:라인번호]
- 에러: [현재 발생한 에러]

## 기술 상태
- 브랜치: $(git branch --show-current)
- 마지막 커밋: $(git log --oneline -1)
- 변경 파일: $(git status --porcelain)
- TODO: $(grep -r "TODO\|FIXME" . | grep -v node_modules | head -5)
EOF
```

### 새 세션 시작 시 복원
1. `read_file ~/Teamo/WORK_STATE.md`
2. `git status` 확인
3. `npm run dev` 실행
4. 마지막 작업 파일 열기
5. 테스트 실행으로 현재 상태 확인

## ⛔ 금지사항

- [ ] **테스트 없는 구현** - 모든 기능은 테스트 필수
- [ ] **any 타입 사용** - 명확한 타입 정의 필수
- [ ] **console.log 방치** - 프로덕션 코드에 남기지 않기
- [ ] **하드코딩된 값** - 상수나 환경변수로 관리
- [ ] **복잡한 해결책 우선** - 단순한 방법부터 시도
- [ ] **모바일 미고려 UI** - 모든 UI는 모바일 우선
- [ ] **과도한 컬러 사용** - 주요 액션 외 무채색 유지
- [ ] **중복 코드 방치** - DRY 원칙 엄격 준수
- [ ] **의미없는 주석** - 코드로 설명되지 않는 것만 주석

## 📚 참고 문서

- [Next.js 14 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [shadcn/ui 컴포넌트](https://ui.shadcn.com)
- 프로젝트 내 문서:
  - `CLAUDE.md`: Claude AI 작업 가이드
  - `design-system.md`: 디자인 시스템 상세
  - `WORK_HISTORY.md`: 작업 이력
