const { Server } = require("socket.io");
const db = require('./config/db');

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    const onlineUsers = new Map();
    let lastSeenChecked = false;
    let hasLastSeen = false;
    const ensureLastSeenColumn = async () => {
        if (lastSeenChecked) return hasLastSeen;
        try {
            const [cols] = await db.execute("SHOW COLUMNS FROM users LIKE 'last_seen_at'");
            hasLastSeen = cols.length > 0;
        } catch (err) {
            hasLastSeen = false;
        }
        lastSeenChecked = true;
        return hasLastSeen;
    };

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_lobby', () => {
            socket.join('lobby');
            // console.log(`User ${socket.id} joined lobby`);
        });

        socket.on('join_user_room', async (userId) => {
            socket.join(`user_${userId}`);
            
            onlineUsers.set(userId, socket.id);
            
            io.emit('online_users_update', Array.from(onlineUsers.keys()));
            try {
                if (await ensureLastSeenColumn()) {
                    await db.execute('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [userId]);
                }
            } catch (err) {
                console.error('Error updating last_seen_at:', err);
            }
        });

        socket.on('disconnect', async () => {
            // Remove user from online list
            let disconnectedUserId = null;
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    onlineUsers.delete(userId);
                    break;
                }
            }

            if (disconnectedUserId) {
                io.emit('online_users_update', Array.from(onlineUsers.keys()));
                try {
                    if (await ensureLastSeenColumn()) {
                        await db.execute('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [disconnectedUserId]);
                    }
                } catch (err) {
                    console.error('Error updating last_seen_at:', err);
                }
            }
            // console.log('User disconnected:', socket.id);
        });

        socket.on('join_dm', ({ userId, targetId }) => {
            const room = [userId, targetId].sort().join('_');
            socket.join(room);
            // console.log(`User ${userId} joined DM room ${room}`);
        });

        socket.on('leave_dm', ({ userId, targetId }) => {
            const room = [userId, targetId].sort().join('_');
            socket.leave(room);
        });

        socket.on('send_message', async (data) => {
            const { senderId, receiverId, content, senderName } = data;
            
            try {
                // Fetch sender and receiver info to ensure complete payload
                const [users] = await db.execute('SELECT id, username, profile_image FROM users WHERE id IN (?, ?)', [senderId, receiverId]);
                
                const sender = users.find(u => u.id === senderId);
                const receiver = users.find(u => u.id === receiverId);

                if (!sender || !receiver && receiverId) {
                     // Should not happen usually
                }

                const senderAvatar = sender ? sender.profile_image : null;
                const receiverName = receiver ? receiver.username : 'Unknown';
                const receiverAvatar = receiver ? receiver.profile_image : null;

                const sql = 'INSERT INTO chat_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)';
                await db.execute(sql, [senderId, receiverId || null, content]);

                const messagePayload = {
                    senderId,
                    receiverId,
                    content,
                    senderName: sender ? sender.username : senderName,
                    senderAvatar, 
                    receiverName,
                    receiverAvatar,
                    created_at: new Date()
                };

                if (receiverId) {
                    const room = [senderId, receiverId].sort().join('_');
                    io.to(room).emit('receive_message', messagePayload);
                    
                    // Notify the receiver directly via their personal room
                    io.to(`user_${receiverId}`).emit('private_message', messagePayload);
                    
                    // Notify sender's personal room as well
                     io.to(`user_${senderId}`).emit('private_message', messagePayload);

                } else {
                    io.to('lobby').emit('receive_message', messagePayload);
                }
            } catch (err) {
                console.error('Error saving message:', err);
            }
        });

    });

    return io;
};
