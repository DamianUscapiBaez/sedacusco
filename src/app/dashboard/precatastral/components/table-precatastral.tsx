"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import { RiResetRightFill } from "react-icons/ri";
import React, { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PreCatastralData } from "@/types/types";
import { ActionButtons } from "@/components/custom/ActionButtons";

interface ApiResponse {
  data: PreCatastralData[];
  total: number;
}

interface Props {
  onEdit: (data: PreCatastralData) => void;
  onDelete: (id: number) => void;
  fetchData: (params: any) => Promise<ApiResponse>;
  refreshTrigger: number;
}

export default function PreCatastralTable({ onEdit, onDelete, fetchData, refreshTrigger }: Props) {
  const [data, setData] = useState<PreCatastralData[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchByFile, setSearchByFile] = useState("");
  const [searchByInscription, setSearchByInscription] = useState("");

  // Memoizar la función de carga de datos
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchData({
        page,
        limit: rowsPerPage,
        file: searchByFile,
        inscription: searchByInscription
      });
      setData(result.data);
      setTotalRows(result.total);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchData, page, rowsPerPage, searchByFile, searchByInscription]);

  // Efecto para cargar datos
  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Manejar búsqueda con debounce
  const handleSearch = useCallback(() => {
    setPage(1);
    loadData();
  }, [loadData]);

  // Resetear filtros
  const handleReset = useCallback(async () => {
    setSearchByFile('');
    setSearchByInscription('');
    setPage(1);
  }, []);

  // Cambiar número de filas por página
  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value));
    setPage(1);
  };

  const totalPages = Math.ceil(totalRows / rowsPerPage);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="Filtrar por Nro. Ficha"
          value={searchByFile}
          onChange={(e) => setSearchByFile(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Input
          placeholder="Filtrar por Inscripción"
          value={searchByInscription}
          onChange={(e) => setSearchByInscription(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} className="flex items-center gap-2">
          <FiSearch /> Buscar
        </Button>
        <Button
          onClick={handleReset}
          className="flex items-center gap-2"
          variant="outline"
        >
          <RiResetRightFill /> Resetear
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>N° Ficha</TableHead>
              <TableHead>N° Inscripción</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Predio</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {Array.from({ length: 8 }).map((_, cellIdx) => (
                    <TableCell key={`skeleton-cell-${index}-${cellIdx}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {searchByFile || searchByInscription
                    ? "No se encontraron resultados"
                    : "No hay datos disponibles"}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.file_number || "N/A"}</TableCell>
                  <TableCell>{item.customer?.inscription || "N/A"}</TableCell>
                  <TableCell>{item.customer?.customer_name || "N/A"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {item.customer?.address || "N/A"}
                  </TableCell>
                  <TableCell>{item.property || "N/A"}</TableCell>
                  <TableCell>{item.technician?.name || "N/A"}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <ActionButtons
                      onEdit={() => onEdit(item)}
                      onDelete={item.id ? () => onDelete(item.id) : undefined}
                      editPermission="precatastral.update"
                      deletePermission="precatastral.delete"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, totalRows)} de {totalRows} registros
          </p>
          <Select
            value={rowsPerPage.toString()}
            onValueChange={handleRowsPerPageChange}
          >
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue placeholder={rowsPerPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            <FiChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center px-4">
            <span className="text-sm">
              Página {page} de {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            <FiChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}