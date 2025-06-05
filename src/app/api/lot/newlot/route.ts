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

        // Validación básica
        if (!name || !start_date || !end_date || !status) {
            return NextResponse.json(
                { message: "Todos los campos son obligatorios." },
                { status: 400 }
            );
        }

        // Validar fechas
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return NextResponse.json(
                { message: "Las fechas no son válidas." },
                { status: 400 }
            );
        }

        // Verificar si el nombre del lote ya existe (ignora espacios)
        const existingName = await prisma.lot.findFirst({
            where: { name: name.trim() },
        });

        if (existingName) {
            return NextResponse.json(
                { message: "El nombre del lote ya existe." },
                { status: 400 }
            );
        }

        // Si se va a crear un nuevo lote como ACTIVO, desactivar los demás
        if (status === "ACTIVE") {
            await prisma.lot.updateMany({
                where: { status: "ACTIVE" },
                data: { status: "INACTIVE" },
            });
        }

        // Crear el nuevo lote
        const newLot = await prisma.lot.create({
            data: {
                name: name.trim(),
                start_date: startDate,
                end_date: endDate,
                status
            },
        });

        return NextResponse.json(newLot, { status: 201 });

    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { message: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
