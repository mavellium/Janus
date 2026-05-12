import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getLoginLogs } from '@/modules/admin/queries/getLoginLogs'
import { getBlockedIps } from '@/modules/admin/queries/getBlockedIps'
import { AdminLogsClient } from './AdminLogsClient'

export const metadata = { title: 'Logs — Admin' }

export default async function AdminLogsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [logs, blockedIps] = await Promise.all([
    getLoginLogs(200),
    getBlockedIps(),
  ])

  return <AdminLogsClient logs={logs} blockedIps={blockedIps} />
}
