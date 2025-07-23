// CLAIMCHECK/frontend/src/pages/ClaimDetail.jsx

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClaim, updateClaim } from '../services/claimService'; // Use the updated service

export default function ClaimDetail() {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [formData, setFormData] = useState({ name: '', date: '', amount: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        setIsLoading(true);
        const fetchedClaim = await getClaim(id);
        setClaim(fetchedClaim);
        // Pre-fill the form with corrected data if it exists, otherwise use original fields
        setFormData(fetchedClaim.correctedFields || fetchedClaim.fields || { name: '', date: '', amount: '' });
      } catch (err) {
        setError('Failed to load claim data. Please try again.');
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
    setSaveSuccess(false);
    try {
      await updateClaim(id, formData);
      setSaveSuccess(true);
      // Hide the success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save corrections.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-10">Loading claim details...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">← Back to Dashboard</Link>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Edit Claim: {claim.filename}</h2>
          <p className="text-sm text-gray-500 mb-6">Correct any fields that were extracted incorrectly by the OCR.</p>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Claimant Name</label>
              <input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Claim Date</label>
              <input
                id="date"
                name="date"
                value={formData.date || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Claim Amount</label>
              <input
                id="amount"
                name="amount"
                value={formData.amount || ''}
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-center justify-end space-x-4">
              {saveSuccess && <span className="text-green-600">Saved successfully!</span>}
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
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