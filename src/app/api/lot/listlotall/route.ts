import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Paginación
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        // Consulta eficiente con transaction
        const [data, total] = await prisma.$transaction([
            prisma.lot.findMany({
                where: { deleted_at: null }, // Asegúrate de que este campo exista en tu modelo
                skip,
                take: limit,
                orderBy: { id: 'desc' }
            }),
            prisma.lot.count(),
        ]);

        // Función para formatear fechas
        const formatDate = (date: Date | null) => {
            return date ? new Date(date).toISOString().split('T')[0] : null;
        };

        // Formatear todas las fechas
        const formattedData = data.map((record) => ({
            ...record,
            start_date: formatDate(record.start_date),
            end_date: formatDate(record.end_date)
        }));

        return NextResponse.json({ data: formattedData, total });
    } catch (error) {
        console.error("Error in API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
