import otpService from "./otp.service.js";

/**
 * Custom SMS delivery — no Twilio.
 * Providers: console (dev), fast2sms (India), msg91 (India)
 */
class SMSService {
  constructor() {
    this.fast2smsKey = process.env.FAST2SMS_API_KEY?.trim();
    this.msg91AuthKey = process.env.MSG91_AUTH_KEY?.trim();
    this.msg91TemplateId = process.env.MSG91_TEMPLATE_ID?.trim();

    const configured = process.env.SMS_PROVIDER?.trim().toLowerCase();
    if (configured) {
      this.provider = configured;
    } else if (this.fast2smsKey) {
      this.provider = "fast2sms";
    } else if (this.msg91AuthKey && this.msg91TemplateId) {
      this.provider = "msg91";
    } else {
      this.provider = "console";
    }
  }

  getConfigSummary() {
    const summaries = {
      console: "Console only (OTP printed in server logs — set FAST2SMS_API_KEY for real SMS)",
      fast2sms: this.fast2smsKey
        ? "Fast2SMS (India) — real OTP on phone"
        : "Fast2SMS selected but FAST2SMS_API_KEY is missing",
      msg91: this.msg91AuthKey && this.msg91TemplateId
        ? "MSG91 (India) — real OTP on phone"
        : "MSG91 selected but MSG91_AUTH_KEY or MSG91_TEMPLATE_ID is missing",
    };
    return `OTP SMS [${this.provider}]: ${summaries[this.provider] || "Unknown provider"}`;
  }

  formatMobileNumber(mobileNumber) {
    return otpService.formatMobileNumber(mobileNumber);
  }

  validateMobileNumber(mobileNumber) {
    return otpService.validateMobileNumber(mobileNumber);
  }

  async sendOTP(mobileNumber, otp) {
    const to = otpService.formatMobileNumber(mobileNumber);

    if (!otpService.validateMobileNumber(to)) {
      return { success: false, message: "Invalid mobile number format" };
    }

    try {
      switch (this.provider) {
        case "fast2sms":
          return await this.sendViaFast2SMS(to, otp);
        case "msg91":
          return await this.sendViaMSG91(to, otp);
        case "console":
        default:
          return this.sendViaConsole(to, otp);
      }
    } catch (error) {
      console.error(`SMS [${this.provider}] failed:`, error.message);
      return {
        success: false,
        message: error.message || "Failed to send OTP. Try again later.",
      };
    }
  }

  sendViaConsole(to, otp) {
    console.log(`\n🔐 AlgoChat OTP`);
    console.log(`   Phone: ${to}`);
    console.log(`   Code:  ${otp}`);
    console.log(`   Valid: ${process.env.OTP_EXPIRY_MINUTES || 5} minutes\n`);

    return {
      success: true,
      message: "OTP sent (check server terminal in development)",
      devFallback: true,
    };
  }

  async sendViaFast2SMS(to, otp) {
    if (!this.fast2smsKey) {
      throw new Error("FAST2SMS_API_KEY is not set in .env");
    }

    const numbers = otpService.toIndianLocal(to);
    if (numbers.length !== 10) {
      throw new Error("Fast2SMS supports Indian 10-digit mobile numbers (+91)");
    }

    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: this.fast2smsKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: otp,
        numbers,
      }),
    });

    const data = await response.json();

    if (!data?.return) {
      const errMsg = Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message || "Fast2SMS request failed";
      throw new Error(errMsg);
    }

    console.log(`✅ Fast2SMS OTP sent to ${otpService.maskPhone(to)}`);
    return { success: true, message: "OTP sent to your phone" };
  }

  async sendViaMSG91(to, otp) {
    if (!this.msg91AuthKey || !this.msg91TemplateId) {
      throw new Error("MSG91_AUTH_KEY and MSG91_TEMPLATE_ID are required in .env");
    }

    const mobile = otpService.toMsg91Mobile(to);
    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("otp_expiry", String(process.env.OTP_EXPIRY_MINUTES || 5));
    url.searchParams.set("template_id", this.msg91TemplateId);
    url.searchParams.set("mobile", mobile);
    url.searchParams.set("authkey", this.msg91AuthKey);
    url.searchParams.set("otp", otp);

    const response = await fetch(url.toString(), { method: "POST" });
    const data = await response.json();

    if (data.type === "error") {
      throw new Error(data.message || "MSG91 request failed");
    }

    console.log(`✅ MSG91 OTP sent to ${otpService.maskPhone(to)}`);
    return { success: true, message: "OTP sent to your phone" };
  }
}

export default new SMSService();
