const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();



console.log('🚨 Missing Alert System Backend Starting...');
console.log('👨‍💻 Built by: Aayansh03');
console.log('🕐 Server Time:', new Date().toISOString());

const app = express();

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl} - ${req.ip} - ${new Date().toISOString()}`);
  next();
});

// Database connection
const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not Set');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/missing-alert', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Missing Alert System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    builtBy: 'Aayansh03',
    version: '1.0.0'
  });
});

// API Routes with proper error handling
console.log('🔗 Loading API routes...');

// Load auth routes - FIXED: Proper error handling
try {
  console.log('🔎 Attempting to load /api/auth from ./routes/auth');
  const authRoutes = require('./routes/auth');
  
  // Check if authRoutes is a valid router
  // if (typeof authRoutes !== 'function') {
  //   throw new Error('Auth routes did not export a valid router function');
  // }
  
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load /api/auth:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

// Load case routes
try {
  console.log('🔎 Attempting to load /api/cases from ./routes/cases');
  const caseRoutes = require('./routes/cases');

  
  // if (typeof caseRoutes !== 'function') {
  //   throw new Error('Case routes did not export a valid router function');
  // }
  
  app.use('/api/cases', caseRoutes);
  console.log('✅ Case routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load /api/cases:', error.message);
  // Don't exit - cases route might not exist yet
}

// Load user routes
try {
  console.log('🔎 Attempting to load /api/users from ./routes/users');
  const userRoutes = require('./routes/users');
  
  if (typeof userRoutes !== 'function') {
    throw new Error('User routes did not export a valid router function');
  }
  
  app.use('/api/users', userRoutes);
  console.log('✅ User routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load /api/users:', error.message);
  // Don't exit - users route might not exist yet
}

// 404 handler for API routes
app.use('/api/*\w', (req, res) => {
  console.log(`❌ API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    endpoint: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 Global Error Handler:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
  
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('💥 Unhandled Promise Rejection:', err.message);
  console.error('Stack:', err.stack);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n🚀 Missing Alert System Backend Started Successfully!');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`👨‍💻 Built by: Aayansh03`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

module.exports = app;