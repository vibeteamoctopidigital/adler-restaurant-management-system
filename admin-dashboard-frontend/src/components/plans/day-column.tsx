import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { DAYS_FULL, type AssignedSlot, type Category, type Worker } from "../../lib/plan-data";
import { WorkerAvatar } from "./worker-avatar";
import { ConfirmBadge } from "./confirm-badge";

interface DayColumnProps {
  day: number;
  slots: AssignedSlot[];
  workers: Worker[];
  categories: Category[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onReassign: (s: AssignedSlot) => void;
}

/** One day of the weekly board: a card per assigned slot with confirm/reject/reassign actions. */
export function DayColumn({ day, slots, workers, categories, onAccept, onReject, onReassign }: DayColumnProps) {
  const totalHours = slots.reduce((s, x) => s + x.hours, 0);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="border-b border-border/60 bg-gradient-to-br from-primary/[0.06] to-transparent px-4 py-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold tracking-tight">{DAYS_FULL[day]}</h2>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {slots.length} · {totalHours.toFixed(1)}h
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-2 p-3">
        {slots.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 py-6 text-center text-[11px] text-muted-foreground">
            No slots
          </div>
        ) : (
          slots.map((s) => {
            const w = workers.find((x) => x.id === s.workerId);
            const c = categories.find((x) => x.id === s.categoryId);
            const confirmed = s.status === "accepted";
            const accent = confirmed
              ? "ring-emerald-500/50 bg-emerald-500/5"
              : "ring-rose-500/50 bg-rose-500/5";
            return (
              <div
                key={s.id}
                className={`group relative rounded-xl border border-border/60 p-3 ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${accent}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <WorkerAvatar name={w?.name} color={c?.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold">{w?.name}</div>
                    <div className="truncate text-[10px] font-medium text-muted-foreground">{c?.name}</div>
                  </div>
                  <ConfirmBadge confirmed={confirmed} status={s.status} />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="tabular-nums font-semibold">
                    {s.start} – {s.end}
                  </span>
                  <span className="font-medium text-muted-foreground">
                    ${s.cost.toFixed(0)} · {s.hours.toFixed(1)}h
                  </span>
                </div>
                {s.reassignedFrom && (
                  <div className="mt-1.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                    reassigned
                  </div>
                )}
                <div className="mt-2 flex gap-1 border-t border-border/50 pt-2">
                  <button
                    onClick={() => onAccept(s.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium text-emerald-600 transition hover:bg-emerald-500/10"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Confirm
                  </button>
                  <button
                    onClick={() => onReject(s.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium text-rose-600 transition hover:bg-rose-500/10"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </button>
                  <button
                    onClick={() => onReassign(s)}
                    className="flex items-center justify-center rounded-md px-2 py-1 text-muted-foreground transition hover:bg-accent"
                    aria-label="Reassign"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
