import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getLoginLogs } from '@/modules/admin/queries/getLoginLogs'
import { getBlockedIps } from '@/modules/admin/queries/getBlockedIps'
import { getAuditLogs } from '@/modules/admin/queries/getAuditLogs'
import { AdminLogsClient } from './AdminLogsClient'

export const metadata = { title: 'Auditoria & Logs — Admin' }

export default async function AdminLogsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [logs, blockedIps, auditLogs] = await Promise.all([
    getLoginLogs(200),
    getBlockedIps(),
    getAuditLogs(500),
  ])

  return (
    <AdminLogsClient
      logs={logs}
      blockedIps={blockedIps}
      auditLogs={auditLogs}
    />
  )
}
