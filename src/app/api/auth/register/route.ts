import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/libs/db";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

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

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        status: "ACTIVE",
      },
    });

    // Solución aplicada aquí
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error in user registration:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}