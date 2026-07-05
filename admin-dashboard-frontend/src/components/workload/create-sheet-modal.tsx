import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, ChevronRight, Loader2 } from "lucide-react";
import { useCreateWorkloadSheet } from "@/features/workload/hooks/use-workload";
import type { WorkloadSheetInput } from "@/features/workload/api/workload.service";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getWeeksForMonth(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const weeks: { weekNumber: number; range: string; start: string; end: string }[] = [];
  let weekNum = 1;
  const cursor = new Date(firstDay);
  const dow = cursor.getDay();
  if (dow !== 1) cursor.setDate(cursor.getDate() - ((dow + 6) % 7));

  while (cursor <= lastDay) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("en", { month: "short" })}`;
    weeks.push({
      weekNumber:weekNum,
      range: `${fmt(weekStart)} — ${fmt(weekEnd)}`,
      start: weekStart.toISOString().split("T")[0],
      end: weekEnd.toISOString().split("T")[0],
    });
    weekNum++;
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

interface CreateSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSheetModal({ open, onOpenChange }: CreateSheetModalProps) {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [monthVal, setMonthVal] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [weekId, setWeekId] = useState("");

  const yearNum = parseInt(year);
  const monthNum = parseInt(monthVal.split("-")[1] ?? "1");

  const weeks = useMemo(() => getWeeksForMonth(yearNum, monthNum), [yearNum, monthNum]);

  // Auto-select the first week when weeks change
  const resolvedWeekId = weekId && weeks.some((_, i) => `w${i + 1}` === weekId) ? weekId : `w1`;
  const currentWeek = weeks.find((_, i) => `w${i + 1}` === resolvedWeekId) ?? weeks[0];

  const years = ["2025", "2026", "2027", "2028"];
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: `${yearNum}-${String(i + 1).padStart(2, "0")}`,
    label: `${MONTHS[i]} ${yearNum}`,
  }));

  const createMut = useCreateWorkloadSheet();

  const handleCreate = () => {
    if (!currentWeek) return;
    const weekNumber = weeks.findIndex((w) => w === currentWeek) + 1;
    const data: WorkloadSheetInput = {
      month: monthVal,
      weekNumber,
      dateRange: { start: currentWeek.start, end: currentWeek.end },
      label: `Week ${weekNumber}`,
      status: "draft",
      entries: [],
    };
    createMut.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 shadow-xl bg-white p-0 overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 pt-6 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl font-bold">New workload sheet</DialogTitle>
              <DialogDescription className="text-blue-100 text-sm mt-0.5">
                Select month and week for the new sheet
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Year & Month */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year</label>
              <Select value={year} onValueChange={(v) => { setYear(v); setWeekId(""); }}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-sm font-medium">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-xl rounded-xl">
                  {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Month</label>
              <Select value={monthVal} onValueChange={(v) => { setMonthVal(v); setWeekId(""); }}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-sm font-medium">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-xl rounded-xl max-h-56">
                  {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Week */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Week</label>
            <div className="grid gap-2">
              {weeks.map((w, i) => {
                const id = `w${i + 1}`;
                const selected = resolvedWeekId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setWeekId(id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                      selected
                        ? "border-blue-500 bg-blue-50/60 shadow-sm shadow-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                        selected
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${
                          selected ? "text-blue-700" : "text-slate-700"
                        }`}>
                          Week {i + 1}
                        </p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">{w.range}</p>
                      </div>
                    </div>
                    {selected && (
                      <ChevronRight className="h-4 w-4 text-blue-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl h-11 font-semibold border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMut.isPending || !currentWeek}
              className="flex-1 rounded-xl h-11 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25"
            >
              {createMut.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
              ) : (
                `Create Week ${(weeks.findIndex((w) => w === currentWeek) + 1) || 1}`
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
