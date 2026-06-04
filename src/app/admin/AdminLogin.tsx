import { Lock } from "lucide-react";
import { loginAction } from "./page";

export function AdminLogin() {
  return (
    <div className="scroll" style={{ padding: "0 24px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 32 }}>
        <Lock size={20} />
        <span className="kicker">Admin</span>
      </div>
      <h1 className="h1" style={{ marginTop: 4 }}>Master-Passwort</h1>
      <form action={loginAction} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          name="password"
          type="password"
          className="field-input"
          placeholder="Passwort"
          autoComplete="current-password"
          required
        />
        <button type="submit" className="btn btn-primary">Einloggen</button>
      </form>
    </div>
  );
}
