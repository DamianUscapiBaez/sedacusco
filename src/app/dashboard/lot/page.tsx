"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HiUserAdd } from "react-icons/hi";
import Swal from "sweetalert2";
import { PermissionWrapper } from "@/components/custom/PermissionWrapper";
import LotTable from "./components/table-lot";
import LotDialog from "./components/dialog-lot";

export default function LotPage() {
    const [open, setOpen] = useState<boolean>(false);
    const [editData, setEditData] = useState<any | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchData = async (params: {
        page?: number;
        limit?: number;
    } = {}) => {
        try {
            const queryParams = new URLSearchParams({
                page: params.page?.toString() || "1",
                limit: params.limit?.toString() || "10"
            });

            const response = await fetch(
                `/api/lot/listlotall?${queryParams.toString()}`
            );

            if (!response.ok) throw new Error(`Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching data:", error);
            throw error;
        }
    };

    const handleOpenEdit = (data: any | null = null) => {
        setEditData(data);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditData(null);
    };

    const refreshTable = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleSubmit = async (data: any) => {
        try {
            const userResponse = await fetch("/api/auth/session");
            const session = await userResponse.json();
            const userId = Number(session.user?.id);
            if (!userId) {
                Swal.fire({
                    icon: "error",
                    title: "Error de autenticación",
                    text: "No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.",
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: {
                        container: 'swal2-container-custom !z-[99999]',
                        popup: '!z-[99999]',
                    },
                });
                return;
            }

            const apiEndpoint = editData
                ? `/api/lot/updatelot?id=${editData?.id}`  // URL de actualización
                : "/api/lot/newlot";  // URL de creación

            const method = editData ? "PUT" : "POST";  // Método PUT si estamos actualizando

            const response = await fetch(apiEndpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: result.message || "Algo salió mal al guardar.",
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: {
                        container: 'swal2-container-custom !z-[99999]',
                        popup: '!z-[99999]',
                    },
                });
                return;
            }

            Swal.fire({
                icon: "success",
                title: "¡Guardado exitosamente!",
                text: editData?.id ? "El registro fue actualizado correctamente." : "El registro fue creado correctamente.",
                timer: 2000,
                showConfirmButton: false,
                customClass: {
                    container: 'swal2-container-custom !z-[99999]',
                    popup: '!z-[99999]',
                },
            });

            handleClose();
            refreshTable();

        } catch (error) {
            console.error("❌ Error al guardar:", error);
            Swal.fire({
                icon: "error",
                title: "Error del servidor",
                text: "Ocurrió un error inesperado. Intenta nuevamente.",
                showConfirmButton: false,
                timer: 2000,
                customClass: {
                    container: 'swal2-container-custom !z-[99999]',
                    popup: '!z-[99999]',
                },
            });
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¡Esta acción no se puede deshacer!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`/api/lot/deletelot?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Error al eliminar el registro');

            await Swal.fire('¡Eliminado!', 'El registro ha sido eliminado correctamente.', 'success');
            refreshTable();
        } catch (error) {
            console.error('Error al eliminar:', error);
            Swal.fire('Error', 'Hubo un problema al eliminar el registro.', 'error');
        }
    };

    return (
        <div className="mt-4 w-full px-4">
            <Card className="w-full mx-auto overflow-visible">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold">Lotes</CardTitle>
                    <CardDescription>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:items-center">
                            <p className="text-sm sm:text-base">Gestiona los lotes de la aplicación.</p>
                            <PermissionWrapper permission="lots.create">
                                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 w-full">
                                    <Button
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto"
                                        onClick={() => handleOpenEdit(null)}
                                    >
                                        <HiUserAdd className="mr-2 h-4 w-4" /> Nuevo Lote
                                    </Button>
                                </div>
                            </PermissionWrapper>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="w-full overflow-x-auto">
                    <LotTable
                        onDelete={handleDelete}
                        fetchData={fetchData}
                        refreshTrigger={refreshTrigger}
                        onEdit={handleOpenEdit}
                    />
                </CardContent>
            </Card>
            <LotDialog
                open={open}
                onClose={handleClose}
                editData={editData} 
                onSubmit={handleSubmit}
            />
        </div>
    );
}
