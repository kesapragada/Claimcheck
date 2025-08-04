//CLAIMCHECK/frontend/src/pages/History.jsx
import React, { useEffect, useState } from 'react';
import { fetchClaimHistory } from '../services/claimService';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function History() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchClaimHistory();
        setClaims(data);
      } catch (err) {
        toast.error('Failed to fetch claim history.');
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const getStatusColor = (status) => ({
    queued: 'text-yellow-400',
    processing: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-500',
  }[status] || 'text-slate-400');

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">Claim History</h2>
      
      {claims.length === 0 ? (
        <div className="text-center bg-slate-900 border border-slate-800 p-10 rounded-lg">
          <h3 className="text-xl font-semibold text-white">No Claims Found</h3>
          <p className="text-slate-400 mt-2">You haven't uploaded any claims yet. Get started on the dashboard!</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-lg overflow-hidden">
          <ul className="divide-y divide-slate-800">
            {claims.map((claim, index) => (
              <motion.li
                key={claim._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className='flex-1 min-w-0'>
                    <p className="font-semibold text-white font-mono truncate">{claim.filename}</p>
                    <p className="text-sm text-slate-400">
                      Uploaded: {new Date(claim.createdAt).toLocaleString()}
                    </p>
                    <p className={`text-sm capitalize font-medium ${getStatusColor(claim.status)}`}>
                      Status: {claim.status}
                    </p>
                  </div>
                  <Link to={`/claim/${claim._id}`} className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex-shrink-0">
                    View / Edit
                  </Link>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};