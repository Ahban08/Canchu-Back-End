const express = require('express');
const router = express.Router();
const auth = require('../utils/auth');
const chatController = require('../controller/chatController');

// POST chat
router.post('/:user_id', auth.verifyToken, chatController.createMessage);

// Get chat
router.get('/:user_id/messages', auth.verifyToken, chatController.searchMessages);

module.exports = router;