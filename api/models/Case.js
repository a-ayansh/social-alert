const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  
  caseNumber: {
    type: String,
    unique: true
  },

  title: {
    type: String,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Case description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },

  missingPerson: {
    name: {
      type: String,
      required: [true, 'Missing person name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age cannot exceed 150']
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['male', 'female', 'other']
    },
    height: String,
    weight: String,
    hairColor: String,
    eyeColor: String,
    distinguishingFeatures: String,
    lastSeenClothing: String,
    photos: [{
      url: String,
      description: String,
      isPrimary: {
        type: Boolean,
        default: false
      }
    }]
  },

  lastKnownLocation: {
    address: {
      type: String,
      required: [true, 'Last known address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'United States'
    },
    zipCode: String
  },

  lastSeenDate: {
    type: Date,
    required: [true, 'Last seen date is required']
  },
  lastSeenTime: String,
  circumstances: String,

  contactInfo: {
    primaryContact: {
      name: {
        type: String,
        required: [true, 'Primary contact name is required'],
        trim: true
      },
      relationship: String,
      phone: {
        type: String,
        required: [true, 'Primary contact phone is required'],
        trim: true
      },
      email: String
    }
  },

  status: {
    type: String,
    enum: ['active', 'found', 'closed', 'dismissed'], 
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['missing-person', 'runaway', 'other'],
    default: 'missing-person'
  },

  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  notes: [{
    content: {
      type: String,
      required: true,
      trim: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  }],

  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

caseSchema.index({ caseNumber: 1 });
caseSchema.index({ status: 1 });
caseSchema.index({ reportedBy: 1 });
caseSchema.index({ createdAt: -1 });
caseSchema.index({ 'missingPerson.name': 'text', description: 'text' });

caseSchema.pre('save', async function(next) {
  if (this.isNew && !this.caseNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      const startOfDay = new Date(year, date.getMonth(), date.getDate());
      const endOfDay = new Date(year, date.getMonth(), date.getDate() + 1);
      
      const todaysCount = await this.constructor.countDocuments({
        createdAt: { 
          $gte: startOfDay, 
          $lt: endOfDay 
        }
      });
      
      const sequence = String(todaysCount + 1).padStart(3, '0');
      this.caseNumber = `MA-${year}${month}${day}-${sequence}`;
      
          } catch (error) {
      console.error('❌ Error generating case number:', error);
      
      this.caseNumber = `MA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  next();
});

module.exports = mongoose.model('Case', caseSchema);