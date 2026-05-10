'use client'

import { Settings } from 'lucide-react'

export function EditProjectButton() {
  return (
    <button
      className="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition flex items-center justify-center gap-2"
      style={{ backgroundColor: '#514030' }}
    >
      <Settings className="w-3 h-3" />
      Editar
    </button>
  )
}
