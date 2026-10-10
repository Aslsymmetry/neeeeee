# neeeeee — 차근차근

HTML, CSS, JavaScript와 Firebase Realtime Database로 만든 한국어 할 일 앱입니다.

## 실행

Node.js 18 이상을 설치한 후 프로젝트 폴더에서 실행합니다. 패키지 설치는 필요 없습니다.

```bash
npm start
```

브라우저에서 http://127.0.0.1:3000/index.html 을 엽니다. 서버 종료는 Ctrl+C입니다.
Firebase SDK와 글꼴을 불러오려면 인터넷 연결이 필요합니다.

## 기능

- 할 일 추가, 수정, 확인 후 삭제
- 완료 표시와 전체 / 진행 중 / 완료 필터
- 완료율과 할 일 개수 표시
- 새로고침 후 데이터 유지 및 여러 탭 사이 실시간 동기화
- 모바일 화면, 키보드 조작, 저장 및 접근 오류 안내

## Firebase

`app.js`에 제공된 설정과 SDK 13.0.0을 적용했습니다.
데이터베이스: https://ttttttoooodo-default-rtdb.firebaseio.com/
저장 경로: `/todos/{자동생성ID}`
필드: `text`, `completed`, `createdAt`, `updatedAt`.
추가/완료 변경은 서버 타임스탬프, 수정 트랜잭션은 클라이언트 타임스탬프를 사용합니다.

이 앱은 로그인 없이 하나의 목록을 공유합니다. Firebase 규칙에서 `/todos`의 읽기와 쓰기가 허용되어 있어야 합니다. 접근 권한 오류가 표시되면 Firebase 콘솔 → Realtime Database → 규칙에서 현재 권한을 확인하세요. 규칙은 앱에서 자동 변경하지 않습니다.
공개 운영이나 개인별 목록이 필요하면 Firebase Authentication과 사용자별 데이터 규칙을 추가하세요. Firebase 웹 설정은 공개 클라이언트 설정이며 데이터 보호는 보안 규칙이 담당합니다.

공식 문서: https://firebase.google.com/docs/database/web/read-and-write?hl=ko

로컬 서버는 `127.0.0.1:3000`에만 바인딩되며 앱의 HTML/CSS/JS 파일만 제공합니다.
