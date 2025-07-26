//CLAIMCHECK/frontend/react/src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import API from '../services/api'; // Import your API helper

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // Add loading state

  const fetchUser = useCallback(async () => {
    if (token) {
      try {
        // Securely fetch user data from the backend
        const res = await API.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user, logging out.", err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // No need to call fetchUser here, the useEffect will trigger it.
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Don't render children until we've checked for a user
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);