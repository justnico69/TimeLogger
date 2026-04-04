"use client"

import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";


type scannedResult = {
  name: string;
  id: string;
  course: string;
  status: "IN" | "OUT";
  time : string;
};

type newUser = {
  name: string;
  id: string;
  course: string;
}

export default function App () {

  const [pendingUser,setPendingUser] = useState<newUser | null>(null);
  const [result, setResult] = useState<scannedResult | null>(null);
  const [loading,setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    if (!detectedCodes.length || loading || cooldown) return;

    try {

      const releaseCooldown = () => {
        setTimeout(() => setCooldown(false),1500);
      };

      setLoading(true);
      setCooldown(true)

      const raw = detectedCodes[0].rawValue;
      console.log(raw)
      
      let payload;
      
      try{
        
        payload = JSON.parse(raw)
        console.log("Raw JSON parsing: ",payload)
      }
      catch {
        const parts = raw.split(/\s+/);
        console.log(parts)

        payload = {
          fullName: parts.slice(0,4).join(" "),
          studentId: parts[4],
          schoolCourse: parts[5],
        }
        
        console.log("Name, ID, Course ",payload)
      }
      
     const requestBody = {
      name: payload.fullName ?? payload.name ?? "",
      id: payload.studentId ?? payload.id ?? "",
      course: payload.schoolCourse ?? payload.course ,
     };

     if (!requestBody.id || !requestBody.name) {
  throw new Error("QR payload missing id or name");
}

      const res = await fetch("api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...requestBody,
          confirmed: false,
        }),
      });

      const dataRes = await res.json();

      if(dataRes.isNewUser){
        setPendingUser(requestBody);
        console.log("New user:", requestBody)
        releaseCooldown();
        return;
      }

      if(!res.ok) {
        releaseCooldown();
        throw new Error(dataRes.error || "Failed to Log")
      }

      setResult({
        name: requestBody.name,
        id: requestBody.id,
        course: requestBody.course,
        status: dataRes.status,
        time: new Date().toLocaleTimeString(),
      });

      setTimeout(() => setResult(null),3000);
      releaseCooldown();

     
    } catch (error) {
      console.log("Scan Error: ", error);
    } finally{
      setLoading(false);
    }
  };



  return (
  <main className="min-h-screen bg-white text-black p-4 md:p-6">
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">QR Time Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Continuous scan station with daily attendance records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="attendance-date" className="text-sm font-medium">
            Date
          </label>
          <input
            id="attendance-date"
            type="date"
            className="h-9 rounded-md border border-black/20 bg-white px-3 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT: Scanner panel */}
        <section className="lg:col-span-5">
          <div className="rounded-xl border border-black/15 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">QR Scan</h2>

            <div className="overflow-hidden rounded-lg border border-black/10 bg-black/5 p-2">
              <Scanner onScan={handleScan} />
            </div>

            <div className="mt-3 text-sm">
              {!result && !loading && (
                <p className="text-muted-foreground">Position QR code in frame...</p>
              )}
              {loading && <p className="font-medium">Processing scan...</p>}
              {result && (
                <div className="rounded-md border border-black/15 bg-white p-3">
                  <p className="font-semibold">{result.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.status === "IN" ? "Logged In" : "Logged Out"} • {result.time}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT: Daily records panel */}
        <section className="lg:col-span-7">
          <div className="rounded-xl border border-black/15 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Daily Records</h2>

            <div className="overflow-hidden rounded-lg border border-black/10">
              <table className="w-full text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Full Name</th>
                    <th className="px-4 py-2 text-left font-medium">Course</th>
                    <th className="px-4 py-2 text-left font-medium">Time In</th>
                    <th className="px-4 py-2 text-left font-medium">Time Out</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      No records yet for selected date.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
);
}