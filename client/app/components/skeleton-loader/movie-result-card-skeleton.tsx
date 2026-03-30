import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function MovieResultCardSkeleton() {
  return (
    <Card className="overflow-hidden border-white/12 bg-[#101010] py-0 shadow-none">
      <div className="flex items-center gap-3 p-2 sm:gap-3.5 sm:p-2.5">
        <Skeleton className="h-16 w-12 shrink-0 rounded-md bg-white/18 sm:h-20 sm:w-14" />

        <CardContent className="min-w-0 flex-1 space-y-2 p-0">          <Skeleton className="h-4 w-3/4 max-w-56 bg-white/20" />
          <Skeleton className="h-3 w-1/2 max-w-30 bg-white/16" />
        </CardContent>
      </div>
    </Card>
  );
}
