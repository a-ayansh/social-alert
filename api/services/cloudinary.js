const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
  constructor() {
    this.folders = {
      cases: 'missing-alert/cases',
      sightings: 'missing-alert/sightings',
      avatars: 'missing-alert/avatars',
      documents: 'missing-alert/documents'
    };
  }

  // Upload image from buffer
  async uploadImage(buffer, options = {}) {
    try {
      console.log(`📤 Uploading image to Cloudinary at ${new Date().toISOString()}`);

      const defaultOptions = {
        resource_type: 'image',
        folder: this.folders.cases,
        quality: 'auto:good',
        fetch_format: 'auto',
        flags: 'progressive',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      };

      const uploadOptions = { ...defaultOptions, ...options };

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('🚨 Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log(`✅ Image uploaded successfully: ${result.public_id}`);
              resolve(result);
            }
          }
        );

        uploadStream.end(buffer);
      });

    } catch (error) {
      console.error('🚨 Upload service error:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  // Upload image from URL
  async uploadFromUrl(imageUrl, options = {}) {
    try {
      console.log(`📤 Uploading image from URL: ${imageUrl}`);

      const defaultOptions = {
        folder: this.folders.cases,
        quality: 'auto:good',
        fetch_format: 'auto'
      };

      const uploadOptions = { ...defaultOptions, ...options };
      const result = await cloudinary.uploader.upload(imageUrl, uploadOptions);

      console.log(`✅ Image uploaded from URL: ${result.public_id}`);
      return result;

    } catch (error) {
      console.error('🚨 URL upload error:', error);
      throw new Error(`URL upload failed: ${error.message}`);
    }
  }

  // Delete image
  async deleteImage(publicId) {
    try {
      console.log(`🗑️ Deleting image: ${publicId}`);

      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok') {
        console.log(`✅ Image deleted successfully: ${publicId}`);
        return { success: true, result };
      } else {
        console.log(`⚠️ Image deletion result: ${result.result} for ${publicId}`);
        return { success: false, error: `Deletion result: ${result.result}` };
      }

    } catch (error) {
      console.error('🚨 Delete image error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get image details
  async getImageDetails(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId, {
        colors: true,
        faces: true,
        quality_analysis: true,
        accessibility_analysis: true
      });

      return {
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          created_at: result.created_at,
          colors: result.colors,
          faces: result.faces,
          quality_analysis: result.quality_analysis
        }
      };

    } catch (error) {
      console.error('🚨 Get image details error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate optimized URL with transformations
  generateOptimizedUrl(publicId, transformations = []) {
    const defaultTransformations = [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ];

    const allTransformations = [...defaultTransformations, ...transformations];

    return cloudinary.url(publicId, {
      transformation: allTransformations,
      secure: true
    });
  }

  // Generate thumbnail URL
  generateThumbnail(publicId, width = 300, height = 300) {
    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'fill', gravity: 'auto' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      secure: true
    });
  }

  // Create image variants for different use cases
  async createImageVariants(publicId) {
    try {
      const baseUrl = cloudinary.url(publicId, { secure: true });
      
      const variants = {
        original: baseUrl,
        thumbnail: this.generateThumbnail(publicId, 300, 300),
        small: this.generateOptimizedUrl(publicId, [{ width: 400, crop: 'scale' }]),
        medium: this.generateOptimizedUrl(publicId, [{ width: 800, crop: 'scale' }]),
        large: this.generateOptimizedUrl(publicId, [{ width: 1200, crop: 'scale' }]),
        square: this.generateOptimizedUrl(publicId, [{ width: 500, height: 500, crop: 'fill', gravity: 'auto' }])
      };

      return { success: true, variants };

    } catch (error) {
      console.error('🚨 Create variants error:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload multiple images
  async uploadMultipleImages(buffers, options = {}) {
    try {
      console.log(`📤 Uploading ${buffers.length} images to Cloudinary`);

      const uploadPromises = buffers.map(async (buffer, index) => {
        try {
          const result = await this.uploadImage(buffer, {
            ...options,
            public_id: `${options.public_id || 'image'}_${index}_${Date.now()}`
          });
          return { success: true, result, index };
        } catch (error) {
          return { success: false, error: error.message, index };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      console.log(`✅ Uploaded ${successful.length}/${buffers.length} images successfully`);

      return {
        success: true,
        results,
        summary: {
          total: buffers.length,
          successful: successful.length,
          failed: failed.length,
          success_rate: ((successful.length / buffers.length) * 100).toFixed(1)
        }
      };

    } catch (error) {
      console.error('🚨 Multiple upload error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get usage statistics
  async getUsageStats() {
    try {
      const usage = await cloudinary.api.usage();
      
      return {
        success: true,
        data: {
          plan: usage.plan,
          credits: {
            used: usage.credits?.used || 0,
            limit: usage.credits?.limit || 0,
            remaining: (usage.credits?.limit || 0) - (usage.credits?.used || 0)
          },
          bandwidth: {
            used: usage.bandwidth?.used || 0,
            limit: usage.bandwidth?.limit || 0,
            remaining: (usage.bandwidth?.limit || 0) - (usage.bandwidth?.used || 0)
          },
          storage: {
            used: usage.storage?.used || 0,
            limit: usage.storage?.limit || 0,
            remaining: (usage.storage?.limit || 0) - (usage.storage?.used || 0)
          },
          requests: usage.requests || 0,
          resources: usage.resources || 0,
          derived_resources: usage.derived_resources || 0
        }
      };

    } catch (error) {
      console.error('🚨 Usage stats error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get images by folder
  async getImagesByFolder(folder, options = {}) {
    try {
      const defaultOptions = {
        type: 'upload',
        prefix: folder,
        max_results: 100
      };

      const searchOptions = { ...defaultOptions, ...options };
      const result = await cloudinary.api.resources(searchOptions);

      return {
        success: true,
        data: result.resources,
        next_cursor: result.next_cursor,
        total_count: result.total_count
      };

    } catch (error) {
      console.error('🚨 Get images by folder error:', error);
      return { success: false, error: error.message };
    }
  }

  // Search images by tags
  async searchImagesByTags(tags, options = {}) {
    try {
      const tagString = Array.isArray(tags) ? tags.join(',') : tags;
      
      const defaultOptions = {
        expression: `tags:${tagString}`,
        max_results: 100,
        sort_by: [['created_at', 'desc']]
      };

      const searchOptions = { ...defaultOptions, ...options };
      const result = await cloudinary.search.expression(searchOptions.expression)
        .max_results(searchOptions.max_results)
        .sort_by(...searchOptions.sort_by)
        .execute();

      return {
        success: true,
        data: result.resources,
        total_count: result.total_count
      };

    } catch (error) {
      console.error('🚨 Search by tags error:', error);
      return { success: false, error: error.message };
    }
  }

  async cleanupOldImages(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      console.log(`🧹 Cleaning up images older than ${daysOld} days (before ${cutoffDate.toISOString()})`);

     
      
      return {
        success: true,
        message: 'Cleanup functionality would be implemented here',
        cutoff_date: cutoffDate.toISOString()
      };

    } catch (error) {
      console.error('🚨 Cleanup error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CloudinaryService();