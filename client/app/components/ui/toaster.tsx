"use client";

import { useEffect, useState } from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastIcon,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/app/components/ui/toast";
import { AppToast, getToastEventName } from "@/app/Hooks/use-toast";

type ToastItem = AppToast & {
  id: string;
  open: boolean;
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const eventName = getToastEventName();

    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<AppToast>;
      const nextToast: ToastItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        open: true,
        duration: 4000,
        variant: customEvent.detail.variant ?? "default",
        title: customEvent.detail.title,
        description: customEvent.detail.description,
      };

      setToasts((current) => [...current, nextToast]);
    };

    window.addEventListener(eventName, handleToast as EventListener);
    return () => {
      window.removeEventListener(eventName, handleToast as EventListener);
    };
  }, []);

  return (
    <ToastProvider duration={4500}>
      {toasts.map((item) => (
        <Toast
          key={item.id}
          open={item.open}
          duration={item.duration}
          variant={item.variant}
          onOpenChange={(open) => {
            setToasts((current) =>
              current.map((toast) => (toast.id === item.id ? { ...toast, open } : toast)),
            );

            if (!open) {
              window.setTimeout(() => {
                setToasts((current) => current.filter((toast) => toast.id !== item.id));
              }, 220);
            }
          }}
        >
          <div className="flex min-w-0 items-start gap-3.5">
            <ToastIcon variant={item.variant} />
            <div className="min-w-0 flex-1">
              <ToastTitle>{item.title}</ToastTitle>
              {item.description ? <ToastDescription>{item.description}</ToastDescription> : null}
            </div>
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
