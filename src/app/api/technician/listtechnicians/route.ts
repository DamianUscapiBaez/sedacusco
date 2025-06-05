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
      prisma.technician.findMany({
        where: {
          deleted_at: null
        },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              acts: true,
              preCatastrals: true
            }
          }
        },
        orderBy: { id: 'desc' }
      }),
      prisma.technician.count({ where: { deleted_at: null } }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error("Error in API:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
