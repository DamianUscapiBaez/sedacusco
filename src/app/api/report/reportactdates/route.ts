import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/libs/db";
import ExcelJS from "exceljs";

interface ReportParams {
    startDate?: string | null;
    endDate?: string | null;
}

export async function GET(request: Request) {
    try {
        // 1. Validación de parámetros
        const { searchParams } = new URL(request.url);
        const params: ReportParams = {
            startDate: searchParams.get("startDate"),
            endDate: searchParams.get("endDate")
        };

        if (!params.startDate || !params.endDate) {
            return NextResponse.json(
                { message: "Se requieren ambas fechas (startDate y endDate)" },
                { status: 400 }
            );
        }

        // Asegurar formato completo con zona horaria de Perú (UTC-5)
        const date_start = new Date(`${params.startDate}T00:00:00-05:00`);
        const date_end = new Date(`${params.endDate}T23:59:59.999-05:00`);

        if (isNaN(date_start.getTime())) {
            return NextResponse.json(
                { message: "Fecha de inicio inválida. Use formato YYYY-MM-DD" },
                { status: 400 }
            );
        }

        if (isNaN(date_end.getTime())) {
            return NextResponse.json(
                { message: "Fecha final inválida. Use formato YYYY-MM-DD" },
                { status: 400 }
            );
        }

        if (date_start > date_end) {
            return NextResponse.json(
                { message: "La fecha de inicio no puede ser mayor a la fecha final" },
                { status: 400 }
            );
        }

        // 2. Primero obtener los IDs de actas desde los historiales
        const historyConditions: Prisma.ActHistoryWhereInput = {
            action: "CREATE",
            updated_at: {
                gte: date_start,
                lte: date_end
            },
            act: {
                observations: "SIN_OBSERVACIONES",
                deleted_at: null
            }
        };

        // Obtener solo los IDs de las actas que cumplen con el filtro
        const actIds = await prisma.actHistory.findMany({
            where: historyConditions,
            distinct: ['actId'],
            select: {
                actId: true
            }
        });

        if (actIds.length === 0) {
            return NextResponse.json(
                { message: "No se encontraron registros para el rango de fechas especificado" },
                { status: 404 }
            );
        }

        const actIdsList = actIds.map(item => item.actId);

        // 3. Configuración del Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Sistema de Reportes";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("Reporte de Actas", {
            pageSetup: {
                orientation: 'landscape',
                margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.4, header: 0.3, footer: 0.3 }
            }
        });

        // Definir estilos (igual que antes)
        const headerStyle: Partial<ExcelJS.Style> = {
            font: { bold: true, color: { argb: 'FFFFFF' }, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
            alignment: { vertical: 'middle', horizontal: 'center' },
            border: {
                top: { style: 'thin', color: { argb: '000000' } },
                left: { style: 'thin', color: { argb: '000000' } },
                right: { style: 'thin', color: { argb: '000000' } },
                bottom: { style: 'thin', color: { argb: '000000' } }
            }
        };

        const dataStyle: Partial<ExcelJS.Style> = {
            font: { size: 10 },
            alignment: { vertical: 'middle', wrapText: true },
            border: {
                top: { style: 'thin', color: { argb: 'D9D9D9' } },
                left: { style: 'thin', color: { argb: 'D9D9D9' } },
                right: { style: 'thin', color: { argb: 'D9D9D9' } },
                bottom: { style: 'thin', color: { argb: 'D9D9D9' } }
            }
        };

        // Configurar columnas (igual que antes)
        worksheet.columns = [
            { header: "Ficha", key: "file_number", width: 12 },
            { header: "Lote", key: "lote", width: 8 },
            { header: "Fecha", key: "file_date", width: 12 },
            { header: "Inscripción", key: "inscription", width: 18 },
            { header: "Dirección", key: "address", width: 30 },
            { header: "Cliente", key: "customer_name", width: 25 },
            { header: "Med. Antiguo", key: "old_meter", width: 14 },
            { header: "Lectura", key: "reading", width: 10 },
            { header: "Med. Nuevo", key: "new_meter", width: 14 },
            { header: "Código Verif.", key: "verification_code", width: 16 },
            { header: "DNI Técnico", key: "dni", width: 12 },
            { header: "Técnico", key: "technician_name", width: 20 },
            { header: "Digitador", key: "digitador", width: 20 }
        ];

        // Aplicar estilo al encabezado
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.style = headerStyle;
        });

        // 4. Procesamiento de datos paginado
        const PAGE_SIZE = 1000;
        const totalPages = Math.ceil(actIdsList.length / PAGE_SIZE);

        for (let page = 0; page < totalPages; page++) {
            const currentPageIds = actIdsList.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

            const batch = await prisma.act.findMany({
                where: {
                    id: { in: currentPageIds }
                },
                include: {
                    lot: { select: { name: true } },
                    customer: {
                        select: {
                            customer_name: true,
                            inscription: true,
                            address: true,
                            old_meter: true
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
                            action: "CREATE"
                        },
                        select: {
                            user: { select: { names: true } }
                        },
                        orderBy: { updated_at: "desc" },
                        take: 1
                    }
                }
            });

            // Agregar datos a la hoja
            batch.forEach((record) => {
                const row = worksheet.addRow({
                    file_number: Number(record.file_number) || "-",
                    lote: record.lot?.name || "-",
                    file_date: record.file_date?.toLocaleDateString('es-PE') || "-",
                    inscription: record.customer?.inscription || "-",
                    address: record.customer?.address || "-",
                    customer_name: record.customer?.customer_name || "-",
                    old_meter: record.customer?.old_meter || "-",
                    reading: record.reading?.toString() || "-",
                    new_meter: record.meter?.meter_number || "-",
                    verification_code: record.meter?.verification_code || "-",
                    dni: record.technician?.dni || "-",
                    technician_name: record.technician?.name || "-",
                    digitador: record.histories[0]?.user?.names || "-"
                });

                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.style = dataStyle;
                });
            });

            // Pequeña pausa para evitar bloqueo del event loop
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        // 5. Configuración final del documento
        worksheet.views = [{
            state: 'frozen',
            ySplit: 1
        }];

        // 6. Generar y devolver el archivo
        const buffer = await workbook.xlsx.writeBuffer();

        const filename = `Reporte_Actas_${date_start.toISOString().split('T')[0]}_${date_end.toISOString().split('T')[0]}.xlsx`;

        return new NextResponse(buffer, {
            status: 200,
            headers: new Headers({
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "X-Total-Records": actIdsList.length.toString()
            })
        });

    } catch (error) {
        console.error("Error en generación de reporte:", error);
        return NextResponse.json(
            { message: "Error interno del servidor al generar el reporte" },
            { status: 500 }
        );
    }
}