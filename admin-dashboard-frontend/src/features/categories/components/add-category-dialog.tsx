import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useCreateCategory } from "../hooks/use-categories";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_VALUES = { name: "", description: "", defaultRate: 0, maxShifts: 0 };

export function AddCategoryDialog({ open, onOpenChange }: AddCategoryDialogProps) {
  const createMut = useCreateCategory();
  const [values, setValues] = useState(EMPTY_VALUES);

  const handleOpenChange = (next: boolean) => {
    if (!next) setValues(EMPTY_VALUES);
    onOpenChange(next);
  };

  const handleCreate = () => {
    const name = values.name.trim();
    if (!name) {
      toast.error("Category name is required");
      return;
    }
    createMut.mutate(
      {
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        description: values.description,
        defaultRate: values.defaultRate,
        maxShifts: values.maxShifts,
        sub: [],
      },
      { onSuccess: () => handleOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Add category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="font-semibold text-slate-700 text-sm">Name *</Label>
            <Input
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="e.g. Reception"
              className="rounded-xl h-11 border-slate-200 bg-slate-50 focus-visible:ring-blue-500/30 focus-visible:border-blue-400 transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold text-slate-700 text-sm">Description</Label>
            <Input
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              placeholder="Brief description"
              className="rounded-xl h-11 border-slate-200 bg-slate-50 focus-visible:ring-blue-500/30 focus-visible:border-blue-400 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700 text-sm">Rate (CHF/h)</Label>
              <Input
                type="number"
                value={values.defaultRate}
                onChange={(e) => setValues((v) => ({ ...v, defaultRate: Number(e.target.value) }))}
                className="rounded-xl h-11 border-slate-200 bg-slate-50 focus-visible:ring-blue-500/30 focus-visible:border-blue-400 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700 text-sm">Max shifts/wk</Label>
              <Input
                type="number"
                value={values.maxShifts}
                onChange={(e) => setValues((v) => ({ ...v, maxShifts: Number(e.target.value) }))}
                className="rounded-xl h-11 border-slate-200 bg-slate-50 focus-visible:ring-blue-500/30 focus-visible:border-blue-400 transition-all"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-xl font-semibold border-slate-200 hover:bg-slate-50"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all duration-200"
            onClick={handleCreate}
            disabled={createMut.isPending}
          >
            {createMut.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
              </>
            ) : (
              "Create category"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
