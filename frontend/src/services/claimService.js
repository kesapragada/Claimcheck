//CLAIMCHECK/frontend/src/services/claimService.js
import API from './api';

export const uploadClaim = async (file) => {
  const formData = new FormData();
  formData.append('claimFile', file);
  const res = await API.post('/claims/upload', formData);
  return res.data;
};

export const getClaimStatus = async (claimId) => {
  const res = await API.get(`/claims/status/${claimId}`);
  return res.data;
};
