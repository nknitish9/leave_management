const express = require('express');
const { getUsers, updateLeaveBalance } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin: update a user's leave balance
router.get('/', protect, authorize('admin'), getUsers);
router.put('/:id/leave-balance', protect, authorize('admin'), updateLeaveBalance);

module.exports = router;
