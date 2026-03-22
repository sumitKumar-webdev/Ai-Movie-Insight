"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";

type AuthRequiredModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextPath: string;
  title?: string;
  description?: string;
};

export default function AuthRequiredModal({
  open,
  onOpenChange,
  nextPath,
  title = "Sign in to keep going",
  description = "Create an account or log in to like reviews, add your own review, and join the conversation.",
}: AuthRequiredModalProps) {
  const encodedNext = encodeURIComponent(nextPath || "/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[1.75rem] border border-white/12 bg-[linear-gradient(180deg,#0a0f1a,#0f1727)] p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <DialogHeader className="text-left">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/18 bg-cyan-300/10 text-cyan-100">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <DialogTitle className="text-2xl font-semibold text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-white/65">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/8"
          >
            Maybe later
          </Button>
          <Button asChild type="button" className="rounded-full bg-white text-black hover:bg-cyan-50">
            <Link href={`/auth/login?next=${encodedNext}`}>Log in</Link>
          </Button>
          <Button asChild type="button" className="rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
            <Link href={`/auth/signup?next=${encodedNext}`}>Create account</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
