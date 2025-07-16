const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/profile', auth, async (req, res) => {
  try {

    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {

    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: req.user.id }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: name.trim(),
        email: email.toLowerCase().trim()
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {

    const Case = require('../models/Case');

    const [totalCases, activeCases, foundCases, closedCases] = await Promise.all([
      Case.countDocuments({ reportedBy: req.user.id, isActive: true }),
      Case.countDocuments({ reportedBy: req.user.id, status: 'active', isActive: true }),
      Case.countDocuments({ reportedBy: req.user.id, status: 'found' }),
      Case.countDocuments({ reportedBy: req.user.id, status: 'closed' })
    ]);

    const stats = {
      totalCases,
      activeCases,
      foundCases,
      closedCases,
      successRate: totalCases > 0 ? ((foundCases / totalCases) * 100).toFixed(1) : 0
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
});

router.delete('/account', auth, async (req, res) => {
  try {

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    res.json({
      success: true,
      message: 'Account deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account'
    });
  }
});

module.exports = router;