import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            file_number,
            property,
            located_box,
            buried_connection,
            has_meter,
            reading,
            has_cover,
            cover_state,
            has_box,
            box_state,
            keys,
            cover_material,
            observations,
            customerId,
            technicianId,
            is_located,
            lotId,
            created_by
        } = body;

        // ✅ Verifica si ya existe ese número de ficha
        const fichaExistente = await prisma.preCatastral.findFirst({
            where: { file_number },
        });

        if (fichaExistente) {
            return NextResponse.json(
                { error: "Ya existe un registro con ese número de ficha." },
                { status: 400 }
            );
        }

        // ✅ Verifica si ya existe un registro con este cliente
        const inscripcionExistente = await prisma.preCatastral.findFirst({
            where: { customerId }
        });

        if (inscripcionExistente) {
            return NextResponse.json(
                { error: `Ya existe la ficha ${inscripcionExistente?.file_number} con este cliente.` },
                { status: 400 }
            );
        }

        // ✅ Si todo está bien, creamos el nuevo registro PreCatastral
        const nuevoPreCatastral = await prisma.preCatastral.create({
            data: {
                file_number,
                property,
                located_box,
                buried_connection,
                has_meter,
                reading,
                has_cover,
                cover_state,
                has_box,
                box_state,
                keys,
                cover_material,
                observations,
                is_located,
                customer: { connect: { id: customerId } },  // Conexión con cliente
                technician: { connect: { id: technicianId } }, // Conexión con técnico
                lot: { connect: { id: Number(lotId) } }, // Conexion con lot
                // ✅ Historial de la creación
                histories: {
                    create: [
                        {
                            action: "CREATE",  // Acción de creación
                            updated_by: created_by,  // Técnico que crea el registro
                            details: `Creación inicial del registro con número de ficha: ${file_number}`, // Detalles del historial
                        }
                    ]
                }
            },
        });

        return NextResponse.json(nuevoPreCatastral, { status: 201 });
    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
