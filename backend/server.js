

const express = require('express');
const cors = require('cors');
const { router: authRoutes } = require('./routes/auth');
const friendRoutes = require('./routes/friends');
const chatRoomRoutes = require('./routes/chatRooms');
const messageRoutes = require('./routes/messages');

const app = express();

// CORS 설정: 프론트엔드 URL(3000포트) 및 인증정보 허용
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));

app.use(express.json());

// 라우트 연결 
app.use('/api/auth', authRoutes);           // 인증 (회원가입, 로그인, 프로필)
app.use('/api/friends', friendRoutes);      // 친구 관리 (친구 추가, 목록, 검색)
app.use('/api/chat-rooms', chatRoomRoutes); // 채팅방 관리
app.use('/api/messages', messageRoutes);    // 메시지 관리

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'KakaoTalk Clone API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      friends: '/api/friends', 
      chatRooms: '/api/chat-rooms',
      messages: '/api/messages'
    }
  });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 핸들링
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`KakaoTalk Clone Server running on port ${PORT}`);
});