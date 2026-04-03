"use client"

import { Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";


type Log = {
  name: string;
  status: "IN" | "OUT";
  timeIn? : string;
  timeOut?: string;
};

export default function App () {

  const [log, setLog] = useState<Log | null>(null);
  const [loading,setLoading] = useState(false);

  const handleScan = async (data: any) => {
    if (!data || loading) return;

    try {
      setLoading(true);

      const raw = data[0].rawValue;
      console.log(raw)
      
      const parts = raw.split(/\s+/);
      console.log(parts)

      const fullName = parts.slice(0,4).join(" ");
      console.log(fullName)

      const studentId = parts[4];
      console.log(studentId)

      const schoolCourse = parts[5]
      console.log(schoolCourse)

      const currentTime = new Date();
     

      const res = await fetch("api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: studentId,
          name: fullName,
          course: schoolCourse,
        }),
      });

      const result = await res.json();

      setLog({
        name: fullName,
        status: result.status,
        timeIn: result.data.timeIn,
        timeOut: result.data.timeOut,
      });

     
    } catch (error) {
      console.log("Scan Error: ", error);
    } finally{
      setLoading(false);
    }
  };



  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6">

      <h1 className="text-xl font-semibold"> QR Time Tracker</h1>

      <div className="">
        <Scanner onScan={handleScan}/>
      </div>

      <div className="text-center">
      <p>
        {/* Status */}
          Status: {" "}
          {!log 
          ? "Not logged" 
          : log.status === "IN"
          ? "Currently IN"
          : "Currently OUT"}
      </p>
        
        {/* Time Info */}

        {log && (
          <div className="text-sm text-gray-300 text-center">
            {log.timeIn && (
              <p>
                Time In: {}
                {new Date(log.timeIn).toLocaleTimeString()}
                </p>
            )}
            {log.timeOut && (
              <p>
                Time Out: {}
                {new Date(log.timeOut).toLocaleTimeString()}
                </p>
            )}
          </div>
        )}

        {loading && <p className="text-blue-400 mt-2"> Processing...</p>}

      </div>

    </main>
  )
}