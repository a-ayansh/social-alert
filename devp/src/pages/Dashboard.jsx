import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    foundCases: 0,
    recentCases: 0
  });
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      console.log('📊 Fetching dashboard data...');
      setLoading(true);
      setError('');

      // Fetch stats and cases concurrently
      const [statsResponse, casesResponse] = await Promise.all([
        fetch('http://localhost:5000/api/cases/stats/summary'),
        fetch('http://localhost:5000/api/cases?limit=5', {
          headers: {
            'Content-Type': 'application/json',
            ...(user && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
          }
        })
      ]);

      console.log('📥 Stats response status:', statsResponse.status);
      console.log('📥 Cases response status:', casesResponse.status);

      const statsData = await statsResponse.json();
      const casesData = await casesResponse.json();

      console.log('📊 Stats data:', statsData);
      console.log('📋 Cases data:', casesData);

      if (statsData.success) {
        setStats({
          totalCases: statsData.data.totalCases || 0,
          activeCases: statsData.data.activeCases || 0,
          foundCases: statsData.data.foundCases || 0,
          recentCases: casesData.success ? (casesData.data?.length || 0) : 0
        });
      }

      if (casesData.success) {
        setRecentCases(casesData.data || []);
        console.log('✅ Recent cases loaded:', casesData.data?.length || 0);
      }

    } catch (error) {
      console.error('💥 Dashboard fetch error:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDaysSince = (date) => {
    if (!date) return 0;
    const lastSeen = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - lastSeen);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-600 text-white';
      case 'found': return 'bg-green-600 text-white';
      case 'closed': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-black';
      case 'low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="loading-spinner w-16 h-16 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Loading Dashboard</h2>
            <p className="text-gray-400">Please wait while we fetch the latest data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Overview of missing person cases</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <span className="text-red-400 text-xl mr-3">❌</span>
              <div>
                <p className="text-red-400">{error}</p>
                <button
                  onClick={fetchDashboardData}
                  className="text-red-300 underline text-sm mt-1"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-600 rounded-lg mr-4">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Cases</p>
                <p className="text-white text-2xl font-bold">{stats.totalCases}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-red-600 rounded-lg mr-4">
                <span className="text-white text-xl">🚨</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active Cases</p>
                <p className="text-white text-2xl font-bold">{stats.activeCases}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-600 rounded-lg mr-4">
                <span className="text-white text-xl">✅</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Found</p>
                <p className="text-white text-2xl font-bold">{stats.foundCases}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-purple-600 rounded-lg mr-4">
                <span className="text-white text-xl">📝</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Recent (24h)</p>
                <p className="text-white text-2xl font-bold">{stats.recentCases}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Cases */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Recent Cases</h2>
              <button
                onClick={() => navigate('/cases')}
                className="text-red-400 hover:text-red-300 font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {recentCases.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-white mb-2">No Recent Cases</h3>
                <p className="text-gray-400 mb-6">No missing person cases have been reported recently.</p>
                <button
                  onClick={() => navigate('/cases/create')}
                  className="btn-primary"
                >
                  Report Missing Person
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCases.map((caseItem) => (
                  <div
                    key={caseItem._id}
                    onClick={() => navigate(`/cases/${caseItem._id}`)}
                    className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* FIXED: Display actual missing person name */}
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-white">
                            {caseItem.missingPerson?.name || 'Unknown Person'}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${getStatusColor(caseItem.status)}`}>
                            {caseItem.status}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${getPriorityColor(caseItem.priority)}`}>
                            {caseItem.priority}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Case:</span>
                            <p className="text-white font-mono">{caseItem.caseNumber}</p>
                          </div>
                          
                          <div>
                            <span className="text-gray-400">Age:</span>
                            <p className="text-white">
                              {caseItem.missingPerson?.age ? `${caseItem.missingPerson.age} years` : 'Unknown'}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-gray-400">Last seen:</span>
                            <p className="text-white">
                              {caseItem.lastKnownLocation?.city && caseItem.lastKnownLocation?.state 
                                ? `${caseItem.lastKnownLocation.city}, ${caseItem.lastKnownLocation.state}`
                                : 'Unknown location'
                              }
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-gray-400">Days missing:</span>
                            <p className="text-white font-semibold">
                              {calculateDaysSince(caseItem.lastSeenDate)} days
                            </p>
                          </div>
                        </div>
                        
                        {/* FIXED: Show actual description */}
                        {caseItem.description && (
                          <div className="mt-3">
                            <p className="text-gray-300 line-clamp-2">
                              {caseItem.description}
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-3 flex items-center text-xs text-gray-400">
                          <span>Reported by {caseItem.reportedBy?.name || 'Unknown'}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(caseItem.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="ml-6 flex items-center">
                        <span className="text-gray-400 text-2xl">→</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🚨</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Report Missing Person</h3>
              <p className="text-gray-400 text-sm mb-4">File a new missing person report</p>
              <button
                onClick={() => navigate('/cases/create')}
                className="btn-primary w-full"
              >
                Report Now
              </button>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Search Cases</h3>
              <p className="text-gray-400 text-sm mb-4">Browse all missing person cases</p>
              <button
                onClick={() => navigate('/cases')}
                className="btn-secondary w-full"
              >
                Search Cases
              </button>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">👤</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">My Profile</h3>
              <p className="text-gray-400 text-sm mb-4">Manage your account and cases</p>
              <button
                onClick={() => navigate('/profile')}
                className="btn-secondary w-full"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;