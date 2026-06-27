
import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-display',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Freela Dock Admin',
  description: 'Portal Administrativo — Freela Dock',
  robots: { index: false, follow: false }, // never index admin panel
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  )
}
