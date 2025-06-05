import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";
import { error } from "console";

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));
        const body = await request.json();

        const {
            name,
            description,
            permissions // Array de IDs de permisos (number[])
        } = body;

        // Validación básica
        if (!id || !name || !Array.isArray(permissions)) {
            return NextResponse.json(
                { message: "ID, nombre y permisos son requeridos" },
                { status: 400 }
            );
        }

        // Verificar si el rol existe
        const existingRole = await prisma.role.findUnique({
            where: { id },
        });

        if (!existingRole) {
            return NextResponse.json(
                { message: "El rol no existe" },
                { status: 404 }
            );
        }

        // Verificar si el nuevo nombre ya existe (excluyendo el actual)
        const nameExists = await prisma.role.findFirst({
            where: {
                name,
                NOT: { id }
            }
        });

        if (nameExists) {
            return NextResponse.json(
                { error: "El nombre del rol ya está en uso" },
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
                { error: "Algunos permisos no existen" },
                { status: 400 }
            );
        }

        // Actualizar el rol y permisos (transacción)
        const updatedRole = await prisma.$transaction(async (prisma) => {
            // 1. Actualizar datos básicos del rol
            await prisma.role.update({
                where: { id },
                data: {
                    name,
                    description
                },
            });

            // 2. Eliminar relaciones de permisos existentes
            await prisma.rolePermission.deleteMany({
                where: { roleId: id }
            });

            // 3. Crear nuevas relaciones con permisos
            await prisma.rolePermission.createMany({
                data: permissions.map(permissionId => ({
                    roleId: id,
                    permissionId
                }))
            });

            // 4. Obtener el rol actualizado con sus permisos
            return await prisma.role.findUnique({
                where: { id },
                include: {
                    permissions: {
                        include: {
                            Permission: true
                        }
                    }
                }
            });
        });

        return NextResponse.json(updatedRole, { status: 200 });
    } catch (error) {
        console.error("Error en la API:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}