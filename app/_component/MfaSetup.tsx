"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Shield,
  Smartphone,
  Mail,
  Copy,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface MfaStatus {
  mfaEnabled: boolean;
  emailMfaEnabled: boolean;
  smsEnabled: boolean;
  totpEnabled: boolean;
  preferredMethod: string | null;
  availableMethods: string[];
  backupCodesCount: number;
  hasPhoneNumber: boolean;
}

interface MfaSettingsUpdate {
  preferredMfaMethod?: string;
  emailMfaEnabled?: boolean;
  smsEnabled?: boolean;
  disableTotp?: boolean;
}

export default function MfaSetup() {
  const { data: session } = useSession();
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupStep, setSetupStep] = useState<"setup" | "verify" | "complete">(
    "setup"
  );

  // TOTP Setup States
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [manualEntryKey, setManualEntryKey] = useState<string>("");
  const [totpCode, setTotpCode] = useState<string>("");
  const [totpLoading, setTotpLoading] = useState(false);

  // Backup Codes States
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodesLoading, setBackupCodesLoading] = useState(false);

  // Disable TOTP confirmation states
  const [showDisableTotpConfirmation, setShowDisableTotpConfirmation] = useState(false);
  const [disableTotpConfirmationText, setDisableTotpConfirmationText] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetchMfaStatus();
    }
  }, [session]);

  const fetchMfaStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mfa/settings");
      if (response.ok) {
        const data = await response.json();
        setMfaStatus(data);
      } else {
        toast.error("Failed to load MFA settings");
      }
    } catch (error) {
      console.error("Error loading MFA settings:", error);
      toast.error("Error loading MFA settings");
    } finally {
      setLoading(false);
    }
  };

  const setupTotp = async () => {
    try {
      setTotpLoading(true);

      const response = await fetch("/api/mfa/setup-totp", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeImage(data.qrCodeImage);
        setManualEntryKey(data.manualEntryKey);
        setSetupStep("verify");
        toast.success("QR code generated! Scan with your authenticator app.");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to setup authenticator");
      }
    } catch (error) {
      console.error("Error setting up authenticator:", error);
      toast.error("Error setting up authenticator");
    } finally {
      setTotpLoading(false);
    }
  };

  const verifyTotp = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    try {
      setTotpLoading(true);
      const response = await fetch("/api/mfa/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: totpCode,
          enableTotp: true,
        }),
      });

      if (response.ok) {
        setSetupStep("complete");
        toast.success("Authenticator app enabled successfully!");
        fetchMfaStatus();
        generateBackupCodes();
      } else {
        const error = await response.json();
        toast.error(error.error || "Invalid verification code");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      toast.error("Error verifying code");
    } finally {
      setTotpLoading(false);
    }
  };

  const generateBackupCodes = async () => {
    try {
      setBackupCodesLoading(true);
      const response = await fetch("/api/mfa/generate-backup-codes", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.backupCodes);
        setShowBackupCodes(true);
        toast.success("Backup codes generated!");
        // Refresh MFA status to get updated backup codes count
        // Add a small delay to ensure database is updated
        setTimeout(() => {
          fetchMfaStatus();
        }, 500);

        // Auto-hide codes after 30 seconds
        setTimeout(() => {
          setShowBackupCodes(false);
          setBackupCodes([]);
        }, 30000);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate backup codes");
      }
    } catch (error) {
      console.error("Error generating backup codes:", error);
      toast.error("Error generating backup codes");
    } finally {
      setBackupCodesLoading(false);
    }
  };

  const updateMfaSettings = async (settings: MfaSettingsUpdate) => {
    try {
      // Handle mutual exclusion logic
      const updatedSettings = { ...settings };

      // If enabling email MFA, disable TOTP
      if (settings.emailMfaEnabled === true) {
        updatedSettings.disableTotp = true;
      }

      // If enabling TOTP, disable email MFA
      if (settings.disableTotp === false && mfaStatus?.emailMfaEnabled) {
        updatedSettings.emailMfaEnabled = false;
      }

      const response = await fetch("/api/mfa/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });

      if (response.ok) {
        toast.success("Settings updated successfully");
        fetchMfaStatus();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Error updating settings");
    }
  };

  const disableTotp = async () => {
    try {
      const response = await fetch("/api/mfa/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disableTotp: true }),
      });

      if (response.ok) {
        toast.success("Authenticator app disabled successfully");
        fetchMfaStatus();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to disable authenticator");
      }
    } catch (error) {
      console.error("Error disabling authenticator:", error);
      toast.error("Error disabling authenticator");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "accufin-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Multi-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Multi-Factor Authentication
            {mfaStatus?.mfaEnabled && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                Enabled
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with multi-factor
            authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!mfaStatus?.mfaEnabled && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Your account is not protected with multi-factor authentication.
                Enable MFA to secure your account.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Email MFA */}
            <div
              className={`flex items-center justify-between p-4 border rounded-lg ${mfaStatus?.emailMfaEnabled ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-medium">Email Verification</h3>
                  <p className="text-sm text-gray-500">
                    Receive verification codes via email
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {setupStep !== "verify" &&
                  !mfaStatus?.totpEnabled &&
                  !mfaStatus?.emailMfaEnabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateMfaSettings({ emailMfaEnabled: true })
                      }
                    >
                      Enable
                    </Button>
                  )}
              </div>
            </div>

            {/* Authenticator App */}
            <div
              className={`flex items-center justify-between p-4 border rounded-lg ${mfaStatus?.totpEnabled ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="font-medium">Authenticator App</h3>
                  <p className="text-sm text-gray-500">
                    Use Microsoft Authenticator or Google Authenticator
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!mfaStatus?.totpEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setupTotp}
                    disabled={totpLoading}
                  >
                    {totpLoading ? "Setting up..." : "Set up"}
                  </Button>
                )}
                {mfaStatus?.totpEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisableTotpConfirmation(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Disable
                  </Button>
                )}
              </div>
            </div>

            {/* Authenticator Setup/Verification */}
            {setupStep === "verify" && (
              <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-4">Scan QR Code</h3>
                  {qrCodeImage && (
                    <div className="inline-block p-4 bg-white rounded-lg border">
                      <img
                        src={qrCodeImage}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Or enter this code manually:</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={manualEntryKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(manualEntryKey)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totpCode">
                    Enter verification code from your app:
                  </Label>
                  <Input
                    id="totpCode"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-lg tracking-wider"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setSetupStep("setup")}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={verifyTotp}
                    disabled={totpLoading || totpCode.length !== 6}
                    className="flex-1"
                  >
                    {totpLoading ? "Verifying..." : "Verify & Enable"}
                  </Button>
                </div>
              </div>
            )}

            {/* Backup Codes - Only show if authenticator is enabled */}
            {mfaStatus?.totpEnabled && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Backup Recovery Codes</h3>
                      <p className="text-sm text-gray-500">
                        Use these codes if you lose access to your authenticator
                        app
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {mfaStatus?.backupCodesCount || 0} codes available
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={generateBackupCodes}
                      disabled={backupCodesLoading}
                      variant="outline"
                    >
                      {backupCodesLoading
                        ? "Generating..."
                        : "Generate New Codes"}
                    </Button>
                  </div>

                  {showBackupCodes && backupCodes.length > 0 && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>Important:</strong> Save these backup codes in a
                        secure place. They will automatically disappear in 30
                        seconds and you won't be able to see them again.
                      </AlertDescription>
                    </Alert>
                  )}

                  {showBackupCodes && backupCodes.length > 0 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg font-mono text-sm">
                        {backupCodes.map((code) => (
                          <div key={code} className="text-center py-1">
                            {code}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={downloadBackupCodes}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          onClick={() =>
                            copyToClipboard(backupCodes.join("\n"))
                          }
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy All
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disable Authenticator Confirmation Modal */}
      <Dialog
        open={showDisableTotpConfirmation}
        onOpenChange={setShowDisableTotpConfirmation}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Disable Authenticator App</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">
                This will turn off your authenticator app for MFA. You will no
                longer be prompted for codes from your authenticator when
                signing in.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="disable-totp-confirm" className="text-sm font-medium text-gray-700">
                To confirm this action, type <strong>"CONFIRM"</strong> below:
              </label>
              <input
                id="disable-totp-confirm"
                type="text"
                value={disableTotpConfirmationText}
                onChange={(e) => setDisableTotpConfirmationText(e.target.value)}
                placeholder="Type CONFIRM to proceed"
                className="w-full border border-red-300 rounded-md px-3 py-2 text-sm focus:border-red-500 focus:ring-red-200"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={async () => {
                if (disableTotpConfirmationText !== "CONFIRM") return;
                await disableTotp();
                setShowDisableTotpConfirmation(false);
                setDisableTotpConfirmationText("");
              }}
              disabled={disableTotpConfirmationText !== "CONFIRM"}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Disable Authenticator
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableTotpConfirmation(false);
                setDisableTotpConfirmationText("");
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
