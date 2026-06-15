import express from 'express';
import {
  generateInterpretation,
  getInterpretation,
} from '../controllers/aiInterpretation.controller';
import { protect, authorizeUserType } from '../middleware/auth.middleware';

const router = express.Router();

// POST /api/reports/:bookingId/interpret — Generate AI interpretation
router.post(
  '/:bookingId/interpret',
  protect,
  authorizeUserType('patient'),
  generateInterpretation
);

// GET /api/reports/:bookingId/interpret — Get saved interpretation
router.get(
  '/:bookingId/interpret',
  protect,
  authorizeUserType('patient'),
  getInterpretation
);

export default router;
