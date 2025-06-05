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
                { message: "No se encontraron registros en el lote especificado" },
                { status: 404 }
            );
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("IMPRIMIR");

        // Configuración para vista de diseño de página
        worksheet.views = [
            {
                state: 'normal',
                zoomScale: 100, // Zoom ligeramente reducido para ver mejor el diseño
                rightToLeft: false,
                showGridLines: false
            }
        ];

        // Configuración avanzada de página
        worksheet.pageSetup = {
            orientation: 'landscape',
            margins: {
                left: 0.7, right: 0.7,
                top: 0.75, bottom: 0.75,
                header: 0.3, footer: 0.3
            },
            paperSize: 9, // Tamaño A4
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            showGridLines: false,
            horizontalCentered: true,
            verticalCentered: false
        };

        // Configuración de columnas con ajuste de texto
        worksheet.columns = [
            { header: "N°", key: "index", width: 5, alignment: { wrapText: true } },
            { header: "N° FICHA", key: "file_number", width: 10, alignment: { wrapText: true } },
            { header: "FECHA", key: "file_date", width: 12, alignment: { wrapText: true } },
            { header: "N° INSCRIPCIÓN", key: "inscription", width: 20, alignment: { wrapText: true } },
            { header: "DIRECCIÓN", key: "address", width: 50, alignment: { wrapText: true } },
            { header: "MEDIDOR NUEVO", key: "meter_number", width: 20, alignment: { wrapText: true } },
            { header: "MED. ANT.", key: "verification_code", width: 15, alignment: { wrapText: true } },
        ];

        // Formato de cabecera mejorado
        const headerRow = worksheet.getRow(1);
        headerRow.font = {
            bold: true,
            size: 8,
            name: 'Arial'
        };
        headerRow.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true
        };
        headerRow.height = 20; // Altura fija para el encabezado
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
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
                const dataRow = worksheet.addRow({
                    index: contador,
                    file_number: Number(record.file_number) || "N/A",
                    file_date: record.file_date ? formatDateDisplay(record.file_date) : "N/A",
                    inscription: record.customer?.inscription.toString() || "N/A",
                    address: record.customer?.address || "N/A",
                    meter_number: record.meter?.meter_number || "N/A",
                    verification_code: record.meter?.verification_code || "N/A",
                });

                // Ajuste de altura de fila y formato de texto
                dataRow.height = 18;
                dataRow.eachCell((cell) => {
                    cell.font = {
                        size: 8,
                        name: 'Arial'
                    };
                    cell.alignment = {
                        vertical: "middle",
                        wrapText: true
                    };
                    cell.border = {
                        top: { style: "thin", color: { argb: "D3D3D3" } },
                        left: { style: "thin", color: { argb: "D3D3D3" } },
                        bottom: { style: "thin", color: { argb: "D3D3D3" } },
                        right: { style: "thin", color: { argb: "D3D3D3" } },
                    };
                });
            }

            await new Promise((resolve) => setImmediate(resolve));
        }

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
            { message: "Error interno del servidor." },
            { status: 500 }
        );
    }
}

function formatDateDisplay(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };
    return date.toLocaleDateString('es-PE', options);
} 