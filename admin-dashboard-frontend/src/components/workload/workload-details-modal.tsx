import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, Users, Layers, Clock, CheckCircle2 } from "lucide-react";
import { DAYS } from "@/features/workload/api/workload.service";
import type { WorkloadSheet } from "@/features/workload/api/workload.service";
import { formatDate } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  published: { label: "Published", cls: "bg-blue-50 text-blue-600 border-blue-200" },
};

interface WorkloadDetailsModalProps {
  sheet: WorkloadSheet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkloadDetailsModal({ sheet, open, onOpenChange }: WorkloadDetailsModalProps) {
  if (!sheet) return null;

  const [year, monthNum] = sheet.month.split("-");
  const monthLabel = `${MONTH_NAMES[parseInt(monthNum) - 1] || monthNum} ${year}`;
  const meta = STATUS_META[sheet.status] ?? STATUS_META.draft;

  const totalRequired = (sheet.entries ?? []).reduce((a, e) => a + e.required, 0);

  // Group entries by day for the daily breakdown
  const byDay = useMemo(() => {
    const map = new Map<string, typeof sheet.entries>();
    (sheet.entries ?? []).forEach((e) => {
      const existing = map.get(e.day) ?? [];
      existing.push(e);
      map.set(e.day, existing);
    });
    return map;
  }, [sheet.entries]);

  // Group entries by category
  const byCategory = useMemo(() => {
    const map = new Map<string, typeof sheet.entries>();
    (sheet.entries ?? []).forEach((e) => {
      const key = e.categoryName || e.categoryId;
      const existing = map.get(key) ?? [];
      existing.push(e);
      map.set(key, existing);
    });
    return map;
  }, [sheet.entries]);

  // Day order
  const dayOrder = DAYS.filter((d) => byDay.has(d));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto rounded-2xl border-slate-200 shadow-xl bg-white p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 pt-6 pb-6 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-white text-xl font-bold">
                {sheet.label || `Week ${sheet.weekNumber}`}
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-sm mt-1">
                {monthLabel} · {sheet.dateRange.start} → {sheet.dateRange.end}
              </DialogDescription>
            </div>
            <span className={`text-xs px-3 py-1 rounded-lg font-bold border bg-white/20 text-white border-white/30 backdrop-blur-sm ${meta.cls}`}>
              {meta.label}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <Users className="h-4 w-4 text-blue-600 mb-1.5" />
              <p className="text-2xl font-bold text-slate-900">{totalRequired}</p>
              <p className="text-xs font-medium text-slate-500">Total staff needed</p>
            </div>
            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
              <Layers className="h-4 w-4 text-indigo-600 mb-1.5" />
              <p className="text-2xl font-bold text-slate-900">{byCategory.size}</p>
              <p className="text-xs font-medium text-slate-500">Categories</p>
            </div>
            <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100">
              <CalendarRange className="h-4 w-4 text-sky-600 mb-1.5" />
              <p className="text-2xl font-bold text-slate-900">{dayOrder.length}</p>
              <p className="text-xs font-medium text-slate-500">Days planned</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <Clock className="h-4 w-4 text-slate-500 mb-1.5" />
              <p className="text-2xl font-bold text-slate-900">
                {formatDate(sheet.updatedAt || sheet.createdAt)}
              </p>
              <p className="text-xs font-medium text-slate-500">Last updated</p>
            </div>
          </div>

          {/* Daily breakdown table */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              Daily breakdown
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="border-b border-r border-slate-200 p-3 text-left font-bold text-slate-600 bg-slate-50/80 min-w-[120px]">
                      Day
                    </th>
                    <th className="border-b border-r border-slate-200 p-3 text-left font-bold text-slate-600 bg-slate-50/80 min-w-[120px]">
                      Shift
                    </th>
                    <th className="border-b border-r border-slate-200 p-3 text-left font-bold text-slate-600 bg-slate-50/80">
                      Category
                    </th>
                    <th className="border-b border-slate-200 p-3 text-right font-bold text-slate-600 bg-slate-50/80">
                      Required
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dayOrder.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                        No entries in this sheet yet.
                      </td>
                    </tr>
                  )}
                  {dayOrder.map((day, di) => {
                    const dayEntries = byDay.get(day) ?? [];
                    const dayTotal = dayEntries.reduce((a, e) => a + e.required, 0);
                    return (
                      <>
                        {dayEntries.map((entry, ei) => (
                          <tr
                            key={`${day}-${entry.shiftType}-${entry.categoryId}`}
                            className="hover:bg-blue-50/30 transition-colors"
                          >
                            {ei === 0 && (
                              <td
                                rowSpan={dayEntries.length}
                                className="border-b border-r border-slate-100 p-3 font-bold text-slate-800 align-top"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${
                                    di < 5 ? "bg-blue-500" : "bg-indigo-500"
                                  }`} />
                                  {day}
                                </div>
                              </td>
                            )}
                            <td className="border-b border-r border-slate-100 p-3">
                              <Badge
                                variant="outline"
                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                                  entry.shiftType === "Lunch"
                                    ? "border-sky-200 bg-sky-50 text-sky-700"
                                    : "border-indigo-200 bg-indigo-50 text-indigo-700"
                                }`}
                              >
                                {entry.shiftType}
                              </Badge>
                            </td>
                            <td className="border-b border-r border-slate-100 p-3 font-medium text-slate-700">
                              {entry.categoryName || entry.categoryId}
                            </td>
                            <td className="border-b border-slate-100 p-3 text-right">
                              <span className="inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm">
                                {entry.required}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {/* Day total row */}
                        <tr className="bg-slate-50/50">
                          <td colSpan={1} />
                          <td colSpan={2} className="border-b border-slate-100 p-2 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Day total
                          </td>
                          <td className="border-b border-slate-100 p-2 text-right">
                            <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-lg bg-blue-600 text-white font-bold text-xs">
                              {dayTotal}
                            </span>
                          </td>
                        </tr>
                      </>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <td colSpan={3} className="p-3 text-right font-bold text-slate-700 uppercase tracking-wider text-sm">
                      Grand total
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center justify-center h-9 min-w-9 px-3 rounded-lg bg-blue-600 text-white font-bold shadow-sm">
                        {totalRequired}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Category summary */}
          {byCategory.size > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                Category summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from(byCategory.entries()).map(([name, entries]) => {
                  const catTotal = entries.reduce((a, e) => a + e.required, 0);
                  return (
                    <div
                      key={name}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                    >
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {name}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{catTotal}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        {entries.length} shift{entries.length !== 1 ? "s" : ""} across{" "}
                        {new Set(entries.map((e) => e.day)).size} day
                        {new Set(entries.map((e) => e.day)).size !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
