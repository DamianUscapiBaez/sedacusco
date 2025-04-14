import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";
import bcrypt from "bcrypt";

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);

        // Paginación
        const id = Number(searchParams.get("id"));
        const {
            names,
            username,
            password,
            status,
            role_id
        } = body;

        const existingUser = await prisma.user.findFirst({
            where: { username },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "Username already exists" },
                { status: 400 }
            );
        }

        let hashedPassword: string | undefined;

        if (password !== null && password !== "") {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // ✅ Si todo está bien, actualizamos el registro PreCatastral
        const actualizadoUser = await prisma.user.update({
            where: { id },
            data: {
            names,
            username,
            ...(hashedPassword && { password: hashedPassword }), // Solo actualiza si hashedPassword existe
            status,
            role: { connect: { id: Number(role_id) } },  // Conexión con cliente
            },
        });

        return NextResponse.json(actualizadoUser, { status: 200 });
    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
