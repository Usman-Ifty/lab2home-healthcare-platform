import express from 'express';
import {
    createBooking,
    getPatientBookings,
    getLabBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
    uploadReport,
    getReport,
    handleBookingITN,
} from '../controllers/booking.controller';
import { protect } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

// All booking routes require authentication
router.post('/', protect, createBooking);
router.get('/patient/:patientId', protect, getPatientBookings);
router.get('/lab/:labId', protect, getLabBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/status', protect, updateBookingStatus);
router.delete('/:id', protect, cancelBooking);
router.post('/:id/upload-report', protect, upload.single('report'), uploadReport);
router.get('/:id/report', getReport); // Public route for viewing reports
router.post('/itn', handleBookingITN);

export default router;
