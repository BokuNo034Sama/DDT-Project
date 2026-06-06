"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
              Welcome back
            </h1>
            <p className="font-sans text-[16px] text-[#6B6960]">
              Sign in to your DDT Structure workspace
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1A1917] font-medium">
                  Work Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@lab.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-[44px] bg-white border-[#D1D5DB] rounded-[12px] text-[#1A1917] placeholder:text-[#9CA3AF] focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 transition-all font-sans text-[14px]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#1A1917] font-medium">
                    Password
                  </Label>
                  <Link href="#" className="text-[14px] text-[#3B82F6] hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-[44px] bg-white border-[#D1D5DB] rounded-[12px] text-[#1A1917] placeholder:text-[#9CA3AF] focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 transition-all font-sans text-[14px]"
                />
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
              <span>{loading ? "Signing in..." : "Sign In"}</span>
              {!loading && <ArrowRight className="w-5 h-5" />}
            </Button>
            
            <p className="text-center text-[14px] text-[#6B6960] mt-6">
              Don&apos;t have a workspace?{" "}
              <Link href="/register" className="text-[#3B82F6] hover:underline font-medium">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}
