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

        // Consulta corregida según tu modelo de datos
        const lot = await prisma.lot.findUnique({ where: { id: Number(id) } });

        if (!lot) {
            return NextResponse.json(
                { message: "Role not found" },
                { status: 404 }
            );
        }

        const formattedRecord = {
            ...lot,
            start_date: new Date(lot.start_date).toISOString().split('T')[0],
            end_date: new Date(lot.end_date).toISOString().split('T')[0]
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