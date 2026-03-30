"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser, getAuthStoreState } from "@/app/store/store";

export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const currentUser = getAuthStoreState().user ?? await fetchCurrentUser();
      if (currentUser?.id) {
        router.replace("/home");
        return;
      }

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

    void redirect();
  }, [router]);

  return null;
}
