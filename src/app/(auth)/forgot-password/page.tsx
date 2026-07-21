"use client";

import { useState, Suspense } from "react";
import { sendPasswordReset } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Mail } from "lucide-react";

function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    await sendPasswordReset(email);
    setSubmittedEmail(email);
    setSubmitted(true);
    setLoading(false);
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setEmail(submittedEmail);
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

      {/* Right Panel - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {submitted ? (
            /* Success State */
            <div className="space-y-6 text-center lg:text-left">
              <div className="w-16 h-16 bg-[#3B82F6]/10 rounded-full flex items-center justify-center text-[#3B82F6] mx-auto lg:mx-0">
                <Mail className="w-8 h-8 text-[#3B82F6]" />
              </div>

              <div className="space-y-2">
                <h1 className="font-sans text-[40px] font-bold text-[#1A1917] tracking-tight leading-tight">
                  Check your email
                </h1>
                <p className="font-sans text-[16px] text-[#6B6960] leading-relaxed">
                  We&apos;ve sent a password reset link to{" "}
                  <span className="font-semibold text-[#1A1917]">
                    {submittedEmail}
                  </span>
                  . Check your inbox and spam folder.
                </p>
              </div>

              <div className="pt-4 space-y-4">
                <p className="text-[14px] text-[#6B6960]">
                  Didn&apos;t receive it?{" "}
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-[#3B82F6] hover:underline font-medium focus:outline-none"
                  >
                    Resend email or try another address
                  </button>
                </p>

                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-[14px] text-[#3B82F6] hover:underline font-medium space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="space-y-2">
                <h1 className="font-sans text-[40px] font-bold text-[#1A1917] tracking-tight leading-tight">
                  Reset your password
                </h1>
                <p className="font-sans text-[16px] text-[#6B6960]">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#1A1917] font-medium">
                    Work Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-[44px] bg-white border-[#D1D5DB] rounded-[12px] text-[#1A1917] placeholder:text-[#9CA3AF] focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 transition-all font-sans text-[14px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#A3E635] hover:bg-[#90D028] text-[#1A1917] font-bold h-[52px] rounded-full transition-colors flex items-center justify-center space-x-2 text-[16px]"
                >
                  <span>{loading ? "Sending..." : "Send Reset Link →"}</span>
                </Button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-[14px] text-[#3B82F6] hover:underline font-medium space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
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
      <ForgotPasswordContent />
    </Suspense>
  );
}
