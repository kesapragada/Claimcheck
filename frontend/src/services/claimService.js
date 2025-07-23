// CLAIMCHECK/frontend/src/services/claimService.js

import API from './api';

// This function is now the single source for getting a claim's full data.
export const getClaim = async (claimId) => {
  const response = await API.get(`/claims/status/${claimId}`);
  return response.data;
};

// This function uploads a new claim.
export const uploadClaim = async (file) => {
  const formData = new FormData();
  formData.append('claimFile', file);
  const response = await API.post('/claims/upload', formData);
  return response.data;
};

// This function saves the corrected data for a claim.
export const updateClaim = async (claimId, correctedData) => {
  const response = await API.put(`/claims/${claimId}`, correctedData);
  return response.data;
};