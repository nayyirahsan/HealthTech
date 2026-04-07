"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronDown, Sun, Moon } from "lucide-react";
import { useTheme } from "@/app/providers";

// Mock user — replace with Supabase session data when auth is wired up
const MOCK_USER = { name: "Alex Johnson", initials: "AJ", email: "alexj@utexas.edu" };

export function TopNav() {
  const [open,    setOpen]    = useState(false);
  const dropRef               = useRef<HTMLDivElement>(null);
  const { theme, toggle }     = useTheme();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <header className="h-12 border-b border-white/10 bg-[#080E1A] flex items-center justify-between px-5 shrink-0 z-20">
      {/* Wordmark */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="w-5 h-5 rounded bg-[#BF5700] flex items-center justify-center">
          <span className="text-[8px] font-black text-white">UT</span>
        </div>
        <span className="text-xs font-bold text-white tracking-wide">Premed Copilot</span>
      </div>

      {/* Spacer on desktop (wordmark is in sidebar) */}
      <div className="hidden md:block" />

      <div className="flex items-center gap-1">

      {/* Theme toggle */}
      <button
        onClick={toggle}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors mr-1"
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Right — user dropdown */}
      <div ref={dropRef} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-[#BF5700]/25 border border-[#BF5700]/40 flex items-center justify-center text-[11px] font-bold text-[#BF5700] shrink-0">
            {MOCK_USER.initials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-medium text-white/80 leading-none">{MOCK_USER.name}</p>
            <p className="text-[10px] text-white/30 mt-0.5 leading-none font-mono">{MOCK_USER.email}</p>
          </div>
          <ChevronDown
            size={12}
            className={`text-white/25 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#0D1628] border border-white/15 rounded-xl shadow-2xl py-1.5 z-50">
            {/* User info header */}
            <div className="px-3 py-2 border-b border-white/[0.07] mb-1">
              <p className="text-xs font-semibold text-white/80">{MOCK_USER.name}</p>
              <p className="text-[10px] text-white/30 font-mono mt-0.5">{MOCK_USER.email}</p>
            </div>

            <DropdownItem href="/settings" icon={<User size={13} />}     label="Profile"   onClick={() => setOpen(false)} />
            <DropdownItem href="/settings" icon={<Settings size={13} />} label="Settings"  onClick={() => setOpen(false)} />

            <div className="my-1 border-t border-white/[0.07]" />

            <button
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      </div> {/* end flex items-center gap-1 */}
    </header>
  );
}

function DropdownItem({
  href, icon, label, onClick,
}: {
  href: string; icon: React.ReactNode; label: string; onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 text-xs text-white/55 hover:text-white/85 hover:bg-white/[0.05] transition-colors"
    >
      <span className="text-white/35">{icon}</span>
      {label}
    </Link>
  );
}
