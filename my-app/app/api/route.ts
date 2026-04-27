// app/api/attendance/route.ts
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Get the start of the current day (00:00:00)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 2. Fetch logs from today
    const logs = await prisma.attendanceLog.findMany({
      where: {
        timeIn: {
          gte: startOfDay, // "Greater than or equal to" start of today
        },
      },
      include: {
        student: true, // This "joins" the Student table so you get name/course
      },
      orderBy: {
        timeIn: "desc", // Newest scans at the top
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET_LOGS_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}