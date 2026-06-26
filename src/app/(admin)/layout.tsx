import { requireAdminSession } from '@/lib/auth'
import AdminSidebar from '@/components/layout/AdminSidebar'

/**
 * Admin layout — root layout for all protected /admin routes.
 *
 * requireAdminSession() is called at the top of every render cycle.
 * If the user is not authenticated or not a super_admin, it redirects
 * to /login before any children are rendered.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth guard — redirects to /login if not an authenticated super_admin
  await requireAdminSession()

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <AdminSidebar />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto"
      >
        {children}
      </main>
    </div>
  )
}
