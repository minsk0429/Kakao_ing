# 🟡 카카오톡 클론 프로젝트 (Kakao_ing)

## ✨ 주요 특징

- **🎨 실제 카카오톡과 동일한 UI**: PC 버전 카카오톡의 로그인 화면부터 메인 화면까지 완벽 재현
- **� 완전한 사용자 인증**: JWT 기반 보안 시스템과 bcrypt 비밀번호 암호화
- **👥 친구 관리 시스템**: 친구 추가, 삭제, 프로필 관리 기능
- **💬 실시간 채팅**: 1:1 및 그룹 채팅 지원
- **📱 반응형 디자인**: 모바일과 데스크톱 환경 모두 지원
- **🏗️ 확장 가능한 아키텍처**: MVC 패턴과 RESTful API 설계

## �🛠️ 기술 스택

### 백엔드
- **Node.js** + **Express.js** - RESTful API 서버
- **MySQL** - 관계형 데이터베이스
- **JWT** - 토큰 기반 인증
- **bcrypt** - 비밀번호 해싱
- **CORS** - 교차 출처 리소스 공유 설정

### 프론트엔드
- **React 18** + **TypeScript** - 타입 안전성을 갖춘 모던 UI
- **Vite** - 빠른 개발 환경과 빌드
- **CSS3** - 카카오톡과 동일한 스타일링
- **Axios** - HTTP 클라이언트

### 데이터베이스 설계
```sql
users           - 사용자 정보 (id, username, email, password_hash, profile_image, status_message)
friends         - 친구 관계 (양방향 관계 지원)
chat_rooms      - 채팅방 정보
chat_room_members - 채팅방 참여자 관리
messages        - 메시지 저장 (텍스트/이미지/파일 지원)
```

## 📁 프로젝트 구조

```
카카오초안/
├── 📁 backend/                  # Node.js API 서버
│   ├── 📁 config/
│   │   └── database.js          # MySQL 연결 설정
│   ├── 📁 models/               # 데이터 모델 (MVC)
│   │   ├── users.js             # 사용자 CRUD 작업
│   │   ├── chatRooms.js         # 채팅방 관리
│   │   └── messages.js          # 메시지 처리
│   ├── 📁 routes/               # API 라우트
│   │   ├── auth.js              # 회원가입/로그인
│   │   ├── friends.js           # 친구 관리
│   │   ├── chatRooms.js         # 채팅방 생성/관리
│   │   └── messages.js          # 메시지 송수신
│   ├── server.js                # Express 서버 엔트리포인트
│   └── package.json
│
├── 📁 frontend/                 # React 클라이언트
│   ├── 📁 src/
│   │   ├── App.tsx              # 메인 React 컴포넌트
│   │   ├── App.css              # 카카오톡 스타일 CSS
│   │   └── main.tsx             # React 앱 진입점
│   ├── 📁 public/
│   │   └── 📁 images/           # UI 에셋
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── 📁 db/
│   └── database.sql             # 데이터베이스 스키마
├── .gitignore                   # Git 무시 파일
└── README.md
│   └── tsconfig.json
└── db/
    └── database.sql             # 데이터베이스 스키마
```

## ✨ 주요 기능

### 🔐 인증 기능
- **회원가입** - 사용자명, 비밀번호, 이메일, 상태메시지
- **로그인** - JWT 토큰 기반 인증
- **프로필 조회/수정** - 프로필 이미지, 상태메시지 관리

### 👥 친구 관리
- **친구 추가** - 사용자명으로 친구 검색 및 추가
- **친구 목록** - 프로필 이미지, 상태메시지 포함
- **친구 검색** - 실시간 사용자 검색

### 💬 채팅 기능
- **채팅방 생성** - 1:1 및 그룹 채팅방
- **채팅방 관리** - 멤버 추가/조회
- **실시간 메시징** - 텍스트, 이미지, 파일 전송
- **메시지 히스토리** - 페이지네이션 지원

## 📊 데이터베이스 스키마

### users (사용자)
- `id`, `username`, `email`, `password_hash`
- `profile_image`, `status_message`, `created_at`

### friends (친구 관계)
- `id`, `user_id`, `friend_id`, `created_at`

### chat_rooms (채팅방)
- `id`, `room_name`, `created_at`

### chat_room_members (채팅방 멤버)
- `id`, `room_id`, `user_id`, `joined_at`

### messages (메시지)
- `id`, `room_id`, `sender_id`, `message_type`
- `content`, `created_at`

## 🔧 수정사항

### 프로젝트 구조 개선
- **MVC 패턴 적용** - routes, models, config 폴더 분리
- **모듈화** - 기능별 파일 분리로 유지보수성 향상

### 데이터베이스 필드명 통일
- **스키마 기준 정규화** - 모든 API가 database.sql과 일치
- **TypeScript 타입 안정성** - 프론트엔드 인터페이스 추가

### API 확장
- **완전한 CRUD** - 모든 테이블에 대한 생성/조회/수정 API
- **에러 핸들링** - 체계적인 에러 응답 및 상태 코드
- **보안 강화** - JWT 미들웨어, 비밀번호 해싱

## 🆕 추가된 기능

### 새로운 API 엔드포인트
- `POST /api/chat-rooms/create` - 채팅방 생성
- `GET /api/chat-rooms/list` - 사용자 채팅방 목록
- `POST /api/messages/send` - 메시지 전송
- `GET /api/messages/room/:room_id` - 채팅방 메시지 조회
- `GET /api/auth/profile` - 프로필 조회
- `PUT /api/auth/profile` - 프로필 수정

### 향상된 기능
- **친구 시스템** - 프로필 정보 포함 응답
- **메시지 타입** - 텍스트/이미지/파일 구분
- **페이지네이션** - 메시지 히스토리 효율적 로딩

## 🚀 실행 방법

### 백엔드
```bash
cd backend
npm install
npm run dev
```

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

### 데이터베이스
```sql
-- db/database.sql 실행
mysql -u root -p < db/database.sql
```

## 📡 API 문서

서버 실행 후 `http://localhost:3001`에서 API 엔드포인트 확인 가능



