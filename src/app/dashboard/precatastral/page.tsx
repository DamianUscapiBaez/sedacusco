"use client";
import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PreCatastralTable from "./components/table-precatastral";
import PreCatastralDialog from "./components/dialog-precatastral";
import { HiDocumentAdd } from "react-icons/hi";
import Swal from "sweetalert2";
import { PermissionWrapper } from "@/components/custom/PermissionWrapper";

export default function PreCatastralPage() {
  const [open, setOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [tableKey, setTableKey] = useState(0); // Key para forzar reinicio de la tabla

  const fetchData = useCallback(async (params: any = {}) => {
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
  }, []);

  const handleOpenEdit = (data: { [key: string]: any } | null = null) => {
    setEditData(data);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditData(null);
  };

  const refreshTable = useCallback(() => {
    setTableKey(prev => prev + 1);
  }, []);

  const handleDelete = useCallback((id: number) => {
    console.log("Eliminar registro con ID:", id);
  }, []);
  
  return (
    <div className="mt-4 w-full max-w-[100vw] px-4">
      <Card className="w-full max-w-[100vw] mx-auto overflow-visible">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Pre Catastro</CardTitle>
          <CardDescription className="grid grid-cols-1 md:grid-cols-2 items-center">
            <p>Gestiona los precatastros de la aplicación.</p>
            <PermissionWrapper permission="precatastral.create">
              <div className="flex flex-row items-center justify-center md:justify-end gap-2 w-full mt-4">
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white w-full md:w-auto"
                  onClick={() => handleOpenEdit(null)}
                >
                  <HiDocumentAdd className="mr-2 h-4 w-4" /> Nuevo Pre Catastro
                </Button>
              </div>
            </PermissionWrapper>
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full overflow-visible">
          <PreCatastralTable
            onDelete={handleDelete}
            onEdit={handleOpenEdit}
            fetchData={fetchData}
          />
        </CardContent>
      </Card>
      <PreCatastralDialog
        open={open}
        onClose={handleClose}
        editData={editData}
        refreshTable={refreshTable}
      />
    </div>
  );
}
