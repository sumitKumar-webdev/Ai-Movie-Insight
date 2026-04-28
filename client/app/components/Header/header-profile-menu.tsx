"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleHelp, LogOut, User } from "lucide-react";
import RenderAvatar from "@/app/components/avatar/render-avatar";
import VerifiedBadge from "@/app/components/verified-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { logoutUser, useAuthStore } from "@/app/store/store";
import { getProfileHref } from "@/lib/profile";

type HeaderProfileMenuProps = {
  triggerClassName?: string;
  avatarClassName?: string;
  menuClassName?: string;
};

export default function HeaderProfileMenu({
  triggerClassName,
  avatarClassName,
  menuClassName,
}: HeaderProfileMenuProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const authStatus = useAuthStore((auth) => auth.status);
  const user = useAuthStore((auth) => auth.user);

  const navigateTo = (href: string) => {
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutUser();
      window.location.assign("/");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open profile menu"
          className={triggerClassName}
        >
          {authStatus === "authenticated" && user ? (
            <RenderAvatar
              name={user.name || user.username || "User"}
              imageUrl={user.avatar}
              className={avatarClassName}
              initialsClassName="text-xs"
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className={menuClassName}>
        {authStatus === "authenticated" && user ? (
          <>
            <DropdownMenuLabel className="min-w-0 text-xs text-white/65">
              <div className="flex items-center gap-1.5">
                <span className="truncate">{user.name}</span>
                {user.isVerified ? (
                  <VerifiedBadge className="h-3.5 w-3.5 shrink-0" />
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => navigateTo(getProfileHref(user.username))}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => navigateTo("/support")}
              className="gap-2"
            >
              <CircleHelp className="h-4 w-4" />
              Support
            </DropdownMenuItem>
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
          <DropdownMenuItem
            onSelect={() => navigateTo("/auth/login")}
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-white hover:bg-gray-700"
          >
            Login
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
