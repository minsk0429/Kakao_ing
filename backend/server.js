

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { router: authRoutes } = require('./routes/auth');
const friendRoutes = require('./routes/friends');
const chatRoomRoutes = require('./routes/chatRooms');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CORS 설정: 프론트엔드 URL 및 인증정보 허용
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Socket.IO 인스턴스를 전역으로 설정
app.set('io', io);

// 라우트 연결 
app.use('/api/auth', authRoutes);           // 인증 (회원가입, 로그인, 프로필)
app.use('/api/friends', friendRoutes);      // 친구 관리 (친구 추가, 목록, 검색)
app.use('/api/chat-rooms', (req, res, next) => {
  req.io = io;
  next();
}, chatRoomRoutes); // 채팅방 관리
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

// Socket.IO 연결 처리
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  jwt.verify(token, 'yourjwtsecret', (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`사용자 ${socket.username} (ID: ${socket.userId}) 연결됨`);
  
  // 사용자를 특정 채팅방에 조인
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`${socket.username}이 채팅방 ${roomId}에 참여`);
    
    // 채팅방 참여 시에도 목록 업데이트 알림
    setTimeout(() => {
      io.emit('chat_room_updated', {
        roomId: roomId,
        action: 'join',
        userId: socket.userId
      });
    }, 100);
  });
  
  // 채팅방 나가기
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`${socket.username}이 채팅방 ${roomId}에서 나감`);
    
    // 채팅방 나가기 시에도 목록 업데이트 알림
    setTimeout(() => {
      io.emit('chat_room_updated', {
        roomId: roomId,
        action: 'leave',
        userId: socket.userId
      });
    }, 100);
  });
  
  // 메시지 전송
  socket.on('send_message', (data) => {
    const { roomId, content, message_type = 'text' } = data;
    
    // DB에 메시지 저장
    const messageModel = require('./models/messages');
    messageModel.createMessage(roomId, socket.userId, message_type, content, (err, result) => {
      if (err) {
        console.error('메시지 저장 실패:', err);
        return;
      }
      
      const messageId = result.insertId;
      
      // 저장된 메시지 정보 조회
      messageModel.getMessageById(messageId, (err, messages) => {
        if (err) {
          console.error('메시지 조회 실패:', err);
          return;
        }
        
        if (messages.length > 0) {
          const message = messages[0];
          const messageData = {
            id: message.id,
            room_id: message.room_id,
            sender_id: message.sender_id,
            sender_username: message.sender_username,
            sender_profile_image: message.sender_profile_image,
            message_type: message.message_type,
            content: message.content,
            created_at: message.created_at,
            unread_count: 1
          };
          
          // 같은 방의 모든 사용자에게 메시지 전송
          io.to(roomId).emit('receive_message', messageData);
          
          // 모든 연결된 사용자에게 채팅방 목록 업데이트 알림
          io.emit('chat_room_updated', {
            roomId: roomId,
            lastMessage: content,
            lastMessageTime: message.created_at
          });
        }
      });
    });
  });
  
  // 메시지 읽음 확인
  socket.on('message_read', (data) => {
    const { messageId, roomId, readerId } = data;
    
    // 메시지를 읽었으므로 unread_count를 0으로 설정
    const unread_count = 0;
    
    // 같은 방의 모든 사용자에게 읽음 상태 업데이트 전송
    io.to(roomId).emit('message_read_update', {
      messageId: messageId,
      unread_count: unread_count
    });
    
    console.log(`메시지 ${messageId}가 ${readerId}에 의해 읽음 처리됨`);
  });

  // 타이핑 중 상태
  socket.on('typing_start', (roomId) => {
    socket.to(roomId).emit('user_typing', {
      username: socket.username,
      isTyping: true
    });
  });
  
  socket.on('typing_stop', (roomId) => {
    socket.to(roomId).emit('user_typing', {
      username: socket.username,
      isTyping: false
    });
  });
  
  // 연결 해제
  socket.on('disconnect', () => {
    console.log(`사용자 ${socket.username} 연결 해제됨`);
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
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`KakaoTalk Clone Server running on port ${PORT}`);
});

// 프로세스 에러 핸들링
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // 서버를 graceful하게 종료하지 않고 즉시 종료
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // 서버를 graceful하게 종료
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});