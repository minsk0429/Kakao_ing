const connection = require('../config/database');

// 메시지 생성
exports.createMessage = (room_id, sender_id, message_type, content, callback) => {
  const query = 'INSERT INTO messages (room_id, sender_id, message_type, content) VALUES (?, ?, ?, ?)';
  connection.query(query, [room_id, sender_id, message_type, content], (err, result) => {
    if (err) return callback(err, result);
    
    // 새 메시지가 생성되면 해당 채팅방에서 나간 모든 사용자들의 채팅방을 다시 보이게 함
    const showRoomQuery = `
      UPDATE chat_room_members 
      SET hidden = FALSE, left_at = NULL 
      WHERE room_id = ? AND hidden = TRUE
    `;
    connection.query(showRoomQuery, [room_id], (showErr) => {
      if (showErr) {
        console.error('채팅방 다시 보이기 오류:', showErr);
      }
      callback(err, result);
    });
  });
};

// 채팅방의 메시지 조회
exports.getMessagesByRoomId = (room_id, limit = 50, offset = 0, callback) => {
  const query = `
    SELECT m.id, m.room_id, m.sender_id, m.message_type, m.content, m.created_at,
           u.username as sender_username, u.profile_image as sender_profile_image
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.room_id = ?
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `;
  connection.query(query, [room_id, limit, offset], callback);
};

// 메시지 ID로 메시지 조회
exports.getMessageById = (message_id, callback) => {
  const query = `
    SELECT m.id, m.room_id, m.sender_id, m.message_type, m.content, m.created_at,
           u.username as sender_username, u.profile_image as sender_profile_image
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `;
  connection.query(query, [message_id], callback);
};

// 최근 메시지 조회 (채팅방별)
exports.getLatestMessageByRoomId = (room_id, callback) => {
  const query = `
    SELECT m.id, m.room_id, m.sender_id, m.message_type, m.content, m.created_at,
           u.username as sender_username, u.profile_image as sender_profile_image
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.room_id = ?
    ORDER BY m.created_at DESC
    LIMIT 1
  `;
  connection.query(query, [room_id], callback);
};