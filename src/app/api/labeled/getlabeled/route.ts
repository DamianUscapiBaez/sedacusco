import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        // Validación más robusta del ID
        if (!id || isNaN(Number(id))) {
            return NextResponse.json(
                {
                    error: "Se requiere un ID válido",
                    details: "El parámetro ID debe ser un número"
                },
                { status: 400 }
            );
        }

        const numericId = Number(id);

        // Consulta optimizada con select específico
        const labeled = await prisma.labeled.findUnique({
            where: { id: numericId },
            include: {
                lot: true,
                meters: {
                    select: {
                        id: true,
                        old_meter: true,
                        reading: true,
                    }
                }
            }
        });

        if (!labeled) {
            return NextResponse.json(
                {
                    error: "Caja no encontrada",
                    details: `No existe una caja con el ID ${numericId}`
                },
                { status: 404 }
            );
        }

        // Estructura de respuesta consistente
        return NextResponse.json({ data: labeled }, { status: 200 });

    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            {
                error: "Error interno del servidor",
            },
            { status: 500 }
        );
    }
}