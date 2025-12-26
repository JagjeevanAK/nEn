import express from 'express';
import { authRateLimiter } from '../utils/rateLimiter';
// Assuming controllers for auth exist, e.g.,
// import { registerUser, loginUser, logoutUser, refreshAccessToken } from '../controllers/auth.controller';

const router = express.Router();

// Apply a stricter rate limiter to login and register routes to prevent brute-force attacks
router.post('/register', authRateLimiter, (req, res) => {
    // Placeholder for registerUser logic
    res.status(200).json({ message: 'Register endpoint hit' });
});
router.post('/login', authRateLimiter, (req, res) => {
    // Placeholder for loginUser logic
    res.status(200).json({ message: 'Login endpoint hit' });
});

// Other auth routes that might not need the strict rate limit, or implicitly use the general API rate limiter from index.ts
// router.post('/logout', logoutUser);
// router.post('/refresh-token', refreshAccessToken);

export default router;