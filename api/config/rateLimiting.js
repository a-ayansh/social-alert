const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    timestamp: '2025-07-13 13:12:36',
    retry_after: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please slow down.',
      timestamp: '2025-07-13 13:12:36',
      limit: req.rateLimit.limit,
      remaining: req.rateLimit.remaining,
      reset: new Date(req.rateLimit.resetTime).toISOString(),
      built_by: 'Aayansh03'
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
    timestamp: '2025-07-13 13:12:36',
    security_notice: 'Multiple failed attempts detected'
  },
  skipSuccessfulRequests: true
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Upload limit exceeded. Please wait before uploading more files.',
    timestamp: '2025-07-13 13:12:36'
  }
});

const geocodingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Geocoding rate limit exceeded. Please wait a moment.',
    timestamp: '2025-07-13 13:12:36'
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  geocodingLimiter
};
