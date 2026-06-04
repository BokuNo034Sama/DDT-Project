import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[calc(100vh-64px)] flex flex-col justify-between bg-[#0C1220] overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#A3E635]/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Main Content Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12 md:py-20">
        {/* Left Column: Copy & Actions */}
        <div className="space-y-8 flex flex-col justify-center text-left max-w-xl lg:max-w-none">
          <h1 className="font-inter font-bold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] md:leading-[1.15]">
            Engineering Confidence.<br />
            <span className="font-syne text-[#A3E635]">Technical Report</span> clarity.
          </h1>

          <p className="font-inter text-slate-300 text-lg sm:text-xl leading-relaxed font-normal">
            Focus on what matters. DDT Structure helps NDT laboratories manage projects,
            track staff performance, and proofread reports against LSMTL
            guidelines — automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-full bg-[#A3E635] hover:bg-[#8fd125] transition-all duration-200 text-slate-950 font-inter font-bold text-base min-h-[48px]"
            >
              <span>Start free trial</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-[52px] px-8 rounded-full border border-white hover:bg-white/10 transition-all duration-200 text-white font-inter font-semibold text-base min-h-[48px]"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Right Column: Visual Showcase */}
        <div className="relative w-full h-[320px] sm:h-[450px] lg:h-[500px] rounded-[24px] overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center bg-slate-900 group">
          <Image
            src="/images/hero_visual.png"
            alt="DDT Structure High-Rise Structural Horizon"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
            sizes="(max-w-768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C1220]/60 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Bottom: Subtle Scroll Indicator */}
      <div className="w-full flex justify-center pb-8 animate-bounce">
        <div className="flex flex-col items-center text-slate-400 gap-1 select-none">
          <span className="font-inter text-xs tracking-wider uppercase font-semibold">Discover More</span>
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    </section>
  );
}
