import { useState } from "react";
import {
  CalendarRange,
  Eye,
  Trash2,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useWorkloadSheets, useDeleteWorkloadSheet } from "@/features/workload/hooks/use-workload";
import { formatDate } from "@/lib/utils";
import type { WorkloadSheet } from "@/features/workload/api/workload.service";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  published: { label: "Published", cls: "bg-blue-50 text-blue-600 border-blue-200" },
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface SheetsListProps {
  onViewDetails: (sheet: WorkloadSheet) => void;
  onEditSheet: (sheet: WorkloadSheet) => void;
}

export function SheetsList({ onViewDetails, onEditSheet }: SheetsListProps) {
  const now = new Date();
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError } = useWorkloadSheets({
    status: statusFilter === "all" ? undefined : statusFilter,
    month: monthFilter === "all" ? undefined : monthFilter,
  });

  const deleteMut = useDeleteWorkloadSheet();
  const [deleteTarget, setDeleteTarget] = useState<WorkloadSheet | null>(null);

  const sheets = data?.items ?? [];

  // Derive available months from data
  const availableMonths = [...new Set(sheets.map((s) => s.month))].sort();

  // Client-side search
  const filtered = searchQuery
    ? sheets.filter((s) => {
        const q = searchQuery.toLowerCase();
        return (
          s.label?.toLowerCase().includes(q) ||
          s.month.toLowerCase().includes(q) ||
          `week ${s.weekNumber}`.includes(q)
        );
      })
    : sheets;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white/90 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Filters
          </span>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] rounded-xl h-10 text-sm font-medium border-slate-200 bg-white shadow-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 shadow-xl rounded-xl">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[180px] rounded-xl h-10 text-sm font-medium border-slate-200 bg-white shadow-sm">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 shadow-xl rounded-xl">
              <SelectItem value="all">All months</SelectItem>
              {availableMonths.map((m) => {
                const [y, mo] = m.split("-");
                const label = `${MONTH_NAMES[parseInt(mo) - 1] || mo} ${y}`;
                return (
                  <SelectItem key={m} value={m}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search sheets…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl h-10 text-sm font-medium border-slate-200 bg-white shadow-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-300"
            />
          </div>

          <div className="ml-auto text-xs font-medium text-slate-400">
            {filtered.length} sheet{filtered.length !== 1 ? "s" : ""}
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {isError && (
        <Card className="rounded-2xl border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="font-bold text-red-700 text-sm">Failed to load sheets</p>
              <p className="text-sm text-red-500 mt-0.5">
                Ensure the mock API server is running (<code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">npm run dev:server</code>)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardContent className="p-5 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40 rounded-lg" />
                  <Skeleton className="h-4 w-60 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filtered.length === 0 && (
        <Card className="rounded-2xl border-slate-200 border-dashed bg-slate-50/50">
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No workload sheets found</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Create your first sheet to get started"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sheets list */}
      {!isLoading &&
        !isError &&
        filtered.map((sheet) => {
          const meta = STATUS_META[sheet.status] ?? STATUS_META.draft;
          const totalRequired = (sheet.entries ?? []).reduce((a, e) => a + e.required, 0);
          const uniqueCategories = new Set(
            (sheet.entries ?? []).map((e) => e.categoryName || e.categoryId)
          );
          const [year, monthNum] = sheet.month.split("-");
          const monthLabel = `${MONTH_NAMES[parseInt(monthNum) - 1] || monthNum} ${year}`;

          return (
            <Card
              key={sheet.id}
              className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden transition-all hover:border-primary/30 hover:shadow-md group"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Icon + Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-sm">
                      <CalendarRange className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">
                          {sheet.label || `Week ${sheet.weekNumber}`}
                        </h3>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-md font-bold border ${meta.cls}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-500 mt-1">
                        {monthLabel} · {sheet.dateRange.start} → {sheet.dateRange.end}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-400">
                        <span>
                          {totalRequired} staff needed
                        </span>
                        {uniqueCategories.size > 0 && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>
                              {uniqueCategories.size} categor{uniqueCategories.size === 1 ? "y" : "ies"}
                            </span>
                          </>
                        )}
                        <span className="text-slate-300">·</span>
                        <span>Updated {formatDate(sheet.updatedAt || sheet.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(sheet)}
                      className="rounded-xl h-9 font-semibold border-slate-200 shadow-sm"
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Details
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onEditSheet(sheet)}
                      className="rounded-xl h-9 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                    >
                      Edit
                    </Button>
                    {sheet.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(sheet)}
                        className="rounded-xl h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl border-slate-200 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">
              Delete workload sheet?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.label || `Week ${deleteTarget?.weekNumber}`} will be permanently
              removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-slate-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white border-0"
              onClick={() => {
                if (deleteTarget) {
                  deleteMut.mutate(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              {deleteMut.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…</>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
