import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

interface MeterType {
    old_meter: string;
    reading: string;
}

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));

        if (isNaN(id)) {
            return NextResponse.json(
                { error: "ID inválido" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, meters, lotId } = body;

        // Verificar si el nombre ya existe (excluyendo el registro actual)
        const existingBox = await prisma.labeled.findFirst({
            where: {
                name,
                NOT: { id } // Excluir el registro actual por ID
            }
        });

        if (existingBox) {
            return NextResponse.json(
                { error: "El nombre de la caja ya existe" },
                { status: 409 }
            );
        }

        // Usar transacción para asegurar consistencia
        const updatedBox = await prisma.$transaction(async (prisma) => {
            // 1. Actualizar datos básicos de la caja
            const caja = await prisma.labeled.update({
                where: { id },
                data: {
                    name,
                    lot: { connect: { id: Number(lotId) } },
                },
            });

            // 2. Eliminar y recrear los medidores asociados
            await prisma.meterLabeled.deleteMany({
                where: { labeledId: id }
            });

            await prisma.meterLabeled.createMany({
                data: meters.map((meter: MeterType) => ({
                    labeledId: caja.id,
                    old_meter: meter.old_meter,
                    reading: meter.reading
                }))
            });

            return caja;
        });

        return NextResponse.json(updatedBox, { status: 200 });
    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}