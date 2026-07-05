import { cn } from "@/lib/utils";

interface WorkerAvatarProps {
  name?: string | null;
  color?: string;
  size?: "sm" | "md";
  className?: string;
}

/** Circular initials avatar tinted by category color — shared by the schedule grid and day board. */
export function WorkerAvatar({ name, color, size = "md", className }: WorkerAvatarProps) {
  const initials = (name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-background shadow-sm",
        size === "sm" ? "h-8 w-8 text-[10px]" : "h-8 w-8 text-xs",
        color ?? "bg-slate-500",
        className,
      )}
    >
      {initials || "?"}
    </div>
  );
}
