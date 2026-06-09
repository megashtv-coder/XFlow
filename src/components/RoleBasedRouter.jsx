import { useTenant } from '../context/TenantContext'
import { useApp } from '../context/AppContext'
import { LoadingSkeleton } from './UI'

/**
 * RoleBasedRouter - Routes to appropriate interface based on user role
 * All users (regular users and super admins) use the organization app
 */
export default function RoleBasedRouter({ AppLayout }) {
  const { loading: tenantLoading } = useTenant()
  const { loading: appLoading } = useApp()

  if (tenantLoading || appLoading) {
    return <LoadingSkeleton />
  }

  return <AppLayout />
}
