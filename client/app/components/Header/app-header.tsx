"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Film, LogOut, UserCircle2 } from "lucide-react";
import { logoutUser, useAuthStore } from "@/app/store/auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const authStatus = useAuthStore((auth) => auth.status);
  const user = useAuthStore((auth) => auth.user);

  const isHome = pathname === "/";
  const isAuthPage = pathname?.startsWith("/auth/");

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutUser();
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLoginNavigation = () => {
    router.push("/auth/login");
  };

  if (isHome || isAuthPage) return null;

  return (
    <>
      <header className="relative z-100 bg-black backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-white/90 transition hover:text-white"
          >
            <Film className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wide sm:text-base">
              Movie Insight
            </span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open profile menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              >
                <UserCircle2 className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              {authStatus === "authenticated" && user ? (
                <>
                  <DropdownMenuLabel className="truncate text-xs text-white/65">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => void handleLogout()}
                    disabled={loggingOut}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {loggingOut ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={handleLoginNavigation} className=" px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                  Login
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
