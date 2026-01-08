const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');

router.get('/available', adoptionController.getAvailable);
router.post('/adopt', adoptionController.adopt);

module.exports = router;
