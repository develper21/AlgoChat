import { useState, useEffect, useRef } from "react";
import { Phone, ChevronDown } from "lucide-react";

const countries = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+1", name: "USA", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "+880", name: "Bangladesh", flag: "🇧🇩" },
];

const MobileNumberInput = ({ value, onChange, error, disabled = false }) => {
  const [countryCode, setCountryCode] = useState("+91");
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize and sync with external value
  useEffect(() => {
    if (value) {
      // Extract country code and number
      const matched = countries.find((c) => value.startsWith(c.code));
      if (matched) {
        setCountryCode(matched.code);
        const number = value.replace(matched.code, "");
        setInputValue(number);
      } else {
        // If no match, assume default country code
        const number = value.replace(/^\+\d+/, "");
        setInputValue(number);
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    setInputValue(raw);
    const fullNumber = `${countryCode}${raw}`;
    onChange(fullNumber);
  };

  const handleCountrySelect = (country) => {
    setCountryCode(country.code);
    setIsOpen(false);
    const fullNumber = `${country.code}${inputValue}`;
    onChange(fullNumber);
    
    // Focus back to input after selection
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const selectedCountry = countries.find(c => c.code === countryCode) || countries[0];

  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text font-medium">Mobile Number</span>
      </label>
      
      <div className="flex gap-2 items-center">
        {/* Country Code Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className={`flex items-center gap-1 px-3 py-3 border rounded-lg bg-base-100 hover:bg-base-200 transition-colors ${
              error ? "border-error" : "border-base-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            onKeyDown={handleKeyDown}
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.code}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className="flex items-center gap-3 w-full px-3 py-2 hover:bg-base-200 transition-colors text-left"
                  onClick={() => handleCountrySelect(country)}
                >
                  <span className="text-lg">{country.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{country.name}</div>
                    <div className="text-sm text-base-content/60">{country.code}</div>
                  </div>
                  {country.code === countryCode && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-base-content/40" />
          </div>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="tel"
            className={`input input-bordered w-full pl-10 pr-3 ${
              error ? "input-error" : ""
            } ${disabled ? "opacity-50" : ""}`}
            placeholder="9876543210"
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
            maxLength={15}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}

      {/* Help Text */}
      <label className="label">
        <span className="label-text-alt text-base-content/60">
          Enter your mobile number to receive OTP
        </span>
      </label>
    </div>
  );
};

export default MobileNumberInput;
