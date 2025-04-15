import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));
        const body = await request.json();

        const { dni, name } = body;

        // Verificar si el nuevo nombre ya existe (excluyendo el actual)
        const existingTechnician = await prisma.technician.findFirst({
            where: {
                name,
                NOT: { dni }
            }
        });

        if (existingTechnician) {
            return NextResponse.json(
                { message: "El dni del tecnico ya está en uso" },
                { status: 400 }
            );
        }
        // 1. Actualizar datos básicos del tecnico
        const updatedTechnician = await prisma.technician.update({
            where: { id },
            data: {
                dni,
                name
            },
        });
        return NextResponse.json(updatedTechnician, { status: 200 });
    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}