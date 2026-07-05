import { AlertTriangle, RefreshCw } from "lucide-react";
import { DAYS, type AssignedSlot, type Worker } from "../../lib/plan-data";

interface RejectedAlertProps {
  rejectedSlots: AssignedSlot[];
  workers: Worker[];
  onReassign: (slot: AssignedSlot) => void;
}

/** Banner surfacing rejected slots with a one-click shortcut into the reassign dialog. */
export function RejectedAlert({ rejectedSlots, workers, onReassign }: RejectedAlertProps) {
  if (rejectedSlots.length === 0) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-rose-700 dark:text-rose-300">
          {rejectedSlots.length} slot{rejectedSlots.length === 1 ? "" : "s"} rejected — assign another worker
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {rejectedSlots.map((s) => {
            const w = workers.find((x) => x.id === s.workerId);
            return (
              <button
                key={s.id}
                onClick={() => onReassign(s)}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-background px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-500/10 hover:shadow-sm dark:text-rose-300"
              >
                <RefreshCw className="h-3 w-3" />
                {DAYS[s.day]} {s.start} · {w?.name?.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
