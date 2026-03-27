"use client";

import React from "react";
import { MoreVertical, type LucideIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { ActionType, ActionUse, HandleAction } from "@/app/models/action.model";

export interface ActionItem {
  key: string;
  label?: string;
  icon?: LucideIcon;
  className?: string;
  type?: "separator";
  action?: ActionType;
  actionValue?: string;
  actionUse?: ActionUse;
  data?: Record<string, unknown> | string;
  hidden?: boolean;
  onSelect?: () => void | Promise<void>;
}

interface ActionButtonProps {
  config: ActionItem[];
  row?: Record<string, unknown> | string;
  handleAction?: HandleAction<Record<string, unknown> | string>;
  menuLabel?: string;
  buttonClassName?: string;
  iconClassName?: string;
  contentClassName?: string;
}

const stop = (event: React.MouseEvent) => event.stopPropagation();

export default function ActionButton({
  config,
  row,
  handleAction,
  menuLabel = "Open actions",
  buttonClassName = "h-8 w-8 rounded-full text-[#C6C6C6] hover:bg-white/10 hover:text-white",
  iconClassName = "h-4 w-4",
  contentClassName = "w-40",
}: ActionButtonProps) {
  const visibleConfig = config.filter((item) => !item.hidden);

  if (!visibleConfig.length) {
    return <div className="h-8 w-8 shrink-0" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={menuLabel}
          onClick={stop}
          className={buttonClassName}
        >
          <MoreVertical className={iconClassName} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" onClick={stop} className={contentClassName}>
        {visibleConfig.map((item, index) =>
          item.type === "separator" ? (
            <DropdownMenuSeparator key={`separator-${item.key}-${index}`} />
          ) : (
            <DropdownMenuItem
              key={item.key}
              className={item.className ?? "gap-2"}
              variant={item.className?.includes("destructive") ? "destructive" : undefined}
              onClick={() => {
                if (item.onSelect) {
                  void item.onSelect();
                  return;
                }

                if (item.action) {
                  void handleAction?.(
                    item.action,
                    item.actionValue,
                    item.data ?? row,
                    item.actionUse,
                  );
                }
              }}
            >
              {item.icon ? <item.icon className="mr-2 h-4 w-4" /> : null}
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
