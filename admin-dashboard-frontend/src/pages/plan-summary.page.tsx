import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Users,
  DollarSign,
  CalendarDays,
  Loader2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDB, api, DAYS, MONTHS, type AssignedSlot } from "@/lib/plan-data";
import { PlanPageHeader } from "@/components/plans/plan-page-header";
import { StatTile } from "@/components/plans/stat-tile";
import { ConfirmationProgress } from "@/components/plans/confirmation-progress";
import { RejectedAlert } from "@/components/plans/rejected-alert";
import { StatusFilterTabs } from "@/components/plans/status-filter-tabs";
import { DayColumn } from "@/components/plans/day-column";
import { ReassignDialog } from "@/components/plans/reassign-dialog";

function PlanSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const plan = db.plans.find((p) => p.id === id);
  const workers = db.workers;
  const categories = db.categories;
  const [reassign, setReassign] = useState<AssignedSlot | null>(null);
  const [filter, setFilter] = useState<"all" | AssignedSlot["status"]>("all");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    document.title = plan ? `${plan.name} — Details` : "Plan details";
  }, [plan]);

  const stats = useMemo(() => {
    if (!plan) return null;
    const total = plan.slots.length;
    const accepted = plan.slots.filter((s) => s.status === "accepted").length;
    const rejected = plan.slots.filter((s) => s.status === "rejected").length;
    const pending = plan.slots.filter((s) => s.status === "pending").length;
    const cost = plan.slots.reduce((s, x) => s + x.cost, 0);
    const hours = plan.slots.reduce((s, x) => s + x.hours, 0);
    const uniqueWorkers = new Set(plan.slots.map((s) => s.workerId)).size;
    return { total, accepted, rejected, pending, cost, hours, uniqueWorkers };
  }, [plan]);

  if (!plan || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="text-center">
          <p className="text-muted-foreground">Plan not found.</p>
          <Link to="/dashboard/plans" className="text-primary underline">
            Back to plans
          </Link>
        </div>
      </div>
    );
  }

  const days = DAYS.map((_, i) => ({
    day: i,
    slots: plan.slots
      .filter((s) => s.day === i && (filter === "all" || s.status === filter))
      .sort((a, b) => a.start.localeCompare(b.start)),
  }));

  const setStatus = async (slotId: string, status: AssignedSlot["status"]) => {
    await api.updatePlan(plan.id, {
      slots: plan.slots.map((s) => (s.id === slotId ? { ...s, status } : s)),
    });
    toast.success(`Marked as ${status}`);
  };

  const sendPlanToAll = async () => {
    const emails = Array.from(
      new Set(
        plan.slots
          .map((s) => workers.find((w) => w.id === s.workerId)?.email)
          .filter(Boolean) as string[],
      ),
    );
    if (emails.length === 0) {
      toast.error("No assigned workers to email yet.");
      return;
    }
    setSending(true);
    await api.sendBulkEmail(emails);
    setSending(false);
    toast.success(
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 font-medium">
          <Mail className="h-4 w-4" />
          Sent to {emails.length} worker{emails.length === 1 ? "" : "s"}
        </div>
        <div className="text-xs text-muted-foreground">
          {emails.slice(0, 3).join(", ")}
          {emails.length > 3 ? "…" : ""}
        </div>
      </div>,
    );
  };

  const rejectedSlots = plan.slots.filter((s) => s.status === "rejected");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <PlanPageHeader
        backTo="/dashboard/plans"
        eyebrow={
          <>
            <CalendarDays className="h-3 w-3" />
            {MONTHS[plan.month]} · Week {plan.week} · {plan.year}
          </>
        }
        title={plan.name}
        actions={
          <>
            <Link to={`/dashboard/plans/${plan.id}`}>
              <Button variant="outline" size="sm" className="rounded-xl font-semibold">
                Edit plan
              </Button>
            </Link>
            <Button size="sm" onClick={sendPlanToAll} disabled={sending} className="gap-1.5 rounded-xl font-semibold shadow-md shadow-primary/20">
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {sending ? "Sending…" : "Send to workers"}
            </Button>
          </>
        }
      />

      <div className="mx-auto w-full px-6 py-8">
        {plan.description && (
          <p className="mb-6 max-w-2xl text-muted-foreground">{plan.description}</p>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {[
            <StatTile key="slots" label="Slots" value={stats.total} icon={<CalendarDays className="h-4 w-4" />} />,
            <StatTile key="workers" label="Workers" value={stats.uniqueWorkers} icon={<Users className="h-4 w-4" />} />,
            <StatTile key="hours" label="Hours" value={stats.hours.toFixed(1)} icon={<Clock className="h-4 w-4" />} />,
            <StatTile key="cost" label="Cost" value={`$${stats.cost.toFixed(0)}`} icon={<DollarSign className="h-4 w-4" />} />,
            <StatTile
              key="confirmed"
              label="Confirmed"
              value={stats.accepted}
              tone="emerald"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />,
            <StatTile
              key="unconfirmed"
              label="Unconfirmed"
              value={stats.total - stats.accepted}
              tone="rose"
              icon={<XCircle className="h-4 w-4" />}
            />,
          ].map((tile, i) => (
            <div
              key={tile.key}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {tile}
            </div>
          ))}
        </div>

        <ConfirmationProgress accepted={stats.accepted} total={stats.total} />

        <RejectedAlert rejectedSlots={rejectedSlots} workers={workers} onReassign={setReassign} />

        <StatusFilterTabs value={filter} onChange={setFilter} />

        {plan.slots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 py-20 text-center text-muted-foreground">
            No slots assigned yet.{" "}
            <Link to={`/dashboard/plans/${plan.id}`} className="text-primary underline">
              Go to builder
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
            {days.map((g, i) => (
              <div
                key={g.day}
                className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <DayColumn
                  day={g.day}
                  slots={g.slots}
                  workers={workers}
                  categories={categories}
                  onAccept={(sid) => setStatus(sid, "accepted")}
                  onReject={(sid) => setStatus(sid, "rejected")}
                  onReassign={setReassign}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {reassign && (
        <ReassignDialog slot={reassign} onClose={() => setReassign(null)} planId={plan.id} />
      )}
    </div>
  );
}

export default PlanSummaryPage;
