const express = require('express');
const router = express.Router();
const digimonController = require('../controllers/digimonController');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../controllers/authController').verifyToken;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/assets/sprites')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

router.get('/', digimonController.getAllDigimons);
router.get('/ranking', digimonController.getRanking);
router.post('/', upload.single('sprite'), digimonController.createDigimon);
router.put('/:id', upload.single('sprite'), digimonController.updateDigimon);
router.delete('/:id', digimonController.deleteDigimon);

// Evolution System
router.get('/evolution-line/:userDigimonId', authMiddleware, digimonController.getEvolutionLine);
router.post('/unlock-evolution', authMiddleware, digimonController.unlockEvolution);
router.post('/evolve', authMiddleware, digimonController.evolveDigimon);

module.exports = router;
