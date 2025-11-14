import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token when app starts
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch logged-in user profile
  const loadUser = async () => {
    try {
      const res = await api.get('/api/users/profile');
      setUser(res.data);
    } catch (err) {
      console.error('Error loading user:', err);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // LOGIN USER
  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data);
        return { success: true };
      } else {
        return { success: false, message: 'Login failed - no token received' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed',
      };
    }
  };

  // REGISTER USER
  const register = async (name, email, password) => {
    try {
      const res = await api.post('/api/auth/register', { name, email, password });

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data);
        return { success: true };
      } else {
        return { success: false, message: 'Registration failed - no token received' };
      }
    } catch (err) {
      console.error('Registration error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed',
      };
    }
  };

  // UPDATE USER PROFILE
  const updateUser = async (userData) => {
    try {
      let res;

      // Handle file upload (profile picture)
      if (userData instanceof FormData) {
        res = await api.put('/api/users/profile', userData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        res = await api.put('/api/users/profile', userData);
      }

      setUser(res.data);

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }

      return { success: true };
    } catch (err) {
      console.error('Update user error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Update failed',
      };
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
