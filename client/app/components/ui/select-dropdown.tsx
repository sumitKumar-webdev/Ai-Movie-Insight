"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

type SelectDropdownOption = {
  label: string;
  value: number;
};

type SelectDropdownProps = {
  label: string;
  value: number;
  options: SelectDropdownOption[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: number) => void;
};

function ChevronDownIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-white/50"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function SelectDropdown({
  label,
  value,
  options,
  disabled,
  placeholder,
  onChange,
}: SelectDropdownProps) {
  const activeLabel =
    options.find((option) => option.value === value)?.label ??
    placeholder ??
    "Select";

  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
        {label}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          className="flex h-11 w-full items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none transition-colors focus:border-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="truncate">{activeLabel}</span>
          <ChevronDownIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-64 min-w-[12rem] overflow-y-auto rounded-lg border border-white/10 bg-[#0b0b0f] p-1 text-white shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
        >
          {options.length > 0 ? (
            options.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className="cursor-pointer rounded-md px-2 py-2 text-sm hover:bg-white/10"
              >
                {option.label}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem
              disabled
              className="cursor-default rounded-md px-2 py-2 text-sm text-white/40"
            >
              {placeholder ?? "No options"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </label>
  );
}
