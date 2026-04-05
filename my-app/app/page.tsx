"use client"

import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useEffect, useState } from "react";

// --- SHADCN IMPORTS ---
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, Loader2, XCircle } from "lucide-react"; // Nice icons

// --- TYPES ---
type StudentData = { name: string; id: string; course: string; };
type AttendanceRecord = { 
  id: number; 
  studentId: string; 
  timeIn: string; 
  timeOut: string | null; 
  student: StudentData; 
};
type ScannedResult = StudentData & { status: "IN" | "OUT"; time: string; };

export default function App() {
  const [pendingUser, setPendingUser] = useState<StudentData | null>(null);
  const [result, setResult] = useState<ScannedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/attendance");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    if (!detectedCodes.length || loading || cooldown) return;
    try {
      setLoading(true);
      setCooldown(true);
      const raw = detectedCodes[0].rawValue;
      let payload;
      try { payload = JSON.parse(raw); } 
      catch {
        const parts = raw.split(/\s+/);
        payload = { fullName: parts.slice(0, 4).join(" "), studentId: parts[4], schoolCourse: parts[5] };
      }
      const requestBody = {
        name: payload.fullName ?? payload.name ?? "",
        id: payload.studentId ?? payload.id ?? "",
        course: payload.schoolCourse ?? payload.course ?? "",
      };

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...requestBody, confirmed: false }),
      });
      const dataRes = await res.json();

      if (dataRes.isNewUser) {
        setPendingUser(requestBody);
        return;
      }
      if (!res.ok) throw new Error(dataRes.error || "Failed to Log");

      setResult({ ...requestBody, status: dataRes.status, time: new Date().toLocaleTimeString() });
      setTimeout(() => setResult(null), 3000);
      await fetchRecords();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setTimeout(() => setCooldown(false), 1500);
    }
  };

  const confirmAndRegister = async () => {
    if (!pendingUser) return;
    try {
      setLoading(true);
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingUser, confirmed: true })
      });
      const dataRes = await res.json();
      if (!res.ok) throw new Error(dataRes.error || "Failed to Confirm");

      setResult({ ...pendingUser, status: dataRes.status, time: new Date().toLocaleTimeString() });
      setPendingUser(null);
      setTimeout(() => setResult(null), 3000);
      await fetchRecords();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">QR Attendance Station</h1>
            <p className="text-slate-500">Internship Logging System</p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal bg-white">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* LEFT: SCANNER BOX */}
          <section className="lg:col-span-5">
            <Card className="shadow-lg border-none bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Scanner</CardTitle>
                <CardDescription>Place intern QR code within the frame</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative overflow-hidden rounded-xl bg-slate-900 aspect-square shadow-inner">
                  <Scanner onScan={handleScan} />
                </div>

                <div className="min-h-[80px] flex items-center justify-center">
                  {!result && !loading && (
                    <div className="text-center text-slate-400 text-sm animate-pulse">Waiting for scan...</div>
                  )}
                  {loading && (
                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </div>
                  )}
                  {result && (
                    <div className="w-full animate-in fade-in zoom-in duration-300">
                      <div className={`p-4 rounded-lg flex items-center justify-between border ${result.status === 'IN' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                        <div>
                          <p className="text-xs uppercase font-bold text-slate-500">Intern Logged</p>
                          <h3 className="font-bold text-slate-900">{result.name}</h3>
                        </div>
                        <Badge variant={result.status === "IN" ? "default" : "destructive"} className="px-3 py-1">
                           {result.status === "IN" ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                           {result.status === "IN" ? "IN" : "OUT"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* RIGHT: DATA TABLE */}
          <section className="lg:col-span-7">
            <Card className="shadow-lg border-none h-full bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Daily Log Sheet</CardTitle>
                <CardDescription>Real-time updates for today&apos;s activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Time In</TableHead>
                        <TableHead>Time Out</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-slate-400">No logs found for today.</TableCell>
                        </TableRow>
                      ) : (
                        records.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">{log.student.name}</TableCell>
                            <TableCell className="text-slate-500">{log.student.course}</TableCell>
                            <TableCell className="text-emerald-600 font-mono">
                              {new Date(log.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell className={log.timeOut ? "text-rose-600 font-mono" : "text-slate-300 font-mono"}>
                              {log.timeOut ? new Date(log.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      {/* NEW USER DIALOG */}
      <Dialog open={!!pendingUser} onOpenChange={() => setPendingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Register New Intern</DialogTitle>
            <DialogDescription>This QR code is not in the system yet. Please verify the information.</DialogDescription>
          </DialogHeader>
          {pendingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-slate-500">Name</Label>
                <div className="col-span-3 font-semibold">{pendingUser.name}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-slate-500">ID</Label>
                <div className="col-span-3 font-semibold">{pendingUser.id}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-slate-500">Course</Label>
                <div className="col-span-3 font-semibold">{pendingUser.course}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingUser(null)}>Cancel</Button>
            <Button onClick={confirmAndRegister} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}