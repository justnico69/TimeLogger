import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const {id,name,course} = await req.json();

        if (!id || !name) {
            return NextResponse.json({error: "Missing Id or Name"}, {status: 400});
        }

        const student = await prisma.student.upsert({
            where: {id},
            update: {name,course},
            create: {id,name,course},
        });

        return NextResponse.json(student)
    } catch(error) {
        return NextResponse.json({error: "Internal Server Error"}, {status: 500})
    }
}