import { Router } from 'express';
import v1Routes from './v1';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API Routes are working',
    timestamp: new Date().toISOString(),
  });
});

// API v1 routes (all endpoints are now versioned)
router.use('/v1', v1Routes);

export default router;
