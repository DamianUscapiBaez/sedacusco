import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json(
                { message: "ID is required" },
                { status: 400 }
            );
        }
        const record = await prisma.act.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                customer: true,
                technician: true,
                meter: true,
            },
        });
        if (!record) {
            return NextResponse.json(
                { message: "Record not found" },
                { status: 404 }
            );
        }
        const formattedRecord = {
            ...record,
            file_date: new Date(record.file_date).toISOString().split('T')[0],
            file_time: record.file_time ?
                record.file_time.toISOString().slice(11, 16) :
                null,
        };
        return NextResponse.json({ data: formattedRecord }, { status: 200 });
    } catch (error) {
        console.error("Error in API:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
