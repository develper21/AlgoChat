import { useState, useRef, useEffect } from "react";
import { Shield, RefreshCw, Timer } from "lucide-react";

const OTPVerification = ({ 
  mobileNumber, 
  onVerify, 
  onResendOTP, 
  isVerifying = false, 
  isResending = false,
  error = null 
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const digits = pastedData.replace(/\D/g, "");
    
    if (digits.length === 6) {
      const newOtp = digits.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length === 6) {
      onVerify(otpString);
    }
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setTimer(30);
    setCanResend(false);
    onResendOTP();
    inputRefs.current[0]?.focus();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Verify OTP</h2>
        <p className="text-base-content/60">
          Enter the 6-digit code sent to
        </p>
        <p className="font-semibold text-primary">{mobileNumber}</p>
      </div>

      {/* OTP Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* OTP Input Fields */}
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength={1}
              className={`input input-bordered w-12 h-14 text-center text-lg font-bold ${
                error ? "input-error" : ""
              } ${digit ? "input-primary" : ""}`}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error text-sm">
            <span>{error}</span>
          </div>
        )}

        {/* Verify Button */}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={otp.join("").length !== 6 || isVerifying}
        >
          {isVerifying ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Verifying...
            </>
          ) : (
            "Verify OTP"
          )}
        </button>

        {/* Resend OTP */}
        <div className="text-center space-y-2">
          {canResend ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm text-primary"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend OTP
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-base-content/60">
              <Timer className="w-4 h-4" />
              <span>Resend OTP in {formatTime(timer)}</span>
            </div>
          )}
        </div>
      </form>

      {/* Instructions */}
      <div className="text-center text-xs text-base-content/50">
        <p>• OTP is valid for 5 minutes</p>
        <p>• Maximum 3 attempts allowed</p>
        <p>• Check your SMS for the verification code</p>
      </div>
    </div>
  );
};

export default OTPVerification;
