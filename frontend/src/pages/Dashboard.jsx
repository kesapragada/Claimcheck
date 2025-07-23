// CLAIMCHECK/frontend/src/pages/Dashboard.jsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { uploadClaim, getClaim } from '../services/claimService';
import toast from 'react-hot-toast';
import { Clock, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeClaim, setActiveClaim] = useState(null);
  const pollingIntervalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Cleanup interval on component unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    toast.success('Successfully logged out.');
    navigate('/login');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    setActiveClaim(null);
    setIsUploading(true);
    const uploadToastId = toast.loading('Uploading file...');

    try {
      const initialClaim = await uploadClaim(file);
      toast.success('File accepted! Processing has begun.', { id: uploadToastId });
      setActiveClaim(initialClaim);

      if (['queued', 'processing'].includes(initialClaim.status)) {
        pollingIntervalRef.current = setInterval(async () => {
          try {
            const updatedClaim = await getClaim(initialClaim._id);
            setActiveClaim(updatedClaim);
            if (['completed', 'failed'].includes(updatedClaim.status)) {
              if (updatedClaim.status === 'completed') toast.success(`Processing for "${updatedClaim.filename}" complete!`);
              if (updatedClaim.status === 'failed') toast.error(`Processing for "${updatedClaim.filename}" failed.`);
              clearInterval(pollingIntervalRef.current);
            }
          } catch (err) {
            toast.error('Could not update claim status.');
            clearInterval(pollingIntervalRef.current);
          }
        }, 3000);
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Upload failed.', { id: uploadToastId });
    } finally {
      setIsUploading(false);
      setFile(null);
      if(e.target) e.target.reset();
    }
  };

  const renderStatus = () => {
    if (!activeClaim) return null;

    const statusMap = {
      queued: {
        text: 'In Queue...',
        icon: <Clock size={20} className="text-yellow-500" />,
        bg: 'bg-yellow-100 text-yellow-800',
      },
      processing: {
        text: 'Processing Document...',
        icon: <Loader2 size={20} className="animate-spin text-blue-500" />,
        bg: 'bg-blue-100 text-blue-800',
      },
      failed: {
        text: 'Processing Failed',
        icon: <XCircle size={20} className="text-red-500" />,
        bg: 'bg-red-100 text-red-800',
      },
    };

    if (activeClaim.status === 'completed') {
      return (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-600" /> Extraction Successful
          </h3>
          <div className="space-y-3 text-gray-700">
            <div><strong>Filename:</strong> <span className='font-mono'>{activeClaim.filename}</span></div>
            <div><strong>Claimant Name:</strong> {activeClaim.fields.name || <span className="text-gray-400">Not found</span>}</div>
            <div><strong>Claim Date:</strong> {activeClaim.fields.date || <span className="text-gray-400">Not found</span>}</div>
            <div><strong>Claim Amount:</strong> {activeClaim.fields.amount || <span className="text-gray-400">Not found</span>}</div>
          </div>
        </div>
      );
    }
    
    const currentStatus = statusMap[activeClaim.status];
    if (currentStatus) {
      return (
        <div className={`text-center p-4 mt-8 rounded-md flex items-center justify-center gap-3 ${currentStatus.bg} max-w-2xl mx-auto`}>
          {currentStatus.icon}
          <span className="font-semibold">{currentStatus.text}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">ClaimCheck</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/history" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              History
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-2 text-sm rounded-md font-semibold hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-2xl mx-auto mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4">Upload New Claim</h2>
          <form onSubmit={handleUpload}>
            <input
              type="file"
              accept="application/pdf"
              name="claimFile"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            <button
              type="submit"
              disabled={isUploading || !file}
              className="w-full mt-6 bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Submitting...' : 'Analyze Claim Document'}
            </button>
          </form>
        </div>
        {renderStatus()}
      </main>
    </div>
  );
}