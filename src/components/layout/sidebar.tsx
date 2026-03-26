"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chance", label: "Chance Calculator" },
  { href: "/schools", label: "School Explorer" },
  { href: "/ut-benchmarks", label: "UT Benchmarks" },
  { href: "/my-list", label: "My School List" },
  { href: "/interview-prep", label: "Interview Prep" },
  { href: "/timeline", label: "Timeline" },
  { href: "/activity-tracker", label: "Activity Tracker" },
  { href: "/chat", label: "AI Advisor" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50 min-h-screen p-4">
      <Link href="/" className="block mb-8">
        <h1 className="text-lg font-bold text-gray-900">Premed Copilot</h1>
        <p className="text-xs text-gray-500">UT Austin</p>
      </Link>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-md text-sm ${
              pathname === item.href || pathname?.startsWith(item.href + "/")
                ? "bg-orange-100 text-orange-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
