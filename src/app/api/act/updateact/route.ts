import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);

        // Paginación
        const id = Number(searchParams.get("id"));
        const {
            lot_id,
            file_number,
            file_date,
            file_time,
            meterrenovation_id,
            reading,
            observations,
            rotating_pointer,
            meter_security_seal,
            reading_impossibility_viewer,
            customer_id,
            technician_id,
            updated_by
        } = body;

        // ✅ Verifica si el registro con ese ID existe
        const fichaExistente = await prisma.act.findUnique({
            where: { id },
        });

        if (!fichaExistente) {
            return NextResponse.json(
                { error: "No se encontró el registro para actualizar." },
                { status: 400 }
            );
        }

        // ✅ Verifica si ya existe un registro con este número de ficha, excluyendo el registro actual
        const fichaDuplicada = await prisma.act.findFirst({
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
        const inscripcionExistente = await prisma.act.findFirst({
            where: {
                customer_id,
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
        const actualizadoAct = await prisma.act.update({
            where: { id },
            data: {
                file_number,
                file_date: new Date(file_date), // Convertir a fecha
                file_time: file_time ? new Date(`1970-01-01T${file_time.padEnd(8, ':00').slice(0, 8)}Z`) : null,
                reading,
                observations,
                rotating_pointer,
                meter_security_seal,
                reading_impossibility_viewer,
                lot: { connect: { id: Number(lot_id) } },
                customer: { connect: { id: customer_id } },  // Conexión con cliente
                technician: { connect: { id: technician_id } }, // Conexión con técnico
                meter: { connect: { id: meterrenovation_id } }, // Conexión con medidor
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

        return NextResponse.json(actualizadoAct, { status: 200 });
    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
