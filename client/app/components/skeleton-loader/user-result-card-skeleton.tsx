import { Skeleton } from "@/app/components/ui/skeleton";

export default function UserResultCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[1.15rem] border border-white/8 bg-[#101010] px-3 py-3">
      <Skeleton className="h-11 w-11 rounded-full bg-white/10" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-28 bg-white/10" />
        <Skeleton className="mt-2 h-3.5 w-20 bg-white/8" />
      </div>
    </div>
  );
}
