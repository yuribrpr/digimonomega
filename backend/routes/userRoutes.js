const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../controllers/authController').verifyToken; // Assuming you have this

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/assets/avatars/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 1 }, // 1MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas!'));
        }
    }
});

// Public/User routes
router.post('/avatar', authMiddleware, upload.single('avatar'), userController.uploadAvatar);
router.get('/search', userController.searchUsers);
router.get('/profile/:id', userController.getPublicProfile);

// Admin routes (should be protected by middleware in production)
router.get('/admin/all', userController.getAllUsers);
router.post('/admin/give-item', userController.adminGiveItem);
router.post('/admin/give-digimon', userController.adminGiveDigimon);
router.delete('/admin/digimon/:id', userController.adminRemoveDigimon);
router.put('/admin/:id', userController.updateUserAdmin);
router.delete('/admin/:id', userController.deleteUserAdmin);

router.get('/:id/digimons', userController.getUserDigimons);
router.get('/:id', userController.getUser);
router.post('/:id/digimons/principal', userController.setPrincipal);
router.delete('/:id/digimons/:digimonId', userController.deleteUserDigimon);
router.get('/schemas', userController.getTablesSchema);

module.exports = router;
