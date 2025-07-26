//CLAIMCHECK/frontend/react/src/components/Logo.jsx

import { FileCheck2 } from 'lucide-react';

export const Logo = ({ className }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <FileCheck2 className="h-6 w-6 text-indigo-400" />
    <span className="text-xl font-bold text-slate-50">ClaimCheck</span>
  </div>
);

export const LogoHero = () => (
  <div className="flex flex-col items-center justify-center text-center p-8">
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl mb-4 shadow-lg">
      <FileCheck2 size={60} className="text-white" />
    </div>
    <h1 className="text-5xl font-bold tracking-tight text-white">ClaimCheck</h1>
    <p className="text-slate-300 mt-2 max-w-sm">
      Intelligent document processing, simplified.
    </p>
  </div>
);