import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: number | string;
  tone?: "emerald" | "amber" | "rose";
  icon?: ReactNode;
  /** "card" (bordered KPI tile, used on summary/detail screens) or "compact" (inline grid cell, used on plan cards) */
  variant?: "card" | "compact";
}

const toneClass: Record<NonNullable<StatTileProps["tone"]>, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
};

const toneChipClass: Record<NonNullable<StatTileProps["tone"]>, string> = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

/** Small KPI display reused across the plans list, builder and summary screens. */
export function StatTile({ label, value, tone, icon, variant = "card" }: StatTileProps) {
  const color = tone ? toneClass[tone] : "text-foreground";
  const chip = tone ? toneChipClass[tone] : "bg-primary/10 text-primary";

  if (variant === "compact") {
    const compactBg = tone 
      ? tone === "emerald" ? "bg-emerald-500/10 hover:bg-emerald-500/20"
      : tone === "amber" ? "bg-amber-500/10 hover:bg-amber-500/20"
      : "bg-rose-500/10 hover:bg-rose-500/20"
      : "bg-primary/5 hover:bg-primary/15";
      
    return (
      <div className={cn("rounded-xl py-2.5 text-center transition-colors", compactBg)}>
        <div className={cn("text-lg font-bold tabular-nums", color)}>{value}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
    );
  }

  return (
    <div className="group rounded-2xl border border-border/70 bg-card px-4 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="mb-2 flex items-center gap-2">
        {icon && (
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", chip)}>
            {icon}
          </span>
        )}
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className={cn("text-2xl font-bold tabular-nums tracking-tight", color)}>{value}</div>
    </div>
  );
}
