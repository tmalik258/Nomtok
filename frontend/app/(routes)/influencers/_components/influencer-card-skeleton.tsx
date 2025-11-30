import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const InfluencerCardSkeleton = () => {
  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-none shadow-lg hover:-translate-y-2 py-0">
      <CardContent className="p-4 border-none">
        {/* Card Header with Banner */}
        <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500 relative rounded-xl mb-2">
          <Skeleton className="absolute -bottom-8 left-4 w-16 h-16 rounded-full border-4 border-white" />
        </div>
        <div className="pt-8 px-2">
          <div className="mb-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-16 w-full mb-6" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-12 rounded-xl" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default InfluencerCardSkeleton