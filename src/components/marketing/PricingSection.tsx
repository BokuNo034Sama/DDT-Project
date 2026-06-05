import Link from "next/link";
import { Check } from "lucide-react";

export function PricingSection() {
  const features = [
    "Unlimited NDT projects",
    "Up to 20 staff members",
    "9-stage report pipeline",
    "AI-powered report proofreading",
    "Monthly performance PDF reports",
    "Offline PWA access",
    "Real-time collaboration",
  ];

  return (
    <section id="pricing" className="w-full bg-[#0C1220] py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10 flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <h2 className="font-syne font-bold text-3xl sm:text-4xl lg:text-5xl text-white uppercase tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="font-inter text-slate-300 text-lg max-w-2xl mx-auto font-normal">
            One plan. Everything your lab needs.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-[420px] w-full bg-white rounded-[24px] shadow-2xl p-8 flex flex-col justify-between border border-slate-100 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
          
          {/* Badge */}
          <div className="absolute top-0 right-8 bg-[#A3E635] text-slate-950 font-inter font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-b-xl shadow-sm">
            Most Popular
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-inter font-bold uppercase tracking-wider text-slate-500">
                DDT Structure
              </p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl sm:text-[48px] font-inter font-bold text-slate-900 tracking-tight">
                  ₦15,000
                </span>
                <span className="text-sm font-inter text-slate-500 font-medium">
                  / month
                </span>
              </div>
              <p className="text-xs font-inter text-[#3B82F6] font-semibold mt-2 bg-sky-50 inline-block px-2.5 py-1 rounded">
                Start with 14 days free
              </p>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-slate-100 w-full" />

            {/* Features List */}
            <ul className="space-y-3.5 text-slate-600 text-sm font-medium">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-sky-50 flex items-center justify-center text-[#3B82F6] shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 space-y-4">
            <Link
              href="/register"
              className="flex items-center justify-center h-[52px] w-full rounded-full bg-[#A3E635] hover:bg-[#8fd125] text-slate-950 font-inter font-bold text-base shadow-md transition-all duration-200"
            >
              Start Free Trial →
            </Link>
            <p className="text-center font-inter text-[11px] text-slate-400">
              No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
