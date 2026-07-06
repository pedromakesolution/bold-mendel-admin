/**
 * ticketCountStore
 *
 * Zustand store que mantém a contagem de tickets abertos no admin.
 * Alimentado inicialmente pelo server-side fetch do layout e atualizado
 * em tempo real pelo TicketRealtimeListener (Client Component).
 */

import { create } from 'zustand'

interface TicketCountState {
  count: number
  setCount: (n: number) => void
  increment: () => void
  decrement: () => void
}

export const useTicketCountStore = create<TicketCountState>((set) => ({
  count: 0,
  setCount:  (n)  => set({ count: Math.max(0, n) }),
  increment: ()   => set((s) => ({ count: s.count + 1 })),
  decrement: ()   => set((s) => ({ count: Math.max(0, s.count - 1) })),
}))
