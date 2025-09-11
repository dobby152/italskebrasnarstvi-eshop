import { cn } from "../../lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function FilterSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Filter title skeleton */}
      <Skeleton className="h-6 w-16" />
      
      {/* Filter sections */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-3">
          {/* Section title */}
          <Skeleton className="h-4 w-20" />
          
          {/* Filter options */}
          <div className="space-y-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Price range skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-4">
          {/* Product image */}
          <Skeleton className="aspect-square w-full rounded-lg" />
          
          {/* Product info */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export { Skeleton, FilterSkeleton, ProductGridSkeleton }