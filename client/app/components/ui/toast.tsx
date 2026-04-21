"use client";

import * as React from "react";
import { Toast as ToastPrimitive } from "radix-ui";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start justify-between gap-4 overflow-hidden rounded-[24px] border p-4 pr-12 shadow-[0_22px_60px_rgba(15,23,42,0.18)] ring-1 ring-black/5 backdrop-blur-xl transition-all before:absolute before:inset-x-0 before:top-0 before:h-px before:opacity-80 before:content-[''] after:absolute after:top-0 after:left-0 after:h-full after:w-1.5 after:rounded-full after:content-[''] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
  {
    variants: {
      variant: {
        default:
          "border-sky-200/80 bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.55),transparent_36%),linear-gradient(155deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] text-slate-950 before:bg-white/80 after:bg-sky-400",
        success:
          "border-emerald-200/80 bg-[radial-gradient(circle_at_top_left,rgba(167,243,208,0.52),transparent_36%),linear-gradient(155deg,rgba(255,255,255,0.98),rgba(240,253,244,0.96))] text-slate-950 before:bg-white/80 after:bg-emerald-400",
        destructive:
          "border-rose-200/80 bg-[radial-gradient(circle_at_top_left,rgba(254,205,211,0.55),transparent_36%),linear-gradient(155deg,rgba(255,255,255,0.98),rgba(255,241,242,0.96))] text-slate-950 before:bg-white/80 after:bg-rose-400",
        warning:
          "border-amber-200/80 bg-[radial-gradient(circle_at_top_left,rgba(253,230,138,0.55),transparent_36%),linear-gradient(155deg,rgba(255,251,235,0.98),rgba(255,247,237,0.96))] text-slate-950 before:bg-white/80 after:bg-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const iconWrapVariants = cva(
  "mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_10px_22px_rgba(15,23,42,0.08)]",
  {
    variants: {
      variant: {
        default: "border-sky-200/90 bg-white/80 text-sky-600",
        success: "border-emerald-200/90 bg-white/80 text-emerald-600",
        destructive: "border-rose-200/90 bg-white/80 text-rose-500",
        warning: "border-amber-200/90 bg-white/80 text-amber-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function ToastProvider({
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Provider>) {
  return <ToastPrimitive.Provider swipeDirection="right" {...props} />;
}

function ToastViewport({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
      <ToastPrimitive.Viewport
        className={cn(
          "fixed top-0 right-0 z-400 flex max-h-screen w-full flex-col gap-3 p-4 sm:max-w-[28rem] sm:p-6",
          className,
        )}
        {...props}
    />
  );
}

function Toast({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> &
  VariantProps<typeof toastVariants>) {
  return (
    <ToastPrimitive.Root
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
}

function ToastIcon({
  variant,
}: {
  variant?: VariantProps<typeof toastVariants>["variant"];
}) {
  const resolvedVariant = variant ?? "default";
  const Icon =
    resolvedVariant === "success"
      ? CheckCircle2
      : resolvedVariant === "destructive"
        ? XCircle
        : resolvedVariant === "warning"
          ? AlertTriangle
          : Info;

  return (
    <span className={cn(iconWrapVariants({ variant: resolvedVariant }))}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

function ToastTitle({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title
      className={cn("text-[0.95rem] font-semibold tracking-[-0.02em] text-slate-950", className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description
      className={cn("mt-1 text-sm leading-5 text-slate-600", className)}
      {...props}
    />
  );
}

function ToastClose({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      className={cn(
        "absolute top-3 right-3 rounded-full border border-white/70 bg-white/70 p-1.5 text-slate-400 shadow-sm transition hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
        className,
      )}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </ToastPrimitive.Close>
  );
}

type ToastActionElement = React.ReactElement<typeof ToastPrimitive.Action>;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastIcon,
  type ToastActionElement,
  type VariantProps,
};
