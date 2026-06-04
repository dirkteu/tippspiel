import { ShieldHalf } from "lucide-react";
import type { ReactNode } from "react";

export function AppBar({ action }: { action?: ReactNode }) {
  return (
    <div className="appbar">
      <div className="brand">
        <div className="brand-badge">
          <ShieldHalf size={17} color="#fff" />
        </div>
        <span className="brand-name">
          SECRET <em>SQUAD</em>
        </span>
      </div>
      {action}
    </div>
  );
}
