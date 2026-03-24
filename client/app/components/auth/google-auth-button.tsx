"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/app/services/api-client";
import { fetchCurrentUser } from "@/app/store/auth-store";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

type GoogleAuthButtonProps = {
  mode: "login" | "signup";
  nextPath: string;
  onError: (message: string) => void;
};

const GOOGLE_SCRIPT_ID = "google-identity-services";

export function GoogleAuthButton({ mode, nextPath, onError }: GoogleAuthButtonProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(320);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setReady(false);
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) {
            onError("Google sign-in failed");
            return;
          }

          try {
            setLoading(true);
            onError("");

            const response = await apiFetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: credential }),
            });
            const payload = (await response.json()) as {
              error?: string;
              data?: { user?: unknown };
            };

            if (!response.ok) {
              onError(payload.error ?? "Google sign-in failed");
              return;
            }

            const user = await fetchCurrentUser(true);
            if (!user) {
              onError("Google sign-in succeeded, but your browser did not keep the session.");
              return;
            }

            window.location.assign(nextPath);
          } catch {
            onError("Google sign-in failed");
          } finally {
            setLoading(false);
          }
        },
      });

      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: mode === "login" ? "signin_with" : "signup_with",
        shape: "rectangular",
        width: buttonWidth,
      });
      setReady(true);
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if (window.google?.accounts?.id) {
        initializeGoogle();
      } else {
        existingScript.addEventListener("load", initializeGoogle, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [buttonWidth, mode, nextPath, onError]);

  useEffect(() => {
    const updateWidth = () => {
      const nextWidth = buttonRef.current?.parentElement?.clientWidth ?? 320;
      setButtonWidth(Math.max(220, Math.min(400, Math.floor(nextWidth))));
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    if (buttonRef.current?.parentElement) {
      observer.observe(buttonRef.current.parentElement);
    }

    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Google sign-in is not available right now. Please use email and password to continue.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={buttonRef}
        className={loading ? "pointer-events-none opacity-70" : ""}
      />
      {!ready ? <p className="text-sm text-slate-500">Loading Google sign-in...</p> : null}
    </div>
  );
}
