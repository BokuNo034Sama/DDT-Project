import Link from "next/link";
import { Check } from "lucide-react";

export function PricingSection() {
  const starterFeatures = [
    "Up to 10 staff members",
    "Unlimited NDT projects",
    "9-stage automated pipeline",
    "Monthly performance PDF reports",
    "Offline PWA access",
    "Real-time notifications",
  ];

  const proFeatures = [
    "Everything in Starter",
    "Up to 50 staff members",
    "AI-powered report proofreading",
    "LSMTL guideline compliance checks",
    "V3 document error detection",
    "Minor error auto-correction",
    "Priority support",
    "Advanced performance analytics",
  ];

  return (
    <section id="pricing" className="w-full bg-white py-20 md:py-28 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
      <div className="max-w-7xl mx-auto space-y-12 flex flex-col items-center w-full">
        {/* Heading & Subtext */}
        <div className="space-y-4">
          <h2 className="font-inter font-bold text-3xl sm:text-4xl text-[#0f172a] tracking-tight leading-none" style={{ fontSize: "40px" }}>
            Simple, transparent pricing
          </h2>
          <p className="font-inter text-[#6b7280] text-lg max-w-2xl mx-auto">
            Choose the plan that fits your lab.
          </p>
        </div>

        {/* Two-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] max-w-[900px] w-full items-stretch justify-center">
          
          {/* Card 1: Starter */}
          <div className="bg-white border border-[#e5e7eb] rounded-[24px] p-[40px] flex flex-col text-left w-full h-full">
            <div>
              <span className="font-inter font-semibold text-[18px] text-[#0f172a]">
                Starter
              </span>
              <div className="flex items-baseline gap-1 mt-6">
                <span className="font-inter font-bold text-[#0f172a] text-[56px] tracking-tight leading-none">
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
            <div className="h-[1px] bg-[#e5e7eb] w-full my-[24px]" />

            {/* Description */}
            <p className="font-inter font-normal text-[14px] text-[#6b7280] leading-relaxed mb-6">
              Perfect for small NDT labs getting started with digital operations.
            </p>

            {/* Feature List */}
            <ul className="space-y-4 flex-1">
              {starterFeatures.map((feature, i) => (
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
                className="flex items-center justify-center w-full h-[52px] bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-full font-inter font-semibold text-[16px] transition-colors duration-200"
              >
                Start Free Trial →
              </Link>
              <p className="font-inter font-normal text-[13px] text-[#9ca3af] text-center mt-3">
                No credit card required
              </p>
            </div>
          </div>

          {/* Card 2: Pro (Featured) */}
          <div className="bg-[#0C1220] border-2 border-[#A3E635] rounded-[24px] p-[40px] flex flex-col text-left w-full h-full relative" style={{ boxShadow: "0 8px 40px rgba(163, 230, 53, 0.15)" }}>
            <div>
              <div className="mb-[16px]">
                <span className="inline-block bg-[#A3E635] text-[#0f172a] font-inter font-semibold text-[12px] px-[14px] py-[4px] rounded-full">
                  Most Popular
                </span>
              </div>
              <span className="font-inter font-semibold text-[18px] text-white">
                Pro
              </span>
              <div className="flex items-baseline gap-1 mt-6">
                <span className="font-inter font-bold text-white text-[56px] tracking-tight leading-none">
                  ₦45,000
                </span>
                <span className="font-inter font-normal text-[rgba(255,255,255,0.6)] text-[16px]">
                  per month
                </span>
              </div>
              <p className="font-inter font-medium text-[14px] text-[#A3E635] mt-3">
                Billed monthly. Cancel anytime.
              </p>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-[rgba(255,255,255,0.1)] w-full my-[24px]" />

            {/* Description */}
            <p className="font-inter font-normal text-[14px] text-[rgba(255,255,255,0.6)] leading-relaxed mb-6">
              For growing labs that need AI-powered compliance and advanced reporting.
            </p>

            {/* Feature List */}
            <ul className="space-y-4 flex-1">
              {proFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#A3E635] shrink-0 mt-0.5" />
                  <span className="font-inter text-white text-sm">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA & Caption */}
            <div className="mt-8 flex flex-col w-full">
              <Link
                href="/register"
                className="flex items-center justify-center w-full h-[52px] bg-[#A3E635] hover:bg-[#8fd125] text-[#0f172a] rounded-full font-inter font-semibold text-[16px] transition-colors duration-200"
              >
                Get Premium →
              </Link>
              <p className="font-inter font-normal text-[13px] text-[rgba(255,255,255,0.4)] text-center mt-3">
                No credit card required · Cancel anytime
              </p>
            </div>
          </div>

        </div>

        {/* Comparison Note below cards */}
        <p className="font-inter font-normal text-[14px] text-[#6b7280] text-center mt-[32px]">
          All plans include a 14-day free trial.<br className="sm:hidden" /> No credit card required to start.
        </p>
      </div>
    </section>
  );
}
