// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const routePermissions: Record<string, string[]> = {
  '/dashboard/user': ['users.manage'],
  '/dashboard/role': ['roles.manage'],
  '/dashboard/precatastral': ['precatastral.manage'],
  '/dashboard/acts': ['acts.manage']
};

const publicRoutes = ['/', '/login'];

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/register',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Usuario autenticado accediendo a rutas públicas
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard/:path*', req.url));
  }

  // Rutas protegidas
  if (!publicRoutes.includes(pathname)) {
    // Usuario no autenticado
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Verificación de permisos
    const matchedRoute = Object.keys(routePermissions).find((route) =>
      pathname.startsWith(route)
    );

    if (matchedRoute) {
      const requiredPermissions = routePermissions[matchedRoute];
      const hasPermission = requiredPermissions.some((perm) =>
        token?.permissions?.includes(perm)
      );

      if (!hasPermission) {
        return NextResponse.redirect(new URL('/dashboard/unauthorized', req.url));
      }
    }
  }

  return NextResponse.next();
}
