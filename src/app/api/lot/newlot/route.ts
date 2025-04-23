import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            start_date,
            end_date,
            status
        } = body;

        // Verificar si el nombre del lote ya existe
        const existingName = await prisma.lot.findFirst({
            where: { name: name.trim() },
        });

        if (existingName) {
            return NextResponse.json(
                { message: "El nombre del lote ya existe" },
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

        // Crear el nuevo lote
        const newLot = await prisma.lot.create({
            data: {
                name,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                status
            },
        });

        return NextResponse.json(newLot, { status: 201 });

    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
