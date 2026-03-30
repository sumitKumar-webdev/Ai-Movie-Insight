import { Skeleton } from "@/app/components/ui/skeleton";

function ChipRow({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-6 rounded-full bg-white/8 ${index === 0 ? "w-18" : "w-16"}`}
        />
      ))}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-lg bg-white/8" />
        <Skeleton className="h-3 w-28 bg-white/8" />
      </div>
      <ChipRow />
    </div>
  );
}

export default function InterestPanelSkeleton() {
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[1.2rem] border border-white/8 bg-[#0d0e12] shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
        <div className="border-b border-white/8 px-4 py-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-xl bg-white/8" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-20 bg-white/8" />
              <Skeleton className="h-5 w-28 bg-white/8" />
            </div>
            <Skeleton className="h-9 w-9 rounded-[0.85rem] bg-white/8" />
          </div>

          <div className="mt-2">
            <Skeleton className="h-4 w-11/12 bg-white/8" />
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-sm bg-white/8" />
                  <Skeleton className="h-3 w-18 bg-white/8" />
                </div>
                <Skeleton className="h-6 w-10 bg-white/8" />
              </div>
              <Skeleton className="mt-2 h-3 w-24 bg-white/8" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <Skeleton className="h-3 w-18 bg-white/8" />
                <Skeleton className="mt-2 h-4 w-24 bg-white/8" />
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <Skeleton className="h-3 w-16 bg-white/8" />
                <Skeleton className="mt-2 h-4 w-20 bg-white/8" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <SectionSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      </div>
    </div>
  );
}
