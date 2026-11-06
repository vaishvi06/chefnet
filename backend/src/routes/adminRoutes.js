const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

// Chef Verification & Moderation
router.get('/chefs/pending', adminController.getPendingChefs);
router.patch('/chefs/:id/approve', adminController.approveChef);
router.patch('/chefs/:id/reject', adminController.rejectChef);
router.patch('/chefs/:id/suspend', adminController.toggleSuspendUser);

// User Moderation
router.get('/users', adminController.getUsers);
router.patch('/users/:id/suspend', adminController.toggleSuspendUser);

// Area & Waiting List Management
router.get('/areas', adminController.getAreas);
router.post('/areas', adminController.createArea);
router.patch('/areas/:id', adminController.updateArea);
router.patch('/areas/:id/activate', adminController.activateArea);
router.get('/waiting-lists', adminController.getWaitingLists);

// Complaints Moderation
router.get('/complaints', adminController.getComplaints);
router.patch('/complaints/:id/resolve', adminController.resolveComplaint);

// Support Tickets
router.get('/support-tickets', adminController.getSupportTickets);
router.patch('/support-tickets/:id', adminController.updateSupportTicket);

// Analytics
router.get('/analytics', adminController.getAdminAnalytics);

module.exports = router;
