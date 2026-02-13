import { Router } from 'express';
import {
  patientSignup,
  labSignup,
  phlebotomistSignup,
  verifyOTP,
  resendOTP,
  patientLogin,
  labLogin,
  unifiedLogin,
  getMe,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  requestPasswordChangeOTP,
  verifyPasswordChangeOTP,
  changePassword,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Signup routes
router.post('/signup/patient', patientSignup);
router.post('/signup/lab', upload.single('licenseCopy'), labSignup);
router.post('/signup/phlebotomist', upload.single('trafficLicenseCopy'), phlebotomistSignup);

// OTP verification
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Login routes
router.post('/login', unifiedLogin); // NEW: Auto-detects patient or lab
router.post('/login/patient', patientLogin); // Legacy support
router.post('/login/lab', labLogin); // Legacy support

// Forgot password routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// Password change routes (for logged-in users)
router.post('/request-password-change-otp', requestPasswordChangeOTP);
router.post('/verify-password-change-otp', verifyPasswordChangeOTP);
router.post('/change-password', changePassword);

// Get current user (protected route)
router.get('/me', authenticateToken, getMe);

export default router;

