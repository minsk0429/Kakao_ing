const express = require('express');
const chatRoomModel = require('../models/chatRooms');
const messageModel = require('../models/messages');
const { authenticateToken } = require('./auth');
const router = express.Router();

// 채팅방 생성
router.post('/create', authenticateToken, (req, res) => {
    const { room_name, member_ids } = req.body;
    const current_user_id = req.user.id;
    
    // 채팅방 생성
    chatRoomModel.createChatRoom(room_name, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const room_id = result.insertId;
        
        // 생성자를 채팅방에 추가
        chatRoomModel.addChatRoomMember(room_id, current_user_id, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            // 추가 멤버들도 채팅방에 추가
            if (member_ids && member_ids.length > 0) {
                let memberCount = 0;
                let hasError = false;
                
                member_ids.forEach(member_id => {
                    chatRoomModel.addChatRoomMember(room_id, member_id, (err) => {
                        memberCount++;
                        if (err) hasError = true;
                        
                        // 모든 멤버 추가 완료
                        if (memberCount === member_ids.length) {
                            if (hasError) {
                                return res.status(500).json({ error: 'Failed to add some members' });
                            }
                            res.json({
                                success: true,
                                room_id: room_id,
                                message: 'Chat room created successfully'
                            });
                        }
                    });
                });
            } else {
                res.json({
                    success: true,
                    room_id: room_id,
                    message: 'Chat room created successfully'
                });
            }
        });
    });
});

// 사용자의 채팅방 목록 조회
router.get('/list', authenticateToken, (req, res) => {
    const current_user_id = req.user.id;
    
    chatRoomModel.getUserChatRooms(current_user_id, (err, rooms) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json({
            success: true,
            chat_rooms: rooms
        });
    });
});

// 채팅방 정보 조회
router.get('/:room_id', authenticateToken, (req, res) => {
    const { room_id } = req.params;
    
    chatRoomModel.getChatRoomById(room_id, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Chat room not found' });
        }
        
        const chatRoom = results[0];
        
        // 채팅방 멤버 조회
        chatRoomModel.getChatRoomMembers(room_id, (err, members) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            res.json({
                success: true,
                chat_room: {
                    id: chatRoom.id,
                    room_name: chatRoom.room_name,
                    created_at: chatRoom.created_at,
                    members: members
                }
            });
        });
    });
});

// 채팅방에 멤버 추가
router.post('/:room_id/members', authenticateToken, (req, res) => {
    const { room_id } = req.params;
    const { user_id } = req.body;
    
    chatRoomModel.addChatRoomMember(room_id, user_id, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json({
            success: true,
            message: 'Member added to chat room successfully'
        });
    });
});

// 채팅방 멤버 조회
router.get('/:room_id/members', authenticateToken, (req, res) => {
    const { room_id } = req.params;
    
    chatRoomModel.getChatRoomMembers(room_id, (err, members) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json({
            success: true,
            members: members
        });
    });
});

module.exports = router;