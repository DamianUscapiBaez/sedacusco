import { NextResponse } from "next/server";
import { prisma } from "@/libs/db"; // Asegúrate de tener el cliente prisma configurado correctamente

export async function GET(request: Request) {
    try {
        // Obtener parámetros de la URL
        const { searchParams } = new URL(request.url);
        const meter = searchParams.get("meter");  // Obtener el 'meter' desde los parámetros de la URL

        // Validar que 'meter' no esté vacío
        if (!meter) {
            return NextResponse.json(
                { message: "El parámetro 'meter' es requerido" },
                { status: 400 }  // Error si no se pasa el parámetro
            );
        }

        // Buscar un único técnico por 'dni'
        const meterRenovation = await prisma.meterRenovation.findFirst({
            where: {
                meter_number: meter,  // Buscar por el 'dni' exacto
            },
        });

        // Si no se encuentra el técnico, devolver un mensaje adecuado
        if (!meterRenovation) {
            return NextResponse.json(
                { message: "No se encontró el medidor con el numero proporcionado." },
                { status: 404 }  // No encontrado
            );
        }

        // Si se encuentra el medidor, devolver la información
        return NextResponse.json(meterRenovation, { status: 200 });

    } catch (error) {
        // Manejo de errores
        console.error("Error al obtener el número del medidor:", error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Error interno del servidor" },
            { status: 500 }  // Error de servidor
        );
    }
}
