import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// Generate 2FA secret
export const generateTwoFactorSecret = (email) => {
  return speakeasy.generateSecret({
    name: `AlgoChat (${email})`,
    issuer: 'AlgoChat',
    length: 32
  });
};

// Generate QR code for 2FA setup
export const generateQRCode = async (secret) => {
  try {
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: secret.name,
      issuer: secret.issuer
    });
    
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Verify 2FA token
export const verifyTwoFactorToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after current time
    time: Math.floor(Date.now() / 1000)
  });
};

// Generate backup codes
export const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(speakeasy.generateSecret({ length: 8 }).base32.substring(0, 8).toUpperCase());
  }
  return codes;
};

// Verify backup code
export const verifyBackupCode = (backupCodes, providedCode) => {
  return backupCodes.includes(providedCode);
};

// Remove used backup code
export const removeBackupCode = (backupCodes, usedCode) => {
  return backupCodes.filter(code => code !== usedCode);
};
