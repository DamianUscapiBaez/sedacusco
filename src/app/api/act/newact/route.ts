import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            lot,
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
            created_by
        } = body;

        // ✅ Verifica si ya existe ese número de ficha
        const fichaExistente = await prisma.act.findFirst({
            where: { file_number },
        });

        if (fichaExistente) {
            console.log(fichaExistente)
            return NextResponse.json(
                { error: "Ya existe un registro con ese número de ficha." },
                { status: 400 }
            );
        }

        // ✅ Verifica si ya existe un registro con este cliente
        const inscripcionExistente = await prisma.act.findFirst({
            where: { customer_id }
        });

        if (inscripcionExistente) {
            console.log(inscripcionExistente)
            return NextResponse.json(
                { error: "Ya existe un registro con este cliente." },
                { status: 400 }
            );
        }


        // ✅ Verifica si ya existe un registro con este medidor
        const meterRenovation = await prisma.act.findFirst({
            where: { meterrenovation_id }
        });

        if (meterRenovation) {
            console.log(meterRenovation)
            return NextResponse.json(
                { error: "Ya existe un registro con este medidor." },
                { status: 400 }
            );
        }

        // ✅ Si todo está bien, creamos el nuevo registro PreCatastral
        const newAct = await prisma.act.create({
            data: {
                lot,
                file_number,
                file_date: new Date(file_date), // Convertir a fecha
                file_time: file_time ? new Date(`1970-01-01T${file_time.padEnd(8, ':00').slice(0, 8)}Z`) : null,
                reading,
                observations,
                rotating_pointer,
                meter_security_seal,
                reading_impossibility_viewer,
                customer: { connect: { id: customer_id } },  // Conexión con cliente
                technician: { connect: { id: technician_id } }, // Conexión con técnico
                meter: { connect: { id: meterrenovation_id } }, // Conexión con medidor
                created_by, // Agregar el campo creado por
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
        return NextResponse.json(newAct, { status: 201 });
    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
