//CLAIMCHECK/frontend/src/pages/ClaimDetail.jsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClaim, updateClaim } from '../services/claimService';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

// --- PDF Viewer Imports ---
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure the worker to load from a CDN. This is the easiest setup.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const formatDateForInput = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const offset = date.getTimezoneOffset();
  const correctedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return correctedDate.toISOString().split('T')[0];
};

const getCurrencySymbol = (currency) => {
  const currencyCodeMap = { '$': '$', '€': '€', '£': '£', '₹': '₹' };
  return currencyCodeMap[currency] || '₹';
};

export default function ClaimDetail() {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [formData, setFormData] = useState({ name: '', date: '', amount: '', currency: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [numPages, setNumPages] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const initialFields = useMemo(() => {
    if (!claim) return { name: '', date: '', amount: '', currency: '' };
    const hasCorrections = claim.correctedFields && Object.values(claim.correctedFields).some(v => v !== null && v !== '');
    return hasCorrections ? claim.correctedFields : claim.fields;
  }, [claim]);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        setIsLoading(true);
        const fetchedClaim = await getClaim(id);
        setClaim(fetchedClaim);
      } catch (err) {
        toast.error('Failed to load claim data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchClaim();
  }, [id]);

  useEffect(() => { if (claim) { setFormData(initialFields); } }, [claim, initialFields]);
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (e) => {
    setIsDirty(true);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const savingToastId = toast.loading('Saving changes...');
    try {
      await updateClaim(id, formData);
      setIsDirty(false);
      toast.success('Corrections saved successfully!', { id: savingToastId });
    } catch (err) {
      toast.error('Failed to save corrections.', { id: savingToastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>;
  if (!claim) return <div className="text-center p-10 text-red-500">Could not find claim data.</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <Link to="/history" className="text-indigo-400 hover:underline mb-4 inline-flex items-center gap-2"><ArrowLeft size={16} /> Back to History</Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* --- PDF Viewer Column --- */}
        <div className="bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-lg overflow-y-auto h-[75vh]">
          <Document file={claim.secureUrl} onLoadSuccess={onDocumentLoadSuccess} className="flex justify-center p-4">
            {Array.from(new Array(numPages), (el, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} />
            ))}
          </Document>
        </div>

        {/* --- Edit Form Column --- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Edit Claim</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-mono break-all">{claim.filename}</p>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="name">Claimant Name</Label>
              <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1" placeholder="None" />
            </div>
            <div>
              <Label htmlFor="date">Claim Date</Label>
              <Input id="date" name="date" type="date" value={formatDateForInput(formData.date)} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="amount">Claim Amount</Label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-slate-400 sm:text-sm">{getCurrencySymbol(formData.currency)}</span>
                </div>
                <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount || ''} onChange={handleChange} className="pl-7" placeholder="None" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSaving || !isDirty}>
                {isSaving ? 'Saving...' : 'Save Corrections'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}