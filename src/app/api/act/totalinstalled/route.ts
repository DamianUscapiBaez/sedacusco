import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Obtener el lote desde los parámetros de búsqueda
    const lot = Number(searchParams.get("lot"));

    // Consultar la cantidad de actas con observación "sin_observaciones"
    const count = await prisma.act.count({
      where: {
        lotId: lot,
        observations: "SIN_OBSERVACIONES",
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}