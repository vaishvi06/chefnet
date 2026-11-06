const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', complaintController.createComplaint);
router.get('/mine', complaintController.getMyComplaints);

module.exports = router;
