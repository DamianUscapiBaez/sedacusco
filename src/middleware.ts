import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: '/login', // Ruta para el login
  },
});

export const config = {
  matcher: ["/dashboard/:path*"], // Asegura que solo las rutas dentro del dashboard estén protegidas
};
