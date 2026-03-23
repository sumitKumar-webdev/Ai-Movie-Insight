import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Sentiment } from "@/app/modal/service.modal";

type AIInsightCardProps = {
  loading: boolean;
  data: { sentiment: Sentiment; summary: string; confidence: number } | null;
  error?: string | null;
};

const sentimentTone = (sentiment: Sentiment): string => {
  if (sentiment === "Positive")
    return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
  if (sentiment === "Negative")
    return "bg-rose-500/15 text-rose-300 border-rose-400/30";
  if (sentiment === "NoReviews")
    return "border-brand-primary-soft bg-brand-primary-soft text-brand-primary";
  return "bg-amber-500/15 text-amber-300 border-amber-400/30";
};

const AIInsightCard = ({ loading, data, error }: AIInsightCardProps) => {
  return (
    <Card className="border-white/10 bg-white/3 text-white">
      <CardHeader>
        {loading ? (
          <Skeleton className="h-8 w-28 bg-white/12" />
        ) : (
          <CardTitle className="text-xl md:text-2xl">AI Insight</CardTitle>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-8 w-36 rounded-full bg-white/12" />
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-4 w-full bg-white/12" />
            ))}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 bg-white/12" />
                <Skeleton className="h-4 w-10 bg-white/12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full bg-white/12" />
            </div>
          </>
        ) : error ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : (
          <>
            <Badge
              className={`rounded-full border px-4 py-1 text-sm ${sentimentTone(data?.sentiment ?? "Positive")}`}
            >
              {data?.sentiment} Sentiment
            </Badge>
            <p className="text-sm leading-7 text-white/85">{data?.summary}</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Confidence</span>
                <span>{Math.round((data?.confidence ?? 0) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="bg-brand-primary h-2 rounded-full"
                  style={{
                    width: `${Math.round((data?.confidence ?? 0) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsightCard;
