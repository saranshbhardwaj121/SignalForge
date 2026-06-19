import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SignalsHeroSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-8">
        <Skeleton className="h-8 w-28 rounded-full mb-2" />
        <Skeleton className="h-4 w-16 mb-4" />
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-48 mt-4" />
      </CardContent>
    </Card>
  );
}

export function SignalsBreakdownSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SignalsWatchlistSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
