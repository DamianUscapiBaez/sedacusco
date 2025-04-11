"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Swal from "sweetalert2";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";

export function UserNav() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: '¿Quieres cerrar sesión?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, cerrar sesión',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Sesión cerrada',
                    text: 'Tu sesión ha sido cerrada exitosamente.',
                    icon: 'success',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });

                await signOut({ redirect: false }); 
                router.push("/login");
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Swal.fire({
                title: 'Error',
                text: 'Ocurrió un error al cerrar sesión. Por favor, inténtalo de nuevo.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src="/avatars/02.png" alt="" />
                        <AvatarFallback>SR</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 z-[12]">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Sijin Raj</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            sijin@outlook.com
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <Link href="#">Cerrar Sesión</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
