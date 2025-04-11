import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/libs/db";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Verificar si el usuario ya existen
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 }
      );
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario en la base de datos con status por defecto 1
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        status: "ACTIVE", // Puedes cambiar este valor si es necesario
      },
    });

    // Excluir la contraseña del objeto de respuesta
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error in user registration:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
