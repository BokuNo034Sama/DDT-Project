import Link from "next/link";
import { Check } from "lucide-react";

export function PricingSection() {
  const features = [
    "Unlimited NDT projects",
    "Up to 20 staff members",
    "9-stage automated pipeline",
    "AI-powered report proofreading",
    "Monthly performance PDF reports",
    "Offline PWA — works without internet",
    "Real-time staff notifications",
    "LSMTL guideline compliance checks",
  ];

  return (
    <section id="pricing" className="w-full bg-white py-20 md:py-28 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
      <div className="max-w-7xl mx-auto space-y-12 flex flex-col items-center">
        {/* Heading & Subtext */}
        <div className="space-y-4">
          <h2 className="font-inter font-bold text-3xl sm:text-4xl text-[#0f172a] tracking-tight leading-none" style={{ fontSize: "40px" }}>
            Simple, transparent pricing
          </h2>
          <p className="font-inter text-[#6b7280] text-lg max-w-2xl mx-auto">
            One plan. Everything your lab needs.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-[420px] w-full bg-white rounded-[24px] p-10 flex flex-col border-2 border-[#A3E635] text-left relative overflow-hidden" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.10)" }}>
          
          {/* Header Row with Badge & Plan Name */}
          <div className="flex items-center justify-between">
            <span className="font-inter font-semibold text-[18px] text-slate-900">
              DDT Structure
            </span>
            <span className="bg-[#A3E635] text-[#1a1a1a] font-inter font-semibold text-[12px] px-3 py-1 rounded-full">
              Most Popular
            </span>
          </div>

          {/* Pricing Details */}
          <div className="mt-6">
            <div className="flex items-baseline gap-1">
              <span className="font-inter font-bold text-[#0f172a] text-5xl md:text-[56px] tracking-tight leading-none">
                ₦15,000
              </span>
              <span className="font-inter font-normal text-[#6b7280] text-[16px]">
                per month
              </span>
            </div>
            <p className="font-inter font-medium text-[14px] text-[#3b82f6] mt-3">
              Start with 14 days free
            </p>
          </div>

          {/* Divider */}
          <div className="h-[1px] bg-[#e5e7eb] w-full my-6" />

          {/* Feature List */}
          <ul className="space-y-4 flex-1">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#3b82f6] shrink-0 mt-0.5" />
                <span className="font-inter text-slate-600 text-sm">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA & Caption */}
          <div className="mt-8 flex flex-col w-full">
            <Link
              href="/register"
              className="flex items-center justify-center w-full h-[52px] bg-[#A3E635] hover:bg-[#8fd125] text-[#1a1a1a] rounded-full font-inter font-semibold text-[16px] transition-colors duration-200"
            >
              Start Free Trial →
            </Link>
            <p className="font-inter font-normal text-[13px] text-[#9ca3af] text-center mt-3">
              No credit card required · Cancel anytime
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
