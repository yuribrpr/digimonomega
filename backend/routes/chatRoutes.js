const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Upload
const uploadDir = 'public/assets/chat/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas!'));
        }
    }
});

router.get('/lobby', verifyToken, chatController.getLobbyMessages);
router.get('/dm/:targetId', verifyToken, chatController.getDMMessages);
router.get('/recent', verifyToken, chatController.getRecentChats);
router.post('/read', verifyToken, chatController.markMessagesRead);
router.post('/upload', verifyToken, upload.single('image'), chatController.uploadChatImage);

module.exports = router;
