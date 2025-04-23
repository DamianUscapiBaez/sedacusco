import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/libs/db";
import { Workbook } from 'exceljs';
import { Writable } from 'stream';

class BufferWritable extends Writable {
    chunks: Buffer[] = [];

    _write(chunk: Buffer, encoding: string, callback: () => void) {
        this.chunks.push(chunk);
        callback();
    }

    getBuffer() {
        return Buffer.concat(this.chunks);
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Validación de fechas
        const date_start = validateDate(searchParams.get('startDate'));
        const date_end = validateDate(searchParams.get('endDate'));

        if (!date_start || !date_end) {
            return NextResponse.json(
                { error: "Se requieren ambas fechas válidas (formato YYYY-MM-DD)" },
                { status: 400 }
            );
        }

        if (date_start > date_end) {
            return NextResponse.json(
                { error: "La fecha de inicio no puede ser mayor a la fecha final" },
                { status: 400 }
            );
        }

        // Configuración de la consulta
        const whereConditions: Prisma.ActWhereInput = {
            histories: {
                some: {
                    action: "CREATE",
                    updated_at: {
                        gte: date_start,
                        lte: date_end
                    }
                }
            },
            observations: "SIN_OBSERVACIONES"
        };

        // Contar total de registros para paginación
        const totalCount = await prisma.act.count({ where: whereConditions });

        // Configuración de paginación
        const PAGE_SIZE = 1000;
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);

        // Crear libro de Excel
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Reporte');

        // Definir columnas del reporte
        worksheet.columns = [
            { header: 'ID Acta', key: 'id', width: 10 },
            { header: 'Cliente', key: 'customer', width: 25 },
            { header: 'Inscripción', key: 'inscription', width: 15 },
            { header: 'Dirección', key: 'address', width: 30 },
            { header: 'N° Medidor', key: 'meter', width: 15 },
            { header: 'Marca Medidor', key: 'brand', width: 15 },
            { header: 'Técnico', key: 'technician', width: 20 },
            { header: 'DNI Técnico', key: 'dni', width: 15 },
            { header: 'Última Acción', key: 'action', width: 20 },
            { header: 'Fecha Acción', key: 'actionDate', width: 20 },
            { header: 'Usuario', key: 'user', width: 20 }
        ];

        // Estilo para encabezados
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Procesamiento por lotes
        for (let page = 0; page < totalPages; page++) {
            const batch = await prisma.act.findMany({
                where: whereConditions,
                include: {
                    customer: {
                        select: {
                            customer_name: true,
                            inscription: true,
                            address: true
                        }
                    },
                    meter: {
                        select: {
                            meter_number: true,
                            verification_code: true
                        }
                    },
                    technician: {
                        select: {
                            name: true,
                            dni: true
                        }
                    },
                    histories: {
                        where: {
                            updated_at: {
                                gte: date_start,
                                lte: date_end
                            }
                        },
                        select: {
                            action: true,
                            updated_at: true,
                            user: {
                                select: {
                                    names: true
                                }
                            }
                        },
                        orderBy: {
                            updated_at: 'desc'
                        },
                        take: 1 // Solo el historial más reciente
                    }
                },
                skip: page * PAGE_SIZE,
                take: PAGE_SIZE,
                orderBy: { id: 'asc' }
            });

            // Agregar datos al Excel
            batch.forEach(record => {
                const lastHistory = record.histories[0];
                worksheet.addRow({
                    id: record.id,
                    customer: record.customer?.customer_name || 'N/A',
                    inscription: record.customer?.inscription || 'N/A',
                    address: record.customer?.address || 'N/A',
                    meter: record.meter?.meter_number || 'N/A',
                    brand: record.meter?.verification_code || 'N/A',
                    technician: record.technician?.name || 'N/A',
                    dni: record.technician?.dni || 'N/A',
                    action: lastHistory?.action || 'N/A',
                    actionDate: lastHistory?.updated_at.toISOString() || 'N/A',
                    user: lastHistory?.user.names || 'N/A'
                });
            });

            // Liberar memoria entre lotes
            await new Promise(resolve => setImmediate(resolve));
        }

        // Generar Excel como stream
        const bufferStream = new BufferWritable();
        await workbook.xlsx.write(bufferStream);

        // Configurar respuesta
        const response = new NextResponse(bufferStream.getBuffer(), {
            status: 200,
            headers: new Headers({
                'Content-Disposition': `attachment; filename=reporte_${formatDateForFilename(date_start)}_a_${formatDateForFilename(date_end)}.xlsx`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'X-Total-Records': totalCount.toString()
            })
        });

        return response;

    } catch (error) {
        console.error("Error en generación de reporte:", error);
        return NextResponse.json(
            {
                error: "Error al generar el reporte",
                details: error instanceof Error ? error.message : null
            },
            { status: 500 }
        );
    }
}

function validateDate(dateString: string | null): Date | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
}

function formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0];
}