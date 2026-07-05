import { Link } from "react-router-dom";
import { useState } from "react";
import { CalendarRange, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, MONTHS, type Plan } from "../../lib/plan-data";
import { StatTile } from "./stat-tile";

interface PlanCardProps {
  plan: Plan;
}

export function PlanCard({ plan }: PlanCardProps) {
  const [deleting, setDeleting] = useState(false);
  const totalCost = plan.slots.reduce((s, x) => s + x.cost, 0);
  const accepted = plan.slots.filter((s) => s.status === "accepted").length;
  const rejected = plan.slots.filter((s) => s.status === "rejected").length;

  const handleDelete = async () => {
    if (!confirm(`Delete "${plan.name}"?`)) return;
    setDeleting(true);
    await api.deletePlan(plan.id);
    setDeleting(false);
    toast.success("Plan deleted");
  };

  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-white hover:shadow-xl hover:shadow-primary/20 dark:border-white/10 dark:bg-background/60 dark:hover:bg-background">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-gradient-to-b from-primary/15 via-sky-400/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            <CalendarRange className="h-3.5 w-3.5" />
            {MONTHS[plan.month]} · Week {plan.week} · {plan.year}
          </div>
          <h3 className="mt-2.5 truncate text-lg font-bold leading-tight tracking-tight">{plan.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-muted-foreground">
            {plan.description || "No description."}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
          aria-label="Delete plan"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatTile variant="compact" label="Slots" value={plan.slots.length} />
        <StatTile variant="compact" label="Accepted" value={accepted} tone="emerald" />
        <StatTile variant="compact" label="Rejected" value={rejected} tone="rose" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
        <div className="text-sm">
          <span className="text-muted-foreground">Cost </span>
          <span className="font-bold">${totalCost.toFixed(0)}</span>
        </div>
        <div className="flex gap-2">
          <Link to={`/dashboard/plans/${plan.id}/summary`}>
            <Button variant="ghost" size="sm" className="rounded-lg font-semibold">
              Details
            </Button>
          </Link>
          <Link to={`/dashboard/plans/${plan.id}`}>
            <Button size="sm" className="gap-1 rounded-lg font-semibold shadow-sm shadow-primary/20">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
