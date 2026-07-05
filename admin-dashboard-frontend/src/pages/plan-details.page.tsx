import { OverWorkloadDialog, type PendingAssignment } from "@/components/plans/over-workload-dialog";
import { PlanPageHeader } from "@/components/plans/plan-page-header";
import { WorkerScheduleTable } from "@/components/plans/worker-schedule-table";
import { WorkloadBar } from "@/components/plans/workload-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  api,
  hoursBetween,
  MONTHS,
  useDB,
  type AssignedSlot,
  type Worker,
} from "@/lib/plan-data";
import { CheckCircle2, DollarSign, Loader2, Search, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";


function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Counts assigned slots per category, optionally excluding one slot id (used while editing). */
function countByCategory(slots: AssignedSlot[], excludeSlotId?: string) {
  const map = new Map<string, number>();
  slots.forEach((s) => {
    if (s.id === excludeSlotId) return;
    map.set(s.categoryId, (map.get(s.categoryId) ?? 0) + 1);
  });
  return map;
}

function PlanDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const plan = db.plans.find((p) => p.id === id);
  const categories = db.categories;
  const workers = db.workers;

  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [pendingAssignment, setPendingAssignment] = useState<PendingAssignment | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = plan ? `${plan.name} — Plan builder` : "Plan builder";
  }, [plan]);

  const filteredWorkers = useMemo(
    () =>
      workers.filter(
        (w) =>
          (catFilter === "all" || w.categoryId === catFilter) &&
          (q ? w.name.toLowerCase().includes(q.toLowerCase()) : true),
      ),
    [workers, q, catFilter],
  );

  if (!plan) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Plan not found.</p>
          <Link to="/dashboard/plans" className="text-primary underline">
            Back to plans
          </Link>
        </div>
      </div>
    );
  }

  const totalCost = plan.slots.reduce((s, x) => s + x.cost, 0);
  const assignedCounts = countByCategory(plan.slots);
  const overstaffed = plan.workload.filter(
    (r) => (assignedCounts.get(r.categoryId) ?? 0) > r.needed,
  );

  /** Central entry point for assigning a worker/day/slot to a category.
   *  If it would push the category over its workload requirement, ask for
   *  confirmation via a warning modal instead of assigning immediately. */
  const requestAssign = (
    worker: Worker,
    day: number,
    start: string,
    end: string,
    existing: AssignedSlot | undefined,
    categoryId: string,
  ) => {
    const requirement = plan.workload.find((r) => r.categoryId === categoryId);
    const counts = countByCategory(plan.slots, existing?.id);
    const willBeCount = (counts.get(categoryId) ?? 0) + 1;

    if (requirement && willBeCount > requirement.needed) {
      setPendingAssignment({ worker, day, start, end, existing, categoryId, requirement, willBeCount });
      return;
    }
    void commitAssign(worker, day, start, end, existing, categoryId);
  };

  const commitAssign = async (
    worker: Worker,
    day: number,
    start: string,
    end: string,
    existing: AssignedSlot | undefined,
    categoryId: string,
  ) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const hours = hoursBetween(start, end);
    const cost = +(cat.hourlyRate * hours).toFixed(2);
    const newSlot: AssignedSlot = existing
      ? { ...existing, categoryId, cost, hours }
      : {
          id: uid("s"),
          workerId: worker.id,
          categoryId,
          day,
          start,
          end,
          hours,
          cost,
          status: "pending",
        };
    const nextSlots = existing
      ? plan.slots.map((s) => (s.id === existing.id ? newSlot : s))
      : [...plan.slots, newSlot];
    setSaving(true);
    await api.updatePlan(plan.id, { slots: nextSlots });
    setSaving(false);
  };

  const clearSlot = async (slotId: string) => {
    setSaving(true);
    await api.updatePlan(plan.id, { slots: plan.slots.filter((s) => s.id !== slotId) });
    setSaving(false);
  };

  const confirmPendingAssignment = async () => {
    if (!pendingAssignment) return;
    const { worker, day, start, end, existing, categoryId } = pendingAssignment;
    setPendingAssignment(null);
    await commitAssign(worker, day, start, end, existing, categoryId);
    toast.warning("Assigned above the workload requirement.");
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-foreground overflow-hidden dark:bg-slate-950">
      {/* Vibrant Background Mesh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply opacity-70 animate-pulse dark:mix-blend-screen" />
        <div className="absolute top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-indigo-400/20 blur-[100px] mix-blend-multiply opacity-70 dark:mix-blend-screen" />
        <div className="absolute -bottom-[10%] left-[20%] h-[700px] w-[700px] rounded-full bg-sky-300/20 blur-[120px] mix-blend-multiply opacity-70 dark:mix-blend-screen" />
      </div>

      <div className="relative z-10">
        <PlanPageHeader
        backTo="/dashboard/plans"
        eyebrow={`${MONTHS[plan.month]} · Week ${plan.week}`}
        title={plan.name}
        actions={
          <>
            {saving && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </span>
            )}
            <div className="hidden items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-sm shadow-sm sm:flex">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-muted-foreground">Cost</span>
              <span className="font-bold">${totalCost.toFixed(0)}</span>
            </div>
            {/* <ManageCategoriesDialog categories={categories} /> */}
            <Link to={`/dashboard/plans/${plan.id}/summary`}>
              <Button variant="outline" size="sm" className="gap-1.5  bg-blue-500 text-white hover:bg-blue-600 py-2 rounded-xl font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Submit plan
              </Button>
            </Link>
          </>
        }
      />

      <div className="mx-auto max-w-[1600px] space-y-4 px-6 py-6">
        {overstaffed.length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-700 dark:text-amber-300">
                Over workload in {overstaffed.length} categor{overstaffed.length === 1 ? "y" : "ies"}
              </div>
              <div className="mt-0.5 text-xs font-medium text-amber-700/80 dark:text-amber-300/80">
                {overstaffed
                  .map((r) => {
                    const cat = categories.find((c) => c.id === r.categoryId);
                    return `${r.label} (${cat?.name ?? "—"}): ${assignedCounts.get(r.categoryId) ?? 0}/${r.needed}`;
                  })
                  .join(" · ")}
              </div>
            </div>
          </div>
        )}

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <WorkloadBar plan={plan} categories={categories} assignedCounts={assignedCounts} />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/50 p-4 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-card/50 sm:flex-row sm:items-center animate-in fade-in slide-in-from-bottom-2 duration-500 relative z-10">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search workers…"
              className="pl-9"
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <WorkerScheduleTable
            workers={filteredWorkers}
            plan={plan}
            categories={categories}
            onRequestAssign={requestAssign}
            onClear={clearSlot}
          />
        </div>
      </div>

      <OverWorkloadDialog
        pending={pendingAssignment}
        onCancel={() => setPendingAssignment(null)}
        onConfirm={confirmPendingAssignment}
      />
      </div>
    </div>
  );
}

export default PlanDetailsPage;
