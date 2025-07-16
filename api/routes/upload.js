const express = require('express');
const { upload, handleMulterError } = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const cloudinaryService = require('../services/cloudinary');

const router = express.Router();

router.post('/images', protect, upload.array('images', 10), handleMulterError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
        timestamp: new Date().toISOString()
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await cloudinaryService.uploadImage(file.buffer, {
          folder: 'missing-alert/cases',
          public_id: `${req.user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        });

        return {
          success: true,
          filename: file.originalname,
          url: result.secure_url,
          cloudinaryId: result.public_id,
          size: file.size,
          format: result.format,
          width: result.width,
          height: result.height
        };
      } catch (error) {
        return {
          success: false,
          filename: file.originalname,
          error: error.message,
          size: file.size
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      message: `${successful.length} files uploaded successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      data: {
        uploaded: successful,
        failed: failed,
        summary: {
          total: req.files.length,
          successful: successful.length,
          failed: failed.length
        }
      },
      timestamp: new Date().toISOString(),
      uploaded_by: req.user.name
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload',
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/images/:cloudinaryId', protect, async (req, res) => {
  try {
    const { cloudinaryId } = req.params;

    const result = await cloudinaryService.deleteImage(cloudinaryId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete image',
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        cloudinaryId,
        deletedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during image deletion',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/avatar', protect, upload.single('avatar'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar file uploaded',
        timestamp: new Date().toISOString()
      });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (user.avatar?.cloudinaryId) {
      await cloudinaryService.deleteImage(user.avatar.cloudinaryId);
    }

    const result = await cloudinaryService.uploadImage(req.file.buffer, {
      folder: 'missing-alert/avatars',
      public_id: `avatar_${req.user.id}`,
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    user.avatar = {
      url: result.secure_url,
      cloudinaryId: result.public_id
    };
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: {
          url: result.secure_url,
          cloudinaryId: result.public_id
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during avatar upload',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        timestamp: new Date().toISOString()
      });
    }

    const stats = {
      total_uploads: 0, 
      storage_used: '0 MB', 
      average_file_size: '0 MB',
      popular_formats: ['jpg', 'png', 'webp'],
      upload_trends: {
        today: 0,
        this_week: 0,
        this_month: 0
      },
      cloudinary_stats: await cloudinaryService.getUsageStats()
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching upload statistics',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;