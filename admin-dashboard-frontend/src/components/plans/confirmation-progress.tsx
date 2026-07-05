interface ConfirmationProgressProps {
  accepted: number;
  total: number;
}

/** Two-segment progress bar: accepted (emerald) vs. not-yet-confirmed (rose) share of all slots. */
export function ConfirmationProgress({ accepted, total }: ConfirmationProgressProps) {
  const acceptedPct = total ? (accepted / total) * 100 : 0;
  const remainingPct = total ? ((total - accepted) / total) * 100 : 0;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold tracking-tight">Confirmation progress</h3>
          <p className="text-xs font-medium text-muted-foreground">
            {accepted} of {total} slots confirmed by workers
          </p>
        </div>
        <div className="text-2xl font-bold tabular-nums tracking-tight text-primary">{Math.round(acceptedPct)}%</div>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${acceptedPct}%` }} />
        <div className="bg-gradient-to-r from-rose-400 to-rose-500 transition-all" style={{ width: `${remainingPct}%` }} />
      </div>
    </div>
  );
}
