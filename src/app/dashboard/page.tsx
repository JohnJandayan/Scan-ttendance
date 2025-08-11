import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import OrganizationDashboard from '@/components/dashboard/OrganizationDashboard'

export default function DashboardPage() {
  // TODO: Get organization data from authentication context
  const organizationName = "Sample Organization"
  const organizationId = "sample-org-id"

  return (
    <ProtectedRoute>
      <AppLayout>
        <OrganizationDashboard 
          organizationName={organizationName}
          organizationId={organizationId}
        />
      </AppLayout>
    </ProtectedRoute>
  )
}