//CLAIMCHECK/frontend/react/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  // 'socket' state is for PROVIDING the socket instance to the rest of the app.
  const [socket, setSocket] = useState(null);
  
  // 'socketRef' is for MANAGING the actual, single socket connection instance.
  // This is the key to preventing reconnections on every re-render.
  const socketRef = useRef(null);
  
  const { user } = useAuth();
  const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // This effect runs only when the user logs in or logs out.
    if (user && !socketRef.current) {
      // 1. CREATE THE CONNECTION if a user exists and a connection doesn't.
      const newSocket = io(VITE_API_URL, {
        transports: ['websocket'], // Force a clean transport
        reconnection: true,
        reconnectionAttempts: 5,
      });

      socketRef.current = newSocket; // Store the instance in the stable ref.
      setSocket(newSocket);          // Put the instance in state for consumers.

      newSocket.on('connect', () => {
        console.log('Socket Connection Established:', newSocket.id);
        // Use user._id as it's the actual ID from MongoDB.
        newSocket.emit('registerUserSocket', user._id); 
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket Disconnected:', reason);
      });
    } else if (!user && socketRef.current) {
      // 2. DESTROY THE CONNECTION if the user logs out.
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
    
    // The cleanup function for when the entire app unmounts.
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  // This dependency array is the crucial part. It ONLY depends on the user object.
  // It does not depend on the socket state, which breaks the re-render loop.
  }, [user, VITE_API_URL]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);