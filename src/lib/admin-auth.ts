import "server-only";
import { cookies } from "next/headers";
import { readEnv } from "@/lib/env";

export async function isAdmin(): Promise<boolean> {
  const expected = readEnv("ADMIN_PASSWORD");
  if (!expected) return false;
  const c = await cookies();
  return c.get("sq_admin")?.value === expected;
}
