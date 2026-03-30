import { Skeleton } from "@/app/components/ui/skeleton";

export default function MovieCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[0.7rem] border border-white/10 bg-[#17171a62]">
      <Skeleton className="aspect-[0.76] w-full rounded-none bg-white/6" />
      <div className="space-y-1.5 px-2 py-1.5">
        <Skeleton className="h-4 w-4/5 bg-white/8 md:h-5" />
        <div className="mt-1 flex items-center gap-2">
          <Skeleton className="h-3 w-10 bg-white/8" />
          <Skeleton className="h-5 w-16 rounded-full bg-white/8" />
        </div>
      </div>
    </div>
  );
}
