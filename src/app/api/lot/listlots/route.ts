import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
    try {
        // Consulta sin transacción
        const data = await prisma.lot.findMany({
            where: { deleted_at: null }, // Asegúrate de que este campo exista en tu modelo
            orderBy: {
                id: 'asc',  // Asegúrate de que 'id' es el campo correcto por el cual deseas ordenar
            },
        });
        return NextResponse.json({ data });
    } catch (error) {
        console.error("Error in API:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
