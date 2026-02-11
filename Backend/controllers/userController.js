const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('name email role department leaveBalance');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateLeaveBalance = async (req, res) => {
  try {
    const { sick, casual, annual } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updated = { ...(user.leaveBalance || {}) };
    if (sick !== undefined) updated.sick = Number(sick);
    if (casual !== undefined) updated.casual = Number(casual);
    if (annual !== undefined) updated.annual = Number(annual);

    const values = [updated.sick, updated.casual, updated.annual].filter(
      (v) => v !== undefined
    );
    if (values.some((v) => Number.isNaN(v) || v < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Leave balance values must be non-negative numbers'
      });
    }

    user.leaveBalance = updated;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        leaveBalance: user.leaveBalance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
