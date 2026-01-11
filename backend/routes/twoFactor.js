import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import User from '../models/User.js';
import { 
  generateTwoFactorSecret, 
  generateQRCode, 
  verifyTwoFactorToken, 
  generateBackupCodes,
  verifyBackupCode,
  removeBackupCode
} from '../utils/twoFactor.js';

const router = Router();

// Generate 2FA secret and QR code for setup
router.post('/setup', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    // Generate temporary secret
    const secret = generateTwoFactorSecret(user.email);
    
    // Store temporary secret (expires in 10 minutes)
    user.twoFactorTempSecret = secret.base32;
    user.twoFactorTempSecretExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Generate QR code
    const qrCode = await generateQRCode(secret);

    res.json({
      secret: secret.base32,
      qrCode,
      backupCodes: generateBackupCodes()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enable 2FA after verification
router.post('/enable', authMiddleware, async (req, res) => {
  try {
    const { token, backupCodes } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findById(req.user._id);
    
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    // Check if temporary secret is valid and not expired
    if (!user.twoFactorTempSecret || user.twoFactorTempSecretExpires < new Date()) {
      return res.status(400).json({ message: 'Setup session expired. Please start over.' });
    }

    // Verify the token
    const isValid = verifyTwoFactorToken(user.twoFactorTempSecret, token);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorBackupCodes = backupCodes || generateBackupCodes();
    user.twoFactorTempSecret = undefined;
    user.twoFactorTempSecretExpires = undefined;
    
    await user.save();

    res.json({ 
      success: true, 
      message: '2FA enabled successfully',
      backupCodes: user.twoFactorBackupCodes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Disable 2FA
router.post('/disable', authMiddleware, async (req, res) => {
  try {
    const { password, token } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required to disable 2FA' });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // If 2FA is enabled, verify token
    if (token) {
      const isValid = verifyTwoFactorToken(user.twoFactorSecret, token);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    user.twoFactorTempSecret = undefined;
    user.twoFactorTempSecretExpires = undefined;
    
    await user.save();

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify 2FA token (for login)
router.post('/verify', async (req, res) => {
  try {
    const { email, token, backupCode } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!token && !backupCode) {
      return res.status(400).json({ message: 'Token or backup code is required' });
    }

    const user = await User.findOne({ email });
    
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    let isValid = false;

    // Verify TOTP token
    if (token) {
      isValid = verifyTwoFactorToken(user.twoFactorSecret, token);
    }
    
    // Verify backup code
    else if (backupCode) {
      isValid = verifyBackupCode(user.twoFactorBackupCodes, backupCode);
      
      if (isValid) {
        // Remove used backup code
        user.twoFactorBackupCodes = removeBackupCode(user.twoFactorBackupCodes, backupCode);
        await user.save();
      }
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    res.json({ success: true, message: '2FA verification successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get 2FA status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      enabled: user.twoFactorEnabled,
      hasBackupCodes: user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0,
      backupCodesCount: user.twoFactorBackupCodes ? user.twoFactorBackupCodes.length : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate new backup codes
router.post('/backup-codes', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate new backup codes
    const newBackupCodes = generateBackupCodes();
    user.twoFactorBackupCodes = newBackupCodes;
    await user.save();

    res.json({ 
      success: true, 
      message: 'New backup codes generated',
      backupCodes: newBackupCodes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
