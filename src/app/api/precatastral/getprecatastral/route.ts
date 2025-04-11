import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json(
                { error: "ID is required" },
                { status: 400 }
            );
        }
        const record = await prisma.preCatastrals.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                customer: true,
                technician: true,
            },
        });
        if (!record) {
            return NextResponse.json(
                { error: "Record not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ data: record });
    } catch (error) {
        console.error("Error in API:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
