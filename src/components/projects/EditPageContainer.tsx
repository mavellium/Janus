'use client'

import { useState } from 'react'
import { EditPageModal } from './EditPageModal'

interface EditPageContainerProps {
  pageId: string
  initialName: string
  initialSlug: string
  initialPreviewUrl?: string
  projectId: string
  trigger: React.ReactNode
}

export function EditPageContainer({
  pageId,
  initialName,
  initialSlug,
  initialPreviewUrl,
  projectId,
  trigger,
}: EditPageContainerProps) {
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
        <EditPageModal
          key={`${pageId}-${openCount}`}
          pageId={pageId}
          initialName={initialName}
          initialSlug={initialSlug}
          initialPreviewUrl={initialPreviewUrl}
          projectId={projectId}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  )
}
