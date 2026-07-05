import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, CATEGORY_COLORS, type Category } from "../../lib/plan-data";
import { cn } from "@/lib/utils";

interface ManageCategoriesDialogProps {
  categories: Category[];
}

export function ManageCategoriesDialog({ categories }: ManageCategoriesDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rate, setRate] = useState(15);
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await api.addCategory({ name: name.trim(), color, hourlyRate: rate });
    setSaving(false);
    setName("");
    setRate(15);
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this category?")) return;
    await api.removeCategory(id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-lg font-semibold">
          Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">Work categories</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 transition hover:border-primary/30 hover:bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${c.color}`} />
                <span className="font-semibold">{c.name}</span>
                <span className="text-xs font-medium text-muted-foreground">${c.hourlyRate}/hr</span>
              </div>
              <button
                onClick={() => remove(c.id)}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-2 rounded-lg border border-dashed border-border p-3">
          <div className="text-xs font-medium text-muted-foreground">Add new</div>
          <Input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              className="w-28"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value) || 1)}
            />
            <div className="flex flex-wrap gap-1">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full ring-offset-2 ring-offset-background transition",
                    c,
                    color === c ? "ring-2 ring-foreground" : "",
                  )}
                />
              ))}
            </div>
          </div>
          <Button size="sm" onClick={add} disabled={saving} className="w-full gap-1.5">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Add category
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
