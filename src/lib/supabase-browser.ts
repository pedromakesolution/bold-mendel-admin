/**
 * supabase-browser.ts
 *
 * Creates a Supabase client using the anon key.
 * Used on the server to read the admin's authenticated session
 * via cookies (set by @supabase/ssr).
 *
 * This client RESPECTS Row Level Security.
 * It is used exclusively to:
 *   - Read the current admin session (who is logged in)
 *   - Perform the sign-in / sign-out flows
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Creates a Supabase client that reads cookies for session management.
 * Must be called inside a Server Component, Server Action, or Route Handler.
 */
export async function createBrowserClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // setAll may throw in Server Components (read-only context).
          // This is expected and safe to ignore — cookie writes happen
          // only in Server Actions and Route Handlers.
        }
      },
    },
  })
}
