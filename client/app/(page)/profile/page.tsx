"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileView from "@/app/(page)/profile/profile-view";
import { useAuthStore } from "@/app/store/store";
import { getProfileHref } from "@/lib/profile";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((auth) => auth.user);
  const status = useAuthStore((auth) => auth.status);

  useEffect(() => {
    if (status === "authenticated" && user?.username) {
      router.replace(getProfileHref(user.username));
    }
  }, [router, status, user?.username]);

  if (status === "unauthenticated") {
    return null;
  }

  if (user?.username) {
    return <ProfileView requestedUsername={user.username} />;
  }

  return <main className="box-border min-h-[calc(100vh-73px)] bg-[#050505]" />;
}
