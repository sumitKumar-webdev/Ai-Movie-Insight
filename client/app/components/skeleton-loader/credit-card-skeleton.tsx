import { Skeleton } from "@/app/components/ui/skeleton";

export default function CreditCardSkeleton() {
  return (
    <div className="w-37.5 shrink-0 rounded-2xl p-3 text-center">
      <Skeleton className="mx-auto h-22 w-22 rounded-full bg-white/12" />
      <div className="mt-3 space-y-2">
        <Skeleton className="mx-auto h-5 w-28 bg-white/12" />
        <Skeleton className="mx-auto h-4 w-24 bg-white/10" />
      </div>
    </div>
  );
}
