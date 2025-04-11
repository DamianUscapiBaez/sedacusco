"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PreCatastralTable from "./components/table-precatastral";
import PreCatastralDialog from "./components/dialog-precatastral";
import { HiDocumentAdd } from "react-icons/hi";
import Swal from "sweetalert2";

export default function PreCatastralPage() {
  const [open, setOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchData = async (params: {
    page?: number;
    limit?: number;
    file?: string;
    inscription?: string;
  } = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page?.toString() || "1",
        limit: params.limit?.toString() || "10",
        ...(params.file && { file: params.file }),
        ...(params.inscription && { inscription: params.inscription })
      });

      const response = await fetch(
        `/api/precatastral/listprecatastrals?${queryParams.toString()}`
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

      const dataToSend = {
        ...data,
        [editData?.id ? "updated_by" : "created_by"]: userId,
      };

      const apiEndpoint = editData
        ? `/api/precatastral/updateprecatastral?id=${editData?.id}`  // URL de actualización
        : "/api/precatastral/newprecatastral";  // URL de creación

      const method = editData ? "PUT" : "POST";  // Método PUT si estamos actualizando

      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (!response.ok) {
        refreshTable();
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
    <div className="mt-4 w-full max-w-[100vw] px-4">
      <Card className="w-full max-w-[100vw] mx-auto overflow-visible">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Pre Catastro</CardTitle>
          <CardDescription className="text-justify">
            Gestiona los precatastros de la aplicación.
          </CardDescription>
          <div className="flex flex-row items-center justify-center md:justify-end gap-2 w-full mt-4">
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white w-full md:w-auto"
              onClick={() => handleOpenEdit(null)}
            >
              <HiDocumentAdd className="mr-2 h-4 w-4" /> Nuevo Pre Catastro
            </Button>
          </div>
        </CardHeader>
        <CardContent className="w-full overflow-visible">
          <PreCatastralTable
            onEdit={handleOpenEdit}
            onDelete={() => { }}
            fetchData={fetchData}
            refreshTrigger={refreshTrigger}
          />
        </CardContent>
      </Card>
      <PreCatastralDialog
        open={open}
        onClose={handleClose}
        editData={editData}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
