const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', supportController.createTicket);
router.get('/mine', supportController.getMyTickets);

module.exports = router;
