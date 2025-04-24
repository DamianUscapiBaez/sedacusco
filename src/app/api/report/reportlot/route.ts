import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/libs/db";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const lot = Number(searchParams.get("lot"));

        const whereConditions: Prisma.ActWhereInput = {
            lotId: lot,
            observations: "SIN_OBSERVACIONES",
            histories: {
                some: {
                    action: "CREATE"
                },
            },
        };

        const totalCount = await prisma.act.count({ where: whereConditions });

        if (totalCount === 0) {
            return NextResponse.json(
                { error: "No se encontraron registros en el lote especificado" },
                { status: 404 }
            );
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("IMPRIMIR");

        worksheet.columns = [
            { header: "N°", key: "index", width: 5 },
            { header: "N° FICHA", key: "file_number", width: 10 },
            { header: "FECHA", key: "file_date", width: 12 },
            { header: "N° INSCRIPCION", key: "inscription", width: 20 },
            { header: "DIRECCION", key: "address", width: 40 },
            { header: "MEDIDOR NUEVO", key: "meter_number", width: 20 },
            { header: "MED. ANT.", key: "verification_code", width: 20 },
        ];

        // Formato de cabecera
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, size: 11 };
        headerRow.alignment = { horizontal: "center", vertical: "middle" };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFFF" }, // fondo blanco
            };
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });

        const PAGE_SIZE = 1000;
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);
        let contador = 0;

        for (let page = 0; page < totalPages; page++) {
            const batch = await prisma.act.findMany({
                where: whereConditions,
                include: {
                    customer: { select: { customer_name: true, inscription: true, address: true } },
                    meter: { select: { meter_number: true, verification_code: true } },
                    histories: {
                        where: {
                            action: "CREATE",
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
                contador++;
                worksheet.addRow({
                    index: contador,
                    file_number: record.file_number || "N/A",
                    file_date: record.file_date ? formatDateDisplay(record.file_date) : "N/A",
                    inscription: record.customer?.inscription || "N/A",
                    address: record.customer?.address || "N/A",
                    meter_number: record.meter?.meter_number || "N/A",
                    verification_code: record.meter?.verification_code || "N/A",
                });
            }

            await new Promise((resolve) => setImmediate(resolve));
        }

        // Formato de filas con datos
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return; // skip header

            row.eachCell((cell) => {
                cell.font = { size: 11 };
                cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: new Headers({
                "Content-Disposition": `attachment; filename=reporte_${lot}.xlsx`,
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "X-Total-Records": totalCount.toString(),
            }),
        });
    } catch (error) {
        console.error("Error en generación de reporte:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}


function formatDateDisplay(date: Date): string {
    return date.toLocaleDateString("es-PE"); // o "es-ES"
}
