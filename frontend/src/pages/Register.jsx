// CLAIMCHECK/frontend/src/pages/Register.jsx

import { useState } from 'react';
import { register } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  // 1. ADD STATE FOR THE 'name' FIELD
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!name || !email || !password) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    try {
      // 2. PASS THE 'name' TO THE SERVICE
      const userData = { name, email, password };
      await register(userData);

      // 3. ON SUCCESS, AUTOMATICALLY LOG THE USER IN BY NAVIGATING TO THE DASHBOARD
      // The `register` service will handle setting the token in localStorage.
      navigate('/');

    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96 space-y-4">
        <h2 className="text-2xl font-bold text-center text-gray-800">Create Your Account</h2>
        
        {/* 4. ADD THE INPUT FIELD FOR 'name' */}
        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email Address"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={e => setPassword(e.target.value)}
          minLength="6"
          required
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          className="w-full bg-green-500 text-white p-3 rounded-md font-semibold hover:bg-green-600 transition duration-200 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>

        <div className="text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Already have an account? Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}