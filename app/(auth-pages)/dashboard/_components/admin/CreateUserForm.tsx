"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader,
  UserPlus,
  Mail,
  Lock,
  User,
  Building,
  EyeIcon,
  EyeClosedIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/client-api";

export default function CreateUserForm({
  onSuccess,
}: Readonly<{
  onSuccess?: (createdUser: any) => void;
}>) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    sinNumber: "",
    businessNumber: "",
    dateOfBirth: "",
    contactNumber: "",
    isAdmin: false,
    maxStorageLimitValue: 1,
    maxStorageUnit: "GB" as "KB" | "MB" | "GB",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'email' ? value.toLowerCase() : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const unit = formData.maxStorageUnit || "GB";
      const value = Number(formData.maxStorageLimitValue) || 0;
      const toKB = (v: number, u: "KB" | "MB" | "GB") => {
        if (u === "KB") return v;
        if (u === "MB") return v * 1024;
        return v * 1024 * 1024; // GB -> KB
      };

      const payload = {
        ...formData,
        maxStorageLimit: Math.max(0, Math.floor(toKB(value, unit))),
      };

      const response = await apiFetch("/api/admin/create-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), logoutOn401: false });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      const createdUser = await response.json();
      toast.success("User created successfully!");
      setFormData({
        email: "",
        password: "",
        name: "",
        sinNumber: "",
        businessNumber: "",
        dateOfBirth: "",
        contactNumber: "",
        isAdmin: false,
        maxStorageLimitValue: 1,
        maxStorageUnit: "GB",
      });
      onSuccess?.(createdUser);
    } catch (error: any) {
      toast.error(error.message || "An error occurred while creating the user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Required Fields Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Mail className="w-4 h-4 mr-2 text-emerald-500" />
            Required Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="user@example.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <EyeClosedIcon className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Fields Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <User className="w-4 h-4 mr-2 text-blue-500" />
            Personal Information (Optional)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>

            <div>
              <Label
                htmlFor="dateOfBirth"
                className="text-sm font-medium text-gray-700"
              >
                Date of Birth
              </Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label
                htmlFor="contactNumber"
                className="text-sm font-medium text-gray-700"
              >
                Contact Number
              </Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                type="tel"
                value={formData.contactNumber}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Business Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Building className="w-4 h-4 mr-2 text-purple-500" />
            Business Information (Optional)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="sinNumber"
                className="text-sm font-medium text-gray-700"
              >
                SIN Number
              </Label>
              <Input
                id="sinNumber"
                name="sinNumber"
                type="text"
                value={formData.sinNumber}
                onChange={handleInputChange}
                placeholder="123-456-789"
                className="mt-1"
              />
            </div>

            <div>
              <Label
                htmlFor="businessNumber"
                className="text-sm font-medium text-gray-700"
              >
                Business Number
              </Label>
              <Input
                id="businessNumber"
                name="businessNumber"
                type="text"
                value={formData.businessNumber}
                onChange={handleInputChange}
                placeholder="123456789RT0001"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Admin & Storage Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Lock className="w-4 h-4 mr-2 text-amber-500" />
            Admin & Storage Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col justify-center items-center">
              <span className={`text-md font-medium ${formData.isAdmin ? "text-amber-700" : "text-gray-600"}`}>
                {formData.isAdmin ? "Admin" : "User"}
              </span>
              <Switch
                checked={formData.isAdmin}
                onCheckedChange={(checked) =>
                  setFormData((p) => ({ ...p, isAdmin: checked }))
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Max Storage (in GB)</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maxStorageLimitValue}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, maxStorageLimitValue: Number(e.target.value || 0) }))
                  }
                  placeholder="e.g., 1"
                  className="appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div
                  className="border border-emerald-200 rounded-md px-2 py-1 text-sm bg-gray-50 text-gray-700 flex items-center"
                >
                  GB
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-2 rounded-lg shadow-lg"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Creating User...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
