import express from 'express';
import { apiRateLimiter } from '../utils/rateLimiter';
import authRoutes from './auth.routes';
// Placeholder for other routes - uncomment and import as needed
// import credRoutes from './cred.routes';
// import triggersRoutes from './triggers.routes';
// import workflowRoutes from './workflow.routes';
// import webhookRoutes from './webhook.routes';
// import metricsRoutes from './metrics.routes';

const router = express.Router();

// Apply the general API rate limiter to all routes handled by this router
router.use(apiRateLimiter);

// Mount specific routers
router.use('/auth', authRoutes);
// router.use('/cred', credRoutes);
// router.use('/triggers', triggersRoutes);
// router.use('/workflow', workflowRoutes);
// router.use('/webhook', webhookRoutes);
// router.use('/metrics', metricsRoutes);

export default router;