import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";
interface PreCatastralWhereInput {
  file_number?: {
    contains: string;
  };
  customer?: {
    inscription?: {
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

    // query params
    const file = searchParams.get("file");
    const inscription = searchParams.get("inscription");

    // Construir condiciones WHERE de manera segura
    const where: PreCatastralWhereInput = {};

    if (file) {
      where.file_number = { contains: file }; // Corregido: acceso directo a file_number
    }

    if (inscription) {
      where.customer = { inscription: { contains: inscription } }; // Corregido: acceso correcto a customer.inscription
    }

    // Consulta eficiente con transaction
    const [data, total] = await prisma.$transaction([
      prisma.preCatastrals.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          technician: true,
        }
      }),
      prisma.preCatastrals.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error("Error in API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
