// CLAIMCHECK/frontend/src/pages/History.jsx

import React, { useEffect, useState } from 'react';
import { fetchClaimHistory } from '../services/claimService';
import { Link } from 'react-router-dom';

const History = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const data = await fetchClaimHistory();
        setClaims(data);
      } catch (err) {
        setError('Failed to fetch history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  if (loading) return <div className="text-center p-10">Loading your claim history...</div>;
  if (error) return <div className="text-center p-10 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Claim History</h2>
          <Link to="/" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
        </div>
        
        {/* --- ADDED EMPTY STATE UI --- */}
        {claims.length === 0 ? (
          <div className="text-center bg-white p-10 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-700">No Claims Found</h3>
            <p className="text-gray-500 mt-2">You haven't uploaded any claims yet. Go back to the dashboard to get started!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {claims.map((claim) => (
                <li key={claim._id} className="p-4 hover:bg-gray-50 transition duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{claim.filename}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded: {new Date(claim.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: <span className="font-medium">{claim.status}</span>
                      </p>
                    </div>
                    <Link
                      to={`/claim/${claim._id}`}
                      className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full hover:bg-blue-200"
                    >
                      View / Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;