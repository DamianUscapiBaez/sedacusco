import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);

        const id = Number(searchParams.get("id"));
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
            updated_by,
            save_precatastral,
            created_by // Añadido ya que se usa en el precatastral
        } = body;

        // 1. Verificación de existencia del acta
        const fichaExistente = await prisma.act.findUnique({
            where: { id }
        });

        if (!fichaExistente) {
            return NextResponse.json(
                { message: "No se encontró el registro para actualizar." },
                { status: 404 } // Cambiado a 404 (Not Found)
            );
        }

        // 2. Verificaciones de duplicados
        const [fichaDuplicada, inscripcionExistente] = await Promise.all([
            prisma.act.findFirst({
                where: {
                    file_number,
                    NOT: { id }
                },
            }),
            prisma.act.findFirst({
                where: {
                    customerId,
                    NOT: { id }
                },
            })
        ]);

        if (fichaDuplicada) {
            return NextResponse.json(
                { message: "Ya existe un registro con ese número de ficha." },
                { status: 409 } // Conflict
            );
        }

        if (inscripcionExistente) {
            return NextResponse.json(
                { message: "Ya existe un registro con este cliente." },
                { status: 409 } // Conflict
            );
        }

        // 3. Transacción para actualizar
        const result = await prisma.$transaction(async (prisma) => {
            // Actualizar el acta principal
            const actualizadoAct = await prisma.act.update({
                where: { id },
                data: {
                    file_number,
                    file_date: new Date(file_date),
                    file_time: file_time ? new Date(`1970-01-01T${file_time.padEnd(8, ':00').slice(0, 8)}Z`) : null,
                    reading,
                    observations: observations || null,
                    rotating_pointer,
                    meter_security_seal,
                    reading_impossibility_viewer,
                    lot: { connect: { id: Number(lotId) } },
                    customer: { connect: { id: customerId } },
                    technician: { connect: { id: technicianId } },
                    meter: { connect: { id: meterrenovationId } },
                    histories: {
                        create: {
                            action: "UPDATE",
                            updated_by,
                            details: `Actualización del registro con número de ficha: ${file_number}`,
                        }
                    }
                },
                include: {
                    customer: true,
                    meter: true,
                    technician: true,
                    lot: true
                }
            });

            // 4. Actualizar PreCatastral si es necesario
            if (save_precatastral === "SI") {
                // Primero verificar si ya existe un PreCatastral para este acta
                const precatastralExistente = await prisma.preCatastral.findFirst({
                    where: { file_number }
                });

                if (precatastralExistente) {
                    await prisma.preCatastral.update({
                        where: { id: precatastralExistente.id },
                        data: {
                            file_number,
                            reading,
                            observations: observations || "SIN_OBSERVACIONES",
                            customer: { connect: { id: customerId } },
                            technician: { connect: { id: technicianId } },
                            lot: { connect: { id: Number(lotId) } },
                            histories: {
                                create: {
                                    action: "UPDATE",
                                    updated_by,
                                    details: `Actualización del PreCatastral para ficha: ${file_number}`,
                                }
                            }
                        }
                    });
                } else {
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
            }

            return actualizadoAct;
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { message: "Error interno del servidor." },
            { status: 500 }
        );
    }
}