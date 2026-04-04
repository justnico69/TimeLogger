import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try{

        //get data
        const body = await req.json();
        const {id,name,course,confirmed} = body;

        //validation
        if(!id || !name) {
            return NextResponse.json(
                {error: "Missing required fields: 'name or id' "},
                {status: 400}
            );
        }
        //check first if student exists
        const student = await prisma.student.findUnique({where: {id}});

        if(!student && !confirmed) {
            return NextResponse.json({
                isNewUser: true,
                message: "New user info detected. Please confirm the details."
            });
        }

        //upsert logic to check if this student exists
        await prisma.student.upsert({
            where: {id},
            update: {name, course},
            create: {id,name,course},
        })


        //check for current active session
        const activeLog = await prisma.attendanceLog.findFirst({
            where: {
                studentId: id,
                timeOut: null,
            },
            orderBy: {timeIn: "desc"},
        });

        //Logging In and Out
        if(!activeLog){
            //TimeIn
            const timedIn = await prisma.attendanceLog.create({
                data: {
                    studentId: id,
                    timeIn: new Date(),
                },
            });
            return NextResponse.json({
                status:"IN",
                message: "Logged In",
                data: timedIn,
            });
        } 
        if (activeLog) {
  // Time Out should not be blocked by duplicate "recent in/out"
  const timedOut = await prisma.attendanceLog.update({
    where: { id: activeLog.id },
    data: { timeOut: new Date() },
  });

  return NextResponse.json({
    status: "OUT",
    message: "Logged Out",
    data: timedOut,
  });
}

// 2) No active session -> apply duplicate protection before Time In
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
const recentTimeIn = await prisma.attendanceLog.findFirst({
  where: {
    studentId: id,
    timeIn: { gte: oneHourAgo },
  },
  orderBy: { timeIn: "desc" },
});

if (recentTimeIn) {
  return NextResponse.json(
    { error: "Duplicate scan detected. Please wait before scanning IN again." },
    { status: 429 }
  );
}

// 3) Create new Time In
const timedIn = await prisma.attendanceLog.create({
  data: {
    studentId: id,
    timeIn: new Date(),
  },
});

return NextResponse.json({
  status: "IN",
  message: "Logged In",
  data: timedIn,
});
        

    } catch(error){
        console.error(error);

        return NextResponse.json(
        {error: "Database Error"},
        {status: 500}
    )
        
    }
    
}