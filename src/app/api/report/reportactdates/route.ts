import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/libs/db";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const date_start = validateDate(searchParams.get("startDate"));
        const date_end = validateDate(searchParams.get("endDate"));

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

        const whereConditions: Prisma.ActWhereInput = {
            observations: "SIN_OBSERVACIONES",
            histories: {
                some: {
                    action: "CREATE",
                    updated_at: {
                        gte: date_start,
                        lte: date_end,
                    },
                },
            },
        };

        const totalCount = await prisma.act.count({ where: whereConditions });

        if (totalCount === 0) {
            return NextResponse.json(
                { error: "No se encontraron registros para el rango de fechas especificado" },
                { status: 404 }
            );
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Reporte");

        worksheet.columns = [
            { header: "#", key: "index", width: 6 },
            { header: "# Ficha", key: "file_number", width: 15 },
            { header: "Fecha", key: "file_date", width: 15 },
            { header: "Inscripción", key: "inscription", width: 20 },
            { header: "Dirección", key: "address", width: 30 },
            { header: "Cliente", key: "customer_name", width: 25 },
            { header: "Med. Antiguo", key: "meter_number", width: 15 },
            { header: "Lectura", key: "verification_code", width: 20 },
            { header: "Med. Nuevo", key: "meter_number", width: 15 },
            { header: "Código Verificación", key: "verification_code", width: 20 },
            { header: "DNI Técnico", key: "dni", width: 15 },
            { header: "Técnico", key: "technician_name", width: 20 },
            { header: "Digitador", key: "digitador", width: 20 }
        ];

        worksheet.getRow(1).font = { bold: true, size: 12 };

        const PAGE_SIZE = 1000;
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);
        let contador = 0;

        for (let page = 0; page < totalPages; page++) {
            const batch = await prisma.act.findMany({
                where: whereConditions,
                include: {
                    customer: { select: { customer_name: true, inscription: true, address: true, old_meter: true } },
                    meter: { select: { meter_number: true, verification_code: true } },
                    technician: { select: { name: true, dni: true } },
                    histories: {
                        where: {
                            action: "CREATE",
                            updated_at: { gte: date_start, lte: date_end },
                        },
                        select: {
                            updated_at: true,
                            user: { select: { names: true } },
                        },
                        orderBy: { updated_at: "desc" },
                        take: 1,
                    },
                },
                skip: page * PAGE_SIZE,
                take: PAGE_SIZE,
                orderBy: { file_date: "asc" },
            });

            for (const record of batch) {
                const lastHistory = record.histories[0];
                contador++;
                worksheet.addRow({
                    index: contador,
                    file_number: Number(record.file_number) || "N/A",
                    file_date: record.file_date || "N/A",
                    inscription: record.customer?.inscription || "N/A",
                    address: record.customer?.address || "N/A",
                    customer_name: record.customer?.customer_name || "N/A",
                    old_meter: record.customer.old_meter || "N/A",
                    reading: record.reading || "N/A",
                    meter_number: record.meter?.meter_number || "N/A",
                    verification_code: record.meter?.verification_code || "N/A",
                    dni: record.technician?.dni || "N/A",
                    technician_name: record.technician?.name || "N/A",
                    digitador: lastHistory?.user?.names || "N/A",
                });
            }

            await new Promise((resolve) => setImmediate(resolve));
        }

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: new Headers({
                "Content-Disposition": `attachment; filename=reporte_${formatDateForFilename(date_start)}_a_${formatDateForFilename(date_end)}.xlsx`,
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "X-Total-Records": totalCount.toString()
            })
        });
    } catch (error) {
        console.error("Error en generación de reporte:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
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
    return date.toISOString().split("T")[0];
}
