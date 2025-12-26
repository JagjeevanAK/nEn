import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import apiRouter from './routes/index'; // Import the main API router

dotenv.config({
  path: './.env'
});

const app = express();

// Standard middleware setup
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Adjust based on frontend URL
    credentials: true
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public')); // Serve static files
app.use(cookieParser());

// Mount the API router at the /api path
app.use('/api', apiRouter);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('nEn Backend is running!');
});

// Error handling middleware (example, assuming it exists elsewhere)
// app.use(errorMiddleware);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;