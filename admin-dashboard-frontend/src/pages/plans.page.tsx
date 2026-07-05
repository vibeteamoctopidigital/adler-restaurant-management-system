import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDB } from "@/lib/plan-data";
import { CreatePlanDialog } from "@/components/plans/create-plan-dialog";
import { PlanFiltersBar } from "@/components/plans/plan-filters-bar";
import { PlansEmptyState } from "@/components/plans/plans-empty-state";
import { PlanCard } from "@/components/plans/plan-card";

function ManagePlans() {
  const db = useDB();
  const plans = db.plans;
  const now = new Date();
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    document.title = "Plans — Shift Planner";
  }, []);

  const hasActiveFilters = monthFilter !== "all" || weekFilter !== "all" || q.trim() !== "";

  const filtered = useMemo(() => {
    return plans
      .filter((p) => (monthFilter === "all" ? true : p.month === Number(monthFilter)))
      .filter((p) => (weekFilter === "all" ? true : p.week === Number(weekFilter)))
      .filter((p) => (q ? p.name.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [plans, monthFilter, weekFilter, q]);

  return (
    <div className="relative min-h-screen bg-slate-50 text-foreground overflow-hidden dark:bg-slate-950">
      {/* Vibrant Background Mesh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply opacity-70 animate-pulse dark:mix-blend-screen" />
        <div className="absolute top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-indigo-400/20 blur-[100px] mix-blend-multiply opacity-70 dark:mix-blend-screen" />
        <div className="absolute -bottom-[10%] left-[20%] h-[700px] w-[700px] rounded-full bg-sky-300/20 blur-[120px] mix-blend-multiply opacity-70 dark:mix-blend-screen" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/40 bg-white/60 backdrop-blur-xl shadow-sm dark:border-white/10 dark:bg-background/60">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky-500 text-primary-foreground shadow-lg shadow-primary/25">
              <CalendarRange className="h-5.5 w-5.5" />
            </div>
            <div>
              <Link to="/" className="text-xs font-bold uppercase tracking-widest text-primary">
                Shift Planner
              </Link>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Plans</h1>
             
            </div>
          </div>
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
           
            <div className="[&_button]:rounded-xl [&_button]:font-semibold [&_button]:shadow-md [&_button]:shadow-primary/20">
              <CreatePlanDialog now={now} />
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 py-8">
        <div className="animate-in fade-in slide-in-from-top-1 duration-500">
          <PlanFiltersBar
            q={q}
            onQChange={setQ}
            monthFilter={monthFilter}
            onMonthFilterChange={setMonthFilter}
            weekFilter={weekFilter}
            onWeekFilterChange={setWeekFilter}
          />
        </div>

        {filtered.length === 0 ? (
          <PlansEmptyState now={now} filtered={hasActiveFilters && plans.length > 0} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <div
                key={p.id}
                className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <PlanCard plan={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagePlans;