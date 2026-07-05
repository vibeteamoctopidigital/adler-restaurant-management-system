import { useState } from "react";
import { ArrowLeftRight, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useApprovals, useReviewApproval } from "@/features/approvals/hooks/use-approvals";
import { useEmployees } from "@/features/employees/hooks/use-employees";
import type { Approval } from "@/features/approvals/api/approval.service";
import { initials, formatDate } from "@/lib/utils";

export function ApprovalsPage() {
  const { data, isLoading, isError } = useApprovals();
  const { data: employeesData } = useEmployees();
  const reviewMut = useReviewApproval();

  const [rejectTarget, setRejectTarget] = useState<Approval | null>(null);
  const [reason, setReason] = useState("");

  const list = data?.items ?? [];
  const employees = employeesData?.items ?? [];
  const nameOf = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  const pending = list.filter((s) => s.status === "pending");
  const done = list.filter((s) => s.status !== "pending");

  const approve = (s: Approval) => {
    if (s.swapData.ruleCheck === "fail") return;
    reviewMut.mutate({ id: s.id, action: "approve" });
  };

  const reject = () => {
    if (!rejectTarget) return;
    reviewMut.mutate(
      { id: rejectTarget.id, action: "reject", comments: reason },
      { onSuccess: () => { setRejectTarget(null); setReason(""); } }
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px]">
      <header>
        <p className="text-xs uppercase tracking-widest text-blue-500 font-semibold">Shift approvals</p>
        <h1 className="text-3xl md:text-4xl font-bold mt-1 text-slate-900 tracking-tight">Swap requests</h1>
        <p className="text-slate-500 mt-1 font-medium">Only shift swaps between two employees.</p>
      </header>

      {isError && <div className="py-16 text-center text-red-600 font-medium">Failed to load approvals. Is the mock API running?</div>}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-slate-100 p-1.5 rounded-xl h-auto">
          <TabsTrigger value="pending" className="rounded-lg font-semibold px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 data-[state=active]:border data-[state=active]:border-blue-200">
            Pending <Badge className="ml-2 h-5 min-w-5 px-1.5 bg-blue-600 text-white rounded-lg">{pending.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg font-semibold px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 data-[state=active]:border data-[state=active]:border-blue-200">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {isLoading && Array.from({ length: 2 }).map((_, i) => <SwapSkeleton key={i} />)}
          {!isLoading && pending.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-slate-200 bg-white/80 backdrop-blur-sm">
              <CardContent className="py-16 text-center text-slate-400 font-medium">All caught up.</CardContent>
            </Card>
          ) : pending.map((s) => (
            <SwapCard key={s.id} swap={s} nameOf={nameOf} onApprove={() => approve(s)} onReject={() => setRejectTarget(s)} busy={reviewMut.isPending} />
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          {!isLoading && done.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-slate-200 bg-white/80 backdrop-blur-sm">
              <CardContent className="py-16 text-center text-slate-400 font-medium">No history yet.</CardContent>
            </Card>
          ) : done.map((s) => <SwapCard key={s.id} swap={s} nameOf={nameOf} readOnly />)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Reject swap</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-medium text-slate-500 mt-1">The employees will be notified with your reason.</p>
          <div className="py-4">
            <Textarea placeholder="e.g. Not enough coverage on Sunday morning" value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 min-h-[100px] resize-none transition-all" />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl font-semibold border-slate-200 hover:bg-slate-50" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button className="rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 transition-all duration-200" onClick={reject} disabled={reviewMut.isPending}>
              {reviewMut.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rejecting…</> : "Reject swap"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SwapSkeleton() {
  return (
    <Card className="rounded-2xl shadow-md shadow-slate-100/50 bg-white/80 backdrop-blur-sm border border-slate-200/80 overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <Skeleton className="h-4 w-32 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] items-center">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-full mx-auto" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

function SwapCard({ swap, nameOf, onApprove, onReject, readOnly, busy }: {
  swap: Approval;
  nameOf: (id: string) => string;
  onApprove?: () => void;
  onReject?: () => void;
  readOnly?: boolean;
  busy?: boolean;
}) {
  const { swapData: d } = swap;
  return (
    <Card className={`rounded-2xl shadow-md shadow-slate-100/50 bg-white/90 backdrop-blur-sm border transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 ${d.ruleCheck === "fail" ? "border-red-200 shadow-red-100/30" : "border-slate-200/80"}`}>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5" /> Requested {formatDate(swap.submittedDate)}
          </div>
          {swap.status === "pending" ? (
            <Badge variant="outline" className={`px-3 py-1 rounded-lg font-semibold ${d.ruleCheck === "pass" ? "border-blue-200 text-blue-700 bg-blue-50 shadow-sm shadow-blue-100" : "border-red-200 text-red-700 bg-red-50 shadow-sm shadow-red-100"}`}>
              {d.ruleCheck === "pass" ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Rules OK</> : <><AlertTriangle className="h-3.5 w-3.5 mr-1.5" />Rule fail</>}
            </Badge>
          ) : (
            <Badge variant="outline" className={`px-3 py-1 rounded-lg font-semibold ${swap.status === "approved" ? "border-blue-200 text-blue-700 bg-blue-50" : "border-red-200 text-red-700 bg-red-50"}`}>
              {swap.status === "approved" ? "Approved" : "Rejected"}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] items-center">
          <ShiftBlock name={nameOf(d.fromEmployeeId)} shift={d.fromShift} label="Offers" />
          <div className="hidden md:flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </div>
          <ShiftBlock name={nameOf(d.toEmployeeId)} shift={d.toShift} label="Takes" />
        </div>

        {d.ruleNote && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm font-medium text-red-600">{d.ruleNote}</div>
        )}

        {!readOnly && (
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" className="rounded-xl font-semibold border-slate-200 hover:bg-slate-50 transition-all" onClick={onReject} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2 text-red-500" />} Reject
            </Button>
            <Button className="rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all duration-200" onClick={onApprove} disabled={d.ruleCheck === "fail" || busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} Approve
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShiftBlock({ name, shift, label }: { name: string; shift: { day: string; time: string; category: string }; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-blue-50/30 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-500/20">
          {initials(name)}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="font-bold text-slate-900 truncate mt-0.5">{name}</p>
        </div>
      </div>
      <div className="mt-4 space-y-1 text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
        <p className="font-bold text-slate-900">{shift.day}</p>
        <p className="text-slate-500 font-medium">{shift.time}</p>
        <Badge variant="secondary" className="mt-2 bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold rounded-lg">{shift.category}</Badge>
      </div>
    </div>
  );
}
