const express = require('express');
const router = express.Router();
const gameSettingsController = require('../controllers/gameSettingsController');

router.get('/', gameSettingsController.getAllSettings);
router.put('/:key', gameSettingsController.updateSetting);

module.exports = router;
