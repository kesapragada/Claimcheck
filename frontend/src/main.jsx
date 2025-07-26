//CLAIMCHECK/frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx' // <-- IMPORT THIS

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <SocketProvider>
      <ThemeProvider> {/* <-- WRAP HERE */}
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'text-sm',
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155'
            },
          }}
        />
      </ThemeProvider>
    </SocketProvider>
  </AuthProvider>
);