"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/store";

export default function ResetPasswordPage() {
  const router = useRouter();
  const status = useAuthStore((auth) => auth.status);
  const userId = useAuthStore((auth) => auth.user?.id);

  useEffect(() => {
    if (status === "idle" || status === "loading") {
      return;
    }

    if (status === "authenticated" && userId) {
      router.replace("/home");
      return;
    }

    const redirect = () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token")?.trim();
      const next = params.get("next")?.trim() || "/home";
      const query = new URLSearchParams();

      if (token) {
        query.set("token", token);
      }

      if (next.startsWith("/")) {
        query.set("next", next);
      }

      const target = query.size
        ? `/auth/forgot-password?${query.toString()}`
        : "/auth/forgot-password";

      router.replace(target);
    };

    redirect();
  }, [router, status, userId]);

  return null;
}
