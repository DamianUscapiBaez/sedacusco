"use client";
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HiDocumentAdd } from "react-icons/hi";
import { PermissionWrapper } from "@/components/custom/PermissionWrapper";
import LabeledTable from "./components/table-labeled";
import LabeledDialog from "./components/dialog-labeled";
import Swal from "sweetalert2";

export default function LabeledPage() {
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [tableKey, setTableKey] = useState(0); // Key para forzar reinicio de la tabla

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
        ...(params.box && { box: params.box }),
        ...(params.meter && { meter: params.meter })
      });

      const response = await fetch(`/api/labeled/listlebaled?${queryParams}`);
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
      const response = await fetch(`/api/labeled/deletelabeled?id=${id}`, {
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
          <CardTitle className="text-2xl font-bold">Rotulado</CardTitle>
          <CardDescription className="grid grid-cols-1 md:grid-cols-2 items-center">
            <p>Gestiona el rotulado de los medidores de la aplicación.</p>
            <PermissionWrapper permission="labeled.create">
              <div className="flex flex-row items-center justify-center md:justify-end gap-2 w-full mt-4">
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white w-full md:w-auto"
                  onClick={() => handleOpenEdit()}
                >
                  <HiDocumentAdd className="mr-2 h-4 w-4" /> Nueva caja
                </Button>
              </div>
            </PermissionWrapper>
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full overflow-visible">
          <LabeledTable
            key={tableKey} // Key que fuerza reinicio al cambiar
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            fetchData={fetchData}
          />
        </CardContent>
      </Card>
      <LabeledDialog
        open={open}
        onClose={handleClose}
        editData={editData}
        refreshTable={refreshTable}
      />
    </div>
  );
}