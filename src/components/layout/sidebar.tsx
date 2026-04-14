"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Calculator,
  School,
  BarChart3,
  BookMarked,
  MessageSquare,
  Briefcase,
  MessageCircle,
  Calendar,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard",        label: "Dashboard",         icon: LayoutDashboard },
  { href: "/schools",          label: "Schools",           icon: School          },
  { href: "/chance",           label: "Chance Calc",       icon: Calculator      },
  { href: "/ut-benchmarks",    label: "UT Benchmarks",     icon: BarChart3       },
  { href: "/opportunities",    label: "Opportunities",     icon: Briefcase       },
  { href: "/my-list",          label: "My List",           icon: BookMarked      },
  { href: "/interview-prep",   label: "Interview Prep",    icon: MessageSquare   },
  { href: "/chat",             label: "AI Advisor",        icon: MessageCircle   },
] as const;

const BOTTOM_ITEMS = [
  { href: "/timeline",         label: "Timeline",          icon: Calendar  },
  { href: "/activities",        label: "Activities",        icon: Activity  },
  { href: "/settings",         label: "Settings",          icon: Settings  },
] as const;

// Bottom tab bar — 5 primary routes for mobile
const MOBILE_TABS = [
  { href: "/dashboard",      label: "Home",     icon: LayoutDashboard },
  { href: "/schools",        label: "Schools",  icon: School          },
  { href: "/chance",         label: "Chances",  icon: Calculator      },
  { href: "/my-list",        label: "My List",  icon: BookMarked      },
  { href: "/chat",           label: "Advisor",  icon: MessageCircle   },
] as const;

const LS_KEY = "sidebar-collapsed";

// ── Sidebar (desktop) ─────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname   = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted,   setMounted]   = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      localStorage.setItem(LS_KEY, String(!c));
      return !c;
    });
  }

  // Don't render until hydrated — avoids width flash
  if (!mounted) return <div className="hidden md:block w-[220px] shrink-0 h-screen sticky top-0" />;

  const w = collapsed ? "w-[52px]" : "w-[220px]";

  return (
    <aside
      className={`hidden md:flex ${w} shrink-0 sticky top-0 h-screen flex-col bg-[#080E1A] border-r border-white/10 transition-[width] duration-200 ease-in-out overflow-hidden`}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-3.5 h-12 border-b border-white/10 shrink-0 overflow-hidden">
        <div className="w-6 h-6 rounded-md bg-[#BF5700] flex items-center justify-center shrink-0">
          <span className="text-[10px] font-black text-white">UT</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white tracking-wide whitespace-nowrap">Premed Copilot</p>
            <p className="text-[9px] text-[#BF5700] font-mono tracking-[0.15em] uppercase whitespace-nowrap">UT Austin</p>
          </div>
        )}
      </Link>

      {/* Primary nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <NavLink key={href} href={href} label={label} icon={<Icon size={16} />} active={active} collapsed={collapsed} />
          );
        })}
      </nav>

      {/* Bottom items */}
      <div className="py-3 px-2 border-t border-white/[0.07] space-y-0.5 overflow-hidden">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <NavLink key={href} href={href} label={label} icon={<Icon size={16} />} active={active} collapsed={collapsed} />
          );
        })}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="flex items-center justify-center h-10 border-t border-white/[0.07] text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-colors shrink-0"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}

// ── Shared nav link ───────────────────────────────────────────────────────────

function NavLink({
  href, label, icon, active, collapsed,
}: {
  href:      string;
  label:     string;
  icon:      React.ReactNode;
  active:    boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-2.5 rounded-lg transition-colors overflow-hidden whitespace-nowrap ${
        collapsed ? "px-0 justify-center h-9 w-9 mx-auto" : "px-3 py-2"
      } ${
        active
          ? "bg-[#BF5700]/20 text-[#BF5700]"
          : "text-white/40 hover:text-white/80 hover:bg-white/[0.05]"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && (
        <span className="text-sm font-medium overflow-hidden text-ellipsis">{label}</span>
      )}
    </Link>
  );
}

// ── Bottom tab bar (mobile) ───────────────────────────────────────────────────

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch bg-[#080E1A] border-t border-white/10 h-16">
      {MOBILE_TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
              active ? "text-[#BF5700]" : "text-white/30 hover:text-white/60"
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.75} />
            <span>{label}</span>
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#BF5700] rounded-b-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
