import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));

        // 1️⃣ Validar que el ID existe
        if (!id || isNaN(id)) {
            return NextResponse.json(
                { error: "ID de caja no válido o no proporcionado." },
                { status: 400 }
            );
        }
        // 2️⃣ Verificar que el acta existe
        const cajaExistente = await prisma.labeled.findUnique({
            where: { id }
        });

        if (!cajaExistente) {
            return NextResponse.json(
                { error: "El caja no existe o ya fue eliminada." },
                { status: 404 }
            );
        }

        // 3️⃣ Opción 2: Eliminación lógica (recomendado)
        const cajaEliminado = await prisma.labeled.update({
            where: { id },
            data: {
                deleted_at: new Date(), // Marca fecha de eliminación
            }
        });

        return NextResponse.json({
            success: true,
            message: "Caja eliminada correctamente",
            data: cajaEliminado
        }, { status: 200 });

    } catch (error) {
        console.error("Error al eliminar caja:", error);
        // Manejo específico de errores de Prisma
        return NextResponse.json(
            { error: "Error interno del servidor al procesar la eliminación." },
            { status: 500 }
        );
    }
}