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
        const lot = Number(searchParams.get('lot'));

        if (isNaN(lot)) {
            return NextResponse.json({ error: "Parámetro 'lot' inválido" }, { status: 400 });
        }

        const whereConditions: Prisma.ActWhereInput = {
            lotId: lot,
            observations: "SIN_OBSERVACIONES"
        };

        const totalCount = await prisma.act.count({ where: whereConditions });

        const PAGE_SIZE = 1000;
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);

        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Reporte');

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
                        orderBy: { updated_at: 'desc' },
                        take: 1,
                        include: {
                            user: {
                                select: { names: true }
                            }
                        }
                    }
                },
                skip: page * PAGE_SIZE,
                take: PAGE_SIZE,
                orderBy: { id: 'asc' }
            });

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
                    actionDate: lastHistory?.updated_at?.toISOString() || 'N/A',
                    user: lastHistory?.user?.names || 'N/A'
                });
            });

            await new Promise(resolve => setImmediate(resolve));
        }

        const bufferStream = new BufferWritable();
        await workbook.xlsx.write(bufferStream);

        const response = new NextResponse(bufferStream.getBuffer(), {
            status: 200,
            headers: new Headers({
                'Content-Disposition': `attachment; filename=reporte_lote_${lot}.xlsx`,
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
