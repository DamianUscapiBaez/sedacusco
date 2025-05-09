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
            observations = "", // Valor por defecto
            rotating_pointer,
            meter_security_seal,
            reading_impossibility_viewer,
            save_precatastral,
            customerId,
            technicianId,
            created_by
        } = body;

        // Verificaciones en transacción para consistencia
        const result = await prisma.$transaction(async (prisma) => {
            // Verificar ficha existente
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

            // Crear pre-catastral si es necesario
            if (save_precatastral === "SI") {
                await prisma.preCatastral.create({
                    data: {
                        file_number,
                        property: "DOMESTICO",
                        located_box: "EXTERIOR",
                        buried_connection: "NO",
                        has_meter: "SI",
                        reading,
                        has_cover: "SI",
                        cover_state: "BIEN",
                        has_box: "SI",
                        box_state: "BIEN",
                        keys: "2",
                        cover_material: "ALUMINIO",
                        observations: observations || "SIN_OBSERVACIONES",
                        is_located: "SI",
                        customer: { connect: { id: customerId } },
                        technician: { connect: { id: technicianId } },
                        lot: { connect: { id: Number(lotId) } },
                        histories: {
                            create: {
                                action: "CREATE",
                                updated_by: created_by,
                                details: `Creación inicial del registro con número de ficha: ${file_number}`,
                            }
                        }
                    }
                });
            }

            // Crear el acta principal
            const newAct = await prisma.act.create({
                data: {
                    file_number,
                    file_date: new Date(file_date),
                    file_time: file_time ? new Date(`1970-01-01T${file_time.padEnd(8, ':00')}`) : null,
                    reading,
                    observations,
                    rotating_pointer,
                    meter_security_seal,
                    reading_impossibility_viewer,
                    customer: { connect: { id: customerId } },
                    technician: { connect: { id: technicianId } },
                    ...(meterrenovationId && { meter: { connect: { id: meterrenovationId } } }),
                    lot: { connect: { id: Number(lotId) } },
                    histories: {
                        create: {
                            action: "CREATE",
                            updated_by: created_by,
                            details: `Creación inicial del registro con número de ficha: ${file_number}`,
                        }
                    }
                },
                include: {
                    customer: { select: { customer_name: true, inscription: true, old_meter: true, address: true } },
                    technician: { select: { name: true } },
                    lot: { select: { name: true } },
                    ...(meterrenovationId && { meter: { select: { meter_number: true, verification_code: true } } })
                }
            });

            return newAct;
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: "Acta creada exitosamente"
        }, { status: 201 });

    } catch (error: any) {
        console.error("Error en la API:", error);

        const status = error.message.includes("Ya existe") ? 409 : 500;
        const errorMessage = status === 409 ? error.message : "Error interno del servidor";

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                ...(process.env.NODE_ENV === "development" && { stack: error.stack })
            },
            { status }
        );
    }
}