import bcrypt from "bcryptjs";
import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = (Number(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000;
const MAX_ATTEMPTS = 3;
const RESEND_COOLDOWN_MS = 60 * 1000;

class OTPService {
  generate() {
    return crypto.randomInt(100000, 999999).toString();
  }

  getExpiryDate() {
    return new Date(Date.now() + OTP_EXPIRY_MS);
  }

  async hash(otp) {
    return bcrypt.hash(otp, 10);
  }

  async verify(plainOtp, hashedOtp) {
    if (!plainOtp || !hashedOtp) return false;
    return bcrypt.compare(plainOtp, hashedOtp);
  }

  isExpired(expiresAt) {
    return !expiresAt || new Date() > new Date(expiresAt);
  }

  canResend(sentAt) {
    if (!sentAt) return true;
    return Date.now() - new Date(sentAt).getTime() >= RESEND_COOLDOWN_MS;
  }

  resendCooldownSeconds(sentAt) {
    if (!sentAt) return 0;
    const remaining = RESEND_COOLDOWN_MS - (Date.now() - new Date(sentAt).getTime());
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  get maxAttempts() {
    return MAX_ATTEMPTS;
  }

  validateMobileNumber(mobileNumber) {
    return /^\+[1-9]\d{1,14}$/.test(mobileNumber);
  }

  formatMobileNumber(mobileNumber) {
    let cleaned = String(mobileNumber).replace(/[\s\-()]/g, "");
    if (!cleaned.startsWith("+")) {
      cleaned = `+${cleaned}`;
    }
    return cleaned;
  }

  /** For Indian SMS APIs: 10-digit number without country code */
  toIndianLocal(mobileNumber) {
    const formatted = this.formatMobileNumber(mobileNumber);
    if (formatted.startsWith("+91") && formatted.length === 13) {
      return formatted.slice(3);
    }
    return formatted.replace(/^\+/, "");
  }

  /** MSG91 / similar: 91XXXXXXXXXX */
  toMsg91Mobile(mobileNumber) {
    const formatted = this.formatMobileNumber(mobileNumber);
    return formatted.replace(/^\+/, "");
  }

  maskPhone(phone) {
    if (!phone || phone.length < 6) return "****";
    return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
  }
}

export default new OTPService();
