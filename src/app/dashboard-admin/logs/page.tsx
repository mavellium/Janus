import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { pruneAuditLogs } from '@/lib/audit-logger'
import { getLoginLogs } from '@/modules/admin/queries/getLoginLogs'
import { getBlockedIps } from '@/modules/admin/queries/getBlockedIps'
import {
  getAuditLogs,
  getAuditCompanies,
} from '@/modules/admin/queries/getAuditLogs'
import { getAuditStats } from '@/modules/admin/queries/getAuditStats'
import { AdminLogsClient } from './AdminLogsClient'

export const metadata = { title: 'Auditoria & Logs — Admin' }

export default async function AdminLogsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/')

  await pruneAuditLogs()

  const [logs, blockedIps, audit, auditStats, auditCompanies] =
    await Promise.all([
      getLoginLogs(200),
      getBlockedIps(),
      getAuditLogs(),
      getAuditStats(),
      getAuditCompanies(),
    ])

  return (
    <AdminLogsClient
      logs={logs}
      blockedIps={blockedIps}
      auditLogs={audit.logs}
      auditTotalCount={audit.totalCount}
      auditStats={auditStats}
      auditCompanies={auditCompanies}
    />
  )
}
