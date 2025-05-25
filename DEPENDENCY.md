# 의존성 관리 (압축판)

## 버전 고정 필수
```json
"react": "18.2.0"         // React 19 절대 금지
"typescript": "5.3.3"     // 5.4+ 주의
"next": "^14.2.29"        // 14.x만 허용
```

## 알려진 이슈
1. **Supabase**: auth-helpers-nextjs는 deprecated → ssr 사용
2. **Tailwind**: line-clamp 플러그인 불필요 (3.3+ 내장)
3. **Radix UI**: 컴포넌트별 버전 불일치 주의

## 업데이트 전 필수
```bash
git checkout -b update-backup
npm outdated                    # 확인
npm update pkg --save-exact     # 개별 업데이트
npm run build && npm test       # 검증
```

## 트러블슈팅
```bash
# 빌드 실패시
rm -rf .next node_modules package-lock.json && npm install

# 타입 에러시
npm install @types/react@18.2.47 --save-dev

# 긴급 롤백
git checkout HEAD~1 package-lock.json && npm ci
```

## 체크리스트
- 일일: `npm run dev` 정상 작동
- 주간: `npm audit` 보안 점검
- 월간: `npm outdated` 업데이트 검토
- 항상: package-lock.json 커밋, npm ci 사용

## 핵심 원칙
1. React/Next/TS 메이저 버전 변경 금지
2. 업데이트 전 브랜치 생성 필수
3. package-lock.json 항상 커밋
4. 프로덕션은 npm ci만 사용
