export function validatePasswordStrength(password: string): {
  ok: boolean;
  message?: string;
} {
  if (!password || password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, message: "Include at least one lowercase letter." };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, message: "Include at least one uppercase letter." };
  }
  if (!/\d/.test(password)) {
    return { ok: false, message: "Include at least one number." };
  }
  if (!/[!@#$%^&*()[\]{};:'",.<>/?`~_+=\-\\|]/.test(password)) {
    return { ok: false, message: "Include at least one special character." };
  }
  return { ok: true };
}
