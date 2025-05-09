import { NextResponse } from "next/server";
import { prisma } from "@/libs/db"; // Asegúrate de tener el cliente prisma configurado correctamente

export async function GET(request: Request) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get("dni");  // Obtener el 'dni' desde los parámetros de la URL

    // Validar que 'dni' no esté vacío
    if (!dni) {
      return NextResponse.json(
        { message: "El parámetro 'dni' es requerido" },
        { status: 400 }  // Error si no se pasa el parámetro
      );
    }

    // Buscar un único técnico por 'dni'
    const technician = await prisma.technician.findFirst({
      where: {
        dni: dni,
        deleted_at: null  // Buscar por el 'dni' exacto
      },
    });

    // Si no se encuentra el técnico, devolver un mensaje adecuado
    if (!technician) {
      return NextResponse.json(
        { message: "No se encontró un técnico con el DNI proporcionado." },
        { status: 404 }  // No encontrado
      );
    }

    // Si se encuentra el técnico, devolver la información
    return NextResponse.json(technician, { status: 200 });

  } catch (error) {
    // Manejo de errores
    console.error("Error al obtener el técnico:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }  // Error de servidor
    );
  }
}
