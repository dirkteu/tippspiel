import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BottomNav } from "@/components/primitives/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  return (
    <div className="shell">
      <div className="screen">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
