import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const {id} = await req.json();

        const activeLog = await prisma.attendanceLog.findFirst({
            where:{studentId: id, timeOut: null},
            orderBy: {timeIn: "desc"},
        });

        if(!activeLog){
            return NextResponse.json({error: "No active session found"}, {status:400});
        }
        const updatedLog = await prisma.attendanceLog.update({
            where: {id: activeLog.id},
            data: {timeOut: new Date()},
        });

        return NextResponse.json({status: "OUT", data: updatedLog})

    }catch(error){
        return NextResponse.json({error: "Internal Server Error"},{status: 500});
    }
}