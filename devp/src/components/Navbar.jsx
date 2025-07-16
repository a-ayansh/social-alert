import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed left-0 top-0 h-full w-64" style={{ backgroundColor: '#1f2937', borderRight: '1px solid #374151', zIndex: 50 }}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#dc2626' }}>
            <span className="text-xl font-bold">🚨</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Missing Alert</h1>
            <p className="text-xs" style={{ color: '#9ca3af' }}>by Aayansh03</p>
          </div>
        </div>

        {}
        <nav className="space-y-2">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              color: isActive('/') ? 'white' : '#d1d5db',
              backgroundColor: isActive('/') ? '#dc2626' : 'transparent',
              borderRadius: '8px',
              transition: 'all 0.2s',
              textDecoration: 'none'
            }}
          >
            <span className="mr-3">📊</span>
            Dashboard
          </Link>
          
          <Link
            to="/cases"
            className={`nav-link ${isActive('/cases') ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              color: isActive('/cases') ? 'white' : '#d1d5db',
              backgroundColor: isActive('/cases') ? '#dc2626' : 'transparent',
              borderRadius: '8px',
              transition: 'all 0.2s',
              textDecoration: 'none'
            }}
          >
            <span className="mr-3">📋</span>
            All Cases
          </Link>
          
          <Link
            to="/cases/create"
            className={`nav-link ${isActive('/cases/create') ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              color: isActive('/cases/create') ? 'white' : '#d1d5db',
              backgroundColor: isActive('/cases/create') ? '#dc2626' : 'transparent',
              borderRadius: '8px',
              transition: 'all 0.2s',
              textDecoration: 'none'
            }}
          >
            <span className="mr-3">➕</span>
            Report Missing
          </Link>
          
          <Link
            to="/profile"
            className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              color: isActive('/profile') ? 'white' : '#d1d5db',
              backgroundColor: isActive('/profile') ? '#dc2626' : 'transparent',
              borderRadius: '8px',
              transition: 'all 0.2s',
              textDecoration: 'none'
            }}
          >
            <span className="mr-3">👤</span>
            Profile
          </Link>
        </nav>

        {}
        <div className="absolute bottom-6 left-6 right-6">
          <div style={{ borderTop: '1px solid #374151', paddingTop: '16px' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                style={{ 
                  color: '#9ca3af',
                  transition: 'color 0.2s',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
                title="Logout"
                onMouseOver={(e) => e.target.style.color = '#f87171'}
                onMouseOut={(e) => e.target.style.color = '#9ca3af'}
              >
                <span className="text-lg">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;