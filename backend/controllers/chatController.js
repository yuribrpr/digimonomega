const db = require('../config/db');

exports.getLobbyMessages = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                m.id,
                m.sender_id,
                m.receiver_id,
                m.content,
                m.is_read,
                m.created_at AS created_at,
                u.username AS senderName,
                u.profile_image AS senderAvatar
            FROM chat_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.receiver_id IS NULL
            ORDER BY m.created_at DESC
            LIMIT 50
        `);
        res.json(rows.reverse());
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDMMessages = async (req, res) => {
    const { targetId } = req.params;
    const userId = req.user.id;

    try {
        const [rows] = await db.execute(`
            SELECT 
                m.id,
                m.sender_id,
                m.receiver_id,
                m.content,
                m.is_read,
                m.created_at AS created_at,
                u.username AS senderName,
                u.profile_image AS senderAvatar
            FROM chat_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at DESC
            LIMIT 50
        `, [userId, targetId, targetId, userId]);
        res.json(rows.reverse());
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRecentChats = async (req, res) => {
    const userId = req.user.id;
    try {
        // Find users who have exchanged messages with current user, ordered by most recent message
        const [rows] = await db.execute(`
            SELECT 
                CASE 
                    WHEN sender_id = ? THEN receiver_id 
                    ELSE sender_id 
                END AS partner_id,
                MAX(created_at) AS last_msg_time,
                SUM(CASE WHEN receiver_id = ? AND (is_read = 0 OR is_read IS NULL) THEN 1 ELSE 0 END) AS unread_count
            FROM chat_messages 
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY partner_id
            ORDER BY last_msg_time DESC
        `, [userId, userId, userId, userId]);

        if (rows.length === 0) return res.json([]);

        const partnerIds = rows.map(r => r.partner_id);
        
        if (partnerIds.length === 0) return res.json([]);

        // Get details for these users
        const placeholders = partnerIds.map(() => '?').join(',');
        const [users] = await db.execute(`
            SELECT id, username, profile_image AS avatar 
            FROM users 
            WHERE id IN (${placeholders})
        `, partnerIds);

        // Sort users based on partnerIds order and add unread count
        const result = partnerIds.map(id => {
            const user = users.find(u => u.id === id);
            const chatInfo = rows.find(r => r.partner_id === id);
            return user ? { 
                ...user, 
                unread_count: parseInt(chatInfo.unread_count || 0) 
            } : null;
        }).filter(u => u);

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markMessagesRead = async (req, res) => {
    const { targetId } = req.body;
    const userId = req.user.id;

    console.log(`[MarkRead] User ${userId} marking messages from ${targetId} as read.`);

    if (!targetId) {
        console.log('[MarkRead] Missing targetId');
        return res.status(400).json({ message: 'Missing targetId' });
    }

    try {
        const [result] = await db.execute(`
            UPDATE chat_messages 
            SET is_read = 1 
            WHERE sender_id = ? AND receiver_id = ? AND (is_read = 0 OR is_read IS NULL)
        `, [targetId, userId]);
        
        console.log(`[MarkRead] Updated ${result.affectedRows} messages.`);
        
        res.json({ success: true, affected: result.affectedRows });
    } catch (err) {
        console.error('[MarkRead] Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
