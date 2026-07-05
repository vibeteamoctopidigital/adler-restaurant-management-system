import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, useDB, DAYS, type AssignedSlot } from "../../lib/plan-data";

interface ReassignDialogProps {
  slot: AssignedSlot;
  onClose: () => void;
  planId: string;
}

/** Pick a replacement worker for a rejected/reassigned slot and notify them by (mock) email. */
export function ReassignDialog({ slot, onClose, planId }: ReassignDialogProps) {
  const db = useDB();
  const workers = db.workers;
  const plan = db.plans.find((p) => p.id === planId);
  const candidates = workers.filter(
    (w) =>
      w.id !== slot.workerId &&
      w.availability.some((a) => a.day === slot.day && a.start <= slot.start && a.end >= slot.end),
  );
  const [pick, setPick] = useState<string>(candidates[0]?.id ?? "");
  const [sending, setSending] = useState(false);

  if (!plan) return null;

  const confirm = async () => {
    if (!pick) return;
    const target = workers.find((w) => w.id === pick);
    setSending(true);
    await api.updatePlan(planId, {
      slots: plan.slots.map((s) =>
        s.id === slot.id ? { ...s, workerId: pick, status: "pending", reassignedFrom: s.workerId } : s,
      ),
    });
    await api.sendBulkEmail(target?.email ? [target.email] : []);
    setSending(false);
    toast.success(
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4" />
        Email sent to {target?.name}
      </div>,
    );
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">Reassign slot</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
            <div className="font-semibold">
              {DAYS[slot.day]} · {slot.start} – {slot.end}
            </div>
            <div className="text-xs font-medium text-muted-foreground">
              {slot.hours.toFixed(1)}h · ${slot.cost.toFixed(0)}
            </div>
          </div>
          {candidates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No other workers available for this time.
            </p>
          ) : (
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Choose a replacement</div>
              <Select value={pick} onValueChange={setPick}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={!pick || sending} className="gap-1.5">
            {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Reassign & notify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
