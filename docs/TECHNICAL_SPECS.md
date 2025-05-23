# 기술 스펙 문서

## 🎯 컴포넌트 구조

### AdvancedMemoGrid.tsx
```typescript
interface Memo {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  user_email?: string
  color: string
  position_x: number
  position_y: number
  width: number
  height: number
  is_expanded: boolean
}

type ViewState = 'expanded' | 'collapsed' | 'mixed'
```

### 주요 상수
```typescript
const GRID_SIZE = 20           // 그리드 간격
const MIN_WIDTH = 200          // 최소 너비
const MIN_HEIGHT = 160         // 최소 높이
const DEFAULT_WIDTH = 240      // 기본 너비
const DEFAULT_HEIGHT = 200     // 기본 높이
```

## 🗄️ Supabase 설정

### 환경 변수
```
NEXT_PUBLIC_SUPABASE_URL=https://zxjmtfyjxonkqhcpuimx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 테이블 구조
```sql
-- advanced_memos 테이블
id: UUID (Primary Key)
title: TEXT (NOT NULL)
content: TEXT (NOT NULL)
created_at: TIMESTAMP WITH TIME ZONE
updated_at: TIMESTAMP WITH TIME ZONE
user_id: UUID (Foreign Key)
color: TEXT (Default: '#F8BBD9')
position_x: INTEGER (Default: 0)
position_y: INTEGER (Default: 0)
width: INTEGER (Default: 240)
height: INTEGER (Default: 200)
is_expanded: BOOLEAN (Default: FALSE)
```

## 🎨 스타일 가이드

### CSS 클래스 명명 규칙
- `.memo-grid-container`: 최상위 컨테이너
- `.memo-item`: 개별 메모 아이템
- `.memo-content`: 메모 내용 영역
- `.toolbar`: 상단 툴바
- `.color-palette`: 색상 선택 팔레트

### 색상 팔레트
10가지 파스텔 톤 색상으로 구성:
1. 핑크 (#F8BBD9)
2. 베이지 (#E8D5B7)
3. 연녹색 (#B2F2BB)
4. 연보라 (#A5B4FC)
5. 연주황 (#FED7AA)
6. 연노랑 (#FEF08A)
7. 연파랑 (#BFDBFE)
8. 연라벤더 (#F3E8FF)
9. 연분홍 (#FCE7F3)
10. 연민트 (#D1FAE5)

---
**기술 참고용 문서 - 개발 시 상세 스펙 확인용**
