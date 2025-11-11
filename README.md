# 카카오톡 클론 (Kakao_ing)

## 주요 기능

### 사용자 관리
- **회원가입 & 로그인**: JWT 토큰 기반 인증
- **친구 추가 & 관리**: 사용자명으로 친구 검색 및 추가
- **프로필 관리**: 상태메시지, 프로필 이미지 설정

### 채팅 기능
- **1:1 채팅**: 개인 간 실시간 메시지 송수신
- **그룹 채팅**: 다중 사용자 채팅방 생성 및 관리
- **채팅방 나가기**: 개별 사용자 채팅방 숨김 기능
- **실시간 업데이트**: 채팅방 목록 자동 새로고침

## 기술 스택

### 프론트엔드
- **React + TypeScript**: UI 컴포넌트 및 타입 안전성
- **Vite**: 빠른 개발 서버 및 빌드 도구
- **Socket.IO Client**: 실시간 통신
- **Axios**: HTTP API 통신
- **CSS3**: 카카오톡 스타일 UI 디자인

### 백엔드
- **Node.js + Express.js**: 서버 프레임워크
- **Socket.IO**: 실시간 양방향 통신
- **JWT**: 사용자 인증 및 토큰 관리
- **bcrypt**: 비밀번호 암호화
- **MySQL Connection Pool**: 안정적인 데이터베이스 연결

### 데이터베이스
- **MySQL**: 관계형 데이터베이스
- **테이블 구조**: users, friends, chat_rooms, chat_room_members, messages
- **인덱싱**: 성능 최적화를 위한 외래키 및 인덱스 설정

## 프로젝트 구조

```
카카오초안/
├── backend/
│   ├── config/
│   │   └── database.js          # DB 연결 설정
│   ├── models/
│   │   ├── users.js            # 사용자 모델
│   │   ├── chatRooms.js        # 채팅방 모델
│   │   └── messages.js         # 메시지 모델
│   ├── routes/
│   │   ├── auth.js             # 인증 라우터
│   │   ├── friends.js          # 친구 관리
│   │   ├── chatRooms.js        # 채팅방 관리
│   │   └── messages.js         # 메시지 처리
│   └── server.js               # 메인 서버 파일
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # 메인 앱 컴포넌트
│   │   ├── App.css             # 스타일시트
│   │   └── main.tsx            # 앱 진입점
│   └── package.json
└── db/
    └── database.sql            # 데이터베이스 스키마
```

## 설치 및 실행

### 1. 데이터베이스 설정
```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 테이블 설정
SOURCE db/database.sql;
```

### 2. 백엔드 실행
```bash
cd backend
npm install
node server.js
```

### 3. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

### 4. 접속 정보
- **백엔드 API**: http://localhost:5000
- **프론트엔드**: http://localhost:3002

