import { rateLimit } from 'express-rate-limit';

// General API rate limiter for most routes
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for authentication routes (e.g., login, register)
export const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth routes
  message: 'Too many authentication attempts from this IP, please try again after 5 minutes',
  standardHeaders: true,
  legacyHeaders: false
});