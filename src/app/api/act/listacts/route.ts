import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

interface ActWhereInput {
  file_number?: {
    contains: string;
  };
  deleted_at?: null; // Solo actas no eliminadas
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

    // Paginación con valores por defecto y validación
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    // Obtención y normalización de parámetros de filtro
    const file = searchParams.get("file")?.trim();
    const inscription = searchParams.get("inscription")?.trim();
    const meter = searchParams.get("meter")?.trim();

    // Construcción dinámica del objeto WHERE
    const where: ActWhereInput = {
      deleted_at: null, // Solo registros no eliminados
    };

    if (file) {
      where.file_number = { contains: file };
    }

    if (inscription) {
      where.customer = { inscription: { contains: inscription } };
    }

    if (meter) {
      where.meter = { meter_number: { contains: meter } };
    }

    // Consulta optimizada con transaction
    const [data, total] = await prisma.$transaction([
      prisma.act.findMany({
        where,
        skip,
        take: limit,
        select: { // Usar select en lugar de include para mejor performance
          id: true,
          file_number: true,
          file_date: true,
          file_time: true,
          reading: true,
          observations: true,
          customer: {
            select: {
              inscription: true,
              old_meter: true,
              customer_name: true,
              address: true
            }
          },
          meter: {
            select: {
              meter_number: true,
              verification_code: true
            }
          },
          technician: {
            select: {
              name: true
            }
          },
          histories: {
            select: {
              action: true,
              updated_at: true,
              user: {
                select: {
                  names: true
                }
              }
            },
            orderBy: {
              updated_at: 'desc'
            },
            take: 5 // Limitar el historial a los 5 últimos registros
          }
        },
        orderBy: {
          id: 'desc' // Ordenar por fecha de creación en lugar de ID
        }
      }),
      prisma.act.count({ where })
    ]);

    // Función de formateo de fechas reusable
    const formatDate = (date: Date | string | null): string | null => {
      if (!date) return null;
      return new Date(date).toISOString().split("T")[0];
    };
    // Formatear respuesta
    const response = {
      data: data.map((record) => ({
        ...record,
        file_date: formatDate(record.file_date),
        histories: record.histories?.map((history) => ({
          ...history,
          updated_at: history.updated_at,
        })),
      })),
    };

    return NextResponse.json({ ...response, total });
  } catch (error) {
    console.error("Error in ACT API:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}