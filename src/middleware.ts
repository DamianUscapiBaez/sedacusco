// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const routePermissions: Record<string, string[]> = {
  '/dashboard/user': ['users.manage'],
  '/dashboard/role': ['roles.manage'],
  '/dashboard/precatastral': ['precatastral.manage'],
  '/dashboard/acts': ['acts.manage'],
};

const publicRoutes = ['/', '/login'];

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/register',
    '/login', // Asegúrate de incluir '/login' en el matcher
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Si el usuario está autenticado y está intentando acceder a una ruta pública como '/login', redirigirlo al dashboard
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Si el usuario no está autenticado y está intentando acceder a una ruta protegida
  if (!token && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Rutas protegidas, verificación de permisos
  if (token && !publicRoutes.includes(pathname)) {
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
