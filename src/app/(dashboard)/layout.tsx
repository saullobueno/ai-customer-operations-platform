import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { countUnreadNotifications, listRecentNotifications } from "@/server/services/notifications";
import { NotificationBell } from "@/components/notification-bell";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  if (!session.session.activeOrganizationId) redirect("/onboarding");

  const [notifications, unreadCount] = await Promise.all([
    listRecentNotifications(db, { userId: session.user.id }),
    countUnreadNotifications(db, session.user.id),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/inbox" className="font-semibold tracking-tight">
            AI Customer Operations
          </Link>
          <Link
            href="/knowledge-base"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Base de conhecimento
          </Link>
          <Link href="/analytics" className="text-sm text-muted-foreground hover:text-foreground">
            Analytics
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
          </div>
          <span className="text-sm text-muted-foreground">{session.user.name}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
