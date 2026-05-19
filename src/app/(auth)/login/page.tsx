"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex min-h-screen items-center justify-center bg-ddt-bg p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-ddt-surface p-8 border border-ddt-border shadow-2xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-ddt-accent rounded-lg flex items-center justify-center text-black font-bold text-3xl font-syne">
              D
            </div>
          </div>
          <h1 className="font-syne text-4xl font-bold text-ddt-accent tracking-tight">
            DDT Structure
          </h1>
          <p className="font-sans text-ddt-muted italic text-sm">
            Don&apos;t Destroy The Structure
          </p>
          <div className="h-px bg-ddt-border-strong w-1/4 mx-auto mt-4" />
          <p className="mt-4 text-sm text-ddt-text font-medium uppercase tracking-widest">
            Lab Operations Platform
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-ddt-text">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@lab.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-ddt-input border-ddt-border text-ddt-text placeholder:text-ddt-faint focus:border-ddt-accent focus:ring-ddt-accent transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-ddt-text">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-ddt-input border-ddt-border text-ddt-text placeholder:text-ddt-faint focus:border-ddt-accent focus:ring-ddt-accent transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-ddt-accent hover:bg-ddt-accent-dim text-black font-bold h-11 transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ddt-bg p-4 font-sans text-ddt-text">
          <div className="text-center p-8 bg-ddt-surface border border-ddt-border rounded-xl">
            <p className="text-ddt-muted">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
