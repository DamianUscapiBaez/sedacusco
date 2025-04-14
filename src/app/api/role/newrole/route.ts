import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            name,
            description,
            permissions // Array de IDs de permisos (number[])
        } = body;

        // Validación básica
        if (!name || !Array.isArray(permissions)) {
            return NextResponse.json(
                { message: "Nombre y permisos son requeridos" },
                { status: 400 }
            );
        }

        // Verificar si el rol ya existe
        const existingRole = await prisma.role.findFirst({
            where: { name },
        });

        if (existingRole) {
            return NextResponse.json(
                { message: "El nombre del rol ya existe" },
                { status: 400 }
            );
        }

        // Verificar que los permisos existan
        const existingPermissions = await prisma.permission.findMany({
            where: {
                id: { in: permissions }
            }
        });

        if (existingPermissions.length !== permissions.length) {
            return NextResponse.json(
                { message: "Algunos permisos no existen" },
                { status: 400 }
            );
        }

        // Crear el rol junto con los permisos (transacción)
        const nuevoRole = await prisma.$transaction(async (prisma) => {
            // 1. Crear el rol
            const role = await prisma.role.create({
                data: {
                    name,
                    description
                },
            });

            // 2. Crear las relaciones con permisos
            await prisma.rolePermission.createMany({
                data: permissions.map(permissionId => ({
                    roleId: role.id,
                    permissionId
                }))
            });

            // 3. Obtener el rol con sus permisos para devolverlo
            return await prisma.role.findUnique({
                where: { id: role.id },
                include: {
                    permissions: {
                        include: {
                            Permission: true
                        }
                    }
                }
            });
        });

        return NextResponse.json(nuevoRole, { status: 201 });
    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}