const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authMiddleware = require('../controllers/authController').verifyToken;

router.post('/', newsController.createNews);
router.get('/', newsController.getAllNews);
router.put('/:id', newsController.updateNews);
router.delete('/:id', newsController.deleteNews);
router.post('/:id/like', authMiddleware, newsController.toggleLike);

module.exports = router;
