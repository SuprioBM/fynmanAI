"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Platform", href: "/platform" },
  { label: "Session", href: "/session" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Docs", href: "/docs" },
];

export default function TopNav() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div>
      <nav className="fixed top-0 w-full h-14 z-[100] bg-[#15121b]/80 backdrop-blur-md border-b border-[#464554]/10">
        <div className="relative flex items-center justify-between px-4 md:px-12 w-full max-w-360 mx-auto h-full">
          {/* Left: Logo */}
          <Link href="/" className="font-headline-md text-headline-md font-bold text-[#e7e0ed] tracking-tighter">
            FymenAI
          </Link>

          {/* Center: Desktop Nav */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-6">
            {navItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={
                  index === 0
                    ? "font-body-sm text-body-sm text-[#c0c1ff] font-bold border-b border-[#c0c1ff] py-1"
                    : "font-body-sm text-body-sm text-[#c7c4d7] hover:text-[#c0c1ff] transition-colors py-1"
                }
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right: Desktop buttons + Mobile hamburger */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="font-body-sm text-body-sm text-[#c7c4d7] hover:text-[#c0c1ff] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-[#8083ff] text-[#0d0096] font-body-sm text-body-sm px-6 py-2 rounded-lg font-bold hover:opacity-80 transition-all"
              >
                Get Access
              </Link>
            </div>

            {/* Hamburger Button — mobile only */}
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label="Toggle menu"
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] relative z-[200]"
            >
              <span className={`block h-[2px] w-6 bg-[#e7e0ed] rounded-full origin-center transition-all duration-300 ease-in-out ${isOpen ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`block h-[2px] w-6 bg-[#e7e0ed] rounded-full transition-all duration-300 ease-in-out ${isOpen ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`block h-[2px] w-6 bg-[#e7e0ed] rounded-full origin-center transition-all duration-300 ease-in-out ${isOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Side Drawer */}
      <div className={`fixed top-0 right-0 h-full w-3/4 z-[60] bg-[#15121b] border-l border-[#464554]/20 flex flex-col pt-20 px-6 pb-8 transition-transform duration-300 ease-in-out md:hidden ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col gap-1">
          {navItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`py-3 px-2 text-base rounded-lg transition-colors duration-200 ${
                index === 0
                  ? "text-[#c0c1ff] font-bold border-b border-[#464554]/30"
                  : "text-[#c7c4d7] hover:text-[#c0c1ff] hover:bg-[#c0c1ff]/5 border-b border-[#464554]/30"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <Link
            href="/login"
            onClick={() => setIsOpen(false)}
            className="w-full text-center py-3 text-[#c7c4d7] border border-[#464554]/40 rounded-lg hover:text-[#c0c1ff] hover:border-[#c0c1ff]/40 transition-colors text-sm font-medium"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            onClick={() => setIsOpen(false)}
            className="w-full text-center bg-[#8083ff] text-[#0d0096] py-3 rounded-lg font-bold text-sm hover:opacity-80 transition-all"
          >
            Get Access
          </Link>
        </div>
      </div>
    </div>
  );
}