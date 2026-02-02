const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');
const { verifyToken } = require('../controllers/authController');

router.get('/listings', verifyToken, marketController.getListings);
router.get('/history', verifyToken, marketController.getUserHistory);
router.post('/sell/item', verifyToken, marketController.sellItem);
router.post('/sell/digimon', verifyToken, marketController.sellDigimon);
router.post('/buy/:listingId', verifyToken, marketController.buyListing);
router.post('/cancel/:listingId', verifyToken, marketController.cancelListing);
router.get('/notifications', verifyToken, marketController.getNotifications);
router.put('/notifications/:id/read', verifyToken, marketController.markNotificationRead);

module.exports = router;
