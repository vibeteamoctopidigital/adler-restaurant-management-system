import { useState } from "react";
import {
  ClipboardList,
  Plus,
  FileSpreadsheet,
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CreateSheetModal,
  SheetEditorGrid,
  SheetsList,
  WorkloadDetailsModal,
} from "@/components/workload";
import type { WorkloadSheet } from "@/features/workload/api/workload.service";
import { useWorkloadSheet } from "@/features/workload/hooks/use-workload";

export function WorkloadPage() {
  // View mode: 'list' (show all sheets) | 'edit' (edit a specific sheet)
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsSheet, setDetailsSheet] = useState<WorkloadSheet | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch the editing sheet
  const { data: editingSheet, isLoading: editingLoading } = useWorkloadSheet(
    mode === "edit" ? editingSheetId ?? undefined : undefined
  );

  const handleViewDetails = (sheet: WorkloadSheet) => {
    setDetailsSheet(sheet);
    setDetailsOpen(true);
  };

  const handleEditSheet = (sheet: WorkloadSheet) => {
    setEditingSheetId(sheet.id);
    setMode("edit");
  };

  const handleBack = () => {
    setMode("list");
    setEditingSheetId(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px]">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {mode === "edit" ? (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-xl h-10 w-10 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-xs uppercase tracking-widest text-blue-500 font-semibold">
                  Workload Editor
                </p>
                <h1 className="text-2xl md:text-3xl font-bold mt-1 text-slate-900 tracking-tight">
                  {editingSheet?.label || `Week ${editingSheet?.weekNumber}`}
                </h1>
                <p className="text-slate-500 mt-1 font-medium text-sm">
                  {editingSheet?.month?.replace("-", " · ")} &mdash;{" "}
                  {editingSheet?.dateRange?.start} → {editingSheet?.dateRange?.end}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest text-blue-500 font-semibold">
                Planning
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mt-1 text-slate-900 tracking-tight">
                Workload Management
              </h1>
              <p className="text-slate-500 mt-1 font-medium">
                Create and manage week-based staff workload sheets by category
              </p>
            </>
          )}
        </div>
        {mode === "list" && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-xl h-11 px-6 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25"
          >
            <Plus className="mr-2 h-4 w-4" />
            New sheet
          </Button>
        )}
      </header>

      
      {mode === "edit" ? (
        editingLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="text-sm font-medium text-slate-400">Loading sheet…</p>
            </div>
          </div>
        ) : editingSheet ? (
          <SheetEditorGrid sheet={editingSheet} />
        ) : (
          <div className="py-16 text-center text-slate-400 font-medium">
            Sheet not found.
          </div>
        )
      ) : (
        <SheetsList
          onViewDetails={handleViewDetails}
          onEditSheet={handleEditSheet}
        />
      )}

           <CreateSheetModal open={createOpen} onOpenChange={setCreateOpen} />

    
       <WorkloadDetailsModal
        sheet={detailsSheet}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      /> 
    </div>
  );
}
