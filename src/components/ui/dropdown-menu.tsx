"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Minimal dropdown menu — a fixed-width trigger button that opens a small
 * panel, instead of a row of action buttons whose combined width breaks the
 * layout once the title next to them gets long (see the funnel list card).
 */
export function DropdownMenu({
  trigger,
  children,
  align = "end",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-black/[0.05] hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:bg-white/[0.08]",
          open && "bg-black/[0.05] text-foreground dark:bg-white/[0.08]"
        )}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg",
            align === "end" ? "right-0" : "left-0"
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  className,
  danger,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          : "text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
        className
      )}
      {...props}
    />
  );
}
