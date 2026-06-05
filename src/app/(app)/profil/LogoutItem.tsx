"use client";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutItem() {
  const router = useRouter();
  function logout() {
    document.cookie = "sq_login_token=; Max-Age=0; path=/";
    localStorage.removeItem("sq_login_token");
    router.replace("/");
  }
  return (
    <button
      type="button"
      onClick={logout}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderTop: "1px solid var(--divider, var(--border-soft))",
        color: "var(--fg2)",
        fontSize: 15,
        background: "transparent",
        border: 0,
        width: "100%",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      Abmelden
      <span style={{ marginLeft: "auto", color: "var(--fg4)", display: "flex" }}>
        <ChevronRight size={18} />
      </span>
    </button>
  );
}
