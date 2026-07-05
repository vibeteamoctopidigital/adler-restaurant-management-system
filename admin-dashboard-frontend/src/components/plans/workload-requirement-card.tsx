import { AlertTriangle, ShieldAlert, Trash2, Loader2 } from "lucide-react";
import type { Category, WorkloadRequirement } from "../../lib/plan-data";

interface WorkloadRequirementCardProps {
  requirement: WorkloadRequirement;
  category?: Category;
  assigned: number;
  removing: boolean;
  onRemove: () => void;
}

/** Single workload requirement pill: need vs. assigned progress + over/under status. */
export function WorkloadRequirementCard({
  requirement,
  category,
  assigned,
  removing,
  onRemove,
}: WorkloadRequirementCardProps) {
  const pct = Math.min(100, (assigned / requirement.needed) * 100);
  const short = assigned < requirement.needed;
  const over = assigned > requirement.needed;

  return (
    <div className="w-64 shrink-0 rounded-xl border border-border/60 bg-background/60 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${category?.color}`} />
          <span className="truncate text-sm font-semibold">{requirement.label}</span>
        </div>
        <button
          onClick={onRemove}
          disabled={removing}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </button>
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{category?.name}</div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all ${
              over ? "bg-rose-500" : short ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {assigned}/{requirement.needed}
        </span>
      </div>
      {short && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          Need {requirement.needed - assigned} more
        </div>
      )}
      {over && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          <ShieldAlert className="h-3 w-3" />
          {assigned - requirement.needed} over workload
        </div>
      )}
    </div>
  );
}
