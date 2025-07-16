import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const CreateCase = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    missingPerson: {
      name: '',
      age: '',
      gender: '',
      height: '',
      weight: '',
      hairColor: '',
      eyeColor: '',
      distinguishingFeatures: '',
      photos: []
    },
    description: '',
    lastSeenDate: '',
    lastSeenTime: '',
    circumstances: '',
    lastKnownLocation: {
      address: '',
      city: '',
      state: '',
      country: 'United States',
      zipCode: ''
    },
    contactInfo: {
      primaryContact: {
        name: '',
        relationship: '',
        phone: '',
        email: ''
      }
    },
    priority: 'medium',
    category: 'missing-person'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);

  const updateFormField = (path, value) => {
    setFormData(prevData => {
      const newData = { ...prevData };
      const pathParts = path.split('.');
      let current = newData;

      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }

      current[pathParts[pathParts.length - 1]] = value;
      return newData;
    });

    if (validationErrors.length > 0) setValidationErrors([]);
    if (error) setError('');
  };

  const getFieldValue = (path) => {
    try {
      const pathParts = path.split('.');
      let value = formData;
      
      for (const part of pathParts) {
        value = value?.[part];
        if (value === undefined) return '';
      }
      
      return value || '';
    } catch (err) {
      console.error('Error getting field value:', path, err);
      return '';
    }
  };

  const validateCurrentStep = () => {
    const errors = [];

    try {
      switch (currentStep) {
        case 1:
          if (!getFieldValue('missingPerson.name').trim()) {
            errors.push('Missing person name is required');
          }
          if (!getFieldValue('missingPerson.age')) {
            errors.push('Age is required');
          }
          if (!getFieldValue('missingPerson.gender')) {
            errors.push('Gender is required');
          }
          break;
        
        case 2:
          if (!getFieldValue('lastSeenDate')) {
            errors.push('Last seen date is required');
          }
          if (!getFieldValue('lastKnownLocation.address').trim()) {
            errors.push('Last known address is required');
          }
          if (!getFieldValue('lastKnownLocation.city').trim()) {
            errors.push('City is required');
          }
          if (!getFieldValue('lastKnownLocation.state').trim()) {
            errors.push('State is required');
          }
          break;
        
        case 3:
          if (!getFieldValue('contactInfo.primaryContact.name').trim()) {
            errors.push('Contact name is required');
          }
          if (!getFieldValue('contactInfo.primaryContact.relationship').trim()) {
            errors.push('Relationship is required');
          }
          if (!getFieldValue('contactInfo.primaryContact.phone').trim()) {
            errors.push('Phone number is required');
          }
          break;
        
        case 4:
          if (!getFieldValue('description').trim()) {
            errors.push('Case description is required');
          }
          break;
      }
    } catch (err) {
      console.error('Validation error:', err);
      errors.push('Validation error occurred');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const validateAllFields = () => {
    const errors = [];

    try {
      const requiredFields = [
        { path: 'missingPerson.name', label: 'Missing person name' },
        { path: 'missingPerson.age', label: 'Age' },
        { path: 'missingPerson.gender', label: 'Gender' },
        { path: 'lastSeenDate', label: 'Last seen date' },
        { path: 'lastKnownLocation.address', label: 'Last known address' },
        { path: 'lastKnownLocation.city', label: 'City' },
        { path: 'lastKnownLocation.state', label: 'State' },
        { path: 'contactInfo.primaryContact.name', label: 'Contact name' },
        { path: 'contactInfo.primaryContact.relationship', label: 'Relationship' },
        { path: 'contactInfo.primaryContact.phone', label: 'Phone number' },
        { path: 'description', label: 'Case description' }
      ];

      requiredFields.forEach(field => {
        const value = getFieldValue(field.path);
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors.push(`${field.label} is required`);
        }
      });
    } catch (err) {
      console.error('Full validation error:', err);
      errors.push('Validation error occurred');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const allErrors = validateAllFields();
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setError('Please complete all required fields before submitting.');
      return;
    }

    setLoading(true);
    setError('');
    setValidationErrors([]);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to report a missing person');
        return;
      }

      const response = await fetch('http://localhost:5000/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        navigate(`/cases/${data.data._id}`);
      } else {
        setError(data.message || 'Failed to create case');
      }

    } catch (error) {
      console.error('Create case error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setValidationErrors([]);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setValidationErrors([]);
      setError('');
    }
  };

  const getStepTitle = () => {
    const titles = {
      1: 'Missing Person Information',
      2: 'Last Known Location & Circumstances',
      3: 'Contact Information',
      4: 'Case Details & Review'
    };
    return titles[currentStep] || 'Case Information';
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Report Missing Person</h1>
          <p className="text-gray-400">Provide detailed information to help locate the missing person</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'border-gray-600 text-gray-400'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-center">
            <h2 className="text-xl font-semibold text-white">{getStepTitle()}</h2>
          </div>
        </div>

        {/* Error Messages */}
        {(error || validationErrors.length > 0) && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-8">
            {error && <p className="text-red-400 mb-2">{error}</p>}
            {validationErrors.length > 0 && (
              <div>
                <p className="text-red-400 font-medium mb-2">Please fix the following issues:</p>
                <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
            
            {/* Step 1: Missing Person Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={getFieldValue('missingPerson.name')}
                      onChange={(e) => updateFormField('missingPerson.name', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      value={getFieldValue('missingPerson.age')}
                      onChange={(e) => updateFormField('missingPerson.age', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      min="0"
                      max="150"
                      placeholder="Age"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Gender *
                    </label>
                    <select
                      value={getFieldValue('missingPerson.gender')}
                      onChange={(e) => updateFormField('missingPerson.gender', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Height
                    </label>
                    <input
                      type="text"
                      value={getFieldValue('missingPerson.height')}
                      onChange={(e) => updateFormField('missingPerson.height', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., 5'6&quot; or 168 cm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Weight
                    </label>
                    <input
                      type="text"
                      value={getFieldValue('missingPerson.weight')}
                      onChange={(e) => updateFormField('missingPerson.weight', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., 150 lbs or 68 kg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hair Color
                    </label>
                    <input
                      type="text"
                      value={getFieldValue('missingPerson.hairColor')}
                      onChange={(e) => updateFormField('missingPerson.hairColor', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., Brown, Black, Blonde"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Eye Color
                    </label>
                    <input
                      type="text"
                      value={getFieldValue('missingPerson.eyeColor')}
                      onChange={(e) => updateFormField('missingPerson.eyeColor', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., Brown, Blue, Green"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Distinguishing Features
                  </label>
                  <textarea
                    value={getFieldValue('missingPerson.distinguishingFeatures')}
                    onChange={(e) => updateFormField('missingPerson.distinguishingFeatures', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows="3"
                    placeholder="Scars, tattoos, birthmarks, glasses, etc."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Location & Circumstances */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Seen Date *
                    </label>
                    <input
                      type="date"
                      value={getFieldValue('lastSeenDate')}
                      onChange={(e) => updateFormField('lastSeenDate', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Seen Time
                    </label>
                    <input
                      type="time"
                      value={getFieldValue('lastSeenTime')}
                      onChange={(e) => updateFormField('lastSeenTime', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Known Address *
                  </label>
                  <input
                    type="text"
                    value={getFieldValue('lastKnownLocation.address')}
                    onChange={(e) => updateFormField('lastKnownLocation.address', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={getFieldValue('lastKnownLocation.city')}
                      onChange={(e) => updateFormField('lastKnownLocation.city', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={getFieldValue('lastKnownLocation.state')}
                      onChange={(e) => updateFormField('lastKnownLocation.state', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={getFieldValue('lastKnownLocation.zipCode')}
                      onChange={(e) => updateFormField('lastKnownLocation.zipCode', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Circumstances of Disappearance
                  </label>
                  <textarea
                    value={getFieldValue('circumstances')}
                    onChange={(e) => updateFormField('circumstances', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows="4"
                    placeholder="Describe the circumstances surrounding the disappearance..."
                  />
                </div>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      value={getFieldValue('contactInfo.primaryContact.name')}
                      onChange={(e) => updateFormField('contactInfo.primaryContact.name', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Your name or contact person"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Relationship *
                    </label>
                    <input
                      type="text"
                      value={getFieldValue('contactInfo.primaryContact.relationship')}
                      onChange={(e) => updateFormField('contactInfo.primaryContact.relationship', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., Parent, Spouse, Friend"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={getFieldValue('contactInfo.primaryContact.phone')}
                      onChange={(e) => updateFormField('contactInfo.primaryContact.phone', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={getFieldValue('contactInfo.primaryContact.email')}
                      onChange={(e) => updateFormField('contactInfo.primaryContact.email', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Email address"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Case Details & Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Case Description *
                  </label>
                  <textarea
                    value={getFieldValue('description')}
                    onChange={(e) => updateFormField('description', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows="4"
                    placeholder="Provide a detailed description of the missing person and circumstances..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priority Level
                    </label>
                    <select
                      value={getFieldValue('priority')}
                      onChange={(e) => updateFormField('priority', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Case Category
                    </label>
                    <select
                      value={getFieldValue('category')}
                      onChange={(e) => updateFormField('category', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="missing-person">Missing Person</option>
                      <option value="runaway">Runaway</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Review Section */}
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Review Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Name:</span>
                      <p className="text-white">{getFieldValue('missingPerson.name') || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Age:</span>
                      <p className="text-white">{getFieldValue('missingPerson.age') || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Last Seen:</span>
                      <p className="text-white">{getFieldValue('lastSeenDate') || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Contact:</span>
                      <p className="text-white">{getFieldValue('contactInfo.primaryContact.name') || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              className={`px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors ${
                currentStep === 1 ? 'invisible' : ''
              }`}
            >
              ← Previous
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Case...
                  </div>
                ) : (
                  'Create Case'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCase;