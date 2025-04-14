import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "ID is required" },
                { status: 400 }
            );
        }

        const roleId = Number(id);
        if (isNaN(roleId)) {
            return NextResponse.json(
                { error: "ID must be a number" },
                { status: 400 }
            );
        }

        // Consulta corregida según tu modelo de datos
        const role = await prisma.role.findUnique({
            where: { id: roleId },
            include: {
                permissions: {
                    include: {
                        Permission: true // Relación con el modelo Permission
                    }
                }
            }
        });

        if (!role) {
            return NextResponse.json(
                { error: "Role not found" },
                { status: 404 }
            );
        }

        // Formateo seguro de la respuesta
        const formattedResponse = {
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.permissions.map(rp => ({
                id: rp.Permission.id,
                key: rp.Permission.key,
                name: rp.Permission.name,
                description: rp.Permission.description
            }))
        };

        return NextResponse.json({ data: formattedResponse }, { status: 200 });

    } catch (error) {
        console.error("Error in API:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}