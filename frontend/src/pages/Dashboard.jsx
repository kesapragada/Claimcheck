// CLAIMCHECK/frontend/src/pages/Dashboard.jsx
// CLAIMCHECK/frontend/src/pages/Dashboard.jsx

import { useState, useEffect, useRef } from 'react'; // 1. Import useRef
import { useNavigate } from 'react-router-dom';
import { uploadClaim, getClaim } from '../services/claimService'; // Note: I'm using getClaim for consistency

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeClaim, setActiveClaim] = useState(null);
  
  // 2. Use a ref to hold the interval ID. This persists across re-renders
  // without causing the effect to re-run.
  const pollingIntervalRef = useRef(null);
  const navigate = useNavigate();

  // This is the stable polling function. It does not depend on component state.
  const pollClaim = async (claimId) => {
    try {
      const updatedClaim = await getClaim(claimId);
      setActiveClaim(updatedClaim);

      if (updatedClaim.status === 'completed' || updatedClaim.status === 'failed') {
        // Stop the interval when the job is done
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err) {
      setError('Could not update claim status.');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  };

  // 3. This useEffect is now STABLE. It only runs when the component mounts.
  // Its job is to clean up any running intervals when the user navigates away.
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []); // Empty dependency array means this runs only once.

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current); // Clean up on logout
    }
    navigate('/login');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file.');
    
    // Clear any previous polling interval before starting a new one
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    setError('');
    setActiveClaim(null);
    setIsUploading(true);

    try {
      const initialClaim = await uploadClaim(file);
      setActiveClaim(initialClaim);
      
      // 4. Start the polling mechanism *after* the initial upload succeeds.
      if (initialClaim.status === 'queued' || initialClaim.status === 'processing') {
        pollingIntervalRef.current = setInterval(() => {
          pollClaim(initialClaim._id);
        }, 3000);
      }

    } catch (err) {
      setError(err.response?.data?.msg || 'Upload failed.');
    } finally {
      setIsUploading(false);
      setFile(null);
      e.target.reset();
    }
  };

  const renderStatus = () => {
    if (!activeClaim) return null;

    switch (activeClaim.status) {
      case 'queued':
        return <div className="text-center p-4 bg-yellow-100 text-yellow-800 rounded-md">Status: In Queue... ⏳</div>;
      case 'processing':
        return <div className="text-center p-4 bg-blue-100 text-blue-800 rounded-md">Status: Processing... ⚙️</div>;
      case 'failed':
        return <div className="text-center p-4 bg-red-100 text-red-800 rounded-md">Status: Failed. Please try another file. ❌</div>;
      case 'completed':
        return (
          <div className="mt-8 bg-green-50 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-green-800 mb-4">Extraction Successful ✅</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Filename:</strong> {activeClaim.filename}</p>
              <p><strong>Claimant Name:</strong> {activeClaim.fields.name || 'Not found'}</p>
              <p><strong>Claim Date:</strong> {activeClaim.fields.date || 'Not found'}</p>
              <p><strong>Claim Amount:</strong> {activeClaim.fields.amount || 'Not found'}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header remains the same */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">ClaimCheck Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600 transition duration-200"
          >
            Logout
          </button>
        </nav>
      </header>
      
      <main className="container mx-auto p-6">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Upload New Claim</h2>
          <form onSubmit={handleUpload}>
            <input
              type="file"
              accept="application/pdf"
              name="claimFile"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            <button
              type="submit"
              disabled={isUploading || !file}
              className="w-full mt-4 bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            >
              {isUploading ? 'Submitting...' : 'Analyze Claim Document'}
            </button>
          </form>
        </div>

        {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-md max-w-2xl mx-auto mb-4">{error}</div>}

        {renderStatus()}
      </main>
    </div>
  );
}