// CLAIMCHECK/frontend/src/services/claimService.js

import API from './api'; // Ensure the import is uppercase 'API'

export const getClaim = async (claimId) => {
  const response = await API.get(`/claims/status/${claimId}`);
  return response.data;
};

export const uploadClaim = async (file) => {
  const formData = new FormData();
  formData.append('claimFile', file);
  const response = await API.post('/claims/upload', formData);
  return response.data;
};

export const updateClaim = async (claimId, correctedData) => {
  const response = await API.put(`/claims/${claimId}`, correctedData);
  return response.data;
};

// --- NEW HISTORY SERVICE ---
export const fetchClaimHistory = async () => {
  // Use uppercase 'API' to match the import
  const response = await API.get('/claims/history');
  return response.data;
};