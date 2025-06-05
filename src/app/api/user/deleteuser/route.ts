import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));

        // 1️⃣ Validar que el ID existe
        if (!id || isNaN(id)) {
            return NextResponse.json(
                { message: "ID de acta no válido o no proporcionado." },
                { status: 400 }
            );
        }
        // 2️⃣ Verificar que el acta existe
        const userExistente = await prisma.user.findUnique({
            where: { id }
        });

        if (!userExistente) {
            return NextResponse.json(
                { message: "El usuario no existe o ya fue eliminado." },
                { status: 404 }
            );
        }

        // 3️⃣ Opción 2: Eliminación lógica (recomendado)
        const userEliminado = await prisma.user.update({
            where: { id },
            data: {
                deleted_at: new Date(), // Marca fecha de eliminación
            }
        });

        return NextResponse.json(userEliminado, { status: 200 });

    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        // Manejo específico de errores de Prisma
        return NextResponse.json(
            { message: "Error interno del servidor al procesar la eliminación." },
            { status: 500 }
        );
    }
}