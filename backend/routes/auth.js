import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail } from '../controllers/authController.js';
import { 
  validateRegister, 
  validateLogin, 
  validateForgotPassword, 
  validateResetPassword, 
  validateVerifyEmail, 
  validateResendVerification 
} from '../middleware/validation.js';
import { authLimiter, passwordResetLimiter, emailVerificationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateResetPassword, resetPassword);
router.post('/verify-email', emailVerificationLimiter, validateVerifyEmail, verifyEmail);
router.post('/resend-verification', emailVerificationLimiter, validateResendVerification, resendVerificationEmail);

export default router;
