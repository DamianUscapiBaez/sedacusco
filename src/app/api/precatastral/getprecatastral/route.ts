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
        const record = await prisma.preCatastral.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                customer: true,
                technician: true,
                lot: true
            },
        });
        if (!record) {
            return NextResponse.json(
                { message: "Record not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ data: record });
    } catch (error) {
        console.error("Error in API:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
