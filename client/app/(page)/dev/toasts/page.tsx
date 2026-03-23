"use client";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { toast } from "@/app/Hooks/use-toast";

const toastSamples = [
  {
    label: "Default Toast",
    title: "CineAI is ready",
    description: "A neutral toast for everyday updates and small confirmations.",
    variant: "default" as const,
  },
  {
    label: "Success Toast",
    title: "Saved successfully",
    description: "Your change was saved and the latest state is now live.",
    variant: "success" as const,
  },
  {
    label: "Error Toast",
    title: "Something went wrong",
    description: "We could not finish that action. Please try again in a moment.",
    variant: "destructive" as const,
  },
];

export default function ToastPreviewPage() {
  const fireStackedToasts = () => {
    toast({
      title: "Review published",
      description: "Your review is now visible to other CineAI users.",
      variant: "success",
      duration: 3500,
    });

    window.setTimeout(() => {
      toast({
        title: "Fresh recommendation ready",
        description: "CineAI found three more titles based on your last search.",
        variant: "default",
        duration: 4000,
      });
    }, 250);

    window.setTimeout(() => {
      toast({
        title: "Sync interrupted",
        description: "We lost connection for a moment. Retry when you are ready.",
        variant: "destructive",
        duration: 4500,
      });
    }, 500);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.08),transparent_28%),linear-gradient(180deg,#04070d,#090f18)] px-4 py-10 text-white md:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
            Temporary QA Page
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Toast Preview Lab</h1>
          <p className="max-w-2xl text-sm leading-6 text-white/70">
            Use this page to preview all toast states, spacing, contrast, and stacking behavior.
          </p>
        </div>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Single Toasts</CardTitle>
            <CardDescription className="text-white/60">
              Trigger each variant individually and inspect the visual treatment.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {toastSamples.map((sample) => (
              <Button
                key={sample.label}
                type="button"
                variant="outline"
                className="h-12 justify-center border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() =>
                  toast({
                    title: sample.title,
                    description: sample.description,
                    variant: sample.variant,
                    duration: 3500,
                  })
                }
              >
                {sample.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Stacked Preview</CardTitle>
            <CardDescription className="text-white/60">
              Fire multiple toasts in quick succession to review spacing and motion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              className="h-12 bg-[linear-gradient(135deg,#f8fafc,#dbeafe)] text-slate-950 hover:bg-white"
              onClick={fireStackedToasts}
            >
              Trigger Stacked Toasts
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
