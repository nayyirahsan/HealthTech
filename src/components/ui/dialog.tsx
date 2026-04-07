"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open:     boolean;
  onClose:  () => void;
  title:    string;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[#0D1628] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-white/30 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </>
  );
}
