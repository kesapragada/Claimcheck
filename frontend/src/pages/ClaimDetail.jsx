// CLAIMCHECK/frontend/src/pages/ClaimDetail.jsx

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClaim, updateClaim } from '../services/claimService';
import toast from 'react-hot-toast';

export default function ClaimDetail() {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [formData, setFormData] = useState({ name: '', date: '', amount: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        setIsLoading(true);
        const fetchedClaim = await getClaim(id);
        setClaim(fetchedClaim);
        setFormData(fetchedClaim.correctedFields || fetchedClaim.fields || { name: '', date: '', amount: '' });
      } catch (err) {
        toast.error('Failed to load claim data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClaim();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const savingToastId = toast.loading('Saving changes...');
    try {
      await updateClaim(id, formData);
      toast.success('Corrections saved successfully!', { id: savingToastId });
    } catch (err) {
      toast.error('Failed to save corrections.', { id: savingToastId });
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Loading claim details...</div>;
  }

  if (!claim) {
    return (
      <div className="text-center p-10 text-red-500">
        <p>Could not find claim.</p>
        <Link to="/history" className="text-blue-600 hover:underline mt-4 inline-block">Go to History</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/history" className="text-blue-600 hover:underline mb-4 inline-block">← Back to History</Link>
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800">Edit Claim</h2>
          <p className="text-sm text-gray-500 mb-6 font-mono">{claim.filename}</p>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Claimant Name</label>
              <input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Claim Date</label>
              <input
                id="date"
                name="date"
                value={formData.date || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Claim Amount</label>
              <input
                id="amount"
                name="amount"
                value={formData.amount || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Corrections'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}