import dynamic from 'next/dynamic'

// Simple loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

// Heavy components that should be dynamically imported
export const DynamicDashboardContent = dynamic(
  () => import('../components/dashboard-content'),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
)