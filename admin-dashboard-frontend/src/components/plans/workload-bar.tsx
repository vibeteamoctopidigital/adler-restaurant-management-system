import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type Category, type Plan, type WorkloadRequirement } from "../../lib/plan-data";
import { WorkloadRequirementCard } from "./workload-requirement-card";

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

interface WorkloadBarProps {
  plan: Plan;
  categories: Category[];
  assignedCounts: Map<string, number>;
}

/** Horizontal, top-level workload status bar with an "Add requirement" dialog. */
export function WorkloadBar({ plan, categories, assignedCounts }: WorkloadBarProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [catId, setCatId] = useState<string>(categories[0]?.id ?? "");
  const [needed, setNeeded] = useState(2);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const addReq = async () => {
    if (!label.trim() || !catId) return;
    const req: WorkloadRequirement = { id: uid("r"), categoryId: catId, label: label.trim(), needed };
    setSaving(true);
    await api.updatePlan(plan.id, { workload: [...plan.workload, req] });
    setSaving(false);
    setOpen(false);
    setLabel("");
    setNeeded(2);
  };

  const removeReq = async (id: string) => {
    const req = plan.workload.find((w) => w.id === id);
    if (!req) return;
    if (
      !confirm(
        `Remove workload requirement "${req.label}"? Already-assigned slots will stay, but will no longer count toward it.`,
      )
    ) {
      return;
    }
    setRemovingId(id);
    await api.updatePlan(plan.id, { workload: plan.workload.filter((w) => w.id !== id) });
    setRemovingId(null);
    toast.success("Workload requirement removed");
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-card/50">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold tracking-tight">Workload status</h2>
          <p className="text-xs font-medium text-muted-foreground">Need vs. assigned per category</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 gap-1 rounded-lg font-semibold">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add workload requirement</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Label</Label>
                <Input
                  className="mt-1.5"
                  placeholder="e.g. Lunch service"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={catId} onValueChange={setCatId}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Workers needed</Label>
                <Input
                  type="number"
                  min={1}
                  className="mt-1.5"
                  value={needed}
                  onChange={(e) => setNeeded(Number(e.target.value) || 1)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addReq} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {plan.workload.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/40 bg-white/30 p-6 text-center text-sm font-medium text-muted-foreground shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-black/10">
          No requirements yet. Add lunch, dinner, etc.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {plan.workload.map((r) => (
            <WorkloadRequirementCard
              key={r.id}
              requirement={r}
              category={categories.find((c) => c.id === r.categoryId)}
              assigned={assignedCounts.get(r.categoryId) ?? 0}
              removing={removingId === r.id}
              onRemove={() => removeReq(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
