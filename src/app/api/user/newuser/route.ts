import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            names, // Removed as it does not exist in the PreCatastrals model
            username,
            password,
            role_id,
            status
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
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Si todo está bien, creamos el nuevo registro PreCatastral
        const nuevoUser = await prisma.user.create({
            data: {
                names,
                username,
                password: hashedPassword,
                status,
                role: { connect: { id: Number(role_id) } },  // Conexión con cliente
            },
        });

        return NextResponse.json(nuevoUser, { status: 201 });
    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
