import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

interface ActWhereInput {
  file_number?: {
    contains: string;
  };
  customer?: {
    inscription?: {
      contains: string;
    };
  };
  meter?: {
    meter_number?: {
      contains: string;
    };
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Paginación
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    // Filtros
    const file = searchParams.get("file");
    const inscription = searchParams.get("inscription");
    const meter = searchParams.get("meter");

    // Construir condiciones WHERE
    const where: ActWhereInput = {};

    if (file) {
      where.file_number = { contains: file };
    }

    if (inscription) {
      where.customer = { inscription: { contains: inscription } };
    }
    if (meter) {
      where.meter = { meter_number: { contains: meter } };
    }

    // Consulta con transaction
    const [data, total] = await prisma.$transaction([
      prisma.act.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          meter: true,
          technician: true,
          histories: {
            select: {
              id: true,
              action: true,
              updated_at: true,
              user: {
                select: {
                  names: true
                }
              }
              // incluye otros campos que necesites
            },
            orderBy: {
              updated_at: 'desc'
            }
          }
        },
        orderBy: { id: 'desc' }
      }),
      prisma.act.count({ where })
    ]);

    // Función para formatear fechas
    const formatDate = (date: Date | null) => {
      return date ? new Date(date).toISOString().split('T')[0] : null;
    };

    // Formatear todas las fechas
    const formattedData = data.map((record) => ({
      ...record,
      file_date: formatDate(record.file_date),
      histories: record.histories?.map((history) => ({
        ...history,
        updated_at: formatDate(history.updated_at),
      })),
    }));

    return NextResponse.json({ data: formattedData, total });
  } catch (error) {
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}