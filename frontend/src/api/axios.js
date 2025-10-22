import axios from 'axios';

// Log untuk debugging
console.log('=== AXIOS CONFIG ===');
console.log('ENV REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

const baseURL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';
console.log('Using baseURL:', baseURL);

const api = axios.create({
   baseURL: baseURL,
   headers: {
     'Content-Type': 'application/json',
     'Accept': 'application/json',
   },
   timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Making request to:', config.baseURL + config.url);
    console.log('📦 Request data:', config.data);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response success:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.message);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;