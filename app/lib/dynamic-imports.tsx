"use client"

import DashboardContent from '../components/dashboard-content'

// Simple loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

// Direct export instead of dynamic import
export const DynamicDashboardContent = DashboardContent