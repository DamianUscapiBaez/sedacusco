import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/libs/db";
import bcrypt from "bcrypt";

interface CustomUser extends NextAuthUser {
    id: string;
    username: string;
}

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            username: string;
        };
        expires: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        username: string;
        exp: number;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            credentials: {
                username: { label: "Username", type: "text", required: true },
                password: { label: "Password", type: "password", required: true },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("⚠️ Usuario y contraseña son obligatorios.");
                }

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username },
                    select: { id: true, username: true, password: true },
                });

                if (!user) {
                    throw new Error("❌ Usuario no encontrado.");
                }

                const isPasswordValid = bcrypt.compareSync(credentials.password, user.password);
                if (!isPasswordValid) {
                    throw new Error("❌ Contraseña incorrecta.");
                }

                return { id: String(user.id), username: user.username } as CustomUser;
            },
        }),
    ],
    pages: {
        signIn: "login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const customUser = user as CustomUser;
                token.id = customUser.id;
                token.username = customUser.username;
                token.exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
            }
            return token;
        },
        async session({ session, token }) {
            if (!token.id || Date.now() / 1000 > token.exp) {
                session.user = { id: "", username: "" };
                session.expires = new Date(0).toISOString();
                return session;
            }
            session.user = { id: token.id, username: token.username };
            session.expires = new Date(token.exp * 1000).toISOString();
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
