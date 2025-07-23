// CLAIMCHECK/backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const { MulterError } = require('multer'); // Import MulterError for specific error handling

// --- Local Imports ---
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const claimRoutes =require('./routes/claimRoutes');

// --- Initial Configuration ---
dotenv.config();
connectDB();

const app = express();

// --- Core Middleware ---
// This allows the server to accept and parse JSON in request bodies.
app.use(express.json());

// --- API Routes ---
app.use('/api/users', authRoutes);
app.use('/api/claims', claimRoutes);

// --- Custom Global Error Handling Middleware ---
// This is a catch-all for errors, making the server more robust.
// It's especially useful for handling errors from middleware like Multer.
app.use((err, req, res, next) => {
  // Check if the error is a known Multer error
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ msg: 'File is too large. Maximum size is 5MB.' });
    }
    // Note: The custom fileFilter error is not a MulterError instance
  }
  
  // Handle the custom error from our fileFilter
  if (err.message === 'Invalid file type. Only PDFs are allowed.') {
    return res.status(400).json({ msg: err.message });
  }

  // For any other unexpected errors, log them and send a generic server error response.
  console.error(err.stack);
  res.status(500).json({ msg: 'An unexpected server error occurred.' });
});


// --- Server Activation ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));