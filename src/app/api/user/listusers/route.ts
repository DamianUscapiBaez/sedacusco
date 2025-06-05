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
            prisma.user.findMany({
                where: {
                    deleted_at: null // Asegúrate de filtrar los usuarios eliminados
                },
                skip,
                take: limit,
                include: { role: true },
                orderBy: { id: 'desc' }
            }),
            prisma.user.count(),
        ]);

        return NextResponse.json({ data, total });
    } catch (error) {
        console.error("Error in API:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
