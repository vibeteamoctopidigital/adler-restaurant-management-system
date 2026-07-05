import { Link } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OverviewHeaderProps {
  firstName: string;
}

export function OverviewHeader({ firstName }: OverviewHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Dashboard</p>
        <h1 className="text-3xl md:text-4xl font-bold mt-1 text-slate-900 tracking-tight">
          Good day, {firstName}
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Here&apos;s how things are shaping up.</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" asChild className="rounded-xl font-semibold bg-white border-slate-200 hover:bg-slate-50">
          <Link to="/dashboard/plans/manage">Manage Plans</Link>
        </Button>
        <Button asChild className="rounded-xl font-semibold shadow-md shadow-primary/20">
          <Link to="/dashboard/plan/create">
            Create Plan <CalendarPlus className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
