//CLAIMCHECK/frontend/react/src/services/claimService.js
import API from './api';

// The only function needed for upload is to inform our backend after Cloudinary is done.
export const createClaim = (claimData) => {
  return API.post('/claims', claimData).then(res => res.data);
};

export const fetchClaimHistory = () => API.get('/claims').then(res => res.data);

export const getClaim = (claimId) => API.get(`/claims/${claimId}`).then(res => res.data);

export const updateClaim = (claimId, correctedData) => API.put(`/claims/${claimId}`, correctedData).then(res => res.data);