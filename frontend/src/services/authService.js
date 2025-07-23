//CLAIMCHECK/frontend/src/services/authService.js

import API from './api';

// The register function must accept the full user data object.
// After a successful API call, it stores the token to log the user in automatically.
export const register = async (userData) => {
  const response = await API.post('/users/register', userData);
  if (response.data) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

// The login function remains the same, but for clarity, here it is.
export const login = async (email, password) => {
  const response = await API.post('/users/login', { email, password });
  if (response.data) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};