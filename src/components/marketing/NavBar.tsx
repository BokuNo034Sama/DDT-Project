"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0C1220]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 min-h-[48px] px-2 py-1">
          <span className="font-syne font-bold text-xl tracking-tight text-white uppercase">
            DDT <span className="text-sky-500">Structure</span>
          </span>
        </Link>

        {/* Right: Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/login"
            className="font-inter font-semibold text-sm text-white bg-transparent border border-white/40 hover:border-white hover:bg-white/10 transition-all duration-200 rounded-full px-5 py-2.5 h-[48px] flex items-center justify-center"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="font-inter font-bold text-sm text-[#1a1a1a] bg-[#A3E635] hover:bg-[#8fd125] transition-all duration-200 rounded-full px-5 py-3 h-[48px] flex items-center justify-center min-w-[120px]"
          >
            Start Free Trial →
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-3 -mr-3 rounded-md text-white hover:bg-white/10 transition-colors focus:outline-none min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0C1220]/95 backdrop-blur-md animate-in slide-in-from-top duration-200">
          <div className="px-4 pt-3 pb-6 space-y-4">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="block w-full font-inter font-semibold text-center text-white bg-transparent border border-white/40 hover:bg-white/10 rounded-full py-3 px-4 min-h-[48px] flex items-center justify-center"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="block w-full font-inter font-bold text-center text-[#1a1a1a] bg-[#A3E635] hover:bg-[#8fd125] rounded-full py-3 px-4 min-h-[48px] flex items-center justify-center"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

