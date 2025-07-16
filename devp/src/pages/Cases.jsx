import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

const Cases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all'
  });
  const [stats, setStats] = useState({
    activeCases: 0,
    foundCases: 0,
    totalCases: 0,
    successRate: 0
  });

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.priority !== 'all') queryParams.append('priority', filters.priority);

      const response = await fetch(`http://localhost:5000/api/cases?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setCases(data.data || []);
      } else {
        setError(data.message || 'Failed to load cases');
        console.error('❌ Failed to load cases:', data.message);
      }

    } catch (error) {
      console.error('💥 Error fetching cases:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cases/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchStats();
  }, [filters, user]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const calculateDaysSince = (date) => {
    if (!date) return 0;
    const lastSeen = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - lastSeen);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Loading Cases</h2>
            <p className="text-gray-400">Please wait while we fetch the latest missing person cases...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Missing Person Cases</h1>
            <p className="text-gray-400">All reported missing person cases</p>
          </div>
          
          <button
            onClick={() => navigate('/cases/create')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            + Report Missing Person
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <div className="p-3 bg-purple-600 rounded-lg mr-4">
                <span className="text-white text-xl">📈</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-white text-2xl font-bold">{stats.successRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, case number..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="found">Found</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchCases}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <span className="text-red-400 text-xl mr-3">❌</span>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Cases List */}
        <div className="space-y-6">
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Cases Found</h3>
              <p className="text-gray-400 mb-6">
                {filters.search || filters.status !== 'all' || filters.priority !== 'all'
                  ? 'No cases match your current filters.'
                  : 'No missing person cases have been reported yet.'
                }
              </p>
              <button
                onClick={() => navigate('/cases/create')}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Report Missing Person
              </button>
            </div>
          ) : (
            cases.map((caseItem) => (
              <div
                key={caseItem._id}
                onClick={() => navigate(`/cases/${caseItem._id}`)}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Case Header */}
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {caseItem.missingPerson?.name || 'Unknown Person'}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${getPriorityColor(caseItem.priority)}`}>
                        {caseItem.priority}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Case Number:</span>
                        <p className="text-white font-mono">{caseItem.caseNumber}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Age:</span>
                        <p className="text-white">
                          {caseItem.missingPerson?.age ? `${caseItem.missingPerson.age} years` : 'Unknown'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Gender:</span>
                        <p className="text-white capitalize">
                          {caseItem.missingPerson?.gender || 'Unknown'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Reported:</span>
                        <p className="text-white">{formatDate(caseItem.createdAt)}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Last Seen:</span>
                        <p className="text-white">
                          {caseItem.lastKnownLocation?.city && caseItem.lastKnownLocation?.state 
                            ? `${caseItem.lastKnownLocation.city}, ${caseItem.lastKnownLocation.state}`
                            : 'Unknown location'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Last Seen Date:</span>
                        <p className="text-white">{formatDate(caseItem.lastSeenDate)}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Days Missing:</span>
                        <p className="text-white font-semibold">
                          {calculateDaysSince(caseItem.lastSeenDate)} days
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Reported By:</span>
                        <p className="text-white">
                          {caseItem.reportedBy?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {caseItem.description && (
                      <div className="mt-4">
                        <p className="text-gray-300 line-clamp-2">
                          {caseItem.description}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6 flex items-center">
                    <span className="text-gray-400 text-2xl">→</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Cases;