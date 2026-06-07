"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { acceptInvite } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  console.log("Extracted token from searchParams:", token);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4 font-sans text-[#1A1917]">
        <div className="text-center p-8 bg-white border border-[#D1D5DB] rounded-[24px]">
          <h1 className="text-red-500 font-bold text-xl mb-2">Invalid Link</h1>
          <p className="text-[#6B6960]">
            This invitation link is malformed or missing.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("token", token);
    formData.append("password", password);
    formData.append("fullName", fullName);

    const result = await acceptInvite(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/accept-invite/success");
    router.refresh();
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
            <span className="text-white font-syne text-2xl font-bold tracking-tight">DDT Structure</span>
          </div>
          <p className="text-white text-[20px] font-sans font-normal leading-relaxed">
            Engineering confidence. Report clarity.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="font-sans text-[40px] font-bold text-[#1A1917] tracking-tight leading-tight">
              Set your password
            </h1>
            <p className="font-sans text-[16px] text-[#6B6960]">
              Set your details to activate your laboratory account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[#1A1917] font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-[44px] bg-white border-[#D1D5DB] rounded-[12px] text-[#1A1917] placeholder:text-[#9CA3AF] focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 transition-all font-sans text-[14px]"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  title="Set Password"
                  className="text-[#1A1917] font-medium"
                >
                  Create Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-[12px] text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#A3E635] hover:bg-[#90D028] text-[#1A1917] font-bold h-[52px] rounded-full transition-colors flex items-center justify-center space-x-2 text-[16px]"
            >
              <span>{loading ? "Activating Account..." : "Join the workspace"}</span>
              {!loading && <ArrowRight className="w-5 h-5" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white p-4 font-sans text-[#1A1917]">
          <div className="text-center p-8 bg-white border border-[#D1D5DB] rounded-[24px]">
            <p className="text-[#6B6960]">Loading invitation...</p>
          </div>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
