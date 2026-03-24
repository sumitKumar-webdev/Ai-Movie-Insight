"use client";

import { useEffect } from "react";
import { fetchCurrentUser } from "@/app/store/store";

export default function AuthBootstrap() {
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return null;
}
