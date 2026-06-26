'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createBrowserClient } from '@/lib/supabase-browser'
import { createAdminClient } from '@/lib/supabase-admin'

export type LoginState =
  | { error: string }
  | undefined

/**
 * Server Action: login
 * Authenticates an admin user via email/password.
 * After successful auth, verifies the user is a super_admin
 * before allowing access to the portal.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email e senha são obrigatórios.' }
  }

  const supabase = await createBrowserClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: 'Credenciais inválidas. Verifique seu email e senha.' }
  }

  // Verify super_admin role using service_role (bypasses RLS on user_roles)
  const adminClient = createAdminClient()
  const { data: roleRow } = await adminClient
    .from('user_roles')
    .select('id')
    .eq('user_id', data.user.id)
    .eq('role', 'super_admin')
    .maybeSingle()

  if (!roleRow) {
    // Valid Supabase user but not an admin — sign out and deny
    await supabase.auth.signOut()
    return { error: 'Acesso negado. Sua conta não tem permissão de administrador.' }
  }

  // redirect() must be called outside try/catch — it throws internally
  redirect('/dashboard')
}

/**
 * Server Action: signOut
 * Signs the current admin out of Supabase and redirects to /login.
 * Declared here (in a 'use server' module) so Client Components
 * (e.g. AdminSidebar) can import it without pulling in next/headers.
 */
export async function signOut() {
  const supabase = await createBrowserClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
