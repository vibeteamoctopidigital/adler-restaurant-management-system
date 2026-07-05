import { Sparkles } from "lucide-react";
import { CreatePlanDialog } from "./create-plan-dialog";

interface PlansEmptyStateProps {
  now: Date;
  filtered?: boolean;
}

export function PlansEmptyState({ now, filtered }: PlansEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 py-20 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-sky-500/10 p-4 shadow-inner animate-in zoom-in-50 duration-700">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mt-4 text-lg font-bold tracking-tight">
        {filtered ? "No plans match your filters" : "No plans yet"}
      </h2>
      <p className="mt-1 max-w-sm text-sm font-medium text-muted-foreground">
        {filtered
          ? "Try clearing the search or filters to see more plans."
          : "Create your first weekly plan to start assigning workers into shifts."}
      </p>
      {!filtered && (
        <div className="mt-5">
          <CreatePlanDialog now={now} />
        </div>
      )}
    </div>
  );
}
