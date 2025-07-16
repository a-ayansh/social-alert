const express = require('express');
const Case = require('../models/Case');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Missing Alert System - Fixed Route Order
// Built by Aayansh03 | 2025-07-15 18:39:49

console.log('📋 Cases routes with fixed endpoint order...');

// CRITICAL FIX: Put specific routes BEFORE parameterized routes
// This prevents /my/1 from being caught by /:id route

// @route   GET /api/cases/stats/summary
// @desc    Get case statistics (MUST BE FIRST)
// @access  Public
router.get('/stats/summary', async (req, res) => {
  try {
    console.log('📊 Get comprehensive stats request');

    const [activeCases, foundCases, closedCases, totalCases, recentCases] = await Promise.all([
      Case.countDocuments({ 
        status: 'active', 
        isPublic: true, 
        isActive: true 
      }),
      Case.countDocuments({ 
        status: 'found', 
        isPublic: true 
      }),
      Case.countDocuments({ 
        status: 'closed', 
        isPublic: true 
      }),
      Case.countDocuments({ 
        isPublic: true, 
        isActive: true,
        status: { $ne: 'dismissed' }
      }),
      Case.countDocuments({
        isPublic: true,
        isActive: true,
        createdAt: { 
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      })
    ]);

    const successRate = totalCases > 0 ? ((foundCases / totalCases) * 100).toFixed(1) : 0;

    console.log('✅ Stats retrieved:', {
      activeCases,
      foundCases,
      closedCases,
      totalCases,
      recentCases
    });

    res.json({
      success: true,
      data: {
        activeCases,
        foundCases,
        closedCases,
        totalCases,
        recentCases,
        successRate: parseFloat(successRate)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/cases/my
// @desc    Get current user's cases (MUST BE BEFORE /:id)
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    console.log('👤 Fetching cases for user:', req.user.id, 'at', new Date().toISOString());

    const userCases = await Case.find({ 
      reportedBy: req.user.id,
      isActive: true 
    })
    .populate('reportedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

    console.log(`✅ Found ${userCases.length} cases for user ${req.user.id}`);
    
    // Debug: Log case details
    userCases.forEach((caseItem, index) => {
      console.log(`📋 Case ${index + 1}:`, {
        id: caseItem._id,
        caseNumber: caseItem.caseNumber,
        name: caseItem.missingPerson?.name,
        status: caseItem.status,
        reportedBy: caseItem.reportedBy?._id
      });
    });

    res.json({
      success: true,
      data: userCases,
      count: userCases.length,
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Get user cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your cases',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/cases
// @desc    Get all cases with filtering (BEFORE /:id)
// @access  Public
router.get('/', async (req, res) => {
  try {
    console.log('📋 Get all cases request');

    const {
      page = 1,
      limit = 20,
      status = 'active',
      search
    } = req.query;

    const filter = { isPublic: true, isActive: true };
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { 'missingPerson.name': { $regex: search, $options: 'i' } },
        { caseNumber: { $regex: search, $options: 'i' } },
        { 'lastKnownLocation.city': { $regex: search, $options: 'i' } }
      ];
    }

    const cases = await Case.find(filter)
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Case.countDocuments(filter);

    console.log(`✅ Found ${cases.length} public cases`);

    res.json({
      success: true,
      data: cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Get cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cases',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   POST /api/cases
// @desc    Create new missing person case
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 Create case request by user:', req.user.id);

    const requiredChecks = [
      { field: 'missingPerson.name', value: req.body.missingPerson?.name },
      { field: 'missingPerson.age', value: req.body.missingPerson?.age },
      { field: 'missingPerson.gender', value: req.body.missingPerson?.gender },
      { field: 'description', value: req.body.description },
      { field: 'lastKnownLocation.address', value: req.body.lastKnownLocation?.address },
      { field: 'lastKnownLocation.city', value: req.body.lastKnownLocation?.city },
      { field: 'lastKnownLocation.state', value: req.body.lastKnownLocation?.state },
      { field: 'lastSeenDate', value: req.body.lastSeenDate },
      { field: 'contactInfo.primaryContact.name', value: req.body.contactInfo?.primaryContact?.name },
      { field: 'contactInfo.primaryContact.phone', value: req.body.contactInfo?.primaryContact?.phone }
    ];

    const missingFields = requiredChecks.filter(check => !check.value || check.value.toString().trim() === '');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.map(f => f.field).join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    const caseData = {
      missingPerson: {
        name: req.body.missingPerson.name.trim(),
        age: parseInt(req.body.missingPerson.age),
        gender: req.body.missingPerson.gender,
        height: req.body.missingPerson.height || '',
        weight: req.body.missingPerson.weight || '',
        hairColor: req.body.missingPerson.hairColor || '',
        eyeColor: req.body.missingPerson.eyeColor || '',
        distinguishingFeatures: req.body.missingPerson.distinguishingFeatures || '',
        lastSeenClothing: req.body.lastSeenClothing || '',
        photos: req.body.missingPerson.photos || []
      },
      description: req.body.description.trim(),
      lastKnownLocation: {
        address: req.body.lastKnownLocation.address.trim(),
        city: req.body.lastKnownLocation.city.trim(),
        state: req.body.lastKnownLocation.state.trim(),
        country: req.body.lastKnownLocation.country || 'United States',
        zipCode: req.body.lastKnownLocation.zipCode || ''
      },
      lastSeenDate: new Date(req.body.lastSeenDate),
      lastSeenTime: req.body.lastSeenTime || '',
      circumstances: req.body.circumstances || '',
      contactInfo: {
        primaryContact: {
          name: req.body.contactInfo.primaryContact.name.trim(),
          relationship: req.body.contactInfo.primaryContact.relationship || '',
          phone: req.body.contactInfo.primaryContact.phone.trim(),
          email: req.body.contactInfo.primaryContact.email || ''
        }
      },
      priority: req.body.priority || 'medium',
      category: req.body.category || 'missing-person',
      status: 'active',
      reportedBy: req.user.id,
      isPublic: true,
      isActive: true,
      notes: []
    };

    const newCase = new Case(caseData);
    await newCase.save();
    await newCase.populate('reportedBy', 'name email');

    console.log('✅ Case created:', newCase.caseNumber, 'for user:', req.user.id);

    res.status(201).json({
      success: true,
      message: 'Missing person case created successfully',
      data: newCase,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Create case error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message),
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating case',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   PUT /api/cases/:id/status
// @desc    Update case status
// @access  Private (Owner only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    console.log('📝 Update case status request:', {
      caseId: req.params.id,
      userId: req.user.id,
      newStatus: req.body.status
    });

    const { status, notes } = req.body;

    const validStatuses = ['active', 'found', 'closed', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format',
        timestamp: new Date().toISOString()
      });
    }

    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        timestamp: new Date().toISOString()
      });
    }

    const caseOwnerId = caseData.reportedBy.toString();
    const currentUserId = req.user.id.toString();
    
    if (caseOwnerId !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the case reporter can update status.',
        timestamp: new Date().toISOString()
      });
    }

    const oldStatus = caseData.status;
    caseData.status = status;
    
    if (status === 'dismissed') {
      caseData.isActive = false;
      caseData.isPublic = false;
    }
    
    if (notes || status !== oldStatus) {
      if (!caseData.notes) {
        caseData.notes = [];
      }

      const noteContent = notes || `Status changed from ${oldStatus} to ${status} by ${req.user.name}`;
      
      caseData.notes.push({
        content: noteContent,
        addedBy: req.user.id,
        addedAt: new Date(),
        isPublic: true
      });
    }

    await caseData.save();

    console.log('✅ Case status updated:', oldStatus, '->', status);

    res.json({
      success: true,
      message: `Case status updated from ${oldStatus} to ${status}`,
      data: {
        caseId: caseData._id,
        caseNumber: caseData.caseNumber,
        oldStatus,
        newStatus: status,
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Update case status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating case status',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   DELETE /api/cases/:id/dismiss
// @desc    Dismiss case (soft delete)
// @access  Private (Owner only)
router.delete('/:id/dismiss', auth, async (req, res) => {
  try {
    console.log('🗑️ Dismiss case request:', req.params.id, 'by user:', req.user.id);

    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format',
        timestamp: new Date().toISOString()
      });
    }

    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        timestamp: new Date().toISOString()
      });
    }

    const caseOwnerId = caseData.reportedBy.toString();
    const currentUserId = req.user.id.toString();
    
    if (caseOwnerId !== currentUserId && (req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the case reporter can dismiss this case.',
        timestamp: new Date().toISOString()
      });
    }

    // Soft delete - just mark as inactive
    caseData.isActive = false;
    caseData.isPublic = false;
    
    if (!caseData.notes) {
      caseData.notes = [];
    }

    caseData.notes.push({
      content: `Case dismissed by ${req.user.name || 'User'} at ${new Date().toISOString()}`,
      addedBy: req.user.id,
      addedAt: new Date(),
      isPublic: false
    });

    await caseData.save();

    console.log('✅ Case dismissed successfully:', caseData.caseNumber);

    res.json({
      success: true,
      message: 'Case dismissed successfully',
      data: {
        caseNumber: caseData.caseNumber,
        dismissedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Dismiss case error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while dismissing case',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/cases/:id
// @desc    Get single case by ID (MUST BE LAST)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    console.log('📋 Get single case:', req.params.id);

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ Invalid case ID format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format',
        timestamp: new Date().toISOString()
      });
    }

    const caseData = await Case.findById(req.params.id)
      .populate('reportedBy', 'name email createdAt')
      .lean();

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
        timestamp: new Date().toISOString()
      });
    }

    if (!caseData.isPublic && !caseData.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Case is not publicly accessible',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Case retrieved:', caseData.caseNumber);

    res.json({
      success: true,
      data: caseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Get single case error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching case',
      timestamp: new Date().toISOString()
    });
  }
});

console.log('✅ Cases routes configured with proper order');

module.exports = router;