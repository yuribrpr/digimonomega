const express = require('express');
const router = express.Router();
const questController = require('../controllers/questController');
const { verifyToken } = require('../controllers/authController');

// Public/User Routes
router.get('/campaigns', verifyToken, questController.getCampaigns);
router.get('/progress', verifyToken, questController.getUserQuestProgress);
router.get('/active', verifyToken, questController.getActiveQuests);

// Admin Routes (Protect with admin check in real app)
router.post('/admin/campaign', verifyToken, questController.createCampaign);
router.put('/admin/campaign/:id', verifyToken, questController.updateCampaign);
router.delete('/admin/campaign/:id', verifyToken, questController.deleteCampaign);

router.post('/admin/quest', verifyToken, questController.createQuest);
router.put('/admin/quest/:id', verifyToken, questController.updateQuest);
router.delete('/admin/quest/:id', verifyToken, questController.deleteQuest);

// Action Routes
router.post('/start', verifyToken, questController.startQuest);
router.post('/restart', verifyToken, questController.restartQuest);
router.post('/cancel', verifyToken, questController.cancelQuest);
router.post('/claim', verifyToken, questController.claimReward);

// Details Routes
router.get('/details/:id', verifyToken, questController.getQuestDetails);
router.get('/:id', verifyToken, questController.getQuestDetails); // Alias for convenience

module.exports = router;
