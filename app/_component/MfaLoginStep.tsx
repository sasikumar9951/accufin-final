"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  MessageSquare,
  Smartphone,
  Shield,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

interface MfaLoginStepProps {
  readonly email: string;
  readonly password: string;
  readonly availableMethods: string[];
  readonly preferredMethod: string | null;
  readonly onBack: () => void;
  readonly onSuccess: () => void;
  readonly onLogin: (credentials: {
    email: string;
    password: string;
    mfaMethod?: string;
    otp?: string;
    backupCode?: string;
    otpVerified?: string;
  }) => Promise<void>;
}

export default function MfaLoginStep({
  email,
  password,
  availableMethods,
  preferredMethod,
  onBack,
  onSuccess,
  onLogin,
}: Readonly<MfaLoginStepProps>) {
  const [selectedMethod, setSelectedMethod] = useState(
    preferredMethod || availableMethods[0]
  );
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);

  const sendOtp = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          purpose: "login",
        }),
      });

      if (response.ok) {
        setOtpSent(true);
        toast.success("Verification code sent!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send verification code");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndLogin = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    try {
      setLoading(true);

      if (selectedMethod === "authenticator") {
        // For authenticator, verify directly during login
        await onLogin({
          email,
          password,
          mfaMethod: selectedMethod,
          otp: verificationCode,
        });
      } else {
        // For email/SMS, verify OTP first
        const verifyResponse = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp: verificationCode,
            purpose: "login",
          }),
        });

        if (!verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          toast.error(verifyData.error || "Invalid verification code");
          return;
        }

        // If OTP verified, proceed with login
        await onLogin({
          email,
          password,
          mfaMethod: selectedMethod,
          otpVerified: "true",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const loginWithBackupCode = async () => {
    if (!backupCode || backupCode.trim().length === 0) {
      toast.error("Please enter a backup code");
      return;
    }

    try {
      setLoading(true);
      await onLogin({
        email,
        password,
        backupCode: backupCode.trim(),
      });
      onSuccess();
    } catch (error) {
      console.error("Backup code error:", error);
      toast.error("Invalid backup code");
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "sms":
        return <MessageSquare className="w-4 h-4" />;
      case "authenticator":
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "email":
        return "Email";
      case "sms":
        return "SMS";
      case "authenticator":
        return "Authenticator App";
      default:
        return method;
    }
  };

  if (showBackupCode) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="w-5 h-5" />
            Use Backup Code
          </CardTitle>
          <CardDescription>
            Enter one of your backup recovery codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backupCode">Backup Code</Label>
            <Input
              id="backupCode"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
              placeholder="ABCD-1234"
              className="text-center text-lg tracking-wider"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBackupCode(false)}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={loginWithBackupCode}
              disabled={loading || !backupCode.trim()}
              className="flex-1"
            >
              {loading ? "Verifying..." : "Sign In"}
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This backup code can only be used once. Make sure to generate new
              backup codes after signing in if you're running low.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="w-5 h-5" />
          Verify Your Identity
        </CardTitle>
        <CardDescription>
          Choose how you'd like to receive your verification code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={selectedMethod || ""}
          onValueChange={setSelectedMethod}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            {availableMethods.map((method) => (
              <TabsTrigger
                key={method}
                value={method}
                className="flex items-center gap-1"
              >
                {getMethodIcon(method)}
                <span className="hidden sm:inline">
                  {getMethodLabel(method)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {availableMethods.map((method) => (
            <TabsContent key={method} value={method} className="space-y-4 mt-4">
              {method === "email" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Mail className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-sm text-gray-600">
                      We'll send a verification code to your email address
                    </p>
                  </div>

                  {otpSent ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="emailCode">
                          Enter verification code
                        </Label>
                        <Input
                          id="emailCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="000000"
                          maxLength={6}
                          className="text-center text-lg tracking-wider"
                        />
                      </div>
                      <Button
                        onClick={verifyAndLogin}
                        disabled={loading || verificationCode.length !== 6}
                        className="w-full"
                      >
                        {loading ? "Verifying..." : "Verify & Sign In"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={sendOtp}
                        disabled={loading}
                        className="w-full"
                      >
                        Resend Code
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={sendOtp}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? "Sending..." : "Send Code"}
                    </Button>
                  )}
                </div>
              )}

              {method === "sms" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <MessageSquare className="w-8 h-8 mx-auto text-green-500 mb-2" />
                    <p className="text-sm text-gray-600">
                      We'll send a verification code to your phone number
                    </p>
                  </div>

                  {otpSent ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="smsCode">Enter verification code</Label>
                        <Input
                          id="smsCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="000000"
                          maxLength={6}
                          className="text-center text-lg tracking-wider"
                        />
                      </div>
                      <Button
                        onClick={verifyAndLogin}
                        disabled={loading || verificationCode.length !== 6}
                        className="w-full"
                      >
                        {loading ? "Verifying..." : "Verify & Sign In"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={sendOtp}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? "Sending..." : "Send SMS Code"}
                    </Button>
                  )}
                </div>
              )}

              {method === "authenticator" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Smartphone className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                    <p className="text-sm text-gray-600">
                      Open your authenticator app and enter the 6-digit code
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totpCode">Authenticator code</Label>
                    <Input
                      id="totpCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-lg tracking-wider"
                    />
                  </div>

                  <Button
                    onClick={verifyAndLogin}
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full"
                  >
                    {loading ? "Verifying..." : "Verify & Sign In"}
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 pt-4 border-t space-y-2">
          <Button
            variant="ghost"
            onClick={() => setShowBackupCode(true)}
            className="w-full text-sm"
          >
            Lost your device? Use backup code
          </Button>

          <Button variant="ghost" onClick={onBack} className="w-full text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
