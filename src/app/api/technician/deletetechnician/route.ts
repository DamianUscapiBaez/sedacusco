import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));

        // 1️⃣ Validar que el ID existe
        if (!id || isNaN(id)) {
            return NextResponse.json(
                { message: "ID de técnico no válido o no proporcionado." },
                { status: 400 }
            );
        }
        // 2️⃣ Verificar que el técnico existe
        const tecnicoExistente = await prisma.technician.findUnique({
            where: { id }
        });

        if (!tecnicoExistente) {
            return NextResponse.json(
                { message: "El técnico no existe o ya fue eliminado." },
                { status: 404 }
            );
        }

        // 3️⃣ Opción 2: Eliminación lógica (recomendado)
        const tecnicoEliminado = await prisma.technician.update({
            where: { id },
            data: {
                deleted_at: new Date(), // Marca fecha de eliminación
            }
        });

        return NextResponse.json({
            success: true,
            message: "Técnico eliminado correctamente",
            data: tecnicoEliminado
        }, { status: 200 });

    } catch (error) {
        console.error("Error al eliminar técnico:", error);
        // Manejo específico de errores de Prisma
        return NextResponse.json(
            { message: "Error interno del servidor al procesar la eliminación." },
            { status: 500 }
        );
    }
}