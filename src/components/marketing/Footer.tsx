import Link from "next/link";

export function Footer() {
  const links = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Sign In", href: "/login" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
  ];

  return (
    <footer className="w-full bg-[#0C1220] text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left Side: Logo & Tagline */}
        <div className="space-y-3 text-center md:text-left">
          <span className="font-syne font-bold text-lg text-white uppercase tracking-wider block">
            DDT <span className="text-sky-500">Structure</span>
          </span>
          <p className="font-inter text-slate-500 text-sm max-w-sm leading-relaxed">
            Non-destructive testing project management and automated proofreading for modern laboratories.
          </p>
        </div>

        {/* Center/Right: Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
          {links.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className="font-inter text-sm text-slate-400 hover:text-white transition-colors px-3 py-3 min-h-[48px] flex items-center"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Citation */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <p>&copy; {new Date().getFullYear()} DDT Structure. All rights reserved.</p>
        <p className="font-inter font-medium tracking-wide uppercase">
          Built for NDT laboratories in <span className="text-[#A3E635]">Lagos, Nigeria</span>
        </p>
      </div>
    </footer>
  );
}
