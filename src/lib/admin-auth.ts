import "server-only";
import { cookies } from "next/headers";

export async function isAdmin(): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const c = await cookies();
  return c.get("sq_admin")?.value === expected;
}
