import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try{

        //get data
        const body = await req.json();
        const {id,name,course} = body;

        //validation
        if(!id || !name) {
            return NextResponse.json(
                {error: "Missing required fields: 'name or id"},
                {status: 400}
            );
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
        } else {
            //TimeOut
            const timedOut = await prisma.attendanceLog.update({
                where: {id: activeLog.id},
                data: {
                    timeOut: new Date(),
                },
            })
            return NextResponse.json({
                status: "OUT",
                meesage: "Logged Out",
                data: timedOut
            })
        }

    } catch(error){
        console.error(error);

        return NextResponse.json(
        {error: "Database Error"},
        {status: 500}
    )
        
    }
    
}