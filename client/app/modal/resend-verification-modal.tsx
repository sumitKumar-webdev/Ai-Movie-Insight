"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { resendVerificationEmail } from "@/app/services/auth.service";

type ResendVerificationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export default function ResendVerificationModal({
  open,
  onOpenChange,
  initialEmail = "",
  onSuccess,
  onError,
}: ResendVerificationModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setEmail(initialEmail);
    setError("");
  }, [initialEmail, open]);

  const handleResend = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your registered email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await resendVerificationEmail(normalizedEmail);

      if (!response.status) {
        const message = response.message ?? "Unable to resend verification email.";
        setError(message);
        onError(message);
        return;
      }

      onOpenChange(false);
      onSuccess(response.message ?? "A new verification email has been sent.");
    } catch {
      const message = "Unable to resend verification email.";
      setError(message);
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950 p-6 text-white shadow-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold">Resend verification email</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-white/70">
            Enter your registered email and we&apos;ll send a fresh verification link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="resend-verification-email" className="text-sm font-medium text-white/85">
            Registered email
          </label>
          <Input
            id="resend-verification-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="h-11 border-white/12 bg-white/4 text-white placeholder:text-white/30"
          />
          {error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : null}
        </div>

        <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleResend()}
            className="bg-white text-black hover:bg-zinc-200"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </span>
            ) : (
              "Send email"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
