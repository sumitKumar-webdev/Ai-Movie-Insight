"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";

type DeleteConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
};

export default function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Are you sure you want to delete this item?",
  subtitle = "This action cannot be undone.",
  confirmLabel = "Delete",
}: DeleteConfirmModalProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950 p-6 text-white shadow-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold">{title.trim()}</DialogTitle>
          <DialogDescription className="text-sm text-white/70">
            {subtitle.trim()}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onConfirm()}
            className="bg-rose-500 text-white hover:bg-rose-400"
          >
            {confirmLabel || 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
