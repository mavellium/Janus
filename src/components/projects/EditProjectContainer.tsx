'use client'

import { useState } from 'react'
import { EditProjectModal } from './EditProjectModal'

interface EditProjectContainerProps {
  projectId: string
  initialName: string
  initialPreviewUrl?: string | null
  initialBlogEnabled?: boolean
  canManageBlog?: boolean
  companySlug: string
  trigger: React.ReactNode
}

export function EditProjectContainer({
  projectId,
  initialName,
  initialPreviewUrl,
  initialBlogEnabled,
  canManageBlog,
  companySlug,
  trigger,
}: EditProjectContainerProps) {
  const [open, setOpen] = useState(false)
  const [openCount, setOpenCount] = useState(0)

  function handleOpen() {
    setOpenCount((c) => c + 1)
    setOpen(true)
  }

  return (
    <>
      <div onClick={handleOpen} className="inline-block">
        {trigger}
      </div>
      {open && (
        <EditProjectModal
          key={`${projectId}-${openCount}`}
          projectId={projectId}
          initialName={initialName}
          initialPreviewUrl={initialPreviewUrl}
          initialBlogEnabled={initialBlogEnabled}
          canManageBlog={canManageBlog}
          companySlug={companySlug}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  )
}
