import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Paginación
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    // Filtros (ahora solo se aplican cuando se envía el botón de búsqueda)
    const file = searchParams.get("file");
    const inscription = searchParams.get("inscription");

    // Construir condiciones WHERE de manera segura
    const where: any = {};

    if (file) {
      where.file_number = { contains: file };
    }

    if (inscription) {
      where.customer = { inscription: { contains: inscription } };
    }

    // Consulta eficiente con transaction
    const [data, total] = await prisma.$transaction([
      prisma.act.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          meter: true, // Removed as it is not a valid property
          technician: true,
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.act.count({ where })
    ]);

    return NextResponse.json({ data, total });

  } catch (error) {
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}