/**
 * Employee Table Component
 * Memoized to prevent unnecessary re-renders
 * Improved theme with gradient backgrounds and better colors
 */

import { memo, useCallback } from 'react';
import {
  MoreVertical,
  Pencil,
  Trash2,
  Ban,
  CheckCircle2,
  Users,
  Sparkles,
  Loader2,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { initials } from '@/lib/utils';
import type { Employee } from '@/features/employees/api/employee.service';

// ─────────────────────────────────────────────────────────────
// THEME CONFIGURATION
// ─────────────────────────────────────────────────────────────

const STATUS_THEME = {
  Active: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    shadow: 'shadow-blue-100/50',
  },
  Suspension: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    shadow: 'shadow-amber-100/50',
  },
  Leave: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    shadow: 'shadow-blue-100/50',
  },
  Sacked: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700 border-red-200',
    shadow: 'shadow-red-100/50',
  },
  Resigned: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    shadow: 'shadow-rose-100/50',
  },
  Retired: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    shadow: 'shadow-slate-100/50',
  },
} as const;

const TYPE_THEME = {
  'Full-time': {
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    text: 'text-purple-700',
  },
  'Part time': {
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    text: 'text-sky-700',
  },
  Intern: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    text: 'text-amber-700',
  },
  Remote: {
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
    text: 'text-teal-700',
  },
  Hybrid: {
    badge: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    text: 'text-fuchsia-700',
  },
} as const;

// ─────────────────────────────────────────────────────────────
// TABLE COMPONENT
// ─────────────────────────────────────────────────────────────

interface EmployeeTableProps {
  employees: Employee[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  mutatingId: string | null;
  onEdit: (emp: Employee) => void;
  onToggleStatus: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
  onAdd: () => void;
}

export const EmployeeTable = memo(function EmployeeTable({
  employees,
  isLoading,
  isError,
  isFetching,
  mutatingId,
  onEdit,
  onToggleStatus,
  onDelete,
  onAdd,
}: EmployeeTableProps) {
  return (
    <Card className="rounded-2xl border-slate-200/60 shadow-lg shadow-slate-200/40 bg-white overflow-hidden transition-all duration-200">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Header */}
            <thead>
              <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-blue-50/40 to-indigo-50/30">
                <th className="text-left py-4 px-6">
                  <span className="text-xs uppercase tracking-widest font-bold text-slate-600">
                    Employee
                  </span>
                </th>
                <th className="text-left py-4 px-4">
                  <span className="text-xs uppercase tracking-widest font-bold text-slate-600">
                    Department
                  </span>
                </th>
                <th className="text-left py-4 px-4">
                  <span className="text-xs uppercase tracking-widest font-bold text-slate-600">
                    Type
                  </span>
                </th>
                <th className="text-left py-4 px-4">
                  <span className="text-xs uppercase tracking-widest font-bold text-slate-600">
                    Status
                  </span>
                </th>
                <th className="text-right py-4 px-4">
                  <span className="text-xs uppercase tracking-widest font-bold text-slate-600">
                    Salary
                  </span>
                </th>
                <th className="text-right py-4 px-6">
                  <span className="text-xs uppercase tracking-widest font-bold text-slate-600">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100">
              {/* Loading Skeletons */}
              {/* {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={`skel-${i}`} />
                ))} */}

              {/* Data Rows */}
              {!isLoading &&
               
                employees.map((emp) => (
                  <EmployeeTableRow
                    key={emp.id}
                    employee={emp}
                    isMutating={mutatingId === emp.id}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                  />
                ))}
            </tbody>
          </table>

          {/* Empty State */}
          {!isLoading && !isError && employees.length === 0 && (
            <EmptyTableState onAdd={onAdd} />
          )}

          {/* Error State */}
          {/* {isError && <ErrorTableState />} */}
        </div>
      </CardContent>
    </Card>
  );
});

// ─────────────────────────────────────────────────────────────
// TABLE ROW COMPONENT
// ─────────────────────────────────────────────────────────────

