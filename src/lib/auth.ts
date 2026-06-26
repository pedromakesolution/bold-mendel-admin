/**
 * auth.ts
 *
 * Admin session helpers for Server Components, Server Actions,
 * and Route Handlers.
 *
 * requireAdminSession() is the single guard function called at the
 * top of every protected Server Action and layout. It:
 *   1. Reads the current Supabase session from cookies
 *   2. Verifies the user exists in user_roles with role = 'super_admin'
 *      (checked via the is_super_admin() SECURITY DEFINER function)
 *   3. Redirects to /login if either check fails
 *
 * The check uses the anon client (respects RLS), but is_super_admin()
 * is a SECURITY DEFINER function that bypasses RLS internally,
 * so the anon client can still call it safely.
 */
import { redirect } from 'next/navigation'
import { createBrowserClient } from './supabase-browser'
import { createAdminClient } from './supabase-admin'
import type { User } from '@supabase/supabase-js'

export type AdminSession = {
  user: User
}

/**
 * Verifies the current request has a valid admin session.
 * Redirects to /login if not authenticated or not a super_admin.
 *
 * @returns AdminSession with the authenticated admin User
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const supabase = await createBrowserClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Verify admin role using service_role client to bypass RLS on user_roles
  const adminClient = createAdminClient()
  const { data: roleRow } = await adminClient
    .from('user_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('role', 'super_admin')
    .maybeSingle()

  if (!roleRow) {
    // Authenticated but not an admin — redirect to login with error
    redirect('/login?error=unauthorized')
  }

  return { user }
}
