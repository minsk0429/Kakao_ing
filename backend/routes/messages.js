const express = require('express');
const messageModel = require('../models/messages');
const { authenticateToken } = require('./auth');
const router = express.Router();

// 메시지 전송
router.post('/send', authenticateToken, (req, res) => {
    const { room_id, message_type = 'text', content } = req.body;
    const sender_id = req.user.id;
    
    if (!room_id || !content) {
        return res.status(400).json({ error: 'room_id and content are required' });
    }
    
    // 메시지 타입 유효성 검사
    const validTypes = ['text', 'image', 'file'];
    if (!validTypes.includes(message_type)) {
        return res.status(400).json({ error: 'Invalid message_type. Must be text, image, or file' });
    }
    
    messageModel.createMessage(room_id, sender_id, message_type, content, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const message_id = result.insertId;
        
        // 생성된 메시지 정보 반환
        messageModel.getMessageById(message_id, (err, messages) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (messages.length === 0) {
                return res.status(404).json({ error: 'Message not found' });
            }
            
            const message = messages[0];
            res.json({
                success: true,
                message: {
                    id: message.id,
                    room_id: message.room_id,
                    sender_id: message.sender_id,
                    sender_username: message.sender_username,
                    sender_profile_image: message.sender_profile_image,
                    message_type: message.message_type,
                    content: message.content,
                    created_at: message.created_at
                }
            });
        });
    });
});

// 채팅방 메시지 조회
router.get('/room/:room_id', authenticateToken, (req, res) => {
    const { room_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    messageModel.getMessagesByRoomId(room_id, parseInt(limit), parseInt(offset), (err, messages) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // 메시지를 시간순으로 정렬 (오래된 것부터)
        const sortedMessages = messages.reverse();
        
        res.json({
            success: true,
            messages: sortedMessages.map(message => ({
                id: message.id,
                room_id: message.room_id,
                sender_id: message.sender_id,
                sender_username: message.sender_username,
                sender_profile_image: message.sender_profile_image,
                message_type: message.message_type,
                content: message.content,
                created_at: message.created_at
            }))
        });
    });
});

// 특정 메시지 조회
router.get('/:message_id', authenticateToken, (req, res) => {
    const { message_id } = req.params;
    
    messageModel.getMessageById(message_id, (err, messages) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (messages.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        const message = messages[0];
        res.json({
            success: true,
            message: {
                id: message.id,
                room_id: message.room_id,
                sender_id: message.sender_id,
                sender_username: message.sender_username,
                sender_profile_image: message.sender_profile_image,
                message_type: message.message_type,
                content: message.content,
                created_at: message.created_at
            }
        });
    });
});

// 채팅방의 최근 메시지 조회
router.get('/room/:room_id/latest', authenticateToken, (req, res) => {
    const { room_id } = req.params;
    
    messageModel.getLatestMessageByRoomId(room_id, (err, messages) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (messages.length === 0) {
            return res.status(404).json({ error: 'No messages found' });
        }
        
        const message = messages[0];
        res.json({
            success: true,
            message: {
                id: message.id,
                room_id: message.room_id,
                sender_id: message.sender_id,
                sender_username: message.sender_username,
                sender_profile_image: message.sender_profile_image,
                message_type: message.message_type,
                content: message.content,
                created_at: message.created_at
            }
        });
    });
});

module.exports = router;