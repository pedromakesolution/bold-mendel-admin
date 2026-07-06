'use client'

/**
 * TicketRealtimeListener
 *
 * Client Component que assina eventos INSERT da tabela support_tickets
 * via Supabase Realtime. Quando um novo ticket é criado, incrementa a
 * contagem global de tickets abertos sem precisar de polling ou refresh.
 *
 * Renderizado no layout do admin — vive enquanto o usuário navega.
 */

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useTicketCountStore } from '@/stores/ticketCountStore'

// Browser client (anon key) — apenas para Realtime subscription
const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export function TicketRealtimeListener() {
  const { increment, decrement } = useTicketCountStore()

  useEffect(() => {
    const channel = supabaseBrowser
      .channel('admin-support-tickets')
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'support_tickets',
        },
        () => {
          // Novo ticket aberto — incrementa o badge do sidebar
          increment()
        },
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'support_tickets',
        },
        (payload) => {
          const newStatus = payload.new?.status as string
          const oldStatus = payload.old?.status as string

          const wasOpen   = !['resolved', 'closed'].includes(oldStatus)
          const isNowDone = ['resolved', 'closed'].includes(newStatus)

          // Ticket resolvido/fechado — decrementa o badge
          if (wasOpen && isNowDone) decrement()
          // Ticket reaberto — incrementa
          if (!wasOpen && !isNowDone) increment()
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [increment, decrement])

  // Não renderiza nenhum elemento visível
  return null
}
