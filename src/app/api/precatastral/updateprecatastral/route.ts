import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);

        // Paginación
        const id = Number(searchParams.get("id"));
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
            updated_by  // Técnico que realiza la actualización
        } = body;

        // ✅ Verifica si el registro con ese ID existe
        const fichaExistente = await prisma.preCatastral.findUnique({
            where: { id },
        });

        if (!fichaExistente) {
            return NextResponse.json(
                { error: "No se encontró el registro para actualizar." },
                { status: 400 }
            );
        }

        // ✅ Verifica si ya existe un registro con este número de ficha, excluyendo el registro actual
        const fichaDuplicada = await prisma.preCatastral.findFirst({
            where: {
                file_number,
                NOT: { id },  // Excluye el registro actual
            },
        });

        if (fichaDuplicada) {
            return NextResponse.json(
                { error: "Ya existe un registro con ese número de ficha." },
                { status: 400 }
            );
        }

        // ✅ Verifica si ya existe un registro con este cliente, excluyendo el registro actual
        const inscripcionExistente = await prisma.preCatastral.findFirst({
            where: {
                customerId,
                NOT: { id },  // Excluye el registro actual
            },
        });

        if (inscripcionExistente) {
            return NextResponse.json(
                { error: "Ya existe un registro con este cliente." },
                { status: 400 }
            );
        }

        // ✅ Si todo está bien, actualizamos el registro PreCatastral
        const actualizadoPreCatastral = await prisma.preCatastral.update({
            where: { id },
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
                histories: {
                    create: [
                        {
                            action: "UPDATE",  // Acción de actualización
                            updated_by,  // Técnico que actualiza el registro
                            details: `Actualización del registro con número de ficha: ${file_number}`, // Detalles del historial
                        }
                    ]
                }
            },
        });

        return NextResponse.json(actualizadoPreCatastral, { status: 200 });
    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
