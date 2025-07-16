import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
            const token = localStorage.getItem('token');
      if (token) {
                try {
          const response = await apiService.getCurrentUser();
          if (response.success) {
            setUser(response.data.user);
                      } else {
                        localStorage.removeItem('token');
          }
        } catch (error) {
                    localStorage.removeItem('token');
        }
      } else {
              }
    } catch (error) {
      console.error('🚨 Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
          }
  };

  const login = async (email, password) => {
    try {
            const response = await apiService.login(email, password);
            
      if (response.success) {
        localStorage.setItem('token', response.token);
        setUser(response.data.user);
                return { success: true };
      }
      return { success: false, error: response.message || 'Login failed' };
    } catch (error) {
      console.error('💥 Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
            const response = await apiService.register(userData);
            
      if (response.success) {
        localStorage.setItem('token', response.token);
        setUser(response.data.user);
                return { success: true };
      }
      return { success: false, error: response.message || 'Registration failed' };
    } catch (error) {
      console.error('💥 Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
        localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;