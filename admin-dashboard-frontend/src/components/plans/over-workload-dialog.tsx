import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AssignedSlot, Worker, WorkloadRequirement } from "../../lib/plan-data";

export interface PendingAssignment {
  worker: Worker;
  day: number;
  start: string;
  end: string;
  existing?: AssignedSlot;
  categoryId: string;
  requirement: WorkloadRequirement;
  willBeCount: number;
}

interface OverWorkloadDialogProps {
  pending: PendingAssignment | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirmation modal shown when an assignment would push a category over its workload requirement. */
export function OverWorkloadDialog({ pending, onCancel, onConfirm }: OverWorkloadDialogProps) {
  return (
    <Dialog open={!!pending} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold tracking-tight text-amber-600">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-4 w-4" />
            </span>
            Exceeds workload requirement
          </DialogTitle>
        </DialogHeader>
        {pending && (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Assigning <span className="font-medium text-foreground">{pending.worker.name}</span> here
              will bring{" "}
              <span className="font-medium text-foreground">{pending.requirement.label}</span> to{" "}
              <span className="font-semibold text-amber-600">
                {pending.willBeCount}/{pending.requirement.needed}
              </span>{" "}
              — above the required workload.
            </p>
            <p className="text-xs text-muted-foreground">
              You can still assign this worker, but consider raising the workload requirement instead.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="gap-1.5 rounded-lg bg-amber-600 font-semibold shadow-sm hover:bg-amber-600/90">
            Assign anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
