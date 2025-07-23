// CLAIMCHECK/frontend/src/services/api.js

import axios from 'axios';

// CORRECTED: VITE_API_URL instead of VITE_API_BASE_URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;