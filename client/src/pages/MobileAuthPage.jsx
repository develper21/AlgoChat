import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { MessageSquare, User, ArrowLeft, Loader2 } from "lucide-react";
import MobileNumberInput from "../components/MobileNumberInput";
import OTPVerification from "../components/OTPVerification";
import AuthImagePattern from "../components/AuthImagePattern";

const MobileAuthPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("mobile"); // mobile, otp, fullname
  const [mobileNumber, setMobileNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  
  const {
    authUser,
    sendOTP,
    verifyOTP,
    updateFullName,
    resetMobileAuth,
    isSendingOTP,
    isVerifyingOTP,
    isUpdatingFullName,
    tempMobileNumber,
  } = useAuthStore();

  useEffect(() => {
    if (authUser && (!authUser.fullName || !authUser.fullName.trim())) {
      setStep("fullname");
      if (authUser.mobileNumber) {
        setMobileNumber(authUser.mobileNumber);
      }
    }
  }, [authUser]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!mobileNumber || mobileNumber.length < 12) {
      setError("Please enter a valid mobile number");
      return;
    }

    const result = await sendOTP(mobileNumber);
    if (result.success) {
      setStep("otp");
    }
  };

  const handleVerifyOTP = async (otp) => {
    setError("");
    
    const result = await verifyOTP(otp, fullName);
    
    if (result.success) {
      if (result.requiresFullName) {
        setStep("fullname");
      } else {
        navigate("/");
      }
    } else {
      setError(result.error);
    }
  };

  const handleResendOTP = () => {
    setError("");
    sendOTP(mobileNumber);
  };

  const handleUpdateFullName = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!fullName || fullName.trim().length < 2) {
      setError("Please enter your full name");
      return;
    }

    const result = await updateFullName(fullName.trim());
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
    }
  };

  const handleBack = () => {
    setError("");
    if (step === "otp") {
      setStep("mobile");
      resetMobileAuth();
    } else if (step === "fullname") {
      setStep("otp");
    }
  };

  const renderMobileStep = () => (
    <div className="w-full max-w-md space-y-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex flex-col items-center gap-2 group">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mt-2">Welcome</h1>
          <p className="text-base-content/60">Enter your mobile number to continue</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSendOTP} className="space-y-6">
        <MobileNumberInput
          value={mobileNumber}
          onChange={setMobileNumber}
          error={error}
          disabled={isSendingOTP}
        />

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isSendingOTP || !mobileNumber || mobileNumber.length < 12}
        >
          {isSendingOTP ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending OTP...
            </>
          ) : (
            "Send OTP"
          )}
        </button>
      </form>

      {/* Instructions */}
      <div className="text-center text-xs text-base-content/50 space-y-1">
        <p>• Enter your mobile number with country code</p>
        <p>• You&apos;ll receive a 6-digit verification code</p>
        <p>• OTP is valid for 5 minutes</p>
      </div>
    </div>
  );

  const renderOTPStep = () => (
    <div className="w-full max-w-md">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="btn btn-ghost btn-sm mb-4"
        disabled={isVerifyingOTP}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <OTPVerification
        mobileNumber={tempMobileNumber || mobileNumber}
        onVerify={handleVerifyOTP}
        onResendOTP={handleResendOTP}
        isVerifying={isVerifyingOTP}
        isResending={isSendingOTP}
        error={error}
      />
    </div>
  );

  const renderFullNameStep = () => (
    <div className="w-full max-w-md space-y-8">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="btn btn-ghost btn-sm mb-4"
        disabled={isUpdatingFullName}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Complete Your Profile</h2>
        <p className="text-base-content/60">
          Enter your full name to finish setting up your account
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleUpdateFullName} className="space-y-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Full Name</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-base-content/40" />
            </div>
            <input
              type="text"
              className={`input input-bordered w-full pl-10 ${error ? 'input-error' : ''}`}
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isUpdatingFullName}
              autoFocus
            />
          </div>
          {error && (
            <label className="label">
              <span className="label-text-alt text-error">{error}</span>
            </label>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isUpdatingFullName || !fullName || fullName.trim().length < 2}
        >
          {isUpdatingFullName ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            "Complete Setup"
          )}
        </button>
      </form>
    </div>
  );

  return (
    <div className="h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        {step === "mobile" && renderMobileStep()}
        {step === "otp" && renderOTPStep()}
        {step === "fullname" && renderFullNameStep()}
      </div>

      {/* Right Side - Image/Pattern */}
      <AuthImagePattern
        title={
          step === "mobile"
            ? "Connect Instantly"
            : step === "otp"
            ? "Secure Verification"
            : "Welcome Aboard"
        }
        subtitle={
          step === "mobile"
            ? "Enter your mobile number to start chatting with friends and family."
            : step === "otp"
            ? "Verify your mobile number to secure your account and continue."
            : "Your account is ready! Complete your profile to get started."
        }
      />
    </div>
  );
};

export default MobileAuthPage;
