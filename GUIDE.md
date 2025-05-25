# Teamo 실전 가이드

## 핵심: 작동 우선, 완벽은 나중

## 시작하기
```bash
npm run dev                    # 작동 확인
git checkout -b feature/작업   # 안전망
```

## 언제 조심? 언제 과감?
**조심**: 인증/결제/DB/프로덕션
**과감**: UI/UX/개발도구/실험

## 오류 줄이기
1. **작게**: 10줄 코드 → 테스트 → 커밋
2. **자주**: 변경 즉시 브라우저 확인  
3. **복구**: `git stash` 또는 `git checkout .`

## 구조
```
app/         → 페이지
components/  → UI 부품  
lib/         → 로직
```

## 필수 패턴
```ts
// Supabase 호출시 항상
try {
  const { data, error } = await supabase.from().select()
  if (error) throw error
} catch (error) {
  console.error(error)  // 개발용
  toast.error('실패')   // 사용자용
}
```

## 디버깅
1. 에러 메시지 읽기 (답의 90%)
2. Network 탭 확인 (API 문제)
3. `git diff` (뭘 바꿨나)
4. 재시작 (ctrl+c → npm run dev)

## 체크리스트
- [ ] 작동? 모바일 OK?
- [ ] console.log 제거?
- [ ] 커밋 메시지 명확?

**기억**: 막히면 되돌리고, 에러는 배움의 기회