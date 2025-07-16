import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [userCases, setUserCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [dismissingCase, setDismissingCase] = useState(null);

  // Fetch user's cases using the new endpoint
 const fetchUserCases = async () => {
  try {
    console.log('👤 Fetching user cases for:', user?.id, 'at', new Date().toISOString());
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token || !user) {
      setError('Not authenticated');
      console.log('❌ No token or user found');
      return;
    }

    console.log('🔐 Making request to /api/cases/my with token');

    // FIXED: Ensure we're calling the right endpoint
    const response = await fetch('http://localhost:5000/api/cases/my', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response not ok:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('📥 User cases response:', data);

    if (data.success) {
      console.log('✅ User cases found:', data.data.length);
      console.log('🔍 Cases data:', data.data);
      setUserCases(data.data || []);
    } else {
      setError(data.message || 'Failed to load your cases');
      console.error('❌ API returned success=false:', data.message);
    }

  } catch (error) {
    console.error('💥 Error fetching user cases:', error);
    setError(`Network error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
  // Dismiss case
  const dismissCase = async (caseId, caseName) => {
  if (!window.confirm(`Are you sure you want to dismiss the case for "${caseName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    setDismissingCase(caseId);
    console.log('🗑️ Dismissing case:', caseId);

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Authentication token not found. Please log in again.');
      return;
    }

    const response = await fetch(`http://localhost:5000/api/cases/${caseId}/dismiss`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📥 Dismiss response status:', response.status);
    
    const data = await response.json();
    console.log('📥 Dismiss response data:', data);

    if (response.ok && data.success) {
      // Remove the dismissed case from the list
      setUserCases(prev => prev.filter(c => c._id !== caseId));
      alert(`Case "${caseName}" dismissed successfully`);
      console.log('✅ Case dismissed successfully');
    } else {
      console.error('❌ Dismiss failed:', data);
      alert(data.message || `Failed to dismiss case: ${response.status} ${response.statusText}`);
    }

  } catch (error) {
    console.error('💥 Error dismissing case:', error);
    alert(`Network error while dismissing case: ${error.message}`);
  } finally {
    setDismissingCase(null);
  }
};

  // Update case status
  const updateCaseStatus = async (caseId, newStatus, notes = '') => {
    try {
      console.log('📝 Updating case status:', caseId, 'to', newStatus);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/cases/${caseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, notes })
      });

      const data = await response.json();

      if (data.success) {
        // Update the case in the list
        setUserCases(prev => prev.map(c => 
          c._id === caseId ? { ...c, status: newStatus } : c
        ));
        alert(`Case status updated to ${newStatus}`);
      } else {
        alert(data.message || 'Failed to update case status');
      }

    } catch (error) {
      console.error('💥 Error updating case status:', error);
      alert('Network error while updating status');
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserCases();
    }
  }, [user]);

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-600 text-white';
      case 'found': return 'bg-green-600 text-white';
      case 'closed': return 'bg-gray-600 text-white';
      case 'dismissed': return 'bg-purple-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const calculateDaysSince = (date) => {
    if (!date) return 0;
    const lastSeen = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - lastSeen);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-xl font-semibold text-white mb-2">Not Authenticated</h2>
          <p className="text-gray-400 mb-6">Please log in to view your profile.</p>
          <button
            onClick={() => navigate('/auth')}
            className="btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">Manage your account and view your activity</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-white">{user.name || 'Unknown User'}</h2>
                <p className="text-gray-400">{user.email}</p>
                <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded mt-2">
                  {user.role?.toUpperCase() || 'USER'}
                </span>
                <p className="text-xs text-gray-500 mt-2">ID: {user.id}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'overview' 
                      ? 'bg-red-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">👤</span>
                  Overview
                </button>
                
                <button
                  onClick={() => setActiveTab('cases')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'cases' 
                      ? 'bg-red-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">📋</span>
                  My Cases
                  {userCases.length > 0 && (
                    <span className="ml-auto bg-gray-600 text-white text-xs px-2 py-1 rounded">
                      {userCases.length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-red-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">⚙️</span>
                  Settings
                </button>
              </nav>

              <div className="border-t border-gray-700 mt-6 pt-6">
                <button
                  onClick={logout}
                  className="w-full text-red-400 hover:text-red-300 text-left"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Account Overview</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                      <p className="text-white">{user.name || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                      <p className="text-white">{user.email}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Member Since</label>
                      <p className="text-white">{formatDate(user.createdAt)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Account Status</label>
                      <span className="inline-block px-2 py-1 bg-green-600 text-white text-xs rounded">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Activity Summary</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{userCases.length}</div>
                      <div className="text-gray-400 text-sm">Cases Reported</div>
                    </div>
                    
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">
                        {userCases.filter(c => c.status === 'active').length}
                      </div>
                      <div className="text-gray-400 text-sm">Active Cases</div>
                    </div>
                    
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">
                        {userCases.filter(c => c.status === 'found').length}
                      </div>
                      <div className="text-gray-400 text-sm">Found Cases</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cases' && (
              <div className="bg-gray-800 rounded-lg border border-gray-700">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      My Cases ({userCases.length})
                    </h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={fetchUserCases}
                        className="btn-secondary"
                      >
                        🔄 Refresh
                      </button>
                      <button
                        onClick={() => navigate('/cases/create')}
                        className="btn-primary"
                      >
                        + Report Missing Person
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
                      <p className="text-gray-400">Loading your cases...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">❌</div>
                      <p className="text-red-400 mb-4">{error}</p>
                      <button onClick={fetchUserCases} className="btn-secondary">
                        Try Again
                      </button>
                    </div>
                  ) : userCases.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📋</div>
                      <h4 className="text-lg font-semibold text-white mb-2">No Cases Yet</h4>
                      <p className="text-gray-400 mb-6">Cases you've reported will appear here</p>
                      <button
                        onClick={() => navigate('/cases/create')}
                        className="btn-primary"
                      >
                        Report Missing Person
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userCases.map((caseItem) => (
                        <div
                          key={caseItem._id}
                          className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => navigate(`/cases/${caseItem._id}`)}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-white font-semibold">
                                  {caseItem.missingPerson?.name || 'Unknown Person'}
                                </h4>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                                  {caseItem.status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-400">Case #:</span>
                                  <p className="text-white font-mono">{caseItem.caseNumber}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Age:</span>
                                  <p className="text-white">{caseItem.missingPerson?.age || 'Unknown'}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Reported:</span>
                                  <p className="text-white">{formatDate(caseItem.createdAt)}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Days Missing:</span>
                                  <p className="text-white font-semibold">
                                    {calculateDaysSince(caseItem.lastSeenDate)} days
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="ml-4 flex flex-col space-y-2">
                              {caseItem.status === 'active' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const notes = prompt('Add notes about finding this person (optional):');
                                      if (notes !== null) {
                                        updateCaseStatus(caseItem._id, 'found', notes);
                                      }
                                    }}
                                    className="btn-xs bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    ✅ Found
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const notes = prompt('Add notes about closing this case (optional):');
                                      if (notes !== null) {
                                        updateCaseStatus(caseItem._id, 'closed', notes);
                                      }
                                    }}
                                    className="btn-xs bg-gray-600 hover:bg-gray-700 text-white"
                                  >
                                    🔒 Close
                                  </button>
                                </>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissCase(caseItem._id, caseItem.missingPerson?.name || 'Unknown');
                                }}
                                disabled={dismissingCase === caseItem._id}
                                className="btn-xs bg-red-600 hover:bg-red-700 text-white"
                              >
                                {dismissingCase === caseItem._id ? '...' : '🗑️ Dismiss'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
                <p className="text-gray-400 mb-6">Account settings functionality coming soon...</p>
                
                <div className="space-y-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Change Password</h4>
                    <p className="text-gray-400 text-sm">Update your account password</p>
                    <button className="btn-secondary mt-3" disabled>
                      Coming Soon
                    </button>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Email Preferences</h4>
                    <p className="text-gray-400 text-sm">Manage your notification settings</p>
                    <button className="btn-secondary mt-3" disabled>
                      Coming Soon
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;