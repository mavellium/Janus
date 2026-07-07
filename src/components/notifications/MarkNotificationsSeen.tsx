'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { markNotificationsSeen } from '@/modules/notifications/actions/markNotificationsSeen'

export function MarkNotificationsSeen({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter()
  const fired = useRef(false)

  useEffect(() => {
    if (!hasUnread || fired.current) return
    fired.current = true

    markNotificationsSeen().then((result) => {
      if (result.ok) router.refresh()
    })
  }, [hasUnread, router])

  return null
}
