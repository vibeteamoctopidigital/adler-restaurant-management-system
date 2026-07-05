import { Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DAYS,
  hoursBetween,
  type AssignedSlot,
  type Category,
  type Plan,
  type Worker,
} from "../../lib/plan-data";
import { WorkerAvatar } from "./worker-avatar";

type RequestAssign = (
  worker: Worker,
  day: number,
  start: string,
  end: string,
  existing: AssignedSlot | undefined,
  categoryId: string,
) => void;

interface WorkerScheduleTableProps {
  workers: Worker[];
  plan: Plan;
  categories: Category[];
  onRequestAssign: RequestAssign;
  onClear: (slotId: string) => void;
}

/** Full-width weekly grid: one row per worker, one cell per day, assignable slots inside. */
export function WorkerScheduleTable({
  workers,
  plan,
  categories,
  onRequestAssign,
  onClear,
}: WorkerScheduleTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/60 bg-white/60 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-card/60">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-white/20 bg-gradient-to-r from-primary/10 via-sky-400/10 to-indigo-500/10 text-xs font-bold uppercase tracking-wider text-primary/90 dark:from-primary/20 dark:via-sky-400/20 dark:to-indigo-500/20">
              <th className="sticky left-0 z-10 bg-white/60 backdrop-blur-md px-4 py-3 text-left dark:bg-black/40">Worker</th>
              {DAYS.map((d) => (
                <th key={d} className="px-3 py-3 text-left">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <WorkerRow
                key={w.id}
                worker={w}
                plan={plan}
                categories={categories}
                onRequestAssign={onRequestAssign}
                onClear={onClear}
              />
            ))}
            {workers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-muted-foreground">
                  No workers match filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkerRow({
  worker,
  plan,
  categories,
  onRequestAssign,
  onClear,
}: {
  worker: Worker;
  plan: Plan;
  categories: Category[];
  onRequestAssign: RequestAssign;
  onClear: (slotId: string) => void;
}) {
  const workerCat = categories.find((c) => c.id === worker.categoryId);
  return (
    <tr className="border-b border-white/20 transition-colors last:border-0 hover:bg-white/40 dark:hover:bg-white/5">
      <td className="sticky left-0 z-10 bg-white/40 backdrop-blur-sm px-4 py-3 align-top dark:bg-black/40">
        <div className="flex items-center gap-2">
          <WorkerAvatar name={worker.name} color={workerCat?.color} />
          <div>
            <div className="font-semibold leading-tight">{worker.name}</div>
            <div className="text-xs font-medium text-muted-foreground">
              {workerCat?.name} · ${workerCat?.hourlyRate}/hr
            </div>
          </div>
        </div>
      </td>
      {DAYS.map((_, dayIdx) => {
        const availability = worker.availability.filter((a) => a.day === dayIdx);
        const assigned = plan.slots.filter((s) => s.workerId === worker.id && s.day === dayIdx);
        return (
          <td key={dayIdx} className="min-w-[150px] px-2 py-2 align-top">
            <div className="space-y-1.5">
              {availability.length === 0 && (
                <div className="rounded-md border border-dashed border-border/40 bg-white/20 px-2 py-3 text-center text-[11px] text-muted-foreground/70">
                  Unavailable
                </div>
              )}
              {availability.map((slot, i) => {
                const existing = assigned.find((a) => a.start === slot.start && a.end === slot.end);
                return (
                  <SlotCell
                    key={i}
                    worker={worker}
                    day={dayIdx}
                    start={slot.start}
                    end={slot.end}
                    existing={existing}
                    categories={categories}
                    onRequestAssign={onRequestAssign}
                    onClear={onClear}
                  />
                );
              })}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

function SlotCell({
  worker,
  day,
  start,
  end,
  existing,
  categories,
  onRequestAssign,
  onClear,
}: {
  worker: Worker;
  day: number;
  start: string;
  end: string;
  existing?: AssignedSlot;
  categories: Category[];
  onRequestAssign: RequestAssign;
  onClear: (slotId: string) => void;
}) {
  const hours = hoursBetween(start, end);
  const value = existing?.categoryId ?? "";
  const assignedCat = existing ? categories.find((c) => c.id === existing.categoryId) : null;

  return (
    <div
      className={`rounded-xl border p-2 transition-all duration-300 ${
        existing
          ? "border-primary/50 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent shadow-md shadow-indigo-500/10"
          : "border-transparent bg-white/60 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white hover:shadow-lg hover:shadow-primary/5 dark:bg-white/5 dark:hover:bg-white/10"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium">
        <span>
          {start} – {end}
        </span>
        {existing && (
          <button
            onClick={() => onClear(existing.id)}
            className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Clear"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      <Select value={value} onValueChange={(catId) => onRequestAssign(worker, day, start, end, existing, catId)}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue placeholder="Assign…" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${c.color}`} />
                {c.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {existing && assignedCat && (
        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{hours.toFixed(1)}h</span>
          <span className="font-semibold text-foreground">${existing.cost.toFixed(0)}</span>
        </div>
      )}
    </div>
  );
}
