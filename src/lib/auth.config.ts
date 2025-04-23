import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/libs/db";
import bcrypt from "bcrypt";
import { LotData } from "@/types/types";

interface CustomUser extends NextAuthUser {
    id: string;
    username: string;
    permissions: string[];
    lot: LotData;
}

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            username: string;
            lot: LotData;
            permissions: string[];
        };
        expires: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        username: string;
        permissions: string[];
        lot: LotData;
        exp: number;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "jsmith" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Usuario y contraseña son obligatorios");
                }

                const lot = await prisma.lot.findFirst({ where: { status: "ACTIVE" } }) ?? null;

                const formattedLot = lot && (({ id, name, start_date, end_date }) => ({
                    id,
                    name,
                    start_date: start_date.toISOString().split("T")[0],
                    end_date: end_date.toISOString().split("T")[0],
                }))(lot);


                const user = await prisma.user.findUnique({
                    where: { username: credentials.username },
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        Permission: true
                                    }
                                }
                            }
                        }
                    }
                });

                if (!user) {
                    throw new Error("Usuario no encontrado");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Contraseña incorrecta");
                }

                const permissions = Array.from(new Set(
                    (user.role?.permissions || []).map((rp: { Permission: { key: string } }) => rp.Permission.key)
                ));

                return {
                    id: String(user.id),
                    username: user.username,
                    lot: formattedLot,
                    permissions
                };
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = (user as CustomUser).username;
                token.permissions = (user as CustomUser).permissions;
                token.lot = (user as CustomUser).lot;
                token.exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                id: token.id,
                username: token.username,
                permissions: token.permissions,
                lot: token.lot
            };
            session.expires = new Date(token.exp * 1000).toISOString();
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET
};