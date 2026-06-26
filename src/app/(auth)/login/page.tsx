import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Login — Freela Dock Admin',
  description: 'Acesso restrito ao Portal Administrativo do Freela Dock.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Portal Admin
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Freela Dock — Acesso Restrito
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
          {error === 'unauthorized' && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-amber-800 bg-amber-950/50 px-3 py-2 text-sm text-amber-400"
            >
              Sua sessão expirou ou você não tem acesso de administrador.
            </div>
          )}

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Acesso protegido por Cloudflare Access + Supabase Auth
        </p>
      </div>
    </main>
  )
}
