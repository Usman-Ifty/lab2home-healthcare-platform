import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
    getAvailablePhlebotomists,
    sendRequest,
    getMyRequests,
    acceptRequest,
    rejectRequest,
    getRequestHistory,
} from '../controllers/phlebotomistRequest.controller';

const router = express.Router();

// Lab routes
router.get('/available-phlebotomists/:bookingId', authenticateToken, getAvailablePhlebotomists);
router.post('/send', authenticateToken, sendRequest);
router.get('/booking/:bookingId/history', authenticateToken, getRequestHistory);

// Phlebotomist routes
router.get('/my-requests', authenticateToken, getMyRequests);
router.put('/:requestId/accept', authenticateToken, acceptRequest);
router.put('/:requestId/reject', authenticateToken, rejectRequest);

export default router;
