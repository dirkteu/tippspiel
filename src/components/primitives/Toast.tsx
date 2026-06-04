"use client";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

export function Toast({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <div className={`toast${show ? " show" : ""}`} role="status" aria-live="polite">
      <Check size={17} />
      {children}
    </div>
  );
}
