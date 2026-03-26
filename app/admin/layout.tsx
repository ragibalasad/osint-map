import { protectAdmin } from "@/lib/admin-check";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminContentShell } from "@/components/admin/admin-content-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await protectAdmin();

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <AdminSidebar />
      <AdminContentShell>{children}</AdminContentShell>
    </div>
  );
}
