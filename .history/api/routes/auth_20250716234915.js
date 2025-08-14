const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Create Express Router - THIS IS CRUCIAL!
const router = express.Router();

// Missing Alert System - Auth Routes
// Built by Aayansh03 | 2025-07-14 17:55:23

console.log('🚨 Auth routes initializing...');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Helper function to get client info
const getClientInfo = (req) => {
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'Unknown';
  return { ipAddress, userAgent };
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authLimiter, async (req, res) => {
  try {
    console.log('📝 Registration attempt:', {
      email: req.body.email,
      name: req.body.name,
      timestamp: new Date().toISOString()
    });

    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      console.log('❌ Validation failed: Password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ Registration failed: User already exists');
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Get client information
    const { ipAddress, userAgent } = getClientInfo(req);

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      ipAddress,
      userAgent,
      lastLogin: new Date(),
      loginCount: 1
    });

    await user.save();
    console.log('✅ User created successfully:', user.email);

    // Update login info using the method
    try {
      await user.updateLoginInfo(ipAddress, userAgent);
      console.log('✅ Login info updated successfully');
    } catch (updateError) {
      console.log('⚠️ Warning: Could not update login info:', updateError.message);
      // Don't fail the registration if login info update fails
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove sensitive data from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      statistics: user.statistics,
      preferences: user.preferences
    };

    console.log('🎉 Registration successful:', {
      userId: user._id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('💥 Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
  try {
    console.log('🔐 Login attempt:', {
      email: req.body.email,
      timestamp: new Date().toISOString()
    });

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      console.log('❌ Login validation failed: Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password');

    if (!user) {
      console.log('❌ Login failed: User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ Login failed: User account deactivated');
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      console.log('❌ Login failed: Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get client information
    const { ipAddress, userAgent } = getClientInfo(req);

    // Update login information
    try {
      await user.updateLoginInfo(ipAddress, userAgent);
      console.log('✅ Login info updated successfully');
    } catch (updateError) {
      console.log('⚠️ Warning: Could not update login info:', updateError.message);
      // Don't fail the login if update fails
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove sensitive data from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount,
      createdAt: user.createdAt,
      statistics: user.statistics,
      preferences: user.preferences
    };

    console.log('🎉 Login successful:', {
      userId: user._id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    console.log('👤 Get current user:', req.user.id);

    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('❌ User not found in /me route');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Current user retrieved:', user.email);

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('💥 Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    console.log('🚪 Logout:', req.user.id);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('💥 Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

console.log('✅ Auth routes configured successfully');

// CRUCIAL: Export the router properly
module.exports = router;