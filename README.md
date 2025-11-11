# 카카오톡 클론 (Kakao_ing)

## 기능

- 사용자 회원가입 및 로그인 (JWT 인증)
- 친구 추가 및 관리
- 1:1 채팅 및 그룹 채팅
- 실시간 메시지 송수신
- 프로필 관리

## 기술 스택

**백엔드**
- Node.js + Express.js
- MySQL
- JWT 인증
- bcrypt 암호화

**프론트엔드**
- React + TypeScript
- Vite
- CSS3
- Axios

**데이터베이스**
- mySQL

## 프로젝트 구조

```
├── backend/
│   ├── config/database.js
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   └── public/
└── db/database.sql
```

## 설치 및 실행

**데이터베이스 설정**
```bash
mysql -u root -p
CREATE DATABASE kakaotalk_clone;
USE kakaotalk_clone;
source db/database.sql;
```

**백엔드 실행**
```bash
cd backend
npm install
npm start
```

**프론트엔드 실행**
```bash
cd frontend
npm install
npm run dev
```

- 백엔드: http://localhost:3001
- 프론트엔드: http://localhost:3002