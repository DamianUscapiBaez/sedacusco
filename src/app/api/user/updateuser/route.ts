import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";
import bcrypt from "bcrypt";

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);

        const id = Number(searchParams.get("id"));

        const {
            names,
            username,
            password,
            status,
            roleId
        } = body;

        // Verifica si el username ya está en uso por OTRO usuario
        const existingUser = await prisma.user.findFirst({
            where: {
                username,
                NOT: {
                    id: id
                }
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "El nombre de usuario ya está en uso." },
                { status: 400 }
            );
        }

        let updateData: any = {
            names,
            username,
            status,
            role: {
                connect: { id: Number(roleId) }
            }
        };

        // Si hay una nueva contraseña, hashearla y agregarla al update
        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedUser, { status: 200 });

    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
