import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers }              from "./providers";
import { Sidebar, BottomTabBar } from "@/components/layout/sidebar";
import { TopNav }                 from "@/components/layout/top-nav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "UT Austin Premed AI Copilot",
  description:
    "Data-driven AI copilot helping UT Austin premeds navigate medical school admissions.",
};

// Inline script runs synchronously before any paint — prevents light-mode flash on refresh.
// Default is light. Only switch to dark if explicitly stored.
const FOUC_SCRIPT = `
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark') {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  } catch(e) { document.documentElement.classList.add('light'); }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        {/* FOUC prevention — must be inline, synchronous */}
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0F172A]`}>
        <Providers>
          <div className="flex min-h-screen items-start">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
              <TopNav />
              <main className="flex-1 pb-16 md:pb-0">
                {children}
              </main>
            </div>
          </div>
          <BottomTabBar />
        </Providers>
      </body>
    </html>
  );
}
