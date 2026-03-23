"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  title = "Join the conversation",
  description = "Log in or create an account to post reviews, like reactions, and keep your movie activity in sync.",
}: AuthRequiredModalProps) {
  const encodedNext = encodeURIComponent(nextPath || "/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-1.5rem)] max-w-lg gap-0 overflow-hidden border-white/10 bg-[linear-gradient(180deg,#050505,#101010)] text-white shadow-[0_30px_120px_rgba(0,0,0,0.72)] sm:rounded-lg -p-4"
      >
        <div className="border-b border-white/8 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] sm:h-14 sm:w-14">
              <LockKeyhole className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="font-medium uppercase tracking-[0.22em] text-white/50">
                Locked Content
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4 sm:px-7 sm:pb-7 sm:pt-5">
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="text-2xl font-medium tracking-[-0.03em] text-white sm:text-[2rem]">
              {title}
            </DialogTitle>
            <DialogDescription className="max-w-[24rem] text-sm leading-6 text-zinc-300 sm:text-[0.95rem]">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-white/00 p-4 sm:mt-6 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-300">
              Account access
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Unlock reviews, replies, likes, and a personalized experience across the app.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2">
            <Button
              asChild
              type="button"
              className="h-12 rounded-full border border-white/12 bg-white text-black hover:bg-zinc-200"
            >
              <Link href={`/auth/login?next=${encodedNext}`}>Log in</Link>
            </Button>
            <Button
              asChild
              type="button"
              className="h-12 rounded-full border border-white/14 bg-white/6 text-white hover:bg-white/10"
            >
              <Link
                href={`/auth/signup?next=${encodedNext}`}
                className="flex items-center justify-center gap-2"
              >
                Sign up
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
