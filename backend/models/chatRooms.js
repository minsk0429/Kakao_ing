const connection = require('../config/database');

// 채팅방 생성
exports.createChatRoom = (room_name = null, callback) => {
  const query = 'INSERT INTO chat_rooms (room_name) VALUES (?)';
  connection.query(query, [room_name], callback);
};

// 채팅방 멤버 추가
exports.addChatRoomMember = (room_id, user_id, callback) => {
  const query = 'INSERT INTO chat_room_members (room_id, user_id) VALUES (?, ?)';
  connection.query(query, [room_id, user_id], callback);
};

// 채팅방 멤버 조회
exports.getChatRoomMembers = (room_id, callback) => {
  const query = `
    SELECT u.id, u.username, u.profile_image, u.status_message, crm.joined_at
    FROM chat_room_members crm
    JOIN users u ON crm.user_id = u.id
    WHERE crm.room_id = ?
    ORDER BY crm.joined_at
  `;
  connection.query(query, [room_id], callback);
};

// 사용자의 채팅방 목록 조회
exports.getUserChatRooms = (user_id, callback) => {
  const query = `
    SELECT cr.id, cr.room_name, cr.created_at
    FROM chat_room_members crm
    JOIN chat_rooms cr ON crm.room_id = cr.id
    WHERE crm.user_id = ?
    ORDER BY cr.created_at DESC
  `;
  connection.query(query, [user_id], callback);
};

// 채팅방 정보 조회
exports.getChatRoomById = (room_id, callback) => {
  const query = 'SELECT id, room_name, created_at FROM chat_rooms WHERE id = ?';
  connection.query(query, [room_id], callback);
};