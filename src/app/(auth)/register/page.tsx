"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initializeTenant } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const supabase = createClient();
  const [labName, setLabName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // In a real app, we'd also pass labName to the backend here or store it in user metadata.
    // For now we just create the auth user. The step 33C requires seeding the DB post-registration
    // which should ideally be handled via a secure server action, but we will wire that up shortly.
    
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          lab_name: labName,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    
    // Seed sandbox and create tenant record
    const initResult = await initializeTenant(labName);
    
    if (initResult.error) {
      setError(initResult.error);
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
              Get started
            </h1>
            <p className="font-sans text-[16px] text-[#6B6960]">
              Create your new lab workspace
            </p>
          </div>

          <form onSubmit={handleRegister} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="labName" className="text-[#1A1917] font-medium">
                  Company / Lab Name
                </Label>
                <Input
                  id="labName"
                  type="text"
                  placeholder="StructoLab Ltd"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  required
                  className="h-[44px] bg-white border-[#D1D5DB] rounded-[12px] text-[#1A1917] placeholder:text-[#9CA3AF] focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 transition-all font-sans text-[14px]"
                />
              </div>
              
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
                <Label htmlFor="password" className="text-[#1A1917] font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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
              <span>{loading ? "Creating..." : "Create your workspace"}</span>
              {!loading && <ArrowRight className="w-5 h-5" />}
            </Button>
            
            <p className="text-center text-[14px] text-[#6B6960] mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[#3B82F6] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
      <RegisterContent />
    </Suspense>
  );
}
