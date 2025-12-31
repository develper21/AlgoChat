import { Router } from 'express';
import { subscribe } from '../controllers/pushController.js';

const router = Router();

router.post('/subscribe', subscribe);

export default router;
