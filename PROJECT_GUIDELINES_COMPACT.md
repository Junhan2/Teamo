# Teamo 프로젝트 가이드라인 (압축판)

## 프로젝트 정보
- **경로**: `~/Teamo` | **스택**: Next.js 14, TypeScript, Supabase, Tailwind
- **GitHub**: Junhan2/Teamo | **Supabase**: zxjmtfyjxonkqhcpuimx

## 개발 원칙
1. **TDD**: 구현 전 `*.test.ts` 작성 (Playwright)
2. **Clean Architecture**: components/ → lib/ → types/
3. **TypeScript**: strict mode, any 금지
4. **반응형**: 320px-1920px 완벽 대응
5. **DRY**: 3회 반복시 즉시 함수화

## 디렉토리 구조
```
app/
├── (protected)/     # 인증 필요 (dashboard, calendar, memos)
├── auth/           # login, callback
components/         # UI 컴포넌트 (shadcn/ui 기반)
lib/
├── supabase/      # client.ts(브라우저), server.ts(서버)
hooks/             # 커스텀 훅
types/             # database.ts (스키마 타입)
middleware.ts      # 인증 체크
```

## 디자인 시스템
- **기본**: Gray Cool 팔레트 (#FCFCFD ~ #111322)
- **주요액션**: Sky 팔레트 (ADD TASK 등)
- **상태**: Pending(Amber), Progress(Blue), Complete(Emerald)
- **간격**: 4px 배수 (4,8,16,24,32,48,64)

## 코드 패턴
```typescript
// 서버 컴포넌트 (기본)
import { createClient } from '@/lib/supabase/server';

// 클라이언트 컴포넌트
'use client';
import { createClient } from '@/lib/supabase/client';

// 에러 처리
try {
  const { data, error } = await supabase.from('todos').select();
  if (error) throw error;
} catch (error) {
  toast.error('사용자 친화적 메시지');
}
```

## 작업흐름
`계획 → 테스트 → 구현 → 리팩토링 → 문서화 → 커밋`

## 연속성 관리
```bash
# 중단시
echo "진행중: [작업내용]" > ~/Teamo/WORK_STATE.md
# 재개시
cat ~/Teamo/WORK_STATE.md && npm run dev
```
