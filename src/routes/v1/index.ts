import { Router } from 'express';
import deviceRoutes from '../devices';
import aiRoutes from '../ai';
import queueRoutes from '../queue';

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

// Queue management and health monitoring routes
router.use('/', queueRoutes);


export default router;
