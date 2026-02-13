import express from 'express';
import {
    getAllTests,
    getTestById,
    createTest,
    updateTest,
    deleteTest,
    getTestCategories,
} from '../controllers/test.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.get('/', getAllTests);
router.get('/categories', getTestCategories);
router.get('/:id', getTestById);

// Protected routes (Admin only - will need to add admin middleware)
router.post('/', protect, createTest);
router.put('/:id', protect, updateTest);
router.delete('/:id', protect, deleteTest);

export default router;
