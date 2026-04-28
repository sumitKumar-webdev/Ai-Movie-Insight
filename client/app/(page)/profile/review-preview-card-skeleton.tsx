import { Skeleton } from "@/app/components/ui/skeleton";

export default function ReviewPreviewCardSkeleton() {
  return (
    <div className="rounded-[0.95rem] border border-white/8 bg-[#0f0f0f] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="mx-auto aspect-[0.7] w-full max-w-[132px] rounded-[0.7rem] bg-white/8 sm:mx-0 sm:h-[148px] sm:w-[102px] sm:max-w-none sm:aspect-auto lg:h-[180px] lg:w-[124px]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="mt-4 h-7 w-2/3 bg-white/8" />
            </div>
            <Skeleton className="h-8 w-full rounded-md bg-white/8 sm:w-24" />
          </div>
          <Skeleton className="mt-4 h-4 w-full bg-white/8" />
          <Skeleton className="mt-2 h-4 w-11/12 bg-white/8" />
          <Skeleton className="mt-2 h-4 w-9/12 bg-white/8" />
          <div className="mt-5 flex justify-center gap-3 border-t border-white/6 pt-4 sm:justify-start">
            <Skeleton className="h-4 w-12 bg-white/8" />
            <Skeleton className="h-4 w-12 bg-white/8" />
            <Skeleton className="h-4 w-24 bg-white/8" />
          </div>
        </div>
      </div>
    </div>
  );
}
