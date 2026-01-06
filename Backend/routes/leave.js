const express = require('express');
const {
  applyLeave,
  getLeaves,
  getLeave,
  updateLeaveStatus,
  deleteLeave
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getLeaves);
router.post('/', protect, applyLeave);
router.get('/:id', protect, getLeave);
router.put('/:id', protect, authorize('admin'), updateLeaveStatus);
router.delete('/:id', protect, deleteLeave);

module.exports = router;