import { redirect } from 'next/navigation'

/**
 * Root page — redirects to /dashboard.
 * The actual auth guard is in (admin)/layout.tsx.
 */
export default function RootPage() {
  redirect('/dashboard')
}
