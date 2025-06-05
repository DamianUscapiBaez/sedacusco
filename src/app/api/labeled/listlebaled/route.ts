import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Paginación con validación
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const box = searchParams.get("box");
    const meter = searchParams.get("meter");

    const where: any = {
      deleted_at: null, // Asegúrate de que este campo exista en tu modelo
    };

    if (box) {
      where.name = {
        contains: box,
        mode: 'insensitive'
      };
    }

    if (meter) {
      where.meters = {
        some: {
          old_meter: {
            contains: meter,
            mode: 'insensitive' // Búsqueda case insensitive
          }
        }
      };
    }
    // Consulta optimizada con transaction
    const [data, total] = await prisma.$transaction([
      prisma.labeled.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          lot: true,
          meters: {
            select: {
              id: true,
              old_meter: true,
              reading: true,
            },
          },
        },
      }),
      prisma.labeled.count(),
    ]);

    // Función para formatear fechas
    const formatDateTime = (date: Date | null): string | null => {
      if (!date) return null;
      const d = new Date(date);
      const pad = (num: number) => num.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    // Formatear datos de respuesta
    const formattedData = data.map(item => ({
      ...item,
      createdAt: formatDateTime(item.createdAt),
    }));

    return NextResponse.json({
      data: formattedData,
      total
    });
  } catch (error) {
    console.error("Error in API:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
