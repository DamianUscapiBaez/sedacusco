import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
    try {
        // Consulta sin transacción
        const data = await prisma.lot.findMany({
            orderBy: {
                id: 'asc',  // Asegúrate de que 'id' es el campo correcto por el cual deseas ordenar
            },
        });
        return NextResponse.json({ data });
    } catch (error) {
        console.error("Error in API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
