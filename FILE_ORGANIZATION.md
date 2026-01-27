# SBS-SheetHub 프로젝트 파일 구조 정리 가이드

## 📁 새로운 프로젝트 구조

```
src/
├── App.jsx                           # 메인 앱 컴포넌트
├── main.jsx                          # 엔트리 포인트
├── assets/                           # 이미지, 아이콘 등 정적 자산
│   └── react.svg
├── components/                       # 재사용 가능한 컴포넌트
│   ├── Common/                       # 공통 컴포넌트
│   │   ├── Header.jsx                # 헤더 네비게이션
│   │   └── ClockRing.jsx             # 원형 시계 컴포넌트
│   ├── Teacher/                      # 강사 관련 컴포넌트
│   │   ├── TeacherForm.jsx           # 강사 추가/수정 폼
│   │   └── TeacherTable.jsx          # 강사 테이블 표시
│   └── Subject/                      # 과목 관련 컴포넌트
│       ├── DetailForm.jsx            # 과목 상세내용 추가/수정 폼
│       └── SubjectDetailTable.jsx    # 과목 상세 테이블 표시
├── pages/                            # 페이지 컴포넌트
│   ├── DataTablePage.jsx             # 강의 시트 관리 페이지
│   └── FeedbackPage.jsx              # 피드백 페이지
├── hooks/                            # 커스텀 React 훅
│   └── useClock.js                   # 실시간 시계 훅
├── utils/                            # 유틸리티 함수
│   └── dateUtils.js                  # 날짜/시간 포맷팅 함수
└── styles/                           # 모든 CSS 파일 중앙화
    ├── global.css                    # 전역 스타일
    ├── app.css                       # App 컴포넌트 스타일
    ├── header.css                    # 헤더 스타일
    ├── clock.css                     # 시계 컴포넌트 스타일
    ├── datatable.css                 # 데이터 테이블 스타일
    └── feedback.css                  # 피드백 페이지 스타일
```

## 🎯 정리의 주요 개선사항

### 1. **폴더 구조 재정렬**
- **components**: 기능별로 서브폴더 분류
  - `Common/`: 재사용 가능한 공통 컴포넌트 (Header, ClockRing)
  - `Teacher/`: 강사 관련 컴포넌트 그룹화
  - `Subject/`: 과목/과목상세 관련 컴포넌트 그룹화

- **pages**: 페이지 레벨 컴포넌트 분리
  - `DataTablePage.jsx`: 강의 시트 관리 페이지
  - `FeedbackPage.jsx`: 피드백 페이지

### 2. **CSS 파일 중앙화 (`styles/` 폴더)**
- 모든 CSS 파일을 `src/styles/` 폴더에 통합
- 각 CSS는 해당 기능별로 명확하게 이름 지정
  - `datatable.css`: 테이블 관련 모든 스타일
  - `clock.css`: 시계 컴포넌트 스타일
  - `header.css`: 헤더 네비게이션 스타일
  - `feedback.css`: 피드백 폼 스타일
  - `global.css`: 전역 스타일 및 초기화

### 3. **커스텀 훅 분리 (`hooks/` 폴더)**
- `useClock.js`: 시간 업데이트 로직을 별도 훅으로 추출
- App.jsx에서 로직 분리되어 코드 가독성 증대

### 4. **유틸리티 함수 분리 (`utils/` 폴더)**
- `dateUtils.js`: 날짜/시간 포맷팅 함수 (`formatTime`)
- 재사용 가능한 순수 함수로 분리

### 5. **컴포넌트 임포트 경로 정리**
```jsx
// Before
import Header from './components/Header'
import ClockRing from './components/ClockRing'  // ClockRing이 App.jsx 내부에 있었음

// After
import Header from './components/Common/Header'
import ClockRing from './components/Common/ClockRing'
import TeacherTable from '../components/Teacher/TeacherTable'
import DetailForm from '../components/Subject/DetailForm'
```

## 📦 모듈 분리 예시

### App.jsx (정리 전)
- 380+ 줄의 코드
- 시간 포맷팅 함수 포함
- ClockRing 컴포넌트 내부 정의

### App.jsx (정리 후)
- 25줄의 깔끔한 코드
- 관심사 분리 (CSP - Component Separation Pattern)
- 외부 컴포넌트만 import

### ClockRing.jsx
- `useClock` 훅 사용으로 로직 분리
- `formatTime` 유틸리티 함수 재사용

## 🔧 빌드 및 실행

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 린트 확인
npm run lint
```

## 📋 파일별 책임

| 파일/폴더 | 책임 |
|----------|------|
| `App.jsx` | 메인 라우팅 및 페이지 전환 |
| `components/Common/` | 여러 곳에서 재사용되는 UI 컴포넌트 |
| `components/Teacher/` | 강사 데이터 표시/수정 관련 컴포넌트 |
| `components/Subject/` | 과목 상세 데이터 표시/수정 관련 컴포넌트 |
| `pages/` | 페이지 레벨의 컨테이너 컴포넌트 |
| `hooks/` | 커스텀 React 훅 (상태 로직) |
| `utils/` | 순수 유틸리티 함수 |
| `styles/` | 전체 CSS 스타일시트 |

## ✅ 정리 효과

1. **유지보수성 향상**: 기능별 폴더 구조로 코드 찾기 용이
2. **재사용성 증대**: 컴포넌트가 명확하게 분류되어 재사용 용이
3. **확장성 개선**: 새 기능 추가 시 올바른 위치에 파일 추가 가능
4. **코드 응집도**: 관련된 파일들이 한 곳에 모여있음
5. **스타일 관리**: 모든 CSS가 중앙화되어 스타일 충돌 방지

---

**정리 완료일**: 2026-01-26  
**주요 개선**: 폴더 구조화, CSS 중앙화, 커스텀 훅 분리, 유틸리티 함수 추출
