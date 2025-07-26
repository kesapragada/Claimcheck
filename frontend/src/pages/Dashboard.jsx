//CLAIMCHECK/frontend/react/src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { createClaim } from '../services/claimService';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Clock, Loader2, CheckCircle, XCircle, UploadCloud } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

const formatCurrency = (amount, currencySymbol) => {
  if (amount === null || amount === undefined) {
    return <span className="text-slate-500">Not found</span>;
  }
  const currencyCodeMap = { '$': 'USD', '€': 'EUR', '£': 'GBP', '₹': 'INR' };
  const currencyCode = currencyCodeMap[currencySymbol] || 'INR';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode }).format(amount);
};

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeClaim, setActiveClaim] = useState(null);
  
  // This ref will hold the ID of the claim we are currently tracking.
  // It is immune to the stale closure problem.
  const activeClaimIdRef = useRef(null);
  
  const socket = useSocket();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    
    const handleClaimUpdate = (updatedClaim) => {
      console.log('Socket event received:', updatedClaim);
      console.log('Comparing to active ID:', activeClaimIdRef.current);

      // The listener ALWAYS checks the .current value of the ref, which is guaranteed to be up-to-date.
      if (activeClaimIdRef.current && updatedClaim._id === activeClaimIdRef.current) {
        
        // Use the functional update form of setState to ensure we work with the most recent state.
        setActiveClaim(prevClaim => {
          if (updatedClaim.status === 'completed' && prevClaim?.status !== 'completed') {
            toast.success(`Processing for "${updatedClaim.filename}" complete!`);
          }
          if (updatedClaim.status === 'failed' && prevClaim?.status !== 'failed') {
            toast.error(`Processing for "${updatedClaim.filename}" failed.`);
          }
          return updatedClaim;
        });
      }
    };
    
    socket.on('claimUpdate', handleClaimUpdate);

    return () => {
      socket.off('claimUpdate', handleClaimUpdate);
    };
  }, [socket]); // This effect ONLY re-runs if the socket object itself changes.

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }
    setIsUploading(true);
    setActiveClaim(null);
    activeClaimIdRef.current = null; // Reset the ref before a new upload.
    const uploadToastId = toast.loading('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'claimcheck_preset');
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      const { secure_url, public_id } = response.data;
      const initialClaim = await createClaim({
        filename: file.name,
        secureUrl: secure_url,
        publicId: public_id,
      });
      toast.success('File accepted! Processing begins.', { id: uploadToastId });
      
      // Set the state for rendering AND the ref for the socket listener.
      setActiveClaim(initialClaim);
      activeClaimIdRef.current = initialClaim._id;

    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Upload failed. Please try again.';
      toast.error(errorMsg, { id: uploadToastId });
    } finally {
      setIsUploading(false);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };
  
  const renderStatus = () => {
    if (!activeClaim) return null;
    const statusMap = {
      queued: { text: 'In Queue...', icon: <Clock className="h-5 w-5 text-yellow-400" />, bg: 'border-yellow-400/50' },
      processing: { text: 'Processing Document...', icon: <Loader2 className="h-5 w-5 animate-spin text-blue-400" />, bg: 'border-blue-400/50' },
      failed: { text: 'Processing Failed', icon: <XCircle className="h-5 w-5 text-red-500" />, bg: 'border-red-500/50' },
    };
    if (activeClaim.status === 'completed') {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2"><CheckCircle /> Extraction Successful</h3>
          <div className="space-y-3 text-slate-300 font-mono text-sm">
            <p><strong>Name:</strong> {activeClaim.fields.name || <span className="text-slate-500">Not found</span>}</p>
            <p><strong>Date:</strong> {activeClaim.fields.date ? new Date(activeClaim.fields.date).toLocaleDateString() : <span className="text-slate-500">Not found</span>}</p>
            <p><strong>Amount:</strong> {formatCurrency(activeClaim.fields.amount, activeClaim.fields.currency)}</p>
          </div>
        </motion.div>
      );
    }
    const currentStatus = statusMap[activeClaim.status];
    return currentStatus ? (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-lg flex items-center justify-center gap-3 border ${currentStatus.bg} bg-slate-900`}>
        {currentStatus.icon} <span className="font-semibold text-slate-200">{currentStatus.text}</span>
      </motion.div>
    ) : null;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 p-8 rounded-lg shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-4">Upload New Claim</h2>
        <form onSubmit={handleUpload}>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-700 px-6 py-10">
            <div className="text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-slate-500" />
              <div className="mt-4 flex text-sm leading-6 text-slate-400">
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-indigo-400 focus-within:outline-none hover:text-indigo-300">
                  <span>Upload a file</span>
                  <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFile(e.target.files[0])} accept=".pdf"/>
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-slate-500">PDF up to 5MB</p>
              {file && <p className="text-sm mt-2 text-green-400 font-mono">{file.name}</p>}
            </div>
          </div>
          <Button type="submit" disabled={isUploading || !file} className="w-full mt-6">
            {isUploading ? 'Uploading...' : 'Analyze Claim Document'}
          </Button>
        </form>
      </motion.div>
      <AnimatePresence>
        {activeClaim && renderStatus()}
      </AnimatePresence>
    </div>
  );
}