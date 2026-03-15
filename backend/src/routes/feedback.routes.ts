import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import {
    submitFeedback,
    getFeedbackForTarget,
    getRatingStats,
    getMyReviews,
    updateFeedback,
    deleteFeedback,
    checkExistingFeedback,
    getAllProductReviews,
} from '../controllers/feedback.controller';

const router = Router();

// ============================================
// PROTECTED ROUTES (Patient only)
// ============================================

// Submit new feedback
router.post('/', protect, restrictTo('patient'), submitFeedback);

// Get patient's own reviews
router.get('/my-reviews', protect, restrictTo('patient'), getMyReviews);

// Check if patient has already reviewed a target
router.get('/check/:targetType/:targetId', protect, restrictTo('patient'), checkExistingFeedback);

// Update own feedback
router.put('/:id', protect, restrictTo('patient'), updateFeedback);

// Delete own feedback
router.delete('/:id', protect, restrictTo('patient'), deleteFeedback);

// ============================================
// ADMIN ROUTES
// ============================================
// Get all product reviews for admin dashboard
router.get('/admin/products', protect, restrictTo('admin'), getAllProductReviews);

// ============================================
// PUBLIC ROUTES (must come after specific routes)
// ============================================

// Get rating stats (average, distribution) for a target
router.get('/stats/:targetType/:targetId', getRatingStats);

// Get all feedback for a specific target (lab, phlebotomist, or product)
router.get('/:targetType/:targetId', getFeedbackForTarget);

export default router;
