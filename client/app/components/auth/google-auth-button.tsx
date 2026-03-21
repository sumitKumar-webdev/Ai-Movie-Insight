"use client";

import { useEffect, useRef, useState } from "react";
import { buildApiUrl } from "@/app/services/api-client";
import { AuthUser, setAuthenticatedUser } from "@/app/store/auth-store";

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

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
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

            const response = await fetch(buildApiUrl("/api/auth/google"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ idToken: credential }),
            });
            const payload = (await response.json()) as {
              error?: string;
              data?: { user?: AuthUser };
            };

            if (!response.ok || !payload.data?.user) {
              onError(payload.error ?? "Google sign-in failed");
              return;
            }

            setAuthenticatedUser(payload.data.user);
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
        width: 320,
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
  }, [mode, nextPath, onError]);

  return (
    <div className="space-y-2">
      <div ref={buttonRef} className={loading ? "pointer-events-none opacity-70" : ""} />
      {!ready ? <p className="text-sm text-slate-500">Loading Google sign-in...</p> : null}
    </div>
  );
}
