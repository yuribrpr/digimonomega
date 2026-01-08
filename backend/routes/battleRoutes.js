const express = require('express');
const router = express.Router();
const battleController = require('../controllers/battleController');

router.get('/schema', battleController.getSchema);
router.post('/', battleController.startBattle);
router.post('/:id/attack', battleController.attack);
router.post('/:id/heal', battleController.heal);
router.post('/:id/flee', battleController.flee);
router.post('/set-main', battleController.setMain);

module.exports = router;
