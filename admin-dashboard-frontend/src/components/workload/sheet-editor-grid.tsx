import React, { useMemo, useState } from "react";
import { Plus, Trash2, Save, Send, AlertTriangle, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUpdateWorkloadSheet } from "@/features/workload/hooks/use-workload";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { DAYS, SHIFT_TYPES } from "@/features/workload/api/workload.service";
import type { WorkloadSheet, WorkloadEntry } from "@/features/workload/api/workload.service";

interface SheetEditorGridProps {
  sheet: WorkloadSheet;
}

function emptyEntry(day: string, shiftType: string, categoryId: string): WorkloadEntry {
  return { day, shiftType, categoryId, categoryName: "", required: 0 };
}

export function SheetEditorGrid({ sheet }: SheetEditorGridProps) {
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.items ?? [];
  const updateMut = useUpdateWorkloadSheet();

  const [entries, setEntries] = useState<WorkloadEntry[]>(sheet.entries ?? []);
  const [isDirty, setIsDirty] = useState(false);

  // Build a lookup map: day+shiftType+categoryId -> entry
  const entryMap = useMemo(() => {
    const map = new Map<string, WorkloadEntry>();
    entries.forEach((e) => {
      const key = `${e.day}|${e.shiftType}|${e.categoryId}`;
      map.set(key, e);
    });
    return map;
  }, [entries]);

  const getKey = (day: string, shiftType: string, catId: string) =>
    `${day}|${shiftType}|${catId}`;

  const getValue = (day: string, shiftType: string, catId: string): number => {
    const entry = entryMap.get(getKey(day, shiftType, catId));
    return entry?.required ?? 0;
  };

  const setValue = (day: string, shiftType: string, catId: string, val: number) => {
    setEntries((prev) => {
      const existing = prev.find(
        (e) => e.day === day && e.shiftType === shiftType && e.categoryId === catId
      );
      if (val === 0 && existing) {
        return prev.filter((e) => e !== existing);
      }
      if (existing) {
        return prev.map((e) =>
          e === existing
            ? { ...e, required: val, categoryName: categories.find((c) => c.id === catId)?.name ?? catId }
            : e
        );
      }
      return [
        ...prev,
        {
          day,
          shiftType,
          categoryId: catId,
          categoryName: categories.find((c) => c.id === catId)?.name ?? catId,
          required: val,
        },
      ];
    });
    setIsDirty(true);
  };

  // Weekday columns (Mon-Fri) for Lunch & Dinner, Weekend (Sat-Sun) for Dinner only
  const weekdayDays = DAYS.slice(0, 5); // Mon-Fri
  const weekendDays = DAYS.slice(5, 7); // Sat-Sun

  const handleSave = () => {
    updateMut.mutate(
      { id: sheet.id, data: { entries } },
      {
        onSuccess: () => setIsDirty(false),
      }
    );
  };

  const handlePublish = () => {
    if (entries.length === 0) {
      toast.error("Add at least one manpower entry before publishing");
      return;
    }
    updateMut.mutate(
      { id: sheet.id, data: { entries, status: "published" } },
      {
        onSuccess: () => setIsDirty(false),
      }
    );
  };

  // Aggregate totals for header stats
  const totalStaffNeeded = entries.reduce((sum, e) => sum + e.required, 0);

  return (
    <div className="space-y-6">
      {/* Header with stats + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">
            <UsersIcon className="h-4 w-4 text-blue-600" />
            <div>
              <span className="text-sm font-bold text-blue-700">{totalStaffNeeded}</span>
              <span className="text-xs text-blue-500 ml-1.5 font-medium">total staff needed</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
            <LayersIcon className="h-4 w-4 text-slate-500" />
            <div>
              <span className="text-sm font-bold text-slate-700">{categories.length}</span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">categories</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-semibold">
              Unsaved changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={!isDirty || updateMut.isPending}
            className="rounded-xl h-10 font-semibold border-slate-200 shadow-sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {updateMut.isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            onClick={handlePublish}
            disabled={updateMut.isPending}
            className="rounded-xl h-10 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25"
          >
            <Send className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      {/* Weekday grid (Mon-Fri) — Lunch & Dinner */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-blue-500" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Weekdays</h3>
          <span className="text-xs text-slate-400 font-medium">Monday — Friday</span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gradient-to-b from-slate-50 to-white border-b border-r border-slate-200 p-3 text-left font-bold text-slate-600 min-w-[120px]">
                  <span className="text-xs uppercase tracking-wider">Category</span>
                </th>
                {weekdayDays.map((day) => (
                  <th
                    key={day}
                    colSpan={2}
                    className="border-b border-slate-200 p-2 text-center font-bold text-slate-600 bg-gradient-to-b from-slate-50 to-white"
                  >
                    <span className="text-xs uppercase tracking-wider">{day.slice(0, 3)}</span>
                  </th>
                ))}
              </tr>
              <tr>
                <th className="bg-slate-50/50 border-b border-r border-slate-200 p-1" />
                {weekdayDays.map((day) => (
                  <th
                    key={day}
                    colSpan={2}
                    className="border-b border-slate-200 p-1 text-center bg-slate-50/50"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0 border-sky-200 bg-sky-50 text-sky-700 rounded-md">
                        Lunch
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0 border-indigo-200 bg-indigo-50 text-indigo-700 rounded-md">
                        Dinner
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-medium">
                    No categories available. Create categories first to start assigning staff.
                  </td>
                </tr>
              )}
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="border-b border-r border-slate-100 p-3 sticky left-0 bg-white/95 backdrop-blur-sm group-hover:bg-blue-50/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-600">
                        {cat.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">{cat.name}</span>
                    </div>
                  </td>
                  {weekdayDays.map((day) => (
                    <React.Fragment key={`${day}-${cat.id}`}>
                      <td className="border-b border-slate-100 p-1.5">
                        <Input
                          type="number"
                          min={0}
                          max={20}
                          value={getValue(day, "Lunch", cat.id) || ""}
                          onChange={(e) =>
                            setValue(day, "Lunch", cat.id, Math.max(0, parseInt(e.target.value) || 0))
                          }
                          placeholder="0"
                          className="h-9 w-full text-center text-sm font-bold rounded-lg border-slate-200 bg-white shadow-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="border-b border-slate-100 p-1.5">
                        <Input
                          type="number"
                          min={0}
                          max={20}
                          value={getValue(day, "Dinner", cat.id) || ""}
                          onChange={(e) =>
                            setValue(day, "Dinner", cat.id, Math.max(0, parseInt(e.target.value) || 0))
                          }
                          placeholder="0"
                          className="h-9 w-full text-center text-sm font-bold rounded-lg border-slate-200 bg-white shadow-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekend grid (Sat-Sun) — Dinner only */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-indigo-500" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Weekend</h3>
          <span className="text-xs text-slate-400 font-medium">Saturday — Sunday (Dinner only)</span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gradient-to-b from-slate-50 to-white border-b border-r border-slate-200 p-3 text-left font-bold text-slate-600 min-w-[120px]">
                  <span className="text-xs uppercase tracking-wider">Category</span>
                </th>
                {weekendDays.map((day) => (
                  <th
                    key={day}
                    className="border-b border-slate-200 p-2 text-center font-bold text-slate-600 bg-gradient-to-b from-slate-50 to-white"
                  >
                    <span className="text-xs uppercase tracking-wider">{day.slice(0, 3)}</span>
                    <Badge variant="outline" className="ml-1.5 text-[10px] font-semibold px-1.5 py-0 border-indigo-200 bg-indigo-50 text-indigo-700 rounded-md align-middle">
                      Dinner
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400 font-medium">
                    No categories available
                  </td>
                </tr>
              )}
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="border-b border-r border-slate-100 p-3 sticky left-0 bg-white/95 backdrop-blur-sm group-hover:bg-indigo-50/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {cat.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">{cat.name}</span>
                    </div>
                  </td>
                  {weekendDays.map((day) => (
                    <td key={day} className="border-b border-slate-100 p-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={getValue(day, "Dinner", cat.id) || ""}
                        onChange={(e) =>
                          setValue(day, "Dinner", cat.id, Math.max(0, parseInt(e.target.value) || 0))
                        }
                        placeholder="0"
                        className="h-9 w-full text-center text-sm font-bold rounded-lg border-slate-200 bg-white shadow-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <span>Enter the number of staff needed per category per shift.</span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" /> Lunch
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" /> Dinner
        </span>
      </div>
    </div>
  );
}

// Inline icon components to avoid extra imports
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}