const EmployeeTableRow = memo(function EmployeeTableRow({
  employee: emp,
  isMutating,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  employee: Employee;
  isMutating: boolean;
  onEdit: (emp: Employee) => void;
  onToggleStatus: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
}) {
  const statusTheme = STATUS_THEME[emp.status as keyof typeof STATUS_THEME];
  const typeTheme = TYPE_THEME[emp.employmentType as keyof typeof TYPE_THEME];

  return (
    <tr
      className={`transition-all duration-200 border-slate-50 group ${
        isMutating
          ? 'bg-blue-50/60 shadow-sm shadow-blue-100/50'
          : 'hover:bg-slate-50/60'
      }`}
    >
      {/* Employee Column */}
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/60 text-blue-600 flex items-center justify-center text-xs font-bold overflow-hidden shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-110">
            {emp.avatar ? (
              <img src={emp.avatar} alt={emp.name} className="h-full w-full object-cover" />
            ) : (
              initials(emp.name)
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
              {emp.name}
            </p>
            <p className="text-[11px] font-medium text-slate-400 truncate">
              {emp.email}
            </p>
          </div>
        </div>
      </td>

      {/* Department Column */}
      <td className="py-4 px-4">
        <div>
          <p className="font-semibold text-slate-800">{emp.department}</p>
          <p className="text-[11px] text-slate-500 font-medium">{emp.designation}</p>
        </div>
      </td>

      {/* Employment Type Column */}
      <td className="py-4 px-4">
        <Badge
          variant="outline"
          className={`${typeTheme.badge} font-semibold rounded-lg px-2.5 py-1 border`}
        >
          {emp.employmentType}
        </Badge>
      </td>

      {/* Status Column */}
      <td className="py-4 px-4">
        {isMutating ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Updating…</span>
          </div>
        ) : (
          <Badge
            variant="outline"
            className={`${statusTheme.badge} font-semibold rounded-lg px-2.5 py-1 border`}
          >
            {emp.status}
          </Badge>
        )}
      </td>

      {/* Salary Column */}
      <td className="py-4 px-4 text-right">
        <span className="font-bold text-slate-900">CHF {emp.salary.toLocaleString()}</span>
      </td>

      {/* Actions Column */}
      <td className="py-4 px-6 text-right">
        <EmployeeActionMenu
          employee={emp}
          isMutating={isMutating}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
});

// ─────────────────────────────────────────────────────────────
// ACTION MENU COMPONENT
// ─────────────────────────────────────────────────────────────

const EmployeeActionMenu = memo(function EmployeeActionMenu({
  employee: emp,
  isMutating,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  employee: Employee;
  isMutating: boolean;
  onEdit: (emp: Employee) => void;
  onToggleStatus: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100/80 transition-all rounded-lg"
          disabled={isMutating}
        >
          {isMutating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="rounded-xl border-slate-200/80 shadow-xl shadow-slate-200/50 bg-white/95 backdrop-blur-md"
      >
        <DropdownMenuItem
          className="cursor-pointer rounded-lg mx-1 my-0.5 focus:bg-blue-50 focus:text-blue-700"
          onClick={() => onEdit(emp)}
        >
          <Pencil className="mr-2 h-4 w-4 text-blue-500" /> Edit
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer rounded-lg mx-1 my-0.5 focus:bg-indigo-50 focus:text-indigo-700"
          onClick={() => onToggleStatus(emp)}
        >
          {emp.status === 'Active' ? (
            <>
              <Ban className="mr-2 h-4 w-4 text-amber-500" /> Suspend
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" /> Activate
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-slate-100" />

        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg mx-1 my-0.5"
          onClick={() => onDelete(emp)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// ─────────────────────────────────────────────────────────────
// SKELETON ROW COMPONENT
// ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 bg-slate-50/30">
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3.5 w-32 rounded-md bg-gradient-to-r from-slate-200 to-slate-300" />
            <Skeleton className="h-3 w-40 rounded-md bg-gradient-to-r from-slate-200 to-slate-300" />
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-4 w-20 rounded-md bg-gradient-to-r from-slate-200 to-slate-300" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-6 w-20 rounded-lg bg-gradient-to-r from-slate-200 to-slate-300" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-6 w-20 rounded-lg bg-gradient-to-r from-slate-200 to-slate-300" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-4 w-16 ml-auto rounded-md bg-gradient-to-r from-slate-200 to-slate-300" />
      </td>
      <td className="py-4 px-6">
        <Skeleton className="h-8 w-8 rounded-lg ml-auto bg-gradient-to-r from-slate-200 to-slate-300" />
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE COMPONENT
// ─────────────────────────────────────────────────────────────

function EmptyTableState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-16 text-center flex flex-col items-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-sm">
        <Users className="h-8 w-8 text-slate-400" />
      </div>
      <div>
        <p className="text-slate-500 font-semibold text-sm">No employees found</p>
        <p className="text-slate-400 text-xs mt-1">
          Try adjusting your filters or add a new employee
        </p>
      </div>
      <Button
        onClick={onAdd}
        size="sm"
        className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25"
      >
        <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Add first employee
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ERROR STATE COMPONENT
// ─────────────────────────────────────────────────────────────

function ErrorTableState() {
  return (
    <div className="py-16 text-center">
      <p className="text-red-600 font-semibold text-sm">
        Failed to load employees
      </p>
      <p className="text-red-500 text-xs mt-1">
        Check if the API is running (npm run dev:server)
      </p>
    </div>
  );
}
