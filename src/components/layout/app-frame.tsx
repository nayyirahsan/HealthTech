"use client";

import { usePathname } from "next/navigation";
import { Sidebar, BottomTabBar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { isPublicPath } from "@/lib/app-routes";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicLayout = isPublicPath(pathname) || pathname === "/onboarding";

  if (publicLayout) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <div className="flex min-h-screen items-start">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <TopNav />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
        </div>
      </div>
      <BottomTabBar />
    </>
  );
}
