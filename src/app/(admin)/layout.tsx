import { requireAdminSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
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
  const session = await requireAdminSession()

  // Fetch admin profile for display in the sidebar
  const supabase = createAdminClient()
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <AdminSidebar
        adminName={adminProfile?.full_name ?? session.user.email ?? 'Admin'}
        adminEmail={adminProfile?.email ?? session.user.email ?? ''}
      />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto"
      >
        {children}
      </main>
    </div>
  )
}
