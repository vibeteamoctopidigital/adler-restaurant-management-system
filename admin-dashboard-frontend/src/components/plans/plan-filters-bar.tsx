import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTHS } from "../../lib/plan-data";

interface PlanFiltersBarProps {
  q: string;
  onQChange: (value: string) => void;
  monthFilter: string;
  onMonthFilterChange: (value: string) => void;
  weekFilter: string;
  onWeekFilterChange: (value: string) => void;
}

/** Search + month/week filters toolbar for the plans list. */
export function PlanFiltersBar({
  q,
  onQChange,
  monthFilter,
  onMonthFilterChange,
  weekFilter,
  onWeekFilterChange,
}: PlanFiltersBarProps) {
  return (
    <div className="relative z-10 mb-6 flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/50 p-3.5 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-card/50 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search plans…"
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Select value={monthFilter} onValueChange={onMonthFilterChange}>
          <SelectTrigger className="w-40 rounded-lg font-medium">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {MONTHS.map((m, i) => (
              <SelectItem key={m} value={String(i)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={weekFilter} onValueChange={onWeekFilterChange}>
          <SelectTrigger className="w-36 rounded-lg font-medium">
            <SelectValue placeholder="Week" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All weeks</SelectItem>
            {[1, 2, 3, 4, 5].map((w) => (
              <SelectItem key={w} value={String(w)}>
                Week {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
