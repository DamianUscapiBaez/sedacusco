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

        const technicianId = Number(id);
        if (isNaN(technicianId)) {
            return NextResponse.json(
                { message: "ID must be a number" },
                { status: 400 }
            );
        }

        // Consulta corregida según tu modelo de datos
        const technicianData = await prisma.technician.findUnique({
            where: { id: technicianId },
        });

        if (!technicianData) {
            return NextResponse.json(
                { message: "Technician not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: technicianData }, { status: 200 });

    } catch (error) {
        console.error("Error in API:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}