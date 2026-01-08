const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/:id/digimons', userController.getUserDigimons);
router.get('/:id', userController.getUser);
router.post('/:id/digimons/principal', userController.setPrincipal);
router.delete('/:id/digimons/:digimonId', userController.deleteUserDigimon);
router.get('/schemas', userController.getTablesSchema);

module.exports = router;
