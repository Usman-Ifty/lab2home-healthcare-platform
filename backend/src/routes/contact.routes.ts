import express from 'express';
import { submitContactForm, getAllMessages } from '../controllers/contact.controller';

const router = express.Router();

// Public route to submit form
router.post('/', submitContactForm);

// Admin route (can protect later)
router.get('/', getAllMessages);

export default router;
