"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HiUserAdd } from "react-icons/hi";
import Swal from "sweetalert2";
import { PermissionWrapper } from "@/components/custom/PermissionWrapper";
import TechnicianTable from "./components/table-technician";
import TechnicianDialog from "./components/dialog-technician";

export default function TechnicianPage() {
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
                `/api/technician/listtechnicians?${queryParams.toString()}`
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
                ? `/api/technician/updatetechnician?id=${editData?.id}`  // URL de actualización
                : "/api/technician/newtechnician";  // URL de creación

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
                    text: result.error || "Algo salió mal al guardar.",
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

    return (
        <div className="mt-4 px-4">
            <Card className="w-full max-w-[100vw] mx-auto overflow-visible">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Tecnicos</CardTitle>
                    <CardDescription className="grid grid-cols-1 md:grid-cols-2 items-center">
                        <p>Gestiona los tecnicos de la aplicación.</p>
                        <PermissionWrapper permission="technician.create">
                            <div className="flex flex-row items-center justify-center md:justify-end gap-2 w-full mt-4">
                                <Button
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white w-full md:w-auto"
                                    onClick={() => handleOpenEdit(null)}
                                >
                                    <HiUserAdd className="mr-2 h-4 w-4" /> Nuevo Tecnico
                                </Button>
                            </div>
                        </PermissionWrapper>
                    </CardDescription>
                </CardHeader>
                <CardContent className="w-full overflow-visible">
                    <TechnicianTable
                        onDelete={() => { }}
                        fetchData={fetchData}
                        refreshTrigger={refreshTrigger}
                        onEdit={handleOpenEdit}
                    />
                </CardContent>
            </Card>
            <TechnicianDialog
                open={open}
                onClose={handleClose}
                editData={editData}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
