import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center bg-[#0C1220] overflow-hidden text-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero_visual.png"
          alt="DDT Structure High-Rise Structural Horizon"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-[#0C1220]/75" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col items-center justify-center h-full space-y-8 select-none">
        <h1 className="font-inter font-bold text-4xl sm:text-5xl md:text-[64px] text-white tracking-tight leading-[1.1] md:leading-[1.15] max-w-3xl">
          Engineering Confidence.<br />Technical Report Clarity.
        </h1>

        <p className="font-inter text-lg md:text-[20px] text-white/80 leading-relaxed max-w-2xl font-normal">
          Focus on what matters. DDT Structure helps NDT laboratories manage projects,
          track staff performance, and proofread reports against LSMTL
          guidelines — automatically.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-full bg-[#A3E635] hover:bg-[#8fd125] transition-all duration-200 text-slate-950 font-inter font-bold text-base min-h-[48px]"
          >
            <span>Start Free Trial →</span>
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center h-[52px] px-8 rounded-full border border-white hover:bg-white/10 transition-all duration-200 text-white font-inter font-semibold text-base min-h-[48px]"
          >
            See how it works
          </a>
        </div>

        <p className="font-inter text-xs md:text-sm text-white/80">
          14-day free trial · No credit card required
        </p>
      </div>

      {/* Bottom: Subtle Scroll Indicator */}
      <div className="absolute bottom-8 left-0 right-0 z-10 w-full flex justify-center animate-bounce">
        <a href="#pricing" className="flex flex-col items-center text-slate-300 gap-1 select-none">
          <span className="font-inter text-xs tracking-wider uppercase font-semibold">Discover More</span>
          <ChevronDown className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
}
