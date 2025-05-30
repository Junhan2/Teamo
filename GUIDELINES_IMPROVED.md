# Teamo 프로젝트 가이드라인

## 프로젝트 기본정보
- **경로**: `~/Teamo` | **서비스**: 개인/팀 할일관리 웹앱
- **디자인**: 미니멀 무채색 + 주요액션만 컬러
- **환경**: GitHub + Supabase

## 개발원칙 체크리스트

### 필수 원칙 (보수적)
- [ ] 테스트 먼저 작성 (TDD): 구현 전 반드시 .test.js 파일 생성
- [ ] SOLID + Clean Architecture: 컴포넌트/서비스/유틸 분리
- [ ] 반응형 디자인 필수: 320px-1920px 전 구간 테스트
- [ ] 프로덕션에 모의데이터 금지: NODE_ENV 체크 필수

### 유연한 원칙
- [ ] 단순함 > 복잡함: 작동하면 일단 OK, 나중에 개선
- [ ] DRY 원칙: 3회 반복시 함수화 (급하면 나중에)
- [ ] 빠른 반복: 완벽보다 빠른 피드백 우선

## 코딩 가이드라인
- **함수 크기**: 한 화면에 들어갈 정도 (길어도 작동하면 OK)
- **컴포넌트**: props 많으면 객체로 (또는 그냥 전달)
- **에러 처리**: 사용자가 이해할 수 있는 메시지
- **상태 관리**: loading, error, success 패턴
- **타입 안전성**: 가능한 한 타입 체크 (급하면 any도...)

## 테스트 작성 접근법
```javascript
// 사용자 관점에서 테스트 작성
test('할일 추가 버튼 클릭시 새 할일이 생성된다', () => {
  // Given: 초기 상태
  // When: 사용자 행동
  // Then: 예상 결과
});
// 하지만 급하면 수동 테스트도 OK
```

## API/데이터 처리 원칙
- **Supabase 연동**: 에러 상태와 로딩 상태 관리
- **데이터 검증**: 백엔드 응답 검증 (최소한 null 체크)
- **사용자 피드백**: API 호출시 로딩 표시

## 성능 고려사항 (나중에 최적화 가능)
- **렌더링 최적화**: 눈에 띄게 느리면 개선
- **데이터 로딩**: 필요한 데이터만 (또는 일단 다 가져오고 개선)
- **이미지 처리**: next/image 사용 권장

## UI 디자인 시스템

### 색상 규칙
- **주요 액션**: +ADD TASK, 저장, 생성 등 → 컬러 적용
- **보조 기능**: 필터, 드롭다운, 페이지네이션, 정렬 → 무채색 (gray 계열)
- **위험 액션**: 삭제, 취소 → red 계열
- **배경 대비**: weight 500 배경이면 stroke는 600+ 사용

### 레이아웃 원칙
- **모바일 우선**: 320px부터 설계
- **브레이크포인트**: sm(640px), md(768px), lg(1024px), xl(1280px)
- **간격 시스템**: 4px 배수 선호 (아니어도 괜찮음)

### 반응형 체크리스트
- [ ] 320px-640px: 단일 컬럼, 터치 친화적
- [ ] 640px-1024px: 2-3컬럼 그리드
- [ ] 1024px+: 전체 레이아웃
- [ ] 터치 타겟: 최소 44px × 44px (작아도 작동하면 OK)

### 접근성 요구사항 (점진적 개선)
- [ ] 색상 대비: 가능하면 4.5:1
- [ ] 키보드 네비게이션: 기본 Tab 작동
- [ ] 스크린 리더: semantic HTML 사용
- [ ] 포커스 표시: 기본값이라도 유지

## 연속성 관리 (토큰제한 대응)

### 작업 중단시 즉시 실행
```bash
# 현재 상태 간단히 기록
echo "작업중: [무엇을] 어디까지" > ~/Teamo/WORK_STATE.md
git add . && git commit -m "WIP: 작업 중간 저장"
```

### 새 채팅시 복원
1. `cat ~/Teamo/WORK_STATE.md`
2. `git log --oneline -5`
3. `npm run dev`

## 의존성 관리 (유연하게)
- React 18.2.0, TypeScript 5.3.3 고정 (메이저 변경 금지)
- 나머지는 필요시 업데이트 (작동 확인 후)
- 문제 생기면: `git checkout HEAD~1 package-lock.json && npm ci`

## 환경설정
```
GitHub Token: github_pat_11AYMKKCI0P4qVubHaSeKF_...
Supabase:
  Token: sbp_03e3ce1096a3f14b054a43cd5dc022a8f4862ba4
  Project: zxjmtfyjxonkqhcpuimx
  URL: https://zxjmtfyjxonkqhcpuimx.supabase.co
```

## 작업흐름
```
계획 → (테스트) → 구현 → (리팩토링) → 커밋
# 괄호는 시간 있을 때
```

## 실전 팁
- **막혔을 때**: 일단 작동하게 만들고 나중에 개선
- **오류 났을 때**: 에러 메시지 읽기 → git diff → 롤백
- **시간 없을 때**: 핵심 기능만 구현하고 TODO 주석
- **모르겠을 때**: console.log 찍어보고 Network 탭 확인

## 금지사항 (정말 하지 말것)
- [ ] 인증/결제 로직 대충 처리
- [ ] 프로덕션 DB 직접 수정
- [ ] 사용자 데이터 노출
- [ ] 백업 없이 대규모 변경

## 권장사항 (하면 좋지만 필수는 아님)
- [ ] 테스트 작성
- [ ] 완벽한 타입 정의
- [ ] 코드 중복 제거
- [ ] 성능 최적화
- [ ] 접근성 100% 준수

---
**핵심**: 작동하는 코드가 우선. 완벽은 나중에 추구하자!