import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));

        // 1️⃣ Validar el ID
        if (!id || isNaN(id)) {
            return NextResponse.json(
                { message: "ID de lote no válido o no proporcionado." },
                { status: 400 }
            );
        }

        // 2️⃣ Verificar existencia del lote
        const loteExistente = await prisma.lot.findUnique({
            where: { id },
        });

        if (!loteExistente) {
            return NextResponse.json(
                { message: "El lote no existe o ya fue eliminado." },
                { status: 404 }
            );
        }

        // 3️⃣ Marcar como INACTIVE y establecer deleted_at
        await prisma.lot.update({
            where: { id },
            data: {
                status: "INACTIVE",
                deleted_at: new Date(),
            },
        });

        // 4️⃣ Solo si el lote eliminado estaba ACTIVO, activar otro
        if (loteExistente.status === "ACTIVE") {
            const ultimoLoteValido = await prisma.lot.findFirst({
                where: {
                    deleted_at: null,
                    id: { not: id } // Excluir el que acabamos de eliminar
                },
                orderBy: {
                    id: "desc",
                },
            });

            if (ultimoLoteValido) {
                await prisma.lot.update({
                    where: { id: ultimoLoteValido.id },
                    data: {
                        status: "ACTIVE",
                    },
                });
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: "Lote eliminado correctamente.",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error al eliminar lote:", error);
        return NextResponse.json(
            { message: "Error interno del servidor al procesar la eliminación." },
            { status: 500 }
        );
    }
}
