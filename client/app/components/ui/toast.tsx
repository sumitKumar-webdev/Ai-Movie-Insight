"use client";

import * as React from "react";
import { Toast as ToastPrimitive } from "radix-ui";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-lg border bg-white p-2 pr-10 shadow-[0_16px_35px_rgba(15,23,42,0.08)] transition-all before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-[''] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
  {
    variants: {
      variant: {
        default:
          "border-sky-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] text-slate-950",
        success:
          "border-emerald-200 bg-[linear-gradient(180deg,#ffffff,#f3fdf8)] text-slate-950",
        destructive:
          "border-rose-200 bg-[linear-gradient(180deg,#ffffff,#fff5f6)] text-slate-950",
        warning:
          "border-amber-200 bg-[linear-gradient(180deg,#ffffff,#fffaf0)] text-slate-950",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const iconWrapVariants = cva(
  "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
  {
    variants: {
      variant: {
        default: "border-sky-200 bg-sky-50 text-sky-600",
        success: "border-emerald-200 bg-emerald-50 text-emerald-600",
        destructive: "border-rose-200 bg-rose-50 text-rose-500",
        warning: "border-amber-200 bg-amber-50 text-amber-500",
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
        "fixed top-0 right-0 z-400 flex max-h-screen w-full flex-col gap-3 p-4 sm:max-w-[26rem]",
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
      className={cn("text-sm md:text-base font-semibold tracking-[-0.01em]", className)}
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
      className={cn("mt-1 text-xs md:text-sm leading-5 text-slate-500", className)}
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
        "absolute top-3 right-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
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
