"use client";
import { useState } from "react";
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

            if (result?.error) throw new Error(result.error);

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
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-background transition-colors">
            <div className="w-full max-w-md mx-4">
                <div className="text-center mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Iniciar sesión</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Ingresa tus credenciales para acceder al sistema
                    </p>
                </div>

                <Card className="shadow-md transition-colors">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-medium">Credenciales</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <form className="space-y-4" onSubmit={onSubmit}>
                            <div>
                                <Label htmlFor="username">Nombre de usuario</Label>
                                <Input
                                    id="username"
                                    {...register('username', {
                                        required: 'Este campo es requerido',
                                        minLength: {
                                            value: 3,
                                            message: 'Mínimo 3 caracteres'
                                        }
                                    })}
                                    className="mt-1"
                                    type="text"
                                    placeholder="usuario123"
                                    disabled={isSubmitting}
                                />
                                {errors.username && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.username.message?.toString()}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="password">Contraseña</Label>
                                <PasswordInput
                                    id="password"
                                    {...register('password', {
                                        required: 'Este campo es requerido',
                                        minLength: {
                                            value: 6,
                                            message: 'Mínimo 6 caracteres'
                                        }
                                    })}
                                    className="mt-1"
                                    placeholder="••••••••"
                                    disabled={isSubmitting}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.password.message?.toString()}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full mt-2"
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