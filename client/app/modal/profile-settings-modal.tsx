"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import useDebounce from "@/app/Hooks/use-debounce";
import { toast } from "@/app/Hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { checkUserName, saveProfile } from "@/app/services/auth.service";
import type { AuthUser } from "@/app/store/auth-slice";
import { setAuthenticatedUser } from "@/app/store/store";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

type ProfileSettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser | null;
};

type UsernameStatus = "idle" | "invalid" | "checking" | "available" | "taken";

export default function ProfileSettingsModal({
  open,
  onOpenChange,
  user,
}: ProfileSettingsModalProps) {
  const currentName = user?.name ?? "";
  const currentUsername = user?.username ?? "";

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState("");

  const normalizedName = fullName.trim();
  const normalizedUsername = username.trim();
  const debouncedUsername = useDebounce(normalizedUsername, 300);

  const isDirty =
    normalizedName !== currentName || normalizedUsername !== currentUsername;

  useEffect(() => {
    if (!open) return;

    setFullName(currentName);
    setUsername(currentUsername);
    setError("");
    setUsernameStatus("idle");
    setUsernameMessage("");
  }, [open, currentName, currentUsername]);

  useEffect(() => {
    if (!open) return;

    if (!debouncedUsername) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (debouncedUsername === currentUsername) {
      setUsernameStatus("available");
      setUsernameMessage("");
      return;
    }

    if (!USERNAME_PATTERN.test(debouncedUsername)) {
      setUsernameStatus("invalid");
      setUsernameMessage("Use 3-20 letters, numbers, or underscores.");
      return;
    }

    const runCheck = async () => {
      setUsernameStatus("checking");
      setUsernameMessage("");

      try {
        const payload = (await checkUserName(debouncedUsername)) as {
          error?: string;
          data?: {
            available?: boolean;
            reason?: string;
          };
        };

        if (payload.data?.available) {
          setUsernameStatus("available");
          setUsernameMessage("");
        } else {
          setUsernameStatus("taken");
          setUsernameMessage(
            payload.data?.reason ?? payload.error ?? "Username already exists.",
          );
        }
      } catch {
        setUsernameStatus("invalid");
        setUsernameMessage("Unable to check username right now.");
      }
    };
 runCheck();
  }, [debouncedUsername, open, currentUsername]);

  const handleSave = async () => {
    if (!normalizedName) {
      setError("Full name is required.");
      return;
    }

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setError("Please choose a valid username.");
      return;
    }

    if (usernameStatus === "checking") {
      setError("Username is still being checked.");
      return;
    }

    if (usernameStatus === "invalid" || usernameStatus === "taken") {
      setError("Please choose a different username.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const result = await saveProfile({
        name: normalizedName,
        username: normalizedUsername,
      });

      if (!result.ok || !result.user) {
        const message = result.message || "Profile update failed.";
        setError(message);
        toast({
          title: "Profile update failed",
          description: message,
          variant: "destructive",
        });
        return;
      }

      setAuthenticatedUser(result.user);
      onOpenChange(false);

      toast({
        title: "Profile updated",
        description: "Your name and username were saved successfully.",
        variant: "success",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/80 backdrop-blur-[2px]"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#090d12] p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.7)]"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-semibold text-white">
            Profile settings
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-white/60">
            Update your display name and username for your CineAI profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="profile-name-modal"
              className="text-sm font-medium text-white/82"
            >
              Full name
            </label>
            <Input
              id="profile-name-modal"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your name"
              className="h-11 rounded-xl border-white/12 bg-white/4 text-white placeholder:text-white/30"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="profile-username-modal"
              className="text-sm font-medium text-white/82"
            >
              Username
            </label>

            <div className="relative">
              <Input
                id="profile-username-modal"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="moviefan"
                className={`h-11 rounded-xl border-white/12 bg-white/4 pr-11 text-white placeholder:text-white/30 ${
                  usernameStatus === "available"
                    ? "border-green-400/70 focus-visible:border-green-400 focus-visible:ring-green-400/20"
                    : ""
                }`}
              />

              {usernameStatus === "checking" && (
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/45">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              )}

              {usernameStatus === "available" && (
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-green-300">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              )}
            </div>

             {usernameMessage && usernameStatus !== "available" && usernameStatus !== "checking" && (
               <p className="text-sm text-rose-300">
                 {usernameMessage}
               </p>
             )}
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <p className="rounded-xl border border-cyan-400/15 bg-cyan-400/8 px-3 py-2 text-xs leading-5 text-cyan-100/85">
            Profile photo and extra profile customization will be included in
            coming versions.
          </p>
        </div>

        <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/12 bg-transparent text-white hover:bg-white/8"
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!isDirty || saving || usernameStatus === "checking"}
            className="bg-white text-black hover:bg-zinc-200"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
