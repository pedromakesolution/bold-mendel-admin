import { requireAdminSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { TicketRealtimeListener } from '@/components/realtime/TicketRealtimeListener'

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

  const supabase = createAdminClient()

  // Fetch admin profile and initial open ticket count in parallel
  const [{ data: adminProfile }, { count: openTicketCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('id', session.user.id)
      .single(),

    // Tickets abertos sem admin atribuído — alimenta o badge inicial da sidebar
    supabase
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress', 'waiting_user']),
  ])

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <AdminSidebar
        adminName={adminProfile?.full_name ?? session.user.email ?? 'Admin'}
        adminEmail={adminProfile?.email ?? session.user.email ?? ''}
        initialOpenTicketCount={openTicketCount ?? 0}
      />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto pb-20 md:pb-0"
      >
        {/* TicketRealtimeListener mantém o badge atualizado em tempo real
            sem polling — é um Client Component invisível */}
        <TicketRealtimeListener />
        {children}
      </main>
    </div>
  )
}
