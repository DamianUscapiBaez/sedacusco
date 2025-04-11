"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import PasswordInput from "@/components/custom/password";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const router = useRouter();
    const { status } = useSession(); 
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/dashboard");
        }
    }, [status, router]);

    const onSubmit = handleSubmit(async (data) => {
        setLoading(true);
        const res = await signIn("credentials", {
            username: data.username,
            password: data.password,
            redirect: false,
        });

        if (res?.error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Credenciales incorrectas, inténtelo de nuevo.",
            });
        } else {
            Swal.fire({
                icon: "success",
                title: "¡Bienvenido!",
                text: "Inicio de sesión exitoso.",
                timer: 1500,
                showConfirmButton: false,
            }).then(() => {
                router.push("/dashboard");
                router.refresh();
            });
        }
        setLoading(false);
    });

    return (
        <div className="flex flex-col justify-center items-center min-h-screen">
            <h2 className="text-2xl font-semibold mb-4 text-center mt-8">Iniciar sesión</h2>
            <Card className="md:w-full sm:max-w-md shadow-md rounded-md overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <div>
                            <Label htmlFor='username' className="block text-sm font-medium mb-3">Nombre de usuario o correo electrónico</Label>
                            <Input {...register('username', { required: 'Nombre de usuario requerido' })} type='text' placeholder='Nombre de usuario' className={`w-full py-2 px-4 border border-gray-600 rounded-md focus:outline-none focus:border-blue-500 ${errors.username ? 'border-red-500' : ''}`} />
                            {errors.username && <p className="text-sm text-red-500 mt-2">{errors.username.message?.toString()}</p>}
                        </div>
                        <div>
                            <Label htmlFor='password' className="block text-sm font-medium mb-3">Contraseña</Label>
                            <PasswordInput {...register('password', { required: 'Contraseña requerida' })} placeholder='****************' className={`w-full py-2 px-4 border border-gray-600 rounded-md focus:outline-none focus:border-blue-500 ${errors.password ? 'border-red-500' : ''}`} />
                            {errors.password && <p className="text-sm text-red-500 mt-2">{errors.password.message?.toString()}</p>}
                        </div>
                        <Button type="submit" className='w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md transition-colors duration-300 ease-in-out' disabled={loading}>
                            {loading ? 'Cargando...' : 'Continuar'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}