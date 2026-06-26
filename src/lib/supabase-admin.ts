/**
 * supabase-admin.ts
 *
 * Creates a Supabase client with the SERVICE_ROLE key.
 * This client BYPASSES Row Level Security and has full database access.
 *
 * ⚠️  NEVER import this file in Client Components or expose it via
 *     NEXT_PUBLIC_ environment variables. It must only be used in:
 *     - Server Actions ('use server')
 *     - Route Handlers (app/api/**)
 *     - Server Components
 */
import { createClient } from '@supabase/supabase-js'

/**
 * Returns a new Supabase client with service_role privileges.
 * Call this inside Server Actions/Route Handlers — never at module level.
 *
 * Validation is intentionally deferred to call-time so that
 * Next.js can perform static build analysis without env vars present.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables.\n' +
      'Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
