const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/starters', authController.getStarters);
router.get('/me', authController.verifyToken, authController.getMe);

module.exports = router;
