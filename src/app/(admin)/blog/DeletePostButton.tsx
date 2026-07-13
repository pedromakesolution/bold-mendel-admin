'use client'

import { Trash } from 'lucide-react'

export function DeletePostButton() {
  return (
    <button
      type="submit"
      title="Excluir permanentemente"
      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-900/50 hover:text-red-400"
      onClick={(e) => {
        if (!confirm('Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.')) {
          e.preventDefault()
        }
      }}
    >
      <Trash className="h-4 w-4" />
    </button>
  )
}
