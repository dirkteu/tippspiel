import "server-only";
import { cookies } from "next/headers";

export async function isAdmin(): Promise<boolean> {
  // Bracket-Notation umgeht Next.js Build-Time-Inlining, sodass die Variable
  // erst zur Laufzeit aus dem Container-env gelesen wird.
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected) return false;
  const c = await cookies();
  return c.get("sq_admin")?.value === expected;
}
