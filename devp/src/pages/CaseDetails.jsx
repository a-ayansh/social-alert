import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const CaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch case details
  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        console.log('🔍 Fetching case details for ID:', id);
        setLoading(true);
        setError('');

        const response = await fetch(`http://localhost:5000/api/cases/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(user && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
          }
        });

        const data = await response.json();
        console.log('📥 Case details response:', data);

        if (data.success) {
          setCaseData(data.data);
          console.log('✅ Case details loaded successfully');
        } else {
          setError(data.message || 'Failed to load case details');
          console.error('❌ Failed to load case:', data.message);
        }

      } catch (error) {
        console.error('💥 Error fetching case details:', error);
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCaseDetails();
    }
  }, [id, user]);

  // Update case status
  const handleStatusUpdate = async (newStatus, notes = '') => {
    try {
      setUpdating(true);
      console.log('📝 Updating case status to:', newStatus);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to update case status');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/cases/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, notes })
      });

      const data = await response.json();

      if (data.success) {
        setCaseData(prev => ({
          ...prev,
          status: newStatus
        }));
        alert(`Case status updated to ${newStatus} successfully!`);
      } else {
        setError(data.message || 'Failed to update case status');
      }

    } catch (error) {
      console.error('💥 Error updating case status:', error);
      setError('Network error while updating status');
    } finally {
      setUpdating(false);
    }
  };

  // Calculate days since last seen
  const calculateDaysSince = (date) => {
    if (!date) return 'Unknown';
    const lastSeen = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - lastSeen);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (time) => {
    if (!time) return 'Not specified';
    return time;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-16 h-16 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Case Details</h2>
          <p className="text-gray-400">Please wait while we fetch the case information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-2xl font-bold text-red-500 mb-2">Case Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error || 'The case you\'re looking for doesn\'t exist or is not available.'}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/cases')}
              className="btn-primary"
            >
              ← Back to Cases
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-900/20 text-red-400 border-red-700';
      case 'found': return 'bg-green-900/20 text-green-400 border-green-700';
      case 'closed': return 'bg-gray-900/20 text-gray-400 border-gray-700';
      default: return 'bg-gray-900/20 text-gray-400 border-gray-700';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-900/20 text-red-400 border-red-700';
      case 'high': return 'bg-orange-900/20 text-orange-400 border-orange-700';
      case 'medium': return 'bg-yellow-900/20 text-yellow-400 border-yellow-700';
      case 'low': return 'bg-blue-900/20 text-blue-400 border-blue-700';
      default: return 'bg-gray-900/20 text-gray-400 border-gray-700';
    }
  };

  // Check if user can edit this case
  const canEdit = user && caseData.reportedBy && (
    user.id === caseData.reportedBy._id || 
    user.id === caseData.reportedBy.toString() ||
    user.role === 'admin'
  );

  const daysSinceLastSeen = calculateDaysSince(caseData.lastSeenDate);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/cases')}
              className="btn-ghost"
            >
              ← Back to Cases
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Case Details</h1>
              <p className="text-gray-400">Case #{caseData.caseNumber}</p>
            </div>
          </div>
          
          {canEdit && (
            <div className="flex items-center space-x-3">
              {caseData.status === 'active' && (
                <>
                  <button
                    onClick={() => {
                      const notes = prompt('Add notes about finding this person (optional):');
                      if (notes !== null) {
                        handleStatusUpdate('found', notes);
                      }
                    }}
                    className="btn-primary bg-green-600 hover:bg-green-700"
                    disabled={updating}
                  >
                    ✅ Mark as Found
                  </button>
                  <button
                    onClick={() => {
                      const notes = prompt('Add notes about closing this case (optional):');
                      if (notes !== null) {
                        handleStatusUpdate('closed', notes);
                      }
                    }}
                    className="btn-secondary"
                    disabled={updating}
                  >
                    🔒 Close Case
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Missing Person Information */}
            <div className="card">
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-3">👤</span>
                <h2 className="text-xl font-semibold text-white">Missing Person Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                  <p className="text-white text-lg font-medium">{caseData.missingPerson?.name || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Age</label>
                  <p className="text-white">{caseData.missingPerson?.age || 'Not specified'} years old</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Gender</label>
                  <p className="text-white capitalize">{caseData.missingPerson?.gender || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Height</label>
                  <p className="text-white">{caseData.missingPerson?.height || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Weight</label>
                  <p className="text-white">{caseData.missingPerson?.weight || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Hair Color</label>
                  <p className="text-white">{caseData.missingPerson?.hairColor || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Eye Color</label>
                  <p className="text-white">{caseData.missingPerson?.eyeColor || 'Not specified'}</p>
                </div>
              </div>
              
              {caseData.description && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Physical Description</label>
                  <p className="text-gray-300 leading-relaxed">{caseData.description}</p>
                </div>
              )}
              
              {caseData.missingPerson?.distinguishingFeatures && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Distinguishing Features</label>
                  <p className="text-gray-300">{caseData.missingPerson.distinguishingFeatures}</p>
                </div>
              )}
            </div>

            {/* Last Seen Information */}
            <div className="card">
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-3">📍</span>
                <h2 className="text-xl font-semibold text-white">Last Seen Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                  <p className="text-white">{formatDate(caseData.lastSeenDate)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
                  <p className="text-white">{formatTime(caseData.lastSeenTime)}</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                  <p className="text-white">
                    {caseData.lastKnownLocation?.address}, {caseData.lastKnownLocation?.city}, {caseData.lastKnownLocation?.state}
                    {caseData.lastKnownLocation?.zipCode && ` ${caseData.lastKnownLocation.zipCode}`}
                  </p>
                </div>
              </div>
              
              {caseData.circumstances && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Circumstances</label>
                  <p className="text-gray-300 leading-relaxed">{caseData.circumstances}</p>
                </div>
              )}
              
              {caseData.missingPerson?.lastSeenClothing && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Last Seen Clothing</label>
                  <p className="text-gray-300">{caseData.missingPerson.lastSeenClothing}</p>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="card">
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-3">📞</span>
                <h2 className="text-xl font-semibold text-white">Contact Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Contact Name</label>
                  <p className="text-white">{caseData.contactInfo?.primaryContact?.name || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Relationship</label>
                  <p className="text-white">{caseData.contactInfo?.primaryContact?.relationship || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                  <p className="text-white font-mono">
                    <a href={`tel:${caseData.contactInfo?.primaryContact?.phone}`} className="hover:text-red-400">
                      {caseData.contactInfo?.primaryContact?.phone || 'Not specified'}
                    </a>
                  </p>
                </div>
                
                {caseData.contactInfo?.primaryContact?.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                    <p className="text-white">
                      <a href={`mailto:${caseData.contactInfo.primaryContact.email}`} className="hover:text-red-400">
                        {caseData.contactInfo.primaryContact.email}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Case Status */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Case Status</h3>
              
              <div className="space-y-4">
                <div className={`px-3 py-2 rounded-lg border ${getStatusColor(caseData.status)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium uppercase tracking-wider">
                      {caseData.status}
                    </span>
                    <span className="text-xs">
                      {caseData.status === 'active' ? '🚨' : caseData.status === 'found' ? '✅' : '🔒'}
                    </span>
                  </div>
                </div>
                
                <div className={`px-3 py-2 rounded-lg border ${getPriorityColor(caseData.priority)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium uppercase tracking-wider">
                      {caseData.priority} Priority
                    </span>
                    <span className="text-xs">
                      {caseData.priority === 'critical' ? '🔴' : 
                       caseData.priority === 'high' ? '🟠' : 
                       caseData.priority === 'medium' ? '🟡' : '🔵'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Case Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Case Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Case Number</label>
                  <p className="text-white font-mono">{caseData.caseNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Reported Date</label>
                  <p className="text-white">{formatDate(caseData.createdAt)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Days Since Last Seen</label>
                  <p className="text-white font-semibold">
                    {daysSinceLastSeen} {daysSinceLastSeen === 1 ? 'day' : 'days'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Reported By</label>
                  <p className="text-white">{caseData.reportedBy?.name || 'Unknown'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <p className="text-white capitalize">{caseData.category?.replace('-', ' ') || 'Missing Person'}</p>
                </div>
              </div>
            </div>

            {/* Emergency Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Emergency Actions</h3>
              
              <div className="space-y-3">
                <a
                  href="tel:911"
                  className="block w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg text-center font-medium transition-colors"
                >
                  🚨 Call 911
                </a>
                
                <a
                  href={`tel:${caseData.contactInfo?.primaryContact?.phone}`}
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg text-center font-medium transition-colors"
                >
                  📞 Contact Reporter
                </a>
                
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Missing: ${caseData.missingPerson?.name}`,
                        text: `Help find ${caseData.missingPerson?.name}. Last seen: ${formatDate(caseData.lastSeenDate)}`,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Case link copied to clipboard!');
                    }
                  }}
                  className="block w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-center font-medium transition-colors"
                >
                  📤 Share Case
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8">
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;