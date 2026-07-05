import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface PlanPageHeaderProps {
  backTo: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
}

/** Sticky top bar shared by every plans screen: back link, eyebrow/title, action slot. */
export function PlanPageHeader({ backTo, eyebrow, title, actions }: PlanPageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/60 backdrop-blur-xl shadow-sm dark:border-white/10 dark:bg-background/60">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            to={backTo}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            {eyebrow && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary">
                {eyebrow}
              </div>
            )}
            <h1 className="text-xl font-bold leading-tight tracking-tight text-foreground">{title}</h1>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
