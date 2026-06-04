"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 min-h-[48px] px-2 py-1">
          <span className="font-syne font-bold text-xl tracking-tight text-slate-900 uppercase">
            DDT <span className="text-sky-500">Structure</span>
          </span>
        </Link>

        {/* Right: Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/login"
            className="font-inter font-semibold text-sm text-slate-600 hover:text-slate-900 transition-colors px-4 py-3 min-h-[48px] flex items-center"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="font-inter font-bold text-sm text-slate-900 bg-[#A3E635] hover:bg-[#8fd125] transition-all duration-200 shadow-sm rounded-full px-5 py-3 h-[48px] flex items-center justify-center min-w-[120px]"
          >
            Start Free Trial
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-3 -mr-3 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors focus:outline-none min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white animate-in slide-in-from-top duration-200">
          <div className="px-4 pt-3 pb-6 space-y-4">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="block w-full font-inter font-semibold text-center text-slate-700 hover:bg-slate-50 rounded-xl py-3 px-4 min-h-[48px] flex items-center justify-center"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="block w-full font-inter font-bold text-center text-slate-900 bg-[#A3E635] hover:bg-[#8fd125] rounded-full py-3 px-4 min-h-[48px] flex items-center justify-center"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
