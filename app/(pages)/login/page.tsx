"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import ShowTerms from "@/components/showTerms";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper function to handle API errors
const handleApiError = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: string }).message);
  }
  return defaultMessage;
};

// Loading spinner component
const LoadingSpinner = () => (
  <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
);

// Initial sign in button for unauthenticated users
const InitialSignInButton = ({ 
  agreedToTerms, 
  handleGetOtpAndValidate, 
  otpLoading 
}: {
  agreedToTerms: boolean;
  handleGetOtpAndValidate: () => void;
  otpLoading: boolean;
}) => {
  if (!agreedToTerms) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block">
              <button
                type="button"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#007399] hover:bg-[#0082a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={true}
                aria-disabled="true"
              >
                Sign in
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Please agree to Terms & Conditions first.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <button
      type="button"
      onClick={handleGetOtpAndValidate}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
      disabled={otpLoading}
    >
      {otpLoading ? "Checking..." : "Sign in"}
    </button>
  );
};

// TOTP verification buttons
const TotpButtons = ({ 
  showBackupCodeInput, 
  handleVerifyBackupCode, 
  handleVerifyTotp, 
  loading, 
  backupCode, 
  totpCode 
}: {
  showBackupCodeInput: boolean;
  handleVerifyBackupCode: () => void;
  handleVerifyTotp: () => void;
  loading: boolean;
  backupCode: string;
  totpCode: string;
}) => {
  if (showBackupCodeInput) {
    return (
      <button
        type="button"
        onClick={handleVerifyBackupCode}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={loading || !backupCode.trim() || backupCode.trim().length !== 9}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSpinner />
            Verifying...
          </span>
        ) : (
          "Verify Backup Code"
        )}
      </button>
    );
  }
  
  return (
    <button
      type="button"
      onClick={handleVerifyTotp}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
      disabled={loading || totpCode.length !== 6}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <LoadingSpinner />
          Verifying...
        </span>
      ) : (
        "Verify Authenticator Code"
      )}
    </button>
  );
};

// Sign in button component to reduce complexity
const SignInButton = ({ 
  agreedToTerms, 
  credentialsValidated, 
  totpRequired, 
  showBackupCodeInput, 
  otpVerified, 
  handleGetOtpAndValidate, 
  handleVerifyBackupCode, 
  handleVerifyTotp, 
  handleVerifyOtp,
  otpLoading, 
  loading, 
  backupCode, 
  totpCode, 
  otp 
}: {
  agreedToTerms: boolean;
  credentialsValidated: boolean;
  totpRequired: boolean;
  showBackupCodeInput: boolean;
  otpVerified: boolean;
  handleGetOtpAndValidate: () => void;
  handleVerifyBackupCode: () => void;
  handleVerifyTotp: () => void;
  handleVerifyOtp: () => void;
  otpLoading: boolean;
  loading: boolean;
  backupCode: string;
  totpCode: string;
  otp: string;
}) => {
  if (!credentialsValidated) {
    return (
      <InitialSignInButton
        agreedToTerms={agreedToTerms}
        handleGetOtpAndValidate={handleGetOtpAndValidate}
        otpLoading={otpLoading}
      />
    );
  }

  if (totpRequired) {
    return (
      <TotpButtons
        showBackupCodeInput={showBackupCodeInput}
        handleVerifyBackupCode={handleVerifyBackupCode}
        handleVerifyTotp={handleVerifyTotp}
        loading={loading}
        backupCode={backupCode}
        totpCode={totpCode}
      />
    );
  }

  if (!otpVerified) {
    return (
      <button
        type="button"
        onClick={handleVerifyOtp}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#007399] hover:bg-[#0082a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={loading || otp.length !== 6}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSpinner />
            Verifying...
          </span>
        ) : (
          "Verify Email Code"
        )}
      </button>
    );
  }

  return null;
};

