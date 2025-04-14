"use client";
import { useState } from "react";  // Asegúrate de importar useState
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import PasswordInput from "@/components/custom/password";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const router = useRouter();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();


    const onSubmit = handleSubmit(async (data) => {
        try {
            const result = await signIn("credentials", {
                username: data.username,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            await Swal.fire({
                icon: "success",
                title: "¡Bienvenido!",
                text: "Inicio de sesión exitoso.",
                timer: 1500,
                showConfirmButton: false
            });

            router.push("/dashboard");
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error instanceof Error ? error.message : "Credenciales incorrectas"
            });
        }
    });

    return (
        <div className={`flex min-h-screen flex-col items-center justify-center p-4 transition-colors duration-300`}>
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight transition-colors duration-300">
                        Iniciar sesión
                    </h2>
                    <p className={`mt-2 text-sm transition-colors duration-300 `}>
                        Ingresa tus credenciales para acceder al sistema
                    </p>
                </div>

                <Card className={`transition-colors duration-300`}>
                    <CardHeader>
                        <CardTitle className={`transition-colors duration-300`}>
                            Credenciales
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6" onSubmit={onSubmit}>
                            <div>
                                <Label className={`mb-2 transition-colors duration-300 `} htmlFor="username">
                                    Nombre de usuario
                                </Label>
                                <Input
                                    id="username"
                                    {...register('username', {
                                        required: 'Este campo es requerido',
                                        minLength: {
                                            value: 3,
                                            message: 'Mínimo 3 caracteres'
                                        }
                                    })}
                                    type="text"
                                    placeholder="usuario123"
                                    className="mt-1 transition-colors duration-300"
                                    disabled={isSubmitting}
                                />
                                {errors.username && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.username.message?.toString()}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label className={`mb-2 transition-colors duration-300 `} htmlFor="password">
                                    Contraseña
                                </Label>
                                <PasswordInput
                                    id="password"
                                    {...register('password', {
                                        required: 'Este campo es requerido',
                                        minLength: {
                                            value: 6,
                                            message: 'Mínimo 6 caracteres'
                                        }
                                    })}
                                    placeholder="••••••••"
                                    className={`mt-1 transition-colors duration-300 `}
                                    disabled={isSubmitting}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.password.message?.toString()}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Procesando...
                                    </span>
                                ) : (
                                    "Iniciar sesión"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
