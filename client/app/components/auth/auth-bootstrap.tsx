"use client";

import { useEffect } from "react";
import { fetchCurrentUser } from "@/app/store/auth-store";

export default function AuthBootstrap() {
  useEffect(() => {
    void fetchCurrentUser();
  }, []);

  return null;
}
