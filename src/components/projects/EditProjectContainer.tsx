'use client'

import { useState } from 'react'
import { EditProjectModal } from './EditProjectModal'

interface EditProjectContainerProps {
  projectId: string
  initialName: string
  companySlug: string
  trigger: React.ReactNode
}

export function EditProjectContainer({
  projectId,
  initialName,
  companySlug,
  trigger,
}: EditProjectContainerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger}
      </div>
      {open && (
        <EditProjectModal
          projectId={projectId}
          initialName={initialName}
          companySlug={companySlug}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  )
}
