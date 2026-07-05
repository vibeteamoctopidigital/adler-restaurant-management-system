import { useMemo, useState } from "react";
import { Download, TrendingUp, Clock, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useEmployees } from "@/features/employees/hooks/use-employees";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { initials, exportToCsv } from "@/lib/utils";
import { buildQuery, type ListResponse } from "@/types";

const reportSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  month: z.string(),
  scheduled: z.number(),
  worked: z.number(),
  overtime: z.number(),
  due: z.number(),
  wage: z.number(),
});
type Report = z.infer<typeof reportSchema>;

const listSchema = z.object({
  items: z.array(reportSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

function useReports(month?: string) {
  return useQuery({
    queryKey: ["reports", month ?? "all"],
    queryFn: (): Promise<ListResponse<Report>> =>
      apiClient.get(`/reports${buildQuery({ month })}`, { schema: listSchema }),
  });
}

export function ReportsPage() {
  const [cat, setCat] = useState("all");
  const [name, setName] = useState("");

  const { data: reportsData, isLoading, isError } = useReports();
  const { data: employeesData } = useEmployees();
  const { data: categoriesData } = useCategories();

  const employees = employeesData?.items ?? [];
  const categories = categoriesData?.items ?? [];
  const reports = reportsData?.items ?? [];

  const rows = useMemo(() => {
    return reports
      .map((r) => ({ report: r, employee: employees.find((e) => e.id === r.employeeId) }))
      .filter((row) => {
        if (!row.employee) return false;
        if (cat !== "all" && !(row.employee.categories ?? []).includes(cat)) return false;
        if (name && !row.employee.name.toLowerCase().includes(name.toLowerCase())) return false;
        return true;
      });
  }, [reports, employees, cat, name]);

  const totals = useMemo(() => ({
    worked: rows.reduce((a, r) => a + r.report.worked, 0),
    overtime: rows.reduce((a, r) => a + r.report.overtime, 0),
    wage: rows.reduce((a, r) => a + r.report.wage, 0),
    due: rows.reduce((a, r) => a + r.report.due, 0),
  }), [rows]);

  const doExport = () => {
    if (!rows.length) { toast.error("Nothing to export"); return; }
    exportToCsv(
      "adler-report.csv",
      rows.map((r) => ({
        employee: r.employee!.name,
        department: r.employee!.department,
        contract: r.employee!.contract ?? "",
        workload: r.employee!.workload ?? "",
        scheduled: r.report.scheduled,
        worked: r.report.worked,
        overtime: r.report.overtime,
        due: r.report.due,
        wage: r.report.wage,
      }))
    );
    toast.success("Report exported");
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-blue-500 font-semibold">Analysis</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-1 text-slate-900 tracking-tight">Reports</h1>
          <p className="text-slate-500 mt-1 font-medium">Hours, overtime and wage cost per employee.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Input placeholder="Filter by name…" value={name} onChange={(e) => setName(e.target.value)} className="w-[180px] rounded-xl h-10 border-slate-200 bg-white/60 shadow-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-300 font-medium transition-all" />
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-[180px] rounded-xl font-medium border-slate-200 bg-white/60 shadow-sm h-10"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-slate-200 shadow-xl shadow-slate-200/50 rounded-xl">
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button className="rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all duration-200" onClick={doExport}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SumCard icon={<Clock />} label="Total worked" value={`${totals.worked} h`} colorClass="bg-blue-50 text-blue-600 shadow-sm shadow-blue-100" loading={isLoading} />
        <SumCard icon={<TrendingUp />} label="Overtime" value={`${totals.overtime} h`} accent colorClass="bg-amber-50 text-amber-600 shadow-sm shadow-amber-100" loading={isLoading} />
        <SumCard icon={<Clock />} label="Hours due" value={`${totals.due} h`} colorClass="bg-red-50 text-red-600 shadow-sm shadow-red-100" loading={isLoading} />
        <SumCard icon={<Wallet />} label="Wage cost" value={`CHF ${totals.wage.toLocaleString()}`} colorClass="bg-blue-50 text-blue-600 shadow-sm shadow-blue-100" loading={isLoading} />
      </div>

      <Card className="rounded-2xl border-slate-200/80 shadow-lg shadow-slate-100/50 bg-white/90 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50/80 to-blue-50/30 border-b border-slate-100 pb-4 pt-5 px-6">
          <CardTitle className="text-lg font-bold text-slate-900">Per employee</CardTitle>
          <p className="text-sm font-medium text-slate-500 mt-1">{rows.length} employees</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="text-left py-4 px-6">Employee</th>
                  <th className="text-left py-4 px-4">Contract</th>
                  <th className="text-right py-4 px-4">Scheduled</th>
                  <th className="text-right py-4 px-4">Worked</th>
                  <th className="text-right py-4 px-4">Overtime</th>
                  <th className="text-right py-4 px-4">Due</th>
                  <th className="text-right py-4 px-6">Wage</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-4 px-6"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-28 rounded-lg" /></div></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20 rounded-lg" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-16 ml-auto rounded-lg" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-12 ml-auto rounded-lg" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-12 ml-auto rounded-lg" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-12 ml-auto rounded-lg" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-4 w-20 ml-auto rounded-lg" /></td>
                  </tr>
                ))}

                {!isLoading && rows.map(({ report: r, employee: e }) => {
                  const pct = Math.min(100, Math.round((r.worked / Math.max(1, r.scheduled)) * 100));
                  return (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-blue-50/20 transition-all duration-200 group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/60 text-blue-600 flex items-center justify-center text-xs font-bold overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                            {e!.avatar ? <img src={e!.avatar} alt={e!.name} className="h-full w-full object-cover" /> : initials(e!.name)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{e!.name}</p>
                            <div className="flex gap-1 mt-1">
                              {(e!.categories ?? []).slice(0, 2).map((cid) => (
                                <Badge key={cid} variant="secondary" className="text-[10px] py-0 px-1.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-md">
                                  {categories.find((c) => c.id === cid)?.name ?? cid}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 capitalize text-slate-500 font-medium">{e!.contract} · {e!.workload}%</td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-slate-700">{r.scheduled} h</span>
                        <div className="h-1.5 mt-2 rounded-full bg-slate-100 overflow-hidden w-20 ml-auto">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-slate-900">{r.worked} h</td>
                      <td className="py-4 px-4 text-right">
                        {r.overtime > 0 ? <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200/60 px-2 py-1 rounded-lg shadow-sm shadow-amber-100">+{r.overtime} h</span> : <span className="text-slate-400 font-medium">—</span>}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {r.due > 0 ? <span className="text-red-700 font-bold bg-red-50 border border-red-200/60 px-2 py-1 rounded-lg shadow-sm shadow-red-100">{r.due} h</span> : <span className="text-slate-400 font-medium">—</span>}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-900">CHF {r.wage.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {isError && <div className="py-16 text-center text-red-600 font-medium">Failed to load reports.</div>}
            {!isLoading && !isError && rows.length === 0 && <div className="py-16 text-center text-slate-400 font-medium">No report data matches your filters.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SumCard({ icon, label, value, accent, colorClass, loading }: { icon: React.ReactNode; label: string; value: string; accent?: boolean; colorClass: string; loading?: boolean }) {
  return (
    <Card className={`rounded-2xl shadow-md shadow-slate-100/50 bg-white/90 backdrop-blur-sm border transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 ${accent ? "border-amber-200 shadow-amber-100/30" : "border-slate-200/80"}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${colorClass}`}>
            <span className="h-4 w-4">{icon}</span>
          </span>
          {label}
        </div>
        {loading ? <Skeleton className="mt-4 h-9 w-24 rounded-lg" /> : <p className="mt-4 text-3xl font-bold text-slate-900 tracking-tight">{value}</p>}
      </CardContent>
    </Card>
  );
}
