import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CalendarDays, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { api, currentWeekOfMonth, MONTHS } from "../../lib/plan-data";

interface CreatePlanDialogProps {
  now: Date;
}

const NAME_MAX = 80;
const DESC_MAX = 300;

interface FormErrors {
  name?: string;
  description?: string;
}

export function CreatePlanDialog({ now }: CreatePlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [month, setMonth] = useState(now.getMonth());
  const [week, setWeek] = useState(currentWeekOfMonth(now));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ name?: boolean; description?: boolean }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validate = (values: { name: string; desc: string }): FormErrors => {
    const next: FormErrors = {};
    const trimmedName = values.name.trim();

    if (!trimmedName) {
      next.name = "Give this plan a name.";
    } else if (trimmedName.length < 3) {
      next.name = "Name must be at least 3 characters.";
    } else if (trimmedName.length > NAME_MAX) {
      next.name = `Keep it under ${NAME_MAX} characters.`;
    }

    if (values.desc.length > DESC_MAX) {
      next.description = `Keep it under ${DESC_MAX} characters.`;
    }

    return next;
  };

  // Re-validate live, but only surface errors for fields the user has touched.
  useEffect(() => {
    if (touched.name || touched.description) {
      setErrors(validate({ name, desc }));
    }
  }, [name, desc, touched.name, touched.description]);

  const resetForm = () => {
    setName("");
    setDesc("");
    setMonth(now.getMonth());
    setWeek(currentWeekOfMonth(now));
    setErrors({});
    setTouched({});
    setSubmitError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (saving) return; // don't let the dialog close mid-save
    setOpen(next);
    if (!next) {
      setTimeout(resetForm, 200); // wait out the close animation
    }
  };

  const submit = async () => {
    const validationErrors = validate({ name, desc });
    setErrors(validationErrors);
    setTouched({ name: true, description: true });
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    setSubmitError(null);
    try {
      const plan = await api.createPlan({
        name: name.trim(),
        description: desc.trim(),
        month,
        week,
        year: now.getFullYear(),
        workload: [],
      });
      setOpen(false);
      resetForm();
      navigate(`/dashboard/plans/${plan.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't create the plan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const descRemaining = DESC_MAX - desc.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 rounded-xl font-semibold shadow-lg bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl hover:shadow-primary/25 transition-all">
          <Plus className="h-4 w-4" />
          Create plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden gap-0">
        <DialogHeader className="border-b border-white/20 px-6 pt-6 pb-5 space-y-1.5 dark:border-white/10">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground">
            Create a new plan
          </DialogTitle>
         
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {submitError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <p className="text-sm font-medium text-red-700">{submitError}</p>
            </div>
          )}

          <div>
            <Label htmlFor="pname" className="text-foreground/80 font-semibold text-sm">
              Plan name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pname"
              autoFocus
              value={name}
              disabled={saving}
              maxLength={NAME_MAX + 20}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="Enter a name for this plan"
              aria-invalid={!!errors.name}
              className={`mt-1.5 rounded-xl h-11 bg-background/50 font-medium transition-all placeholder:text-muted-foreground/70 ${
                errors.name
                  ? "border-red-300 focus-visible:ring-red-500/20 focus-visible:border-red-400"
                  : "border-white/30 dark:border-white/10 focus-visible:ring-primary/20 focus-visible:border-primary/40"
              }`}
            />
            {errors.name ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                <AlertCircle className="h-3 w-3" /> {errors.name}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">{name.trim().length}/{NAME_MAX}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground/80 font-semibold text-sm flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> Month
              </Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))} disabled={saving}>
                <SelectTrigger className="mt-1.5 rounded-xl h-11 bg-background/50 border-white/30 dark:border-white/10 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground/80 font-semibold text-sm">Week</Label>
              <Select value={String(week)} onValueChange={(v) => setWeek(Number(v))} disabled={saving}>
                <SelectTrigger className="mt-1.5 rounded-xl h-11 bg-background/50 border-white/30 dark:border-white/10 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((w) => (
                    <SelectItem key={w} value={String(w)}>
                      Week {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        
        </div>

        <DialogFooter className="px-6 pb-6 pt-1 gap-2">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
            className="rounded-xl  bg-gray-300 hover:bg-gray-400 font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            variant="default"
            className="gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 px-5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" /> Create plan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}