import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';
import * as volunteerApi from '../api/volunteers';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clear authentication state
  const clearAuth = useCallback(() => {
    localStorage.removeItem('resq_token');
    localStorage.removeItem('resq_user');
    setUser(null);
    setVolunteerProfile(null);
  }, []);

  // Fetch volunteer profile if volunteer role is active
  const fetchVolunteerProfile = useCallback(async () => {
    try {
      const profile = await volunteerApi.getMyVolunteerProfile();
      setVolunteerProfile(profile);
      return profile;
    } catch (err) {
      console.warn('Volunteer profile not found or could not be loaded:', err.message);
      setVolunteerProfile(null);
      return null;
    }
  }, []);

  // Verify token on boot or state check
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('resq_token');
    if (!token) {
      clearAuth();
      setLoading(false);
      return;
    }

    try {
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem('resq_user', JSON.stringify(userData));

      if (userData.role === 'VOLUNTEER') {
        await fetchVolunteerProfile();
      }
    } catch (error) {
      console.error('Session verification failed, clearing tokens:', error.message);
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [clearAuth, fetchVolunteerProfile]);

  // Boot-up hook
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Log in action
  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('resq_token', data.access_token);
      
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem('resq_user', JSON.stringify(userData));

      if (userData.role === 'VOLUNTEER') {
        await fetchVolunteerProfile();
      }
      return userData;
    } catch (error) {
      clearAuth();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up action
  const registerUser = async (name, email, password, role, extra = {}) => {
    setLoading(true);
    try {
      // Register
      await authApi.register(name, email, password, role, extra);
      // Auto log in after registration
      return await loginUser(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Log out action
  const logoutUser = useCallback(() => {
    clearAuth();
    window.location.href = '/login';
  }, [clearAuth]);

  const value = {
    user,
    volunteerProfile,
    loading,
    isAuthenticated: !!user,
    loginUser,
    registerUser,
    logoutUser,
    checkAuth,
    refreshVolunteerProfile: fetchVolunteerProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
