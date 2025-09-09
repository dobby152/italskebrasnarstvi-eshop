import { DynamicDashboardContent } from "../lib/dynamic-imports"
import { LazyWrapper } from "../components/ui/lazy-wrapper"

export default function Home() {
  return (
    <LazyWrapper>
      <DynamicDashboardContent />
    </LazyWrapper>
  )
}
