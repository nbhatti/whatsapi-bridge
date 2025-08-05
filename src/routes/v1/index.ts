import { Router } from 'express';
import deviceRoutes from '../devices';
import aiRoutes from '../ai';
import exampleRoutes from '../examples';
import validationExampleRoutes from '../validation-examples';

const router = Router();

// Health check route for v1 API
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    version: 'v1',
    message: 'API v1 is working',
    timestamp: new Date().toISOString(),
  });
});

// Device management routes
router.use('/devices', deviceRoutes);

// AI routes
router.use('/ai', aiRoutes);

// Example routes demonstrating middleware usage
router.use('/examples', exampleRoutes);

// Validation example routes
router.use('/validation-examples', validationExampleRoutes);

export default router;
