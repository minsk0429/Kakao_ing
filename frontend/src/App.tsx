import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';
import './App.css';

// TypeScript 인터페이스
interface User {
  id: number;
  username: string;
  email?: string;
  profile_image?: string;
  status_message?: string;
}

interface Friend {
  id: number;
  username: string;
  profile_image?: string;
  status_message?: string;
}

interface ChatRoom {
  id: number;
  room_name?: string;
  created_at: string;
  last_message?: string;
  last_message_time?: string;
  participants?: User[];
  unread_count?: number;
}

interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  sender_username: string;
  sender_profile_image?: string;
  message_type: 'text' | 'image' | 'file';
  content: string;
  created_at: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({ username: '', password: '', email: '', status_message: '' });
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState('');
  
  // 메인 앱 상태
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  
  // 모달 상태
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendUsername, setFriendUsername] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('token'));
  
  // Socket.IO 상태
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedChatRoom, setSelectedChatRoom] = useState<number | null>(null);
  const [showChatRoom, setShowChatRoom] = useState(false);
  const [currentChatFriend, setCurrentChatFriend] = useState<Friend | null>(null);
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<Friend[]>([]);
  const [groupChatName, setGroupChatName] = useState('');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  // API 함수들
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginForm);
      const { user, token } = response.data;
      
      // 사용자 정보와 토큰 저장
      setUser(user);
      setAuthToken(token);
      localStorage.setItem('token', token);
      setIsLoggedIn(true);
      setMessage('로그인 성공!');
      
      // Socket.IO 연결
      connectSocket(token);
      
      // 토큰을 직접 전달하여 친구 목록과 채팅방 목록 로드
      loadFriends(token);
      loadChatRooms(token);
    } catch (error: any) {
      setMessage(error.response?.data?.error || '로그인 실패');
    }
  };

  // Socket.IO 연결 함수
  const connectSocket = (token: string) => {
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO 연결됨');
      
      // 연결 후 사용자 정보 설정 (토큰에서 디코드)
      if (!user && token) {
        // JWT 토큰에서 사용자 정보 디코드 (간단한 방법)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({ id: payload.id, username: payload.username });
          console.log('사용자 정보 설정됨:', payload);
        } catch (error) {
          console.error('토큰 디코드 실패:', error);
        }
      }
    });

    newSocket.on('message_read_update', (data) => {
      // 읽음 상태 업데이트
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, unread_count: data.unread_count }
          : msg
      ));
    });

    newSocket.on('user_typing', (data) => {
      console.log(`${data.username}이 타이핑 중: ${data.isTyping}`);
    });

    newSocket.on('chat_room_updated', (data) => {
      console.log('채팅방 업데이트 이벤트 수신:', data);
      // 채팅방 목록 즉시 새로고침
      loadChatRooms();
    });

    // 새로운 메시지 수신 시에도 채팅방 목록 업데이트
    newSocket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      
      // 채팅방 목록도 업데이트 (마지막 메시지 변경)
      setTimeout(() => loadChatRooms(), 500);
      
      // 다른 사용자의 메시지인 경우 읽음 확인 전송
      if (message.sender_id !== user?.id) {
        newSocket.emit('message_read', {
          messageId: message.id,
          roomId: message.room_id,
          readerId: user?.id
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO 연결 해제됨');
    });

    setSocket(newSocket);
  };

  // 메시지 목록 하단으로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지 전송
  const sendMessage = () => {
    if (!currentMessage.trim() || !socket || !selectedChatRoom) return;

    socket.emit('send_message', {
      roomId: selectedChatRoom,
      content: currentMessage,
      message_type: 'text'
    });

    setCurrentMessage('');
  };

  // 1:1 채팅 시작
  const startChat = async (friend: Friend) => {
    try {
      if (!authToken) return;
      
      // 채팅방 생성 또는 기존 채팅방 찾기
      const response = await axios.post(`${API_BASE_URL}/chat-rooms/create-or-find`, {
        participants: [user?.id, friend.id]
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const roomId = response.data.room.id;
      
      // 채팅방 참여
      if (socket) {
        // 이전 채팅방에서 나가기
        if (selectedChatRoom) {
          socket.emit('leave_room', selectedChatRoom);
        }
        
        // 새 채팅방 참여
        socket.emit('join_room', roomId);
        setSelectedChatRoom(roomId);
        setCurrentChatFriend(friend);
        setShowChatRoom(true);
        // DB에서 메시지 로드
        loadMessages(roomId);
        
        // 프로필 모달 닫기
        setShowProfile(false);
      }
    } catch (error) {
      console.error('채팅방 생성/조회 실패:', error);
      setMessage('채팅방을 시작할 수 없습니다.');
    }
  };

  const createGroupChat = async () => {
    if (selectedGroupMembers.length < 2 || !groupChatName.trim()) {
      alert('그룹 채팅방 이름을 입력하고 2명 이상의 친구를 선택해주세요.');
      return;
    }

    try {
      const participantIds = [user?.id, ...selectedGroupMembers.map(friend => friend.id)];
      const response = await axios.post(
        `${API_BASE_URL}/chat-rooms/create`,
        {
          name: groupChatName,
          room_type: 'group',
          participants: participantIds
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const chatRoom = response.data.room;
      setSelectedChatRoom(chatRoom.id);
      setCurrentChatFriend({ username: groupChatName, id: chatRoom.id, profile_image: undefined } as Friend);
      setShowChatRoom(true);
      setShowGroupChatModal(false);
      
      // 상태 초기화
      setSelectedGroupMembers([]);
      setGroupChatName('');

      // Socket.IO 채팅방 입장
      if (socket) {
        if (selectedChatRoom) {
          socket.emit('leave_room', selectedChatRoom);
        }
        socket.emit('join_room', chatRoom.id);
        // DB에서 메시지 로드
        loadMessages(chatRoom.id);
      }
    } catch (error) {
      console.error('그룹 채팅방 생성 실패:', error);
    }
  };

  const toggleGroupMember = (friend: Friend) => {
    setSelectedGroupMembers(prev => {
      const isSelected = prev.find(f => f.id === friend.id);
      if (isSelected) {
        return prev.filter(f => f.id !== friend.id);
      } else {
        return [...prev, friend];
      }
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/auth/signup`, signupForm);
      setMessage('회원가입 성공! 로그인해주세요.');
      setIsSignup(false);
      setSignupForm({ username: '', password: '', email: '', status_message: '' });
    } catch (error: any) {
      setMessage(error.response?.data?.error || '회원가입 실패');
    }
  };

  const handleLogout = () => {
    // Socket 연결 해제
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    // 로컬 데이터 정리
    localStorage.removeItem('token');
    setUser(null);
    setIsLoggedIn(false);
    setAuthToken(null);
    setMessage('');
    setFriends([]);
    setMessages([]);
    setActiveTab('friends');
  };

  const loadFriends = async (token?: string) => {
    try {
      const currentToken = token || authToken;
      if (!currentToken) {
        console.error('토큰이 없습니다.');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/friends/list`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      setFriends(response.data.friends || []);
      console.log('친구 목록 로드 성공:', response.data.friends);
    } catch (error) {
      console.error('친구 목록 로드 실패:', error);
    }
  };

  const loadChatRooms = async (token?: string) => {
    try {
      const currentToken = token || authToken;
      if (!currentToken) {
        console.error('토큰이 없습니다.');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/chat-rooms/list`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      setChatRooms(response.data.chatRooms || []);
      console.log('채팅방 목록 로드 성공:', response.data.chatRooms);
    } catch (error) {
      console.error('채팅방 목록 로드 실패:', error);
    }
  };

  // 채팅방의 메시지 로드
  const loadMessages = async (roomId: number) => {
    try {
      console.log('메시지 로드 시작 - 채팅방 ID:', roomId);
      if (!authToken) {
        console.error('토큰이 없습니다.');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/messages/room/${roomId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      console.log('메시지 API 응답:', response.data);
      setMessages(response.data.messages || []);
      console.log('메시지 로드 성공:', response.data.messages?.length || 0, '개');
      
      // 메시지 로드 후 스크롤을 맨 아래로
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('메시지 로드 실패:', error);
      setMessages([]);
    }
  };

  // 채팅방 나가기
  const leaveChatRoom = async (roomId: number) => {
    try {
      if (!authToken) {
        console.error('토큰이 없습니다.');
        return;
      }
      
      await axios.post(`${API_BASE_URL}/chat-rooms/${roomId}/leave`, {}, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      console.log('채팅방 나가기 성공:', roomId);
      
      // 현재 채팅방에서 나간 경우 채팅방에서 나가기
      if (selectedChatRoom === roomId) {
        setShowChatRoom(false);
        setSelectedChatRoom(null);
        setCurrentChatFriend(null);
        setMessages([]);
      }
      
      // 채팅방 목록 새로고침
      loadChatRooms();
    } catch (error) {
      console.error('채팅방 삭제 실패:', error);
      alert('채팅방 삭제에 실패했습니다.');
    }
  };

  // 향후 채팅 기능을 위해 주석으로 보관
  // const loadChatRooms = async () => {
  //   try {
  //     const response = await axios.get(`${API_BASE_URL}/chat-rooms`, {
  //       headers: { 'user-id': user?.id }
  //     });
  //     setChatRooms(response.data.rooms || []);
  //   } catch (error) {
  //     console.error('채팅방 목록 로드 실패:', error);
  //   }
  // };

  const addFriend = async () => {
    try {
      if (!authToken) {
        setMessage('로그인이 필요합니다.');
        return;
      }
      
      await axios.post(`${API_BASE_URL}/friends/add`, {
        friend_username: friendUsername
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      setMessage('친구 추가 성공!');
      setShowAddFriend(false);
      setFriendUsername('');
      // 친구 추가 후 목록 새로고침
      loadFriends(authToken);
    } catch (error: any) {
      console.log('친구 추가 에러:', error.response);
      if (error.response?.status === 409) {
        setMessage('이미 친구로 등록된 사용자입니다.');
      } else {
        setMessage(error.response?.data?.error || '친구 추가 실패');
      }
    }
  };

  // 채팅 탭 활성화 시 채팅방 목록 새로고침
  useEffect(() => {
    if (isLoggedIn && activeTab === 'chats' && authToken) {
      console.log('채팅 탭 활성화 - 채팅방 목록 새로고침');
      loadChatRooms();
    }
  }, [activeTab, isLoggedIn, authToken]);

  // 주기적 채팅방 목록 업데이트 (30초마다)
  useEffect(() => {
    if (!isLoggedIn || !authToken) return;

    const intervalId = setInterval(() => {
      if (activeTab === 'chats') {
        console.log('주기적 채팅방 목록 업데이트');
        loadChatRooms();
      }
    }, 30000); // 30초마다

    return () => clearInterval(intervalId);
  }, [isLoggedIn, authToken, activeTab]);

  if (!isLoggedIn) {
    return (
      <div className="App">
        <div className="auth-screen">
          {!isSignup ? (
            // 실제 카카오톡 로그인 화면
            <div className="login-container">
              {/* TALK 로고 */}
              <div className="kakao-talk-logo">
                <div className="talk-bubble">TALK</div>
              </div>

              {/* 로그인 폼 */}
              <form onSubmit={handleLogin} className="login-form">
                <input
                  type="text"
                  placeholder="카카오계정 (이메일 또는 전화번호)"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="login-input"
                  required
                />
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="login-input"
                  required
                />
                <button type="submit" className="kakao-login-btn">
                  로그인
                </button>
              </form>

              {/* 구분선 */}
              <div className="login-divider">
                <div className="divider-line"></div>
                <span className="divider-text">또는</span>
                <div className="divider-line"></div>
              </div>

              {/* QR 코드 로그인 */}
              <button className="qr-login-btn">
                📱 QR코드 로그인
              </button>

              {/* 자동 로그인 */}
              <div className="auto-login-section">
                <div className="auto-login-checkbox"></div>
                <span className="auto-login-text">자동 로그인</span>
              </div>

              {/* 에러 메시지 */}
              {message && <div className="error-message">{message}</div>}

              {/* 하단 링크 */}
              <div className="bottom-links">
                <span className="bottom-link" onClick={() => setIsSignup(true)}>
                  회원가입
                </span>
                <span className="bottom-link">
                  비밀번호 재설정
                </span>
              </div>
            </div>
          ) : (
            // 회원가입 화면
            <div className="signup-container">
              <div className="signup-header">
                <img src="/images/signup_kakao_logo.png" alt="KakaoTalk" className="signup-logo" />
                <h1>카카오톡을 시작합니다</h1>
                <p>사용하실 이메일과 비밀번호를<br />입력해 주세요.</p>
              </div>
              <form onSubmit={handleSignup} className="signup-form">
                <div className="input-group">
                  <label>사용자명</label>
                  <input
                    type="text"
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({...signupForm, username: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>이메일</label>
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>비밀번호</label>
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>상태메시지</label>
                  <input
                    type="text"
                    value={signupForm.status_message}
                    onChange={(e) => setSignupForm({...signupForm, status_message: e.target.value})}
                    placeholder="상태메시지를 입력하세요"
                  />
                </div>
                <button type="submit" className="signup-btn">회원가입</button>
              </form>
              
              {message && <div className="error-message">{message}</div>}
              
              <div className="auth-links">
                <span 
                  className="login-link" 
                  onClick={() => setIsSignup(false)}
                >
                  로그인으로 돌아가기
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 채팅방이 열려있을 때 채팅 UI
  if (showChatRoom && currentChatFriend) {
    return (
      <div className="App chat-mode">
        <div className="chat-room">
          {/* 채팅방 헤더 */}
          <div className="chat-header">
            <div className="chat-header-left">
              <button 
                className="back-btn" 
                onClick={() => {
                  setShowChatRoom(false);
                  setCurrentChatFriend(null);
                  if (socket && selectedChatRoom) {
                    socket.emit('leave_room', selectedChatRoom);
                  }
                  setSelectedChatRoom(null);
                }}
              >
                ←
              </button>
              <img 
                src={currentChatFriend.profile_image || "/images/baseProfile.jpg"} 
                alt="프로필" 
                className="chat-profile-img"
              />
              <div className="chat-info">
                <h3 className="chat-friend-name">{currentChatFriend.username}</h3>
                <span className="chat-member-count">2</span>
              </div>
            </div>
            <div className="chat-header-right">
              <button className="header-icon-btn">🔍</button>
              <button className="header-icon-btn">📞</button>
              <button className="header-icon-btn">📹</button>
              <button className="header-icon-btn">☰</button>
            </div>
          </div>

          {/* 채팅 메시지 영역 */}
          <div className="chat-messages">
            {/* 날짜 표시 */}
            <div className="date-divider">
              📅 2025년 11월 11일 화요일
            </div>

            {/* 메시지 목록 */}
            <div className="messages-container">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.sender_id === user?.id ? 'my-message' : 'friend-message'}`}>
                  {message.sender_id !== user?.id && (
                    <img 
                      src={currentChatFriend?.profile_image || "/images/baseProfile.jpg"} 
                      alt="프로필" 
                      className="message-profile-img"
                    />
                  )}
                  <div className="message-content">
                    <div className={`message-bubble ${message.sender_id === user?.id ? 'my-bubble' : 'friend-bubble'}`}>
                      {message.content}
                    </div>
                    <div className="message-info">
                      <div className="message-time">
                        {new Date(message.created_at).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 메시지 입력창 */}
          <div className="chat-input-area">
            <div className="input-toolbar">
              <button className="toolbar-btn">😊</button>
              <button className="toolbar-btn">📋</button>
              <button className="toolbar-btn">💬</button>
              <button className="toolbar-btn">📁</button>
              <button className="toolbar-btn">📷</button>
              <button className="toolbar-btn">🔄</button>
              <button className="toolbar-btn">😀</button>
            </div>
            <div className="input-container">
              <input
                type="text"
                placeholder="메시지 입력"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    sendMessage();
                  }
                }}
                className="message-input"
              />
              <button 
                onClick={sendMessage}
                className="send-btn"
                disabled={!currentMessage.trim()}
              >
                전송
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 메인 카카오톡 UI (실제 PC 버전 스타일)
  return (
    <div className="App">
      <div className="kakao-main">
        {/* 왼쪽 탭 사이드바 */}
        <div className="left-sidebar">
          <button 
            className={`tab-item ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <span className="tab-icon">👥</span>
          </button>
          <button 
            className={`tab-item ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <span className="tab-icon">💬</span>
          </button>
          <button 
            className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="tab-icon">⚙️</span>
          </button>
          
          {/* 하단에 프로필 버튼 */}
          <div style={{marginTop: 'auto', marginBottom: '20px'}}>
            <button 
              className="tab-item" 
              onClick={() => setShowProfile(true)}
              style={{background: 'none'}}
            >
              <img 
                src={user?.profile_image || "/images/baseProfile.jpg"} 
                alt="Profile" 
                style={{width: '32px', height: '32px', borderRadius: '8px'}}
              />
            </button>
          </div>
        </div>

        {/* 메인 컨테이너 */}
        <div className="main-container">
          {/* 친구 탭 */}
          {activeTab === 'friends' && (
            <>
              <div className="friends-sidebar">
                <div className="friends-header">
                  <h2 className="friends-title">친구</h2>
                  <div className="header-actions">
                    <button className="header-btn" onClick={() => setShowAddFriend(true)}>
                      👤+
                    </button>
                    <button className="header-btn" onClick={() => setShowGroupChatModal(true)}>
                      👥
                    </button>
                    <button className="header-btn">🔍</button>
                  </div>
                </div>

                {/* 내 프로필 */}
                <div className="my-profile-section" onClick={() => setShowProfile(true)}>
                  <img 
                    src={user?.profile_image || "/images/baseProfile.jpg"} 
                    alt="내 프로필" 
                    className="profile-image" 
                  />
                  <div className="profile-info">
                    <div className="profile-name">{user?.username}</div>
                    <div className="profile-status">{user?.status_message || '상태메시지 없음'}</div>
                  </div>
                </div>

                {/* 친구 목록 */}
                <div className="friends-content">
                  {friends.map((friend) => (
                    <div 
                      key={friend.id} 
                      className="friend-item"
                      onClick={() => {
                        setSelectedFriend(friend);
                        setShowProfile(true);
                      }}
                    >
                      <img 
                        src={friend.profile_image || "/images/baseProfile.jpg"} 
                        alt="친구" 
                        className="profile-image"
                      />
                      <div className="profile-info">
                        <div className="profile-name">{friend.username}</div>
                        <div className="profile-status">{friend.status_message || '상태메시지 없음'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 우측 안내 영역 */}
              <div className="right-content">
                <div className="welcome-text">
                  <h3>친구를 추가해 보세요</h3>
                  <p>우측 상단의 친구 추가 버튼을 눌러<br />전화번호와 카카오톡 ID로 친구를 찾아보세요.</p>
                </div>
              </div>
            </>
          )}

          {/* 채팅 탭 */}
          {activeTab === 'chats' && (
            <>
              <div className="friends-sidebar">
                <div className="friends-header">
                  <h2 className="friends-title">채팅</h2>
                  <div className="header-actions">
                    <button className="header-btn" onClick={() => setShowGroupChatModal(true)}>
                      👥
                    </button>
                    <button className="header-btn">🔍</button>
                  </div>
                </div>

                {/* 채팅방 목록 */}
                <div className="friends-content">
                  {chatRooms.length > 0 ? (
                    chatRooms.map((room) => (
                      <div 
                        key={room.id} 
                        className="chat-room-item"
                      >
                        <div 
                          className="chat-room-content"
                          onClick={() => {
                            console.log('채팅방 목록에서 클릭:', room.id);
                            // 채팅방 입장 로직
                            const roomFriend = room.participants?.find((p: any) => p.id !== user?.id) || 
                                              { username: room.room_name || '그룹채팅', id: room.id, profile_image: undefined };
                            
                            if (socket) {
                              // 이전 채팅방에서 나가기
                              if (selectedChatRoom) {
                                console.log('이전 채팅방에서 나가기:', selectedChatRoom);
                                socket.emit('leave_room', selectedChatRoom);
                              }
                              
                              // 새 채팅방 참여
                              console.log('새 채팅방 참여:', room.id);
                              socket.emit('join_room', room.id);
                              setSelectedChatRoom(room.id);
                              setCurrentChatFriend(roomFriend as Friend);
                              setShowChatRoom(true);
                              // DB에서 메시지 로드
                              loadMessages(room.id);
                            }
                          }}
                        >
                          <img 
                            src={room.participants?.find((p: any) => p.id !== user?.id)?.profile_image || "/images/baseProfile.jpg"} 
                            alt="채팅방" 
                            className="profile-image"
                          />
                          <div className="profile-info">
                            <div className="profile-name">
                              {room.participants?.find((p: any) => p.id !== user?.id)?.username || 
                               (room.participants && room.participants.length > 2 ? `그룹채팅 (${room.participants.length}명)` : '알 수 없는 채팅방')}
                            </div>
                            <div className="profile-status">
                              {room.last_message || '아직 메시지가 없습니다'}
                            </div>
                          </div>
                          {room.unread_count && room.unread_count > 0 && (
                            <div className="unread-badge">{room.unread_count}</div>
                          )}
                        </div>
                        <button 
                          className="chat-room-leave-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('이 채팅방을 나가시겠습니까?')) {
                              leaveChatRoom(room.id);
                            }
                          }}
                          title="채팅방 나가기"
                        >
                          🚪
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>아직 채팅방이 없습니다</p>
                      <p>친구와 채팅을 시작해보세요!</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 설정 탭 */}
          {activeTab === 'settings' && (
            <div className="welcome-screen">
              <div className="welcome-content">
                <h2>설정</h2>
                <button onClick={handleLogout} className="logout-btn">로그아웃</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 모달들 */}
      {showAddFriend && (
        <div className="modal-overlay" onClick={() => setShowAddFriend(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>친구 추가</h3>
              <button className="close-btn" onClick={() => setShowAddFriend(false)}>×</button>
            </div>
            <div className="modal-content">
              <input
                type="text"
                placeholder="친구의 사용자명을 입력하세요"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                className="modal-input"
              />
              <button onClick={addFriend} className="modal-btn">친구 추가</button>
            </div>
          </div>
        </div>
      )}

      {showProfile && selectedFriend && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal friend-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="friend-profile-header">
              <img 
                src={selectedFriend.profile_image || "/images/baseProfile.jpg"} 
                alt="친구 프로필" 
                className="friend-profile-img"
              />
              <div className="friend-info">
                <h2 className="friend-name">{selectedFriend.username}</h2>
                <p className="friend-status">{selectedFriend.status_message || '상태메시지 없음'}</p>
              </div>
              <button className="close-btn" onClick={() => setShowProfile(false)}>×</button>
            </div>
            <div className="friend-profile-actions">
              <button 
                className="chat-start-btn" 
                onClick={() => startChat(selectedFriend)}
              >
                💬 1:1 채팅
              </button>
              <button className="voice-call-btn">
                📞 통화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 그룹 채팅 생성 모달 */}
      {showGroupChatModal && (
        <div className="modal-overlay" onClick={() => setShowGroupChatModal(false)}>
          <div className="modal group-chat-modal" onClick={(e) => e.stopPropagation()}>
            <h3>그룹 채팅방 만들기</h3>
            <input
              type="text"
              placeholder="그룹 채팅방 이름을 입력하세요"
              value={groupChatName}
              onChange={(e) => setGroupChatName(e.target.value)}
              className="modal-input"
            />
            <div className="friend-selection">
              <h4>친구 선택</h4>
              <div className="friend-list">
                {friends.map((friend) => (
                  <div 
                    key={friend.id} 
                    className={`selectable-friend ${selectedGroupMembers.find(f => f.id === friend.id) ? 'selected' : ''}`}
                    onClick={() => toggleGroupMember(friend)}
                  >
                    <img 
                      src={friend.profile_image || "/images/baseProfile.jpg"} 
                      alt="친구" 
                      className="profile-image-small"
                    />
                    <span className="friend-name">{friend.username}</span>
                    {selectedGroupMembers.find(f => f.id === friend.id) && (
                      <span className="selected-check">✓</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="selected-members">
                선택된 친구: {selectedGroupMembers.length}명
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowGroupChatModal(false)} className="cancel-btn">취소</button>
              <button onClick={createGroupChat} className="create-btn">만들기</button>
            </div>
          </div>
        </div>
      )}

      {/* 알림 */}
      {message && (
        <div className="notification">
          {message}
        </div>
      )}
    </div>
  );
};

export default App;