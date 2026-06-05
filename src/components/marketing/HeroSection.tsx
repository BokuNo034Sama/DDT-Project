"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function HeroSection({ hasHeroVisual }: { hasHeroVisual: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (supabase?.auth) {
      supabase.auth.getSession().then((res: any) => {
        setIsAuthenticated(!!res?.data?.session);
      });
    }
  }, []);

  const bgStyle = hasHeroVisual
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(8, 18, 50, 0.35) 0%, rgba(8, 18, 50, 0.65) 100%), url('/images/hero_visual.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {
        background: `linear-gradient(160deg, #0f2460 0%, #1a4ba8 30%, #3b82f6 60%, #93c5fd 85%, #e0f2fe 100%)`,
      };

  return (
    <section
      style={bgStyle}
      className="relative w-full h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center select-none z-10">
        {/* 1. Small badge pill */}
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/15 border border-white/30 text-white font-inter text-[13px] font-medium tracking-wide uppercase mb-6">
          LSMTL-Accredited Lab Management
        </div>

        {/* 2. Headline */}
        <h1 className="font-inter font-bold text-4xl sm:text-5xl md:text-[64px] text-white tracking-tight leading-[1.15] max-w-[700px]">
          Engineering confidence.<br />Report clarity.
        </h1>

        {/* 3. Subtext */}
        <p className="font-inter font-normal text-white/80 text-lg md:text-[20px] max-w-[560px] mt-6 leading-relaxed">
          The operations platform built for NDT laboratories in Lagos. Manage projects, track staff, and proofread reports with AI.
        </p>

        {/* 4. Two CTA buttons side by side */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-10">
          <Link
            href={isAuthenticated ? "/dashboard" : "/register"}
            className="inline-flex items-center justify-center bg-[#A3E635] hover:bg-[#8fd125] text-[#1a1a1a] px-8 py-4 rounded-full font-inter font-semibold text-base transition-colors duration-200"
          >
            {isAuthenticated ? "Go to Dashboard →" : "Start Free Trial →"}
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center bg-transparent border-2 border-white/60 hover:bg-white/10 hover:border-white text-white px-8 py-4 rounded-full font-inter font-semibold text-base transition-colors duration-200"
          >
            See how it works
          </a>
        </div>

        {/* 5. Caption below CTAs */}
        <p className="font-inter font-normal text-white/60 text-sm mt-5">
          14-day free trial · No credit card required
        </p>
      </div>
    </section>
  );
}

