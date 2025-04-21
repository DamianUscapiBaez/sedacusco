"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HiDocumentAdd } from "react-icons/hi";
import { PermissionWrapper } from "@/components/custom/PermissionWrapper";
import LabeledTable from "./components/table-labeled";
import LabeledDialog from "./components/dialog-labeled";

export default function LabeledPage() {
  const [open, setOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOpenEdit = (data: { [key: string]: any } | null = null) => {
    setEditData(data);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const refreshTable = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const fetchData = async (params: {
    page?: number;
    limit?: number;
    file?: string;
    inscription?: string;
    meter?: string;
  } = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page?.toString() || "1",
        limit: params.limit?.toString() || "10",
        ...(params.file && { file: params.file }),
        ...(params.inscription && { inscription: params.inscription }),
        ...(params.meter && { meter: params.meter })
      });

      const response = await fetch(
        `/api/act/listacts?${queryParams.toString()}`
      );

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };
  const handleDelete = (id: number) => {
    // Lógica para eliminar
    console.log("Eliminar registro con ID:", id);
  };

  return (
    <div className="mt-4 w-full max-w-[100vw] px-4">
      <Card className="w-full max-w-[100vw] mx-auto overflow-visible">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Rotulado</CardTitle>
          <CardDescription className="grid grid-cols-1 md:grid-cols-2 items-center">
            <p> Gestiona el rotulado de los medidores de la aplicación. Crea, edita y elimina registros según tus necesidades.</p>
            <PermissionWrapper permission="acts.create">
              <div className="flex flex-row items-center justify-center md:justify-end gap-2 w-full mt-4">

                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white w-full md:w-auto"
                  onClick={() => handleOpenEdit()}
                >
                  <HiDocumentAdd className="mr-2 h-4 w-4" /> Nuevo Rotulado
                </Button>
              </div>
            </PermissionWrapper>
          </CardDescription>

        </CardHeader>
        <CardContent className="w-full overflow-visible">
          <LabeledTable
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            fetchData={fetchData}
            refreshTrigger={refreshTrigger} // Cambia esto según tu lógica de actualización
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