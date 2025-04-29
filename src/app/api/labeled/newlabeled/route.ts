import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";
import { Prisma } from "@prisma/client";

interface MeterType {
    old_meter: string;
    reading: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, lotId, meters } = body;

        // Validación mejorada
        if (!body.name?.trim()) {
            return NextResponse.json(
                { error: "El nombre de la caja es requerido" },
                { status: 400 }
            );
        }

        if (!meters || !Array.isArray(meters) || meters.length === 0) {
            return NextResponse.json(
                { error: "Debe incluir al menos un medidor" },
                { status: 400 }
            );
        }


        // Verificar si la caja ya existe (usando el nombre único)
        const existingBox = await prisma.labeled.findUnique({
            where: { name: name },
        });

        if (existingBox) {
            return NextResponse.json(
                { error: "El nombre de la caja ya existe" },
                { status: 409 } // 409 Conflict es más apropiado para recursos duplicados
            );
        }

        // Validar los medidores
        const invalidMeters = meters.filter((m: any) =>
            !m.old_meter?.trim() || !m.reading?.trim()
        );

        if (invalidMeters.length > 0) {
            return NextResponse.json(
                { error: "Todos los medidores deben tener old_meter y reading válidos" },
                { status: 400 }
            );
        }

        // Crear la caja con sus medidores
        const newLabeled = await prisma.labeled.create({
            data: {
                name: name.trim(),
                meters: {
                    create: meters.map((meter: MeterType) => ({
                        old_meter: meter.old_meter.trim(),
                        reading: meter.reading.trim()
                    }))
                },
                lot: { connect: { id: Number(lotId) } }
            },
            include: {
                meters: true
            }
        });

        return NextResponse.json({ data: newLabeled }, { status: 201 });

    } catch (error) {
        console.error("Error en la API:", error);

        // Manejo específico de errores de Prisma
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return NextResponse.json(
                { error: "Error en la base de datos", code: error.code },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}