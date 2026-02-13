import { Router } from 'express';
import {
    getTrafficLicense,
    getDashboard,
    getAssignedBookings,
    getTodaysBookings,
    updateBookingStatus,
    updateAvailability,
    getPerformanceMetrics
} from '../controllers/phlebotomist.controller';
import { authenticateToken, authorizeUserType } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and phlebotomist role
router.use(authenticateToken);
router.use(authorizeUserType('phlebotomist'));

// Dashboard
router.get('/dashboard', getDashboard);

// Traffic license
router.get('/traffic-license', getTrafficLicense);

// Booking management
router.get('/bookings', getAssignedBookings);
router.get('/bookings/today', getTodaysBookings);
router.put('/bookings/:id/status', updateBookingStatus);

// Availability management
router.put('/availability', updateAvailability);

// Performance metrics
router.get('/metrics', getPerformanceMetrics);

export default router;
