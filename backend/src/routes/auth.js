const express = require('express');
const router = express.Router();
const { login, getProfile } = require('../controllers/AuthController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', login);
router.get('/profile', verifyToken, getProfile);

module.exports = router;
