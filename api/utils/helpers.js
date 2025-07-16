const crypto = require('crypto');

class Helpers {
  
  static generateCaseNumber(prefix = 'MA') {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    
    return `${prefix}-${year}${month}${day}-${timestamp}-${random}`;
  }

  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; 
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; 
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  static formatTimeDifference(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  }

  static validateCoordinates(lat, lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    return {
      valid: !isNaN(latitude) && !isNaN(longitude) && 
             latitude >= -90 && latitude <= 90 && 
             longitude >= -180 && longitude <= 180,
      latitude,
      longitude
    };
  }

  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static hashData(data, salt = null) {
    const saltToUse = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, saltToUse, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: saltToUse };
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') 
      .replace(/[<>]/g, '') 
      .substring(0, 10000); 
  }

  static generateSearchKeywords(text) {
    if (!text || typeof text !== 'string') return [];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') 
      .split(/\s+/) 
      .filter(word => word.length > 2) 
      .filter((word, index, arr) => arr.indexOf(word) === index) 
      .slice(0, 20); 
  }

  static formatPhoneNumber(phone) {
    if (!phone) return null;

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone; 
  }

  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  static determinePriority(personalInfo, circumstances) {
    let priority = 'medium'; 

    const age = parseInt(personalInfo.age);
    if (age < 12) priority = 'critical'; 
    else if (age < 18) priority = 'high'; 
    else if (age > 65 && personalInfo.medicalConditions) priority = 'high'; 

    if (personalInfo.medicalConditions && 
        (personalInfo.medicalConditions.includes('dementia') || 
         personalInfo.medicalConditions.includes('alzheimer') ||
         personalInfo.medicalConditions.includes('diabetes') ||
         personalInfo.medicalConditions.includes('medication'))) {
      priority = priority === 'medium' ? 'high' : priority;
    }

    if (circumstances) {
      const lowerCircumstances = circumstances.toLowerCase();
      if (lowerCircumstances.includes('abduction') || 
          lowerCircumstances.includes('kidnapped') ||
          lowerCircumstances.includes('forced')) {
        priority = 'critical';
      }
      
      if (lowerCircumstances.includes('suicidal') || 
          lowerCircumstances.includes('depressed') ||
          lowerCircumstances.includes('threatened')) {
        priority = priority === 'medium' ? 'high' : priority;
      }
    }
    
    return priority;
  }

  static validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; 
    
    const errors = [];
    
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }
    
    if (file.size > maxSize) {
      errors.push('File too large. Maximum size is 10MB.');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static generatePaginationMeta(page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    };
  }

  static createResponse(success, data = null, message = null, meta = null) {
    const response = {
      success,
      timestamp: new Date().toISOString(),
      built_by: 'Aayansh03'
    };
    
    if (message) response.message = message;
    if (data !== null) response.data = data;
    if (meta) response.meta = meta;
    
    return response;
  }

  static logSystemEvent(event, details, level = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      event,
      details,
      system: 'Missing Alert Backend',
      version: '1.0.0',
      built_by: 'Aayansh03'
    };
    
        return logEntry;
  }

  static getSystemInfo() {
    return {
      service: 'Missing Alert System API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      node_version: process.version,
      built_by: 'Aayansh03',
      build_date: '2025-07-07 17:33:05 UTC',
      description: 'Community-Powered Missing Persons & Pets System Backend API'
    };
  }
}

module.exports = Helpers;