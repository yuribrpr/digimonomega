const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directory exists
const uploadDir = 'public/assets/maps';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.get('/', mapController.getAllMaps);
router.get('/:id', mapController.getMapById);
router.post('/', upload.single('image'), mapController.createMap);
router.put('/:id', upload.single('image'), mapController.updateMap);
router.delete('/:id', mapController.deleteMap);

module.exports = router;
