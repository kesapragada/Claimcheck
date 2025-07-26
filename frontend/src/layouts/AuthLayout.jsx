//CLAIMCHECK/frontend/react/src/layouts/AuthLayout.jsx
import { Outlet } from 'react-router-dom';
import { LogoHero } from '../components/Logo';

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 text-white p-4">
      <div className="hidden md:flex flex-col items-center justify-center bg-slate-900 rounded-2xl">
        <LogoHero />
      </div>
      <div className="flex items-center justify-center w-full">
        <Outlet />
      </div>
    </div>
  );
}