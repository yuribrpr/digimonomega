const express = require('express');
const router = express.Router();
const enemyController = require('../controllers/enemyController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/assets/sprites/enemies');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.get('/', enemyController.getAllEnemies);
router.get('/schema', enemyController.getSchema);
router.get('/:id/drops', enemyController.getEnemyDrops);
router.post('/', upload.single('sprite'), enemyController.createEnemy);
router.put('/:id', upload.single('sprite'), enemyController.updateEnemy);
router.delete('/:id', enemyController.deleteEnemy);

module.exports = router;
