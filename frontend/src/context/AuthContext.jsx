import React, { createContext, useContext, useState, useEffect } from 'react';
import api from "../api/axios"; 
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      const res = await api.get("/me");
      setUser(res.data); 
    } catch (err) {
      if (err.response?.status === 401) {
        logout(); 
      }
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

const login = async (email, password) => {
  try {
    delete api.defaults.headers.common['Authorization'];
    
    const res = await api.post("/login", { email, password });
    const newToken = res.data.access_token;
    setToken(newToken);
    localStorage.setItem("token", newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setUser(res.data.user);
    return { success: true };
  } catch (err) {
    console.error('Login error:', err)
    return {
      success: false,
      message: err.response?.data?.error || err.response?.data?.message || "Login failed",
    };
  }
};

  // Register
  const register = async (name, email, password, password_confirmation) => {
    try {
      const res = await api.post("/register", {
        name,
        email,
        password,
        password_confirmation,
      });
      const newToken = res.data.access_token;
      setToken(newToken);
      localStorage.setItem("token", newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setUser(res.data.user); // atau res.data jika backend return user object langsung
      return { success: true };
    } catch (err) {
      return {
        success: false,
        errors: err.response?.data?.errors || { general: ["Register failed"] },
      };
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    fetchMe
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
