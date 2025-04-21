import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Obtener los parámetros de búsqueda
        const lot = Number(searchParams.get("lot"));
        const filterType = searchParams.get("filterType"); // "hoy" o "mensual"

        // Obtener el lote para extraer las fechas startDate y endDate
        const lotData = await prisma.lot.findUnique({
            where: { id: lot },
            select: {
                start_date: true,
                end_date: true,
            },
        });

        if (!lotData) {
            return NextResponse.json(
                { error: "Lot not found" },
                { status: 404 }
            );
        }

        const { start_date: startDate, end_date: endDate } = lotData;

        // Construir el filtro de fecha
        let dateFilter: any = {};
        if (filterType === "hoy") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            dateFilter = {
                gte: today,
                lt: tomorrow,
            };
        } else if (filterType === "mensual") {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            dateFilter = {
                gte: firstDayOfMonth,
                lt: firstDayOfNextMonth,
            };
        } else if (startDate && endDate) {
            dateFilter = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        updatedActHistories: {
                            some: {
                                act: {
                                    lot_id: lot,
                                    histories: {
                                        some: {
                                            updated_at: dateFilter, // Filtrar por fecha
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        updatedPreCatastrals: {
                            some: {
                                preCatastral: {
                                    lot_id: lot,
                                    histories: {
                                        some: {
                                            updated_at: dateFilter, // Filtrar por fecha
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                names: true,
                _count: {
                    select: {
                        updatedActHistories: {
                            where: {
                                action: "CREATE",
                                act: {
                                    histories: {
                                        some: {
                                            updated_at: dateFilter, // Filtrar por fecha
                                        },
                                    },
                                },
                            },
                        },
                        updatedPreCatastrals: {
                            where: {
                                action: "CREATE",
                                preCatastral: {
                                    histories: {
                                        some: {
                                            updated_at: dateFilter, // Filtrar por fecha
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({ data: users });
    } catch (error) {
        console.error("Error in API:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
