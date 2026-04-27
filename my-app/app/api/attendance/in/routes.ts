import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request){
    try{
        const {id} = await req.json();
        const activeLog = await prisma.attendanceLog.findFirst({
            where: {studentId: id, timeOut: null},
        });
        if(activeLog) {
            return NextResponse.json({ error: "Already timed IN"},{
                status: 400
            });
        }
        const newLog = await prisma.attendanceLog.create({
            data: {studentId: id, timeIn: new Date()},
        });
        return NextResponse.json({status: "IN", data: newLog})
    }catch(error){
        return NextResponse.json({error: "Internal Server Error"},
            {status: 500}
        );
    }
}