"use client";

import * as React from "react";
import { Toast as ToastPrimitive } from "radix-ui";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-[1.15rem] border px-3.5 py-3 pr-11 text-white shadow-[0_18px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all before:absolute before:inset-x-0 before:top-0 before:h-px before:content-[''] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
  {
    variants: {
      variant: {
        default:
          "border-cyan-300/18 bg-[radial-gradient(circle_at_top_left,rgba(94,216,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(22,152,255,0.12),transparent_38%),linear-gradient(180deg,rgba(12,18,27,0.97),rgba(6,10,16,0.94))] before:bg-cyan-200/14",
        success:
          "border-emerald-300/18 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.12),transparent_38%),linear-gradient(180deg,rgba(12,18,27,0.97),rgba(6,10,16,0.94))] before:bg-emerald-200/14",
        destructive:
          "border-rose-300/18 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,113,133,0.12),transparent_38%),linear-gradient(180deg,rgba(12,18,27,0.97),rgba(6,10,16,0.94))] before:bg-rose-200/14",
        warning:
          "border-amber-300/18 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.12),transparent_38%),linear-gradient(180deg,rgba(12,18,27,0.97),rgba(6,10,16,0.94))] before:bg-amber-200/14",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const iconWrapVariants = cva(
  "mt-0.5 inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border bg-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  {
    variants: {
      variant: {
        default: "border-cyan-300/22 bg-cyan-300/8 text-cyan-100",
        success: "border-emerald-300/22 bg-emerald-300/8 text-emerald-100",
        destructive: "border-rose-300/22 bg-rose-300/8 text-rose-100",
        warning: "border-amber-300/22 bg-amber-300/8 text-amber-100",
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
          "fixed top-3 right-0 z-400 flex max-h-screen w-full flex-col gap-2.5 p-3 sm:top-4 sm:max-w-[23rem] sm:p-4",
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
      className={cn("text-[0.9rem] font-semibold tracking-[-0.02em] text-white", className)}
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
      className={cn("mt-0.5 text-[0.82rem] leading-5 text-white/64", className)}
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
        "absolute top-2.5 right-2.5 rounded-full border border-white/8 bg-white/5 p-1 text-white/42 transition hover:bg-white/10 hover:text-white/72 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
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
