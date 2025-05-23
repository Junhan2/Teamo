# TODO: 다음 작업 우선순위

## 🚨 즉시 해야 할 작업

### 1. 드래그 앤 드롭 완성 (HIGH)
```typescript
// 구현해야 할 함수들
const handleMouseMove = useCallback((e: MouseEvent) => {
  if (draggedMemo) {
    // 실시간 위치 업데이트 로직
  }
}, [draggedMemo])

const handleMouseUp = useCallback(() => {
  // 드래그 종료 처리
}, [])
```

### 2. 리사이즈 핸들 활성화 (MEDIUM)
```typescript
const handleResize = (memoId: string, newWidth: number, newHeight: number) => {
  // 그리드 스냅과 함께 크기 조정
}
```

### 3. 성능 최적화 (MEDIUM)
- React.memo() 적용
- useMemo, useCallback 최적화
- 불필요한 리렌더링 방지

## 🔧 개발 환경 설정

### 로컬 개발 서버 실행
```bash
cd ~/Teamo
npm run dev
# 접속: http://localhost:3002/test-memo
```

### 데이터베이스 마이그레이션 실행
```sql
-- Supabase SQL Editor에서 실행
-- 파일: sql/advanced_memos_migration.sql
```

### 브라우저 테스트
```bash
npx playwright install  # 최초 1회만
# 테스트 코드에서 playwright 함수 사용
```

## 📋 체크리스트

### 완료된 기능 ✅
- [x] 메모 그리드 배치 시스템
- [x] 호버 확장 효과 (1초 지연)
- [x] 펼침/닫힘/Mixed 토글
- [x] 색상 커스터마이징 (우클릭 메뉴)
- [x] 줌 인/아웃 (Cmd+/-와 Cmd+스크롤)
- [x] Supabase 실시간 동기화
- [x] 반응형 디자인
- [x] 미니멀 디자인 적용

### 진행 중인 작업 🔄
- [ ] 실제 드래그 앤 드롭 구현
- [ ] 리사이즈 핸들 기능 구현
- [ ] 모바일 터치 지원

### 계획된 기능 📅
- [ ] 메모 검색 및 필터링
- [ ] 메모 그룹화/태그 시스템
- [ ] 키보드 단축키 확장
- [ ] 메모 간 연결선 (마인드맵 기능)
- [ ] 무한 캔버스 (스크롤 확장)

---
**다음 작업 시 이 문서를 참고하여 연속성 있게 개발 진행**
