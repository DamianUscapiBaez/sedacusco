import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const inscription = searchParams.get("inscription");

    if (!inscription) {
      return NextResponse.json(
        { message: "El parámetro 'inscription' es requerido" },
        { status: 400 }
      );
    }

    // Buscar cliente por inscripción
    const customer = await prisma.customer.findFirst({
      where: {
        inscription: inscription,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "No se encontró el usuario con esa inscripción" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer, { status: 200 });
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 