import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/libs/db";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lot = Number(searchParams.get("lot"));

        const whereConditions: Prisma.LabeledWhereInput = {
            lotId: lot
        };

        const totalCount = await prisma.labeled.count({ where: whereConditions });

        if (totalCount === 0) {
            return NextResponse.json(
                { error: "No se encontraron registros de cajas para este lote." },
                { status: 404 }
            );
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("CAJAS Y MEDIDORES");

        worksheet.views = [{ state: 'normal', zoomScale: 100, showGridLines: false }];

        worksheet.pageSetup = {
            orientation: 'landscape',
            paperSize: 9,
            fitToPage: true,
            fitToWidth: 1,
            margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
            horizontalCentered: true
        };

        const PAGE_SIZE = 1000;
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);

        // Variables de control
        let startRow = 1;
        const cajasPorFila = 5; // 5 cajas por fila
        const columnasPorCaja = 2; // 2 columnas por cada caja

        for (let page = 0; page < totalPages; page++) {
            const cajas = await prisma.labeled.findMany({
                where: whereConditions,
                include: { meters: true },
                skip: page * PAGE_SIZE,
                take: PAGE_SIZE,
                orderBy: { createdAt: 'asc' }
            });

            let cajaIndex = 0;

            while (cajaIndex < cajas.length) {
                // Escribir los encabezados "CAJA X"
                for (let i = 0; i < cajasPorFila && (cajaIndex + i) < cajas.length; i++) {
                    const colBase = i * (columnasPorCaja + 1) + 1;
                    const caja = cajas[cajaIndex + i];

                    worksheet.mergeCells(startRow, colBase, startRow, colBase + 1);
                    const headerCell = worksheet.getCell(startRow, colBase);
                    headerCell.value = caja.name;
                    headerCell.font = { bold: true, size: 10, name: "Arial" };
                    headerCell.alignment = { horizontal: "center", vertical: "middle" };
                    headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9D9D9" } };
                    headerCell.border = {
                        top: { style: "thin" }, left: { style: "thin" },
                        bottom: { style: "thin" }, right: { style: "thin" }
                    };
                }

                // Escribir "SERIE DE MEDIDORES Y LECTURA"
                const labelRow = startRow + 1;
                for (let i = 0; i < cajasPorFila && (cajaIndex + i) < cajas.length; i++) {
                    const colBase = i * (columnasPorCaja + 1) + 1;

                    const cellSerie = worksheet.getCell(labelRow, colBase);
                    const cellLectura = worksheet.getCell(labelRow, colBase + 1);

                    cellSerie.value = "MEDIDORES";
                    cellLectura.value = "LECTURA";

                    [cellSerie, cellLectura].forEach(cell => {
                        cell.font = { bold: true, size: 8, name: "Arial" };
                        cell.alignment = { horizontal: "center", vertical: "middle" };
                        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FCE4D6" } };
                        cell.border = {
                            top: { style: "thin" }, left: { style: "thin" },
                            bottom: { style: "thin" }, right: { style: "thin" }
                        };
                    });
                }


                // Determinar máximo de medidores para esta fila
                const maxMedidores = Math.max(
                    ...cajas.slice(cajaIndex, cajaIndex + cajasPorFila).map(c => c.meters.length)
                );

                // Escribir los medidores y lecturas
                for (let m = 0; m < maxMedidores; m++) {
                    const dataRow = labelRow + 1 + m;
                    for (let i = 0; i < cajasPorFila && (cajaIndex + i) < cajas.length; i++) {
                        const colBase = i * (columnasPorCaja + 1) + 1;
                        const caja = cajas[cajaIndex + i];
                        const medidor = caja.meters[m];

                        worksheet.getCell(dataRow, colBase).value = medidor?.old_meter || "";
                        worksheet.getCell(dataRow, colBase + 1).value = medidor?.reading || "";

                        [worksheet.getCell(dataRow, colBase), worksheet.getCell(dataRow, colBase + 1)].forEach(cell => {
                            cell.font = { size: 8, name: "Arial" };
                            cell.alignment = { vertical: "middle", horizontal: "center" };
                            cell.border = {
                                top: { style: "thin" }, left: { style: "thin" },
                                bottom: { style: "thin" }, right: { style: "thin" }
                            };
                        });
                    }
                }

                // Actualizar la fila de inicio para las siguientes cajas
                startRow += maxMedidores + 3; // 1 para caja, 1 para headers, 1 espacio extra
                cajaIndex += cajasPorFila;
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: new Headers({
                "Content-Disposition": `attachment; filename=reporte_cajas_medidores_${lot}.xlsx`,
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
