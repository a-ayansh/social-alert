const mongoose = require('mongoose');

const sightingSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: [true, 'Case ID is required']
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { 
      type: [Number], 
      required: [true, 'Location coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[1] >= -90 && coords[1] <= 90 && 
                 coords[0] >= -180 && coords[0] <= 180; 
        },
        message: 'Invalid coordinates'
      }
    }
  },
  address: String,
  sightingDate: {
    type: Date,
    required: [true, 'Sighting date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Sighting date cannot be in the future'
    }
  },
  sightingTime: String,
  description: { 
    type: String, 
    required: [true, 'Sighting description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  confidence: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactInfo: {
    phone: String,
    email: String,
    anonymous: { type: Boolean, default: false },
    allowContact: { type: Boolean, default: true }
  },
  details: {
    personCondition: {
      type: String,
      enum: ['appeared-well', 'appeared-distressed', 'appeared-injured', 'appeared-confused', 'unsure']
    },
    behavior: String,
    clothing: String,
    companions: String,
    transportation: String,
    direction: String,
    additionalInfo: String
  },
  photos: [{
    url: { type: String, required: true },
    cloudinaryId: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  verification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'duplicate', 'investigating'],
      default: 'pending'
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    verificationNotes: String,
    credibilityScore: { type: Number, min: 0, max: 100 }
  },
  investigation: {
    followedUp: { type: Boolean, default: false },
    followUpDate: Date,
    followUpBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    followUpNotes: String,
    evidenceCollected: { type: Boolean, default: false },
    cameraFootageRequested: { type: Boolean, default: false }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [String],
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: { type: String, enum: ['web', 'mobile', 'api', 'phone'], default: 'web' },
    accuracy: Number, 
    submissionMethod: String
  },
  isActive: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true }
}, {
  timestamps: true
});

sightingSchema.index({ 'location': '2dsphere' });
sightingSchema.index({ caseId: 1, createdAt: -1 });
sightingSchema.index({ reportedBy: 1 });
sightingSchema.index({ 'verification.status': 1 });
sightingSchema.index({ sightingDate: -1 });
sightingSchema.index({ priority: 1, createdAt: -1 });

sightingSchema.virtual('timeSinceSighting').get(function() {
  const now = new Date();
  const sightingTime = this.sightingDate;
  const diffInHours = (now - sightingTime) / (1000 * 60 * 60);
  
  if (diffInHours < 1) return 'Less than 1 hour ago';
  if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
  return `${Math.floor(diffInHours / 24)} days ago`;
});

sightingSchema.methods.verify = function(verifiedBy, notes) {
  this.verification.status = 'verified';
  this.verification.verifiedBy = verifiedBy;
  this.verification.verifiedAt = new Date();
  this.verification.verificationNotes = notes;
  this.verification.credibilityScore = 85; 
  
  return this.save();
};

sightingSchema.methods.reject = function(rejectedBy, reason) {
  this.verification.status = 'rejected';
  this.verification.verifiedBy = rejectedBy;
  this.verification.verifiedAt = new Date();
  this.verification.verificationNotes = reason;
  this.verification.credibilityScore = 0;
  
  return this.save();
};

sightingSchema.methods.calculateDistanceFromCase = async function() {
  const Case = mongoose.model('Case');
  const caseData = await Case.findById(this.caseId);
  
  if (!caseData) return null;
  
  const [caseLng, caseLat] = caseData.lastSeen.location.coordinates;
  const [sightingLng, sightingLat] = this.location.coordinates;

  const R = 6371; 
  const dLat = (sightingLat - caseLat) * Math.PI / 180;
  const dLng = (sightingLng - caseLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(caseLat * Math.PI / 180) * Math.cos(sightingLat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; 
};

module.exports = mongoose.model('Sighting', sightingSchema);