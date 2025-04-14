"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RiResetRightFill } from "react-icons/ri";
import { ActionButtons } from "@/components/custom/ActionButtons";
import { ActData } from "@/types/types";

interface ApiResponse {
  data: ActData[];
  total: number;
}

interface Props {
  onEdit: (data: ActData) => void;
  onDelete: (id: number) => void;
  fetchData: (params: { page: number; limit: number; file?: string; inscription?: string }) => Promise<ApiResponse>;
  refreshTrigger: number;
}

export default function ActTable({ onEdit, onDelete, fetchData, refreshTrigger }: Props) {
  const [data, setData] = useState<ActData[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);

  // Estados para los filtros
  const [searchByFile, setSearchByFile] = useState("");
  const [searchByInscription, setSearchByInscription] = useState("");

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, [page, rowsPerPage, refreshTrigger]);
  
  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value));
    setPage(1);
  };

  const totalPages = Math.ceil(totalRows / rowsPerPage);

  // Función para resetear los filtros y la tabla
  const handleReset = async () => {
    setSearchByFile('');
    setSearchByInscription('');
    setLoading(true);
    try {
      const result = await fetchData({
        page,
        limit: rowsPerPage,
      });
      setData(result.data);
      setTotalRows(result.total);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-4">
      {/* Filtros integrados en la tabla */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="Filtrar por Nro. Ficha"
          value={searchByFile}
          onChange={(e) => setSearchByFile(e.target.value)}
        />
        <Input
          placeholder="Filtrar por Inscripción"
          value={searchByInscription}
          onChange={(e) => setSearchByInscription(e.target.value)}
        />
        <Button onClick={handleSearch} className="flex items-center gap-2">
          <FiSearch /> Buscar
        </Button>
        <Button onClick={handleReset} className="flex items-center gap-2">
          <RiResetRightFill /> Resetear
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>N° Ficha</TableHead>
              <TableHead>N° Inscripción</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>N° Ficha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Nro Medidor</TableHead>
              <TableHead>Certificación</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {Array.from({ length: 9 }).map((_, cellIdx) => (
                    <TableCell key={`skeleton-cell-${index}-${cellIdx}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  {searchByFile || searchByInscription
                    ? "No se encontraron resultados"
                    : "No hay datos disponibles"}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">{item.id}</TableCell>
                  <TableCell className="text-sm">{item.file_number}</TableCell>
                  <TableCell className="text-sm">{item.customer.inscription}</TableCell>
                  <TableCell className="text-sm">{item.file_date}</TableCell>
                  <TableCell className="text-sm">{item.customer.customer_name}</TableCell>
                  <TableCell className="max-w-[150px] text-sm">
                    {item.customer.address}
                  </TableCell>
                  <TableCell className="text-sm">{item.meter.meter_number}</TableCell>
                  <TableCell className="text-sm">{item.meter.verification_code}</TableCell>
                  <TableCell className="text-sm">{item.technician.name}</TableCell>
                  <TableCell className="flex justify-end gap-2 text-sm">
                    <ActionButtons
                      onEdit={() => onEdit(item)}
                      onDelete={item.id ? () => onDelete(item.id) : undefined}
                      editPermission="acts.update"
                      deletePermission="acts.delete"
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
            <SelectTrigger className="h-8 w-[70px]">
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