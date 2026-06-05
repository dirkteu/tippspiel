import Link from "next/link";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Standard-AppBar. Wenn keine eigene Action angegeben, zeigt sie automatisch
 * den Info-Button (Link zu /regeln) — damit Regelseite überall erreichbar.
 */
export function AppBar({ action }: { action?: ReactNode }) {
  return (
    <div className="appbar">
      <div className="brand">
        <img
          src="/logo.png"
          alt="Bülser Alm"
          width={30}
          height={30}
          style={{ display: "block", objectFit: "contain" }}
        />
        <span className="brand-name">
          BÜLSER <em>ALM</em>
        </span>
      </div>
      {action ?? (
        <Link href="/regeln" className="icon-btn" aria-label="Tipp-Regeln">
          <Info size={19} />
        </Link>
      )}
    </div>
  );
}
