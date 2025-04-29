import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));
        const deleted_by = Number(searchParams.get("deleted_by")); // ID o nombre de quien elimina

        // 1️⃣ Validar que el ID existe
        if (!id || isNaN(id)) {
            return NextResponse.json(
                { error: "ID de acta no válido o no proporcionado." },
                { status: 400 }
            );
        }
        // 2️⃣ Verificar que el acta existe
        const actaExistente = await prisma.act.findUnique({
            where: { id },
            include: {
                histories: true // Opcional: incluir historial si necesitas registrarlo
            }
        });

        if (!actaExistente) {
            return NextResponse.json(
                { error: "El acta no existe o ya fue eliminada." },
                { status: 404 }
            );
        }

        // 3️⃣ Opción 2: Eliminación lógica (recomendado)
        const actaEliminada = await prisma.act.update({
            where: { id },
            data: {
                deleted_at: new Date(), // Marca fecha de eliminación
                histories: {
                    create: {
                        action: "DELETE",
                        updated_by: deleted_by,
                        details: `Eliminación del acta ${actaExistente.file_number}`
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: "Acta eliminada correctamente",
            data: actaEliminada
        }, { status: 200 });

    } catch (error) {
        console.error("Error al eliminar acta:", error);
        // Manejo específico de errores de Prisma
        return NextResponse.json(
            { error: "Error interno del servidor al procesar la eliminación." },
            { status: 500 }
        );
    }
}