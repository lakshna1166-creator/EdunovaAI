import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, getToken, setAuthSession, clearAuthSession, getCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getCurrentUser());
  const [token, setToken] = useState(() => getToken());
  const [isLoading, setIsLoading] = useState(true);

  // Restore and verify student session on initial page load / refresh
  const verifySession = useCallback(async () => {
    const savedToken = getToken();
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res && res.success && res.user) {
        setUser(res.user);
        setToken(savedToken);
        setAuthSession(savedToken, res.user);
      } else {
        clearAuthSession();
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.warn('Session verification failed (token may be expired):', err.message);
      // If token expired (401), clear session
      if (err.status === 401) {
        clearAuthSession();
        setUser(null);
        setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // Student Login
  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      if (res && res.success) {
        if (res.needsVerification) return { success:true, needsVerification:true, user:res.user };
        const receivedUser = res.user;
        const receivedToken = res.token;
        setUser(receivedUser);
        setToken(receivedToken);
        setAuthSession(receivedToken, receivedUser);
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res?.message || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        needsVerification: !!err.data?.needsVerification,
        message: err.data?.message || err.message || 'Invalid email or password.'
      };
    }
  };

  // Student Registration (Always student role)
  const register = async ({ name, email, password, confirmPassword, preferredLanguage, gradeLevel }) => {
    try {
      const res = await authApi.register({
        name,
        email,
        password,
        confirmPassword,
        preferredLanguage,
        gradeLevel
      });

      if (res && res.success) {
        if (res.needsVerification) return { success:true, needsVerification:true, user:res.user };
        const receivedUser = res.user;
        const receivedToken = res.token;
        setUser(receivedUser);
        setToken(receivedToken);
        setAuthSession(receivedToken, receivedUser);
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res?.message || 'Registration failed' };
    } catch (err) {
      return {
        success: false,
        message: err.data?.message || err.message || 'Registration failed. Please try again.'
      };
    }
  };

  // Logout student session
  const logout = async () => {
    try {
      await authApi.logout().catch(() => {});
    } finally {
      clearAuthSession();
      setUser(null);
      setToken(null);
    }
  };

  // Update profile
  const updateUserProfile = async (updates) => {
    try {
      const res = await authApi.updateProfile(updates);
      if (res && res.success) {
        // Refresh profile
        const freshUser = await authApi.getMe();
        if (freshUser?.user) {
          setUser(freshUser.user);
          setAuthSession(token, freshUser.user);
        }
        return { success: true };
      }
      return { success: false, message: res?.message };
    } catch (err) {
      return { success: false, message: err.data?.message || err.message };
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    updateUserProfile,
    refreshSession: verifySession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
