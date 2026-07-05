import { useState } from "react";
import { Mail, Phone, MapPin, Shield, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { useAvailability } from "@/features/plans/hooks/use-availability";
import { initials, formatDate } from "@/lib/utils";

export function ProfilePage() {
  const user = useAuthStore((s) => s.admin);
  const { data, isLoading } = useAvailability(user?.id);
  const availability = data?.items?.[0];

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1100px]">
      <header>
        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Account</p>
        <h1 className="text-3xl md:text-4xl font-bold mt-1 text-slate-900 tracking-tight">Profile</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage your personal information and availability.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        {/* Left panel */}
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white h-fit">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-2xl font-bold overflow-hidden">
              {user?.avatar ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" /> : initials(user?.name)}
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-sm font-medium text-slate-500">{user?.email}</p>
            <Badge variant="outline" className="mt-3 capitalize border-primary/20 text-primary bg-primary/5 font-semibold px-3 py-1">
              <Shield className="h-3.5 w-3.5 mr-1.5" /> {user?.role}
            </Badge>
            <div className="mt-6 w-full space-y-2 text-left text-sm">
              <div className="flex items-center gap-2 text-slate-500 font-medium"><Mail className="h-4 w-4 text-slate-400" /> {user?.email}</div>
              <div className="flex items-center gap-2 text-slate-500 font-medium"><Clock className="h-4 w-4 text-slate-400" /> Joined {formatDate(user?.createdAt)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Right panel */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="bg-slate-100/50 p-1 rounded-xl">
            <TabsTrigger value="info" className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">Personal info</TabsTrigger>
            <TabsTrigger value="availability" className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6">
            <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4"><CardTitle className="text-lg font-bold text-slate-900">Personal information</CardTitle></CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2 p-6">
                <div className="space-y-2"><Label className="font-semibold text-slate-700">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl h-11 border-slate-200 bg-slate-50" /></div>
                <div className="space-y-2"><Label className="font-semibold text-slate-700">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl h-11 border-slate-200 bg-slate-50" /></div>
                <div className="space-y-2"><Label className="font-semibold text-slate-700 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="017 000 0000" className="rounded-xl h-11 border-slate-200 bg-slate-50" /></div>
                <div className="space-y-2"><Label className="font-semibold text-slate-700 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City" className="rounded-xl h-11 border-slate-200 bg-slate-50" /></div>
                <div className="md:col-span-2 flex justify-end">
                  <Button onClick={() => toast.success("Profile updated (logged)")} className="rounded-xl font-semibold shadow-md shadow-primary/20">Save changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="mt-6">
            <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4"><CardTitle className="text-lg font-bold text-slate-900">Weekly availability</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-3">
                {isLoading && Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                {!isLoading && !availability && <p className="text-slate-500 font-medium text-center py-8">No availability set yet.</p>}
                {!isLoading && availability?.slots.map((slot) => (
                  <div key={slot.day} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-white">
                    <span className="font-bold text-slate-900 w-28">{slot.day}</span>
                    {slot.available ? (
                      <span className="text-sm font-medium text-slate-600 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100">
                        {slot.timeRange.start} – {slot.timeRange.end}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">Unavailable</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
