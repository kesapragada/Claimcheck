// CLAIMCHECK/frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadClaim, getClaimStatus } from '../services/claimService';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // This state will now hold the full claim object that we are tracking
  const [activeClaim, setActiveClaim] = useState(null);

  const navigate = useNavigate();

  // Polling logic using useEffect
  useEffect(() => {
    // We only poll if there is an active claim and its status is not final
    if (activeClaim && (activeClaim.status === 'queued' || activeClaim.status === 'processing')) {
      const interval = setInterval(async () => {
        try {
          const updatedClaim = await getClaimStatus(activeClaim._id);
          // Update the local state with the latest from the server
          setActiveClaim(updatedClaim);

          // If the job is done, stop polling
          if (updatedClaim.status === 'completed' || updatedClaim.status === 'failed') {
            clearInterval(interval);
          }
        } catch (err) {
          setError('Could not update claim status.');
          clearInterval(interval);
        }
      }, 3000); // Poll every 3 seconds

      // Cleanup function to clear the interval when the component unmounts or activeClaim changes
      return () => clearInterval(interval);
    }
  }, [activeClaim]); // This effect re-runs whenever activeClaim changes

  const handleLogout = () => {
    localStorage.removeItem('token');
    setActiveClaim(null); // Clear any active state
    navigate('/login');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file.');
    
    setError('');
    setActiveClaim(null); // Clear previous results
    setIsUploading(true);

    try {
      // The API now responds immediately with the initial claim object
      const initialClaim = await uploadClaim(file);
      setActiveClaim(initialClaim); // Set this as our active claim to start polling
    } catch (err) {
      setError(err.response?.data?.msg || 'Upload failed.');
    } finally {
      setIsUploading(false);
      setFile(null); // Reset the file input
      e.target.reset(); // Reset the form
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