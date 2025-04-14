import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            dni,
            name
        } = body;

        // Verificar si el rol ya existe
        const existingTechnician = await prisma.technician.findFirst({
            where: { dni },
        });

        if (existingTechnician) {
            return NextResponse.json(
                { message: "El dni del tecnico ya existe" },
                { status: 400 }
            );
        }
        // Crear el rol junto con los permisos (transacción)
        const nuevoTecnico = await prisma.$transaction(async (prisma) => {
            // 1. Crear el rol
            const role = await prisma.technician.create({
                data: {
                    dni,
                    name
                },
            });
        });

        return NextResponse.json(nuevoTecnico, { status: 201 });
    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}