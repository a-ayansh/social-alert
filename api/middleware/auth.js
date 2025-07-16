const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    
    if (!user) {
      
      return res.status(401).json({
        success: false,
        message: 'Token is not valid - user not found'
      });
    }

    if (!user.isActive) {
      
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    req.user = {
      id: user._id.toString(), 
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    };

    next();
  } catch (error) {
    console.error('💥 Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

module.exports = auth;