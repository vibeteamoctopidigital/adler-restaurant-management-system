import type { AssignedSlot } from "../../lib/plan-data";

type StatusFilter = "all" | AssignedSlot["status"];

const FILTERS: StatusFilter[] = ["all", "accepted", "pending", "rejected"];

interface StatusFilterTabsProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}

export function StatusFilterTabs({ value, onChange }: StatusFilterTabsProps) {
  return (
    <div className="mb-4 inline-flex rounded-full border border-border/70 bg-card p-1 text-xs shadow-sm">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`rounded-full px-3.5 py-1.5 font-semibold capitalize transition ${
            value === f
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