// Google sign in button component
const GoogleSignInButton = ({ 
  agreedToTerms, 
  googleLoading, 
  setGoogleLoading, 
  signIn 
}: {
  agreedToTerms: boolean;
  googleLoading: boolean;
  setGoogleLoading: (loading: boolean) => void;
  signIn: (provider: string) => void;
}) => {
  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    signIn("google");
  };

  if (!agreedToTerms) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block">
              <button
                type="button"
                disabled={true}
                aria-disabled="true"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <img
                  src="/google.svg"
                  alt="Google"
                  className="w-5 h-5 mr-2"
                />
                <span>Sign in with Google</span>
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Please agree to Terms & Conditions first.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={googleLoading}
      className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <img
        src="/google.svg"
        alt="Google"
        className="w-5 h-5 mr-2"
      />
      <span>Sign in with Google</span>
    </button>
  );
};

function LoginForm() {
  const [showTerms, setShowTerms] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendingOtp, setResendingOtp] = useState(false);
  const [credentialsValidated, setCredentialsValidated] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [totpRequired, setTotpRequired] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [showBackupCodeInput, setShowBackupCodeInput] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  // Helper function to validate user input
  const validateInput = (): boolean => {
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms & Conditions to continue.");
      return false;
    }

    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return false;
    }

    return true;
  };

  // Helper function to validate credentials
  const validateCredentials = async (): Promise<boolean> => {
    const validateResponse = await fetch("/api/auth/validate-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const validateData = await validateResponse.json();

    if (!validateResponse.ok) {
      const msg = validateData.error?.includes("inactive")
        ? `Your account is inactive. To activate it, contact us at info@accufin@gmail.com.`
        : validateData.error;
      toast.error(msg);
      return false;
    }

    toast.success("Credentials validated!");
    return true;
  };

  // Helper function to handle MFA flow
  const handleMfaFlow = async (): Promise<void> => {
    const mfaResponse = await fetch("/api/user/mfa-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (mfaResponse.ok) {
      const mfaData = await mfaResponse.json();
      
      // If TOTP enabled: require TOTP only (no email OTP)
      if (mfaData.mfaEnabled && mfaData.totpEnabled) {
        setTotpRequired(true);
        setCredentialsValidated(true);
        setShowOtpInput(false);
        toast.success("Authenticator required. Enter your TOTP code.");
        return;
      }

      // If Email MFA enabled: send email OTP now
      if (mfaData.mfaEnabled && mfaData.emailMfaEnabled) {
        await sendEmailOtp();
        return;
      }

      // If no MFA enabled: sign in directly
      if (!mfaData.mfaEnabled) {
        await signInDirectly();
        return;
      }
    }
    
    // Fallback: if MFA status couldn't be determined, send OTP
    await sendEmailOtp();
  };

  // Helper function to send email OTP
  const sendEmailOtp = async (): Promise<void> => {
    const otpResponse = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        purpose: "login",
      }),
    });

    if (!otpResponse.ok) {
      const otpData = await otpResponse.json();
      toast.error(otpData.error || "Failed to send OTP");
      return;
    }

    toast.success("OTP sent to your email!");
    setCredentialsValidated(true);
    setShowOtpInput(true);
  };

  // Helper function to sign in directly
  const signInDirectly = async (): Promise<void> => {
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      toast.error(res.error);
    } else {
      setShowWelcome(true);
      toast.success("Login successful!");
      router.push("/dashboard");
    }
  };

  const handleGetOtpAndValidate = async () => {
    if (!validateInput()) {
      return;
    }

    setOtpLoading(true);
    try {
      const isValid = await validateCredentials();
      if (isValid) {
        await handleMfaFlow();
      }
    } catch (err) {
      const errorMessage = handleApiError(err, "Something went wrong during authentication.");
      toast.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };



  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP
      const verifyResponse = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          purpose: "login",
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        toast.error(verifyData.error || "Invalid OTP");
        // Only clear OTP and error states, keep OTP input open for retry
        setOtp("");
        setOtpVerified(false);
        setTotpCode("");
        setShowBackupCodeInput(false);
        setBackupCode("");
        return;
      }

      toast.success("Email OTP verified!");
      setOtpVerified(true);

      // If TOTP not required (preferred method is email), proceed with login
      if (!totpRequired) {
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
          otpVerified: "true",
        });

        if (res?.error) {
          toast.error(res.error);
        } else {
          setShowWelcome(true);
          toast.success("Login successful!");
          router.push("/dashboard");
        }
      }
    } catch (err) {
      const errorMessage = handleApiError(err, "Something went wrong during OTP verification.");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          purpose: "login",
        }),
      });

      if (response.ok) {
        toast.success("New verification code sent!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to resend code");
      }
    } catch (err) {
      const errorMessage = handleApiError(err, "Failed to resend verification code");
      toast.error(errorMessage);
    } finally {
      setResendingOtp(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit TOTP code.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        mfaMethod: "authenticator",
        otp: totpCode,
      });

      if (res?.error) {
        toast.error(res.error);
        // Reset on error
        setTotpCode("");
      } else {
        setShowWelcome(true);
        toast.success("Login successful!");
        router.push("/dashboard");
      }
    } catch (err) {
      const errorMessage = handleApiError(err, "Something went wrong during TOTP verification.");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Backup code verification handler
  const handleVerifyBackupCode = async () => {
    // Always enforce format: XXXX-XXXX (uppercase, 9 chars, hyphen at pos 4)
    let formatted = backupCode.toUpperCase().replaceAll(/[^A-Z0-9]/, "");
    if (formatted.length > 8) formatted = formatted.slice(0, 8);
    if (formatted.length > 4)
      formatted = formatted.slice(0, 4) + "-" + formatted.slice(4);

    if (!formatted || formatted.length !== 9 || formatted.indexOf("-") !== 4) {
      toast.error("Please enter a valid backup code format (XXXX-XXXX).", {
        duration: 4000,
      });
      setBackupCode(formatted);
      return;
    }

    setLoading(true);
    try {
      // 1. Verify backup code with API
      const response = await fetch("/api/mfa/verify-backup-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, backupCode: formatted }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Invalid backup code");
        setBackupCode("");
        return;
      }
      toast.success("Backup code verified!");

      // 2. Login with backupCodeVerified flag (do NOT send the code again)
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        backupCodeVerified: "true",
      });
      if (res?.error) {
        toast.error(res.error);
        setBackupCode("");
      } else {
        setShowWelcome(true);
        toast.success("Login successful!");
        if (data.remainingBackupCodes <= 2) {
          toast(
            () => (
              <div>
                <p>
                  ⚠️ You have {data.remainingBackupCodes} backup codes
                  remaining.
                </p>
                <p className="text-sm mt-1">
                  Consider generating new ones in your account settings.
                </p>
              </div>
            ),
            { duration: 8000 }
          );
        } else {
          toast.success(
            `${data.remainingBackupCodes} backup codes remaining.`,
            { duration: 4000 }
          );
        }
        router.push("/dashboard");
      }
    } catch (err) {
      const errorMessage = handleApiError(err, "Something went wrong during backup code verification.");
      toast.error(errorMessage);
      setBackupCode("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const inactive = searchParams?.get("inactive");
    if (inactive === "1") {
      toast.error(
        `Your account is inactive. To activate it, contact us at ${"info@accufin@gmail.com"}.`
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (session) {
      // Show welcome message for Google login
      if (session.user?.name) {
        toast.success(`Welcome back, ${session.user.name}!`);
      }
      router.push("/dashboard");
    }
  }, [session, router]);

  // Handle Google login specifically
  useEffect(() => {
    const handleGoogleLogin = () => {
      if (session?.user?.name && !showWelcome) {
        setShowWelcome(true);
        toast.success(`Welcome back, ${session.user.name}!`);
      }
    };

    // Check for Google login after a delay
    const timer = setTimeout(handleGoogleLogin, 1500);
    return () => clearTimeout(timer);
  }, [session, showWelcome]);

  const toggleTerms = () => {
    setShowTerms(!showTerms);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 md:pt-[120px] pt-[150px]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-2">
          <img
            src="/image-000.png"
            alt="Accufin Logo"
            className="h-24 w-auto"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg ring-1 ring-gray-100 sm:rounded-xl sm:px-10">
          <form className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 focus:outline-none"
                  tabIndex={0}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <EyeClosedIcon className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-[#007399] hover:text-[#0082a3] focus:outline-none"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="agree-terms"
                  className="block text-sm text-gray-900"
                >
                  I agree to the
                </label>
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className={`${agreedToTerms ? "text-[#007399]" : "text-red-600"} hover:underline focus:outline-none text-sm`}
                >
                  Terms & Conditions
                </button>
              </div>
            </div>

            {/* OTP Input - Show after GET OTP is clicked */}
            {showOtpInput && (
              <div className="mt-4">
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Verification Code
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits and limit to 6 characters
                      if (value.length <= 6 && /^\d*$/.test(value)) {
                        setOtp(value);
                      }
                    }}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-center text-lg tracking-widest"
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </div>
              </div>
            )}

            {/* TOTP Input - Show when TOTP is required */}
            {totpRequired && !showBackupCodeInput && (
              <div className="mt-4">
                <label
                  htmlFor="totpCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Authenticator Code (TOTP)
                </label>
                <div className="mt-1">
                  <input
                    id="totpCode"
                    name="totpCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits and limit to 6 characters
                      if (value.length <= 6 && /^\d*$/.test(value)) {
                        setTotpCode(value);
                      }
                    }}
                    disabled={loading}
                    aria-busy={loading}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-center text-lg tracking-widest"
                    placeholder="000000"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the 6-digit code from your authenticator app
                </p>
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowBackupCodeInput(true)}
                    className="text-sm text-[#007399] hover:text-[#0082a3] focus:outline-none hover:underline"
                  >
                    Do not have device?
                  </button>
                </div>
              </div>
            )}

            {/* Backup Code Input - Show when user clicks "Do not have device?" */}
            {totpRequired && showBackupCodeInput && (
              <div className="mt-4">
                <label
                  htmlFor="backupCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Backup Code
                </label>
                <div className="mt-1">
                  <input
                    id="backupCode"
                    name="backupCode"
                    type="text"
                    maxLength={9}
                    value={backupCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      // Only allow alphanumeric characters and limit to 8 characters
                      if (value.length <= 8 && /^[A-Z0-9]*$/.test(value)) {
                        // Auto-format to XXXX-XXXX
                        let formatted = value;
                        if (formatted.length > 4) {
                          formatted = formatted.slice(0, 4) + "-" + formatted.slice(4);
                        }
                        setBackupCode(formatted);
                      }
                    }}
                    disabled={loading}
                    aria-busy={loading}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-center text-lg tracking-wider font-mono"
                    placeholder="XXXX-XXXX"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter one of your backup codes (format: XXXX-XXXX)
                </p>
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBackupCodeInput(false);
                      setBackupCode("");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none hover:underline"
                  >
                    Back to authenticator
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4">
              <SignInButton
                agreedToTerms={agreedToTerms}
                credentialsValidated={credentialsValidated}
                totpRequired={totpRequired}
                showBackupCodeInput={showBackupCodeInput}
                otpVerified={otpVerified}
                handleGetOtpAndValidate={handleGetOtpAndValidate}
                handleVerifyBackupCode={handleVerifyBackupCode}
                handleVerifyTotp={handleVerifyTotp}
                handleVerifyOtp={handleVerifyOtp}
                otpLoading={otpLoading}
                loading={loading}
                backupCode={backupCode}
                totpCode={totpCode}
                otp={otp}
              />

              {/* Resend OTP and Reset buttons */}
              {showOtpInput && (
                <div className="mt-2 flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendingOtp}
                    className="text-[#007399] hover:text-[#0082a3] focus:outline-none disabled:opacity-60"
                  >
                    {resendingOtp ? "Sending..." : "Resend Email Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpInput(false);
                      setOtp("");
                      setOtpVerified(false);
                      setTotpRequired(false);
                      setTotpCode("");
                      setShowBackupCodeInput(false);
                      setBackupCode("");
                      setCredentialsValidated(false);
                    }}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4">
              <GoogleSignInButton
                agreedToTerms={agreedToTerms}
                googleLoading={googleLoading}
                setGoogleLoading={setGoogleLoading}
                signIn={signIn}
              />
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/register"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-[#007399] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Create new account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showTerms && <ShowTerms toggleTerms={toggleTerms} />}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center items-center space-x-2">
              <img
                src="/image-000.png"
                alt="Accufin Logo"
                className="h-24 w-auto"
              />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007399]"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
