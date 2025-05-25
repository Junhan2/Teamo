# Teamo 의존성 관리 가이드

## 🚨 주요 버전 고정 사항

### React 18.2.0 (고정)
```json
"react": "18.2.0",
"react-dom": "18.2.0"
```
- **이유**: Next.js 14와의 호환성, Supabase Auth Helpers 호환성
- **주의**: React 19로 업그레이드 시 breaking changes 존재
- **영향**: @radix-ui, framer-motion 등 대부분의 UI 라이브러리

### TypeScript 5.3.3 (고정)
```json
"typescript": "5.3.3"
```
- **이유**: Next.js 14.2.x와 최적 호환
- **주의**: 5.4+ 버전은 새로운 strict 옵션으로 기존 코드 영향 가능

## ⚠️ 알려진 호환성 이슈

### 1. Supabase 패키지 간 버전 충돌
```json
"@supabase/auth-helpers-nextjs": "^0.8.7",  // 구버전
"@supabase/ssr": "^0.6.1",                   // 신버전 방식
"@supabase/supabase-js": "^2.39.0"
```
**문제**: auth-helpers-nextjs는 deprecated, ssr로 마이그레이션 필요
**해결**: 
```bash
# 마이그레이션 시
npm uninstall @supabase/auth-helpers-nextjs
npm install @supabase/ssr@latest
```

### 2. Tailwind CSS 플러그인 호환성
```json
"@tailwindcss/line-clamp": "^0.4.4",  // deprecated
"tailwindcss": "^3.4.17"
```
**문제**: Tailwind CSS 3.3+에서 line-clamp 내장
**해결**: 플러그인 제거하고 내장 클래스 사용
```css
/* 변경 전 */ .line-clamp-2
/* 변경 후 */ .line-clamp-2 /* 동일하게 작동 */
```

### 3. Radix UI 버전 불일치
- 각 Radix 컴포넌트가 다른 버전 사용 중
- 잠재적 스타일/동작 불일치 가능

## 📦 의존성 업데이트 전략

### 1. 안전한 업데이트 프로세스
```bash
# 1. 현재 상태 백업
git checkout -b dependency-update-backup

# 2. 업데이트 가능 목록 확인
npm outdated

# 3. 개별 패키지 신중히 업데이트
npm update package-name --save-exact

# 4. 즉시 테스트
npm run build && npm run test
```

### 2. 버전 범위 전략
```json
// 위험도별 버전 지정
"react": "18.2.0",              // 정확한 버전 (메이저 라이브러리)
"next": "^14.2.29",             // 마이너 업데이트 허용
"clsx": "^2.0.0",               // 안전한 유틸리티
"@types/react": "18.2.47"       // React 버전과 동기화
```

### 3. 호환성 매트릭스
| 패키지 | 현재 | 권장 | 최대 | 비고 |
|--------|------|------|------|------|
| React | 18.2.0 | 18.2.0 | 18.2.x | 19.x 금지 |
| Next.js | 14.2.29 | 14.2.x | 14.x.x | 15.x 테스트 필요 |
| TypeScript | 5.3.3 | 5.3.3 | 5.3.x | 5.4+ 주의 |
| Tailwind | 3.4.17 | 3.4.x | 3.x.x | v4 alpha 금지 |

## 🛠️ 트러블슈팅 가이드

### 케이스 1: 빌드 실패
```bash
# 1. 캐시 클리어
rm -rf .next node_modules package-lock.json
npm install
npm run build

# 2. 특정 버전으로 다운그레이드
npm install package@1.2.3 --save-exact
```

### 케이스 2: 타입 에러
```bash
# TypeScript 버전 확인
npx tsc --version

# @types 패키지 동기화
npm install @types/react@18.2.47 @types/react-dom@18.2.18 --save-dev
```

### 케이스 3: Peer Dependency 경고
```bash
# 강제 설치 (주의!)
npm install --force

# 또는 legacy peer deps 사용
npm install --legacy-peer-deps
```

## 🔄 정기 점검 체크리스트

### 주간
- [ ] `npm audit` 실행 - 보안 취약점 확인
- [ ] 개발 서버 정상 작동 확인

### 월간  
- [ ] `npm outdated` 확인
- [ ] 마이너 버전 업데이트 검토
- [ ] 의존성 크기 확인: `npm list --depth=0`

### 분기별
- [ ] 메이저 버전 업데이트 검토
- [ ] deprecated 패키지 확인
- [ ] 번들 크기 분석: `npm run build && npm run analyze`

## 📌 긴급 롤백 절차

```bash
# 1. 이전 package-lock.json으로 복원
git checkout HEAD~1 package-lock.json
npm ci

# 2. 특정 커밋으로 복원
git log --oneline -10  # 안정적인 커밋 찾기
git checkout [commit-hash] package.json package-lock.json
npm ci

# 3. 완전 초기화
rm -rf node_modules package-lock.json
git checkout package.json
npm install
```

## 🎯 의존성 선택 기준

### 새 패키지 추가 시
1. **번들 크기**: bundlephobia.com에서 확인
2. **유지보수**: 최근 업데이트, 이슈 대응
3. **호환성**: React 18, Next.js 14 지원
4. **대안 검토**: 내장 기능으로 가능한지

### 제거 고려 대상
- 6개월 이상 업데이트 없음
- 보안 취약점 미해결
- 더 나은 대안 존재
- 사용 빈도 낮음

## 💡 버전 충돌 예방 팁

1. **package-lock.json 커밋 필수**
2. **npm ci 사용** (install 대신)
3. **정확한 버전 지정** (중요 패키지)
4. **.nvmrc로 Node 버전 고정**
5. **CI/CD에서 동일 환경 보장**
