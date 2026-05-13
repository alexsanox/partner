import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getSession } from "@/lib/auth-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (!session) {
    redirect(`${appUrl}/login`);
  }

  if (session.user.role !== "admin") {
    redirect(`${appUrl}/dashboard`);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 pt-20 md:px-6 md:py-8 md:pt-8">{children}</div>
      </main>
    </div>
  );
}
