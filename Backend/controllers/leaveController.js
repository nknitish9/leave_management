const Leave = require('../models/Leave');
const User = require('../models/User');

exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const requestedStart = new Date(startDate);
    const requestedEnd = new Date(endDate);

    // Check for overlapping leaves (pending or approved)
    const overlappingLeave = await Leave.findOne({
      user: req.user.id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: requestedEnd },
          endDate: { $gte: requestedStart }
        }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or approved leave that overlaps with these dates.'
      });
    }

    // Check leave balance
    const user = await User.findById(req.user.id);
    const diffTime = Math.abs(requestedEnd - requestedStart);
    const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (user.leaveBalance[leaveType] < numberOfDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${leaveType} leave balance. Available: ${user.leaveBalance[leaveType]} days, Required: ${numberOfDays} days`
      });
    }

    // Create the leave request
    const leave = await Leave.create({
      user: req.user.id,
      leaveType,
      startDate: requestedStart,
      endDate: requestedEnd,
      reason
    });

    res.status(201).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

exports.getLeaves = async (req, res) => {
  try {
    let query;

    if (req.user.role === 'admin') {
      query = Leave.find().populate('user', 'name email department');
    } else {
      query = Leave.find({ user: req.user.id });
    }

    const leaves = await query.sort('-appliedAt');

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate('user', 'name email department');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    if (leave.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this leave'
      });
    }

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    const { status, comments } = req.body;

    // Update leave balance if approved
    if (status === 'approved') {
  if (!leave.numberOfDays || leave.numberOfDays <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot approve leave: Invalid number of days'
    });
  }

  const user = await User.findById(leave.user);

  if (user.leaveBalance[leave.leaveType] < leave.numberOfDays) {
    return res.status(400).json({
      success: false,
      message: `Insufficient ${leave.leaveType} leave balance. Required: ${leave.numberOfDays}, Available: ${user.leaveBalance[leave.leaveType]}`
    });
  }

  user.leaveBalance[leave.leaveType] -= leave.numberOfDays;
  await user.save();
}

    // Update leave status
    leave.status = status;
    leave.comments = comments || '';
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = Date.now();
    
    await leave.save();

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    console.error('Error in updateLeaveStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    if (leave.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this leave'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete leave that has been processed'
      });
    }

    await leave.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};