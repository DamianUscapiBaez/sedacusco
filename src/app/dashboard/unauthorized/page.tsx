import Link from 'next/link';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="p-8 rounded-xl shadow-lg max-w-md text-center space-y-6">
                <h1 className="text-3xl font-extrabold text-red-500 mb-4">
                    Acceso No Autorizado
                </h1>
                <p className="text-lg text-gray-300 mb-4">
                    Lo sentimos, no tienes permiso para acceder a esta página.
                </p>
                <p className="text-lg text-gray-300 mb-6">
                    Por favor, contacta al administrador si necesitas acceso.
                </p>
                <Link
                    href="/dashboard"
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Volver al Dashboard
                </Link>
            </div>
        </div>
    );
}
