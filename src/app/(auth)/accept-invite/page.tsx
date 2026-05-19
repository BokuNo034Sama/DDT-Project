"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { acceptInvite } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ddt-bg p-4 font-sans text-ddt-text">
        <div className="text-center p-8 bg-ddt-surface border border-ddt-border rounded-xl">
          <h1 className="text-red-500 font-bold text-xl mb-2">Invalid Link</h1>
          <p className="text-ddt-muted">
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

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ddt-bg p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-ddt-surface p-8 border border-ddt-border shadow-2xl">
        <div className="text-center">
          <h1 className="font-syne text-3xl font-bold text-ddt-accent">
            Join the Team
          </h1>
          <p className="mt-2 text-ddt-muted text-sm italic font-sans">
            Set your details to activate your laboratory account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-ddt-text">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-ddt-input border-ddt-border text-ddt-text focus:ring-ddt-accent"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                title="Set Password"
                className="text-ddt-text"
              >
                Create Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-ddt-input border-ddt-border text-ddt-text focus:ring-ddt-accent"
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
            className="w-full bg-ddt-accent hover:bg-ddt-accent-dim text-black font-bold h-11"
          >
            {loading ? "Activating Account..." : "Accept Invitation"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ddt-bg p-4 font-sans text-ddt-text">
          <div className="text-center p-8 bg-ddt-surface border border-ddt-border rounded-xl">
            <p className="text-ddt-muted">Loading invitation...</p>
          </div>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
