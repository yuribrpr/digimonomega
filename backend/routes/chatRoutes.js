const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../controllers/authController');

router.get('/lobby', verifyToken, chatController.getLobbyMessages);
router.get('/dm/:targetId', verifyToken, chatController.getDMMessages);
router.get('/recent', verifyToken, chatController.getRecentChats);
router.post('/read', verifyToken, chatController.markMessagesRead);

module.exports = router;
