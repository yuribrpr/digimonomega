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

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 50 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImage = file.mimetype && file.mimetype.startsWith('image/');
    const isMp4 = file.mimetype === 'video/mp4' || ext === '.mp4';
    const isAudio = (file.mimetype && file.mimetype.startsWith('audio/')) || ['.mp3', '.ogg', '.wav', '.webm'].includes(ext);

    if (isImage || isMp4 || isAudio) {
      cb(null, true);
      return;
    }

    cb(new Error('Apenas imagens, vídeo mp4 ou áudio (mp3/ogg/wav/webm) são permitidos!'));
  }
});

router.get('/', mapController.getAllMaps);
router.get('/:id', mapController.getMapById);
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'soundtrack', maxCount: 1 }]), mapController.createMap);
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'soundtrack', maxCount: 1 }]), mapController.updateMap);
router.delete('/:id', mapController.deleteMap);

module.exports = router;
