import type { AssignedSlot } from "../../lib/plan-data";

interface ConfirmBadgeProps {
  confirmed: boolean;
  status: AssignedSlot["status"];
}

/** Binary confirm/unconfirmed badge — green if the worker accepted, red otherwise. */
export function ConfirmBadge({ confirmed, status }: ConfirmBadgeProps) {
  return (
    <span
      className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-bold text-white shadow-sm ${
        confirmed ? "bg-emerald-500" : "bg-rose-500"
      }`}
      title={status}
    >
      {confirmed ? "OK" : status === "rejected" ? "NO" : "…"}
    </span>
  );
}
