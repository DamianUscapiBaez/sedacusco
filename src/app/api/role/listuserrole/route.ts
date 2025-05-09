import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";

export async function GET(request: Request) {
  try {
    // Consulta eficiente con transaction
    const data = await prisma.role.findMany({ where: { deleted_at: null } });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}