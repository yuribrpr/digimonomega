const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directory exists
const uploadDir = 'public/assets/items';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

router.get('/', itemController.getAllItems);
router.post('/', upload.single('icon'), itemController.createItem);
router.put('/:id', upload.single('icon'), itemController.updateItem);
router.delete('/:id', itemController.deleteItem);
router.post('/use', itemController.useItem);
router.post('/discard', itemController.discardItem);
router.get('/user/:userId', itemController.getUserInventory);

module.exports = router;
