import React, { useState } from 'react';
import axios from 'axios';
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

// 향후 채팅 기능을 위해 주석으로 보관
// interface ChatRoom {
//   id: number;
//   room_name?: string;
//   created_at: string;
// }

// interface Message {
//   id: number;
//   room_id: number;
//   sender_id: number;
//   sender_username: string;
//   sender_profile_image?: string;
//   message_type: 'text' | 'image' | 'file';
//   content: string;
//   created_at: string;
// }

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
  const [friendUsername, setFriendUsername] = useState('');

  const API_BASE_URL = 'http://localhost:3001/api';

  // API 함수들
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginForm);
      setUser(response.data.user);
      setIsLoggedIn(true);
      setMessage('로그인 성공!');
      loadFriends();
    } catch (error: any) {
      setMessage(error.response?.data?.error || '로그인 실패');
    }
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
    setUser(null);
    setIsLoggedIn(false);
    setFriends([]);
    setActiveTab('friends');
  };

  const loadFriends = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/friends`, {
        headers: { 'user-id': user?.id }
      });
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('친구 목록 로드 실패:', error);
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
      await axios.post(`${API_BASE_URL}/friends/add`, {
        friendUsername: friendUsername
      }, {
        headers: { 'user-id': user?.id }
      });
      setMessage('친구 추가 성공!');
      setShowAddFriend(false);
      setFriendUsername('');
      loadFriends();
    } catch (error: any) {
      setMessage(error.response?.data?.error || '친구 추가 실패');
    }
  };

  // API 연결 테스트는 로그인 시에만 필요하므로 제거
  // useEffect(() => {
  //   // 필요시 여기에서 초기 설정
  // }, []);

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
                  카카오계정 찾기
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
                    <div key={friend.id} className="friend-item">
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
            <div className="welcome-screen">
              <div className="welcome-content">
                <h2>채팅</h2>
                <p>채팅방을 선택하여 대화를 시작해보세요</p>
              </div>
            </div>
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

      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>내 프로필</h3>
              <button className="close-btn" onClick={() => setShowProfile(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="profile-edit">
                <img 
                  src={user?.profile_image || "/images/baseProfile.jpg"} 
                  alt="프로필" 
                  className="profile-edit-img"
                />
                <div className="profile-details">
                  <div className="detail-item">
                    <strong>이름:</strong> {user?.username}
                  </div>
                  <div className="detail-item">
                    <strong>이메일:</strong> {user?.email || '없음'}
                  </div>
                  <div className="detail-item">
                    <strong>상태메시지:</strong> {user?.status_message || '없음'}
                  </div>
                </div>
              </div>
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