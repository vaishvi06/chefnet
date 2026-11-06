const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/:subscriptionId/messages', chatController.getSubscriptionMessages);
router.post('/:subscriptionId/messages', chatController.sendMessage);

module.exports = router;
