import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Validar y obtener parámetros
        const lot = Number(searchParams.get("lot"));
        if (isNaN(lot)) {
            return NextResponse.json(
                { message: "Invalid lot parameter" },
                { status: 400 }
            );
        }

        const filterType = searchParams.get("filterType"); // "hoy", "mensual" o undefined

        // Obtener datos del lote
        const lotData = await prisma.lot.findUnique({
            where: { id: lot },
            select: {
                start_date: true,
                end_date: true,
            },
        });

        if (!lotData) {
            return NextResponse.json(
                { message: "Lot not found" },
                { status: 404 }
            );
        }

        // Construir filtro de fecha con mejor manejo de zonas horarias
        let dateFilter: { gte: Date; lt?: Date; lte?: Date } | undefined;
        
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalizar a inicio del día
        
        if (filterType === "hoy") {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            dateFilter = {
                gte: now,
                lt: tomorrow,
            };
        } else if (filterType === "mensual") {
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            dateFilter = {
                gte: firstDayOfMonth,
                lt: firstDayOfNextMonth,
            };
        } else if (lotData.start_date && lotData.end_date) {
            // Asegurarse de que las fechas del lote sean válidas
            const startDate = new Date(lotData.start_date);
            const endDate = new Date(lotData.end_date);
            
            if (startDate > endDate) {
                return NextResponse.json(
                    { message: "Invalid lot date range" },
                    { status: 400 }
                );
            }
            
            dateFilter = {
                gte: startDate,
                lte: endDate,
            };
        }

        // Consulta principal mejor estructurada
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        updatedActHistories: {
                            some: {
                                act: {
                                    lotId: lot,
                                    ...(dateFilter && {
                                        histories: {
                                            some: {
                                                updated_at: dateFilter,
                                            },
                                        },
                                    }),
                                },
                            },
                        },
                    },
                    {
                        updatedPreCatastrals: {
                            some: {
                                preCatastral: {
                                    lotId: lot,
                                    ...(dateFilter && {
                                        histories: {
                                            some: {
                                                updated_at: dateFilter,
                                            },
                                        },
                                    }),
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true, // Siempre incluir ID para identificación única
                names: true,
                _count: {
                    select: {
                        updatedActHistories: {
                            where: {
                                action: "CREATE",
                                act: {
                                    lotId: lot,
                                    ...(dateFilter && {
                                        histories: {
                                            some: {
                                                updated_at: dateFilter,
                                            },
                                        },
                                    }),
                                },
                            },
                        },
                        updatedPreCatastrals: {
                            where: {
                                action: "CREATE",
                                preCatastral: {
                                    lotId: lot,
                                    ...(dateFilter && {
                                        histories: {
                                            some: {
                                                updated_at: dateFilter,
                                            },
                                        },
                                    }),
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
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}