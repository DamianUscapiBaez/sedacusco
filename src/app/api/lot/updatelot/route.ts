import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));
        const body = await request.json();

        const { name, start_date, end_date, status } = body;

        // Verificar si el nuevo nombre ya existe (excluyendo el actual)
        const existingLot = await prisma.lot.findFirst({
            where: {
                name,
                NOT: { name }
            }
        });

        if (existingLot) {
            return NextResponse.json(
                { message: "El nombre del lote ya esta uso" },
                { status: 400 }
            );
        }


        // Si se crea un nuevo lote como ACTIVO, desactivar el anterior
        if (status === "ACTIVE") {
            await prisma.lot.updateMany({
                where: { status: "ACTIVE" },
                data: { status: "INACTIVE" },
            });
        }
        // 1. Actualizar datos básicos del tecnico
        const updatedLot = await prisma.lot.update({
            where: { id },
            data: {
                name,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                status
            },
        });
        return NextResponse.json(updatedLot, { status: 200 });
    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}