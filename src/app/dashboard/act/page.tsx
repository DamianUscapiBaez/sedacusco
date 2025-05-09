"use client";
import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HiDocumentAdd } from "react-icons/hi";
import ActDialog from "./components/dialog-act";
import ActTable from "./components/table-act";
import { PermissionWrapper } from "@/components/custom/PermissionWrapper";
import Swal from "sweetalert2";

export default function ActPage() {
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [tableKey, setTableKey] = useState(0); // Forzar actualización

  const handleOpenEdit = (data: any = null) => {
    setEditData(data);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const refreshTable = useCallback(() => {
    setTableKey(prev => prev + 1);
  }, []);

  const fetchData = useCallback(async (params: any = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page?.toString() || "1",
        limit: params.limit?.toString() || "10",
        ...(params.file && { file: params.file }),
        ...(params.inscription && { inscription: params.inscription }),
        ...(params.meter && { meter: params.meter }),
      });

      const response = await fetch(`/api/act/listacts?${queryParams.toString()}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }, []);

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
      const response = await fetch(`/api/act/deleteact?id=${id}`, {
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
    <div className="mt-4 w-full max-w-[100vw] px-4">
      <Card className="w-full max-w-[100vw] mx-auto overflow-visible">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Actas</CardTitle>
          <CardDescription className="grid grid-cols-1 md:grid-cols-2 items-center">
            <p>Gestiona las actas de la aplicación. Crea, edita y elimina registros según tus necesidades.</p>
            <PermissionWrapper permission="acts.create">
              <div className="flex flex-row items-center justify-center md:justify-end gap-2 w-full mt-4">
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white w-full md:w-auto"
                  onClick={() => handleOpenEdit()}
                >
                  <HiDocumentAdd className="mr-2 h-4 w-4" />
                  Nuevo Acta
                </Button>
              </div>
            </PermissionWrapper>
          </CardDescription>
        </CardHeader>

        <CardContent className="w-full overflow-visible">
          <ActTable
            key={tableKey}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            fetchData={fetchData}
          />
        </CardContent>
      </Card>

      <ActDialog
        open={open}
        onClose={handleClose}
        editData={editData}
        refreshTable={refreshTable}
      />
    </div>
  );
}
