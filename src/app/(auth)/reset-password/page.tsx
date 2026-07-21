"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, AlertTriangle, ArrowRight } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for expired/error code in URL params or auth session state
  useEffect(() => {
    const errorParam = searchParams.get("error") || searchParams.get("error_code");
    const errorDescription = searchParams.get("error_description");

    if (errorParam || (errorDescription && errorDescription.toLowerCase().includes("expired"))) {
      setIsExpired(true);
      setCheckingSession(false);
      return;
    }

    // Verify session state from Supabase auth link exchange
    const checkAuthSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setIsExpired(true);
        }
      } catch {
        // Fallback catch
      } finally {
        setCheckingSession(false);
      }
    };

    checkAuthSession();

    // Listen for PASSWORD_RECOVERY event or auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          // If auth fails or user signs out
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [searchParams, supabase]);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "text-[#e5e7eb]", barColor: "bg-[#e5e7eb]" };
    const len = pwd.length;
    if (len < 6) {
      return { score: 1, label: "Weak", color: "text-red-500", barColor: "bg-red-500" };
    }
    if (len >= 6 && len <= 7) {
      return { score: 2, label: "Fair", color: "text-amber-500", barColor: "bg-amber-500" };
    }

    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasDigit = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

    if (len >= 8 && hasUpper && hasLower && hasDigit && hasSymbol) {
      return { score: 4, label: "Strong", color: "text-[#A3E635]", barColor: "bg-[#A3E635]" };
    }

    const criteriaCount = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
    if (len >= 8 && criteriaCount >= 2) {
      return { score: 3, label: "Good", color: "text-sky-400", barColor: "bg-sky-400" };
    }

    return { score: 2, label: "Fair", color: "text-amber-500", barColor: "bg-amber-500" };
  };

  const { score: strengthScore, label: strengthLabel, color: strengthColor, barColor: strengthBarColor } = getPasswordStrength(password);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const isPasswordValid = password.length >= 8;
  const isFormValid = isPasswordValid && passwordsMatch && !loading;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);

    const result = await updatePassword(password);

    if (!result.success) {
      if (
        result.error?.toLowerCase().includes("session") ||
        result.error?.toLowerCase().includes("token") ||
        result.error?.toLowerCase().includes("jwt")
      ) {
        setIsExpired(true);
      } else {
        setError(result.error || "Failed to reset password.");
      }
      setLoading(false);
      return;
    }

    router.push("/login?reset=success");
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex w-1/2 bg-[#3B82F6] flex-col relative overflow-hidden">
        <Image
          src="/images/hero_visual.png"
          alt="DDT Structure Hero"
          fill
          className="object-cover opacity-80"
          priority
        />

        <div className="z-20 mt-auto p-12 space-y-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-[#3B82F6] font-bold text-2xl font-syne">
              D
            </div>
            <span className="text-white font-syne text-2xl font-bold tracking-tight">
              DDT Structure
            </span>
          </div>
          <p className="text-white text-[20px] font-sans font-normal leading-relaxed">
            Engineering confidence. Report clarity.
          </p>
        </div>
      </div>

      {/* Right Panel - Form / Expired State */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {checkingSession ? (
            <div className="text-center p-8">
              <p className="text-[#6B6960]">Verifying reset link...</p>
            </div>
          ) : isExpired ? (
            /* Expired Token State */
            <div className="space-y-6 text-center lg:text-left">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto lg:mx-0 border border-amber-200">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>

              <div className="space-y-2">
                <h1 className="font-sans text-[40px] font-bold text-[#1A1917] tracking-tight leading-tight">
                  Reset link expired
                </h1>
                <p className="font-sans text-[16px] text-[#6B6960] leading-relaxed">
                  This password reset link has expired or already been used.
                </p>
              </div>

              <div className="pt-4">
                <Link href="/forgot-password">
                  <Button
                    type="button"
                    className="w-full bg-[#A3E635] hover:bg-[#90D028] text-[#1A1917] font-bold h-[52px] rounded-full transition-colors flex items-center justify-center space-x-2 text-[16px]"
                  >
                    <span>Request new link</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Set New Password Form */
            <>
              <div className="space-y-2">
                <h1 className="font-sans text-[40px] font-bold text-[#1A1917] tracking-tight leading-tight">
                  Set new password
                </h1>
                <p className="font-sans text-[16px] text-[#6B6960]">
                  Choose a strong password for your DDT Structure account.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
                <div className="space-y-4">
                  {/* New Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-[#1A1917] font-medium">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="h-[44px] bg-white border-[#D1D5DB] rounded-[12px] text-[#1A1917] placeholder:text-[#9CA3AF] focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 transition-all font-sans text-[14px] pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((index) => (
                          <div
                            key={index}
                            className={`h-[4px] rounded-full flex-1 transition-colors duration-200 ${
                              index <= strengthScore ? strengthBarColor : "bg-[#e5e7eb]"
                            }`}
                          />
                        ))}
                      </div>
                      {strengthLabel && (
                        <p className={`text-[11px] font-sans font-semibold uppercase tracking-wider transition-colors duration-200 ${strengthColor}`}>
                          {strengthLabel}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[#1A1917] font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-[44px] bg-white border-[#D1D5DB] rounded-[12px] text-[#1A1917] placeholder:text-[#9CA3AF] focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 transition-all font-sans text-[14px] pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Passwords mismatch inline error */}
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <p className="text-xs text-red-500 font-medium">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-[12px] text-sm font-medium">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!isFormValid}
                  className="w-full bg-[#A3E635] hover:bg-[#90D028] disabled:opacity-50 disabled:cursor-not-allowed text-[#1A1917] font-bold h-[52px] rounded-full transition-colors flex items-center justify-center space-x-2 text-[16px]"
                >
                  <span>{loading ? "Resetting..." : "Reset Password →"}</span>
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white p-4 font-sans text-[#1A1917]">
          <div className="text-center p-8 bg-white border border-[#D1D5DB] rounded-[24px]">
            <p className="text-[#6B6960]">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
