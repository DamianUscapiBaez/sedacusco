import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            lotId,
            file_number,
            file_date,
            file_time,
            meterrenovationId,
            reading,
            observations,
            rotating_pointer,
            meter_security_seal,
            reading_impossibility_viewer,
            customerId,
            technicianId,
            created_by
        } = body;

        // ✅ Verifica si ya existe ese número de ficha
        const fichaExistente = await prisma.act.findFirst({
            where: { file_number },
        });

        if (fichaExistente) {
            return NextResponse.json(
                { error: "Ya existe un registro con ese número de ficha." },
                { status: 400 }
            );
        }

        // ✅ Verifica si ya existe un registro con este cliente
        const inscripcionExistente = await prisma.act.findFirst({
            where: { customerId }
        });

        if (inscripcionExistente) {
            return NextResponse.json(
                { error: `Ya existe la ficha ${inscripcionExistente?.file_number} con este cliente.` },
                { status: 400 }
            );
        }


        // ✅ Verifica si ya existe un registro con este medidor
        const meterRenovation = await prisma.act.findFirst({
            where: { meterrenovationId }
        });

        if (meterRenovation) {
            return NextResponse.json(
                { error: `Ya existe la ficha ${meterRenovation?.file_number} con este medidor.` },
                { status: 400 }
            );
        }

        // ✅ Si todo está bien, creamos el nuevo registro PreCatastral
        const newAct = await prisma.act.create({
            data: {
                file_number,
                file_date: new Date(file_date), // Convertir a fecha
                file_time: file_time ? new Date(`1970-01-01T${file_time.padEnd(8, ':00').slice(0, 8)}Z`) : null,
                reading,
                observations,
                rotating_pointer,
                meter_security_seal,
                reading_impossibility_viewer,
                customer: { connect: { id: customerId } }, // Connect customer relation
                technician: { connect: { id: technicianId } }, // Connect technician relation
                meter: { connect: { id: meterrenovationId } }, // Connect meter relation
                // ✅ Historial de la creación
                lot: { connect: { id: Number(lotId) } },
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
