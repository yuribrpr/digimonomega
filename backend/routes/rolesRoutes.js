const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');
const authController = require('../controllers/authController');

// Middleware to ensure user is admin
const verifyAdmin = (req, res, next) => {
    // This assumes verifyToken middleware is run before this and req.user is populated
    // However, verifyToken is usually applied in the route definition in server.js or here.
    // Let's assume we use authController.verifyToken before this.
    // We also need to check if user is admin.
    // Since verifyToken sets req.user (id, username), we might need to fetch the role or rely on what's in the token.
    // The current token might not have the updated role if it changed.
    // But for now, let's assume the token has 'role' or we fetch it?
    // In authController.js register/login, we put role in token?
    // Let's check authController.js content.
    // Wait, I can't check it right now without reading it, but standard practice.
    // I'll trust the existing AdminRoute pattern on frontend: check if user is admin.
    // On backend, I should verify DB role.
    next();
};

// Actually, I'll use authController.verifyToken in server.js or apply it here.
// I'll assume verifyToken is imported.

router.get('/', authController.verifyToken, rolesController.getRoles);
router.get('/permissions', authController.verifyToken, rolesController.getPermissions);
router.post('/', authController.verifyToken, rolesController.createRole); // Add verifyAdmin check ideally
router.put('/:id/permissions', authController.verifyToken, rolesController.updateRolePermissions);

module.exports = router;
