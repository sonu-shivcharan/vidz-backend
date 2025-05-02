import { Router } from 'express';
import { healthcheck } from '../controllers/healthcheck.controller.js';

const router = Router();
// Healthcheck route
router.get('/', healthcheck);

export default router;