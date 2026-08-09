# 지점 대시보드

우리 지점 전용 관리 홈페이지입니다. GitHub Pages(무료 호스팅) + Firebase(로그인/데이터베이스)로 동작합니다.

## 담긴 내용
- 공지사항 (관리자만 작성, 전 직원 열람)
- 일정 관리 (전 직원 작성 가능)
- 직원 정보 (이름·직책·연락처, 본인 정보는 직접 수정)
- 실적 현황 (매출 등록 + 이번 달 자동 합계/평균)
- 직원별 이메일·비밀번호 로그인, 관리자 권한 분리

---

## 1단계. Firebase 프로젝트 만들기
1. https://console.firebase.google.com 접속 → 구글 계정 로그인
2. **프로젝트 추가** → 이름 입력 (예: `my-branch-dashboard`) → Analytics는 꺼도 무방
3. 왼쪽 메뉴 **Authentication** → 시작하기 → **Sign-in method** 탭 → **이메일/비밀번호** 사용 설정
4. 왼쪽 메뉴 **Firestore Database** → 데이터베이스 만들기 → **프로덕션 모드** → 위치 `asia-northeast3(서울)`
5. 왼쪽 상단 톱니바퀴 → **프로젝트 설정** → "내 앱" → 웹 아이콘(`</>`) 클릭 → 앱 닉네임 입력
6. 화면에 나오는 `firebaseConfig` 값을 복사해서 `js/firebase-config.js` 안의 값을 그대로 교체하세요.

## 2단계. 보안 규칙 적용
Firebase 콘솔 → **Firestore Database → 규칙(Rules)** 탭 → 이 프로젝트의 `firestore.rules` 내용을 그대로 붙여넣고 **게시**하세요.

## 3단계. 관리자 계정 만들기 (가장 먼저!)
1. 배포된 사이트에서 **회원가입** 진행
2. Firebase 콘솔 → **Firestore Database → 데이터** → `users` 컬렉션 → 방금 가입한 본인 문서 클릭
3. `role` 필드 값을 `"staff"` → `"admin"` 으로 수정
4. 다시 로그인하면 공지사항 작성 권한이 생깁니다. 이후 가입하는 직원은 기본적으로 `staff`이며, 필요 시 같은 방법으로 관리자 권한을 부여하세요.

## 4단계. GitHub Pages로 배포하기
1. https://github.com 에서 새 저장소 생성 (예: `branch-dashboard`), **Public**으로 설정
2. 이 폴더 안의 모든 파일(index.html, dashboard.html, css/, js/)을 저장소에 업로드
   - GitHub 웹사이트의 "Add file → Upload files" 사용 가능
3. 저장소 **Settings → Pages** 이동
4. **Source**를 `Deploy from a branch`로, **Branch**를 `main` / `(root)`로 설정 후 저장
5. 몇 분 후 `https://[깃허브아이디].github.io/branch-dashboard/` 주소로 접속 가능

---

## 파일 구조
```
index.html            로그인 / 회원가입
dashboard.html         메인 대시보드
css/style.css          디자인 (컬러·타이포 토큰)
js/firebase-config.js  ← Firebase 값 입력하는 곳 (필수)
js/firebase-init.js    Firebase 초기화
js/auth.js             로그인/회원가입 로직
js/app.js              대시보드 전체 로직
firestore.rules        Firestore 보안 규칙 (콘솔에 붙여넣기)
```

## 데이터 구조
| 컬렉션 | 필드 | 작성 권한 |
|---|---|---|
| `users` | name, position, phone, email, role | 본인만 (role은 콘솔에서 관리자가 변경) |
| `announcements` | title, body, authorName, createdAt | 관리자만 |
| `schedule` | date, title, memo, authorName, createdAt | 전 직원 |
| `sales` | date, amount, memo, authorName, createdAt | 전 직원 |

`js/app.js` 안의 각 `load...()` / `submit` 함수를 수정하면 필드나 화면 구성을 자유롭게 바꿀 수 있습니다.

## 나중에 고려하면 좋은 것들
- 파일 첨부: 지금은 텍스트 기반입니다. 실제 파일 업로드가 필요하면 Firebase Storage 연동이 추가로 필요해요.
- 실적 그래프: 지금은 이번 달 합계·평균만 보여줍니다. 월별 추이 그래프가 필요하면 이어서 만들어 드릴 수 있어요.
- 지점이 여러 곳이라면: 지점별로 데이터를 나누는 구조(지점 필드 추가 + 규칙 조정)로 확장할 수 있어요.
- 커스텀 도메인 연결
