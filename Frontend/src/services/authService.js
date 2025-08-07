//CLAIMCHECK/frontend/src/services/authService.js
import API from './api';

export const register = (userData) => {
  return API.post('/auth/register', userData).then(res => res.data);
};

export const login = (email, password) => {
  return API.post('/auth/login', { email, password }).then(res => res.data);
};
