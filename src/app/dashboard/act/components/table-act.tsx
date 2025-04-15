"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiChevronLeft, FiChevronRight, FiSearch, FiChevronDown, FiChevronUp } from "react-icons/fi";
import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RiResetRightFill } from "react-icons/ri";
import { ActionButtons } from "@/components/custom/ActionButtons";
import { ActData } from "@/types/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UserIcon } from "lucide-react";

interface ApiResponse {
  data: ActData[];
  total: number;
}

interface Props {
  onEdit: (data: ActData) => void;
  onDelete: (id: number) => void;
  fetchData: (params: { page: number; limit: number; file?: string; inscription?: string; meter?: string }) => Promise<ApiResponse>;
  refreshTrigger: number;
}

export default function ActTable({ onEdit, onDelete, fetchData, refreshTrigger }: Props) {
  const [data, setData] = useState<ActData[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  // Estados para los filtros
  const [searchByFile, setSearchByFile] = useState("");
  const [searchByInscription, setSearchByInscription] = useState("");
  const [searchByMeter, setSearchByMeter] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchData({
        page,
        limit: rowsPerPage,
        file: searchByFile,
        inscription: searchByInscription,
        meter: searchByMeter,
      });
      setData(result.data);
      setTotalRows(result.total);
      setExpandedRows([]); // Reset expanded rows when data changes
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

  const toggleRowExpand = (id: number) => {
    setExpandedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const totalPages = Math.ceil(totalRows / rowsPerPage);

  const handleReset = async () => {
    setSearchByFile('');
    setSearchByInscription('');
    setPage(1);
    await loadData();
  };

  return (
    <div className="space-y-4">
      {/* Filtros responsive con botones compactos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Inputs - ocuparán 1 columna en móvil, se ajustan en pantallas más grandes */}
        <div className="col-span-2 sm:col-span-1">
          <Input
            placeholder="Nro. Ficha"
            value={searchByFile}
            onChange={(e) => setSearchByFile(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Input
            placeholder="Inscripción"
            value={searchByInscription}
            onChange={(e) => setSearchByInscription(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Input
            placeholder="Medidor"
            value={searchByMeter}
            onChange={(e) => setSearchByMeter(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Botones - se ajustan según el tamaño de pantalla */}
        <Button
          onClick={handleSearch}
          size="sm"
          className="h-8 col-span-1"
        >
          <div className="flex items-center gap-1">
            <FiSearch className="h-3 w-3" />
            <span className="hidden sm:inline text-sm">Buscar</span>
          </div>
        </Button>

        <Button
          onClick={handleReset}
          size="sm"
          className="h-8 col-span-1"
          variant="outline"
        >
          <div className="flex items-center gap-1">
            <RiResetRightFill className="h-3 w-3" />
            <span className="hidden sm:inline text-sm">Resetear</span>
          </div>
        </Button>
      </div>
      {/* Tabla con scroll horizontal y cabecera fija */}
      <div className="rounded-md border relative">
        <ScrollArea className="h-[calc(100vh-370px)] w-full">
          <Table className="table-fixed w-full">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-20">N° Ficha</TableHead>
                <TableHead className="w-24">Inscripción</TableHead>
                <TableHead className="w-24">Fecha</TableHead>
                <TableHead className="min-w-32">Usuario</TableHead>
                <TableHead className="w-24">Nro Medidor</TableHead>
                <TableHead className="w-32">Certificación</TableHead>
                <TableHead className="min-w-32">Técnico</TableHead>
                <TableHead className="w-32 text-right">Acciones</TableHead>
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
                  <React.Fragment key={item.id}>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="p-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleRowExpand(item.id)}
                        >
                          {expandedRows.includes(item.id) ?
                            <FiChevronUp className="h-4 w-4" /> :
                            <FiChevronDown className="h-4 w-4" />
                          }
                        </Button>
                      </TableCell>
                      <TableCell className="py-1 truncate text-xs">{item.file_number}</TableCell>
                      <TableCell className="py-1 truncate text-xs">{item.customer.inscription}</TableCell>
                      <TableCell className="py-1 truncate text-xs">{item.file_date}</TableCell>
                      <TableCell className="py-1 truncate text-xs">{item.customer.customer_name}</TableCell>
                      <TableCell className="py-1 truncate text-xs">{item.meter.meter_number}</TableCell>
                      <TableCell className="py-1 truncate text-xs">{item.meter.verification_code}</TableCell>
                      <TableCell className="py-1 truncate text-xs">{item.technician.name}</TableCell>
                      <TableCell className="py-1 flex justify-end gap-1">
                        <ActionButtons
                          onEdit={() => onEdit(item)}
                          onDelete={item.id ? () => onDelete(item.id) : undefined}
                          editPermission="acts.update"
                          deletePermission="acts.delete"
                        />
                      </TableCell>
                    </TableRow>
                    {expandedRows.includes(item.id) && (
                      <TableRow className="bg-muted/10 hover:bg-muted/20 transition-colors">
                        <TableCell colSpan={9} className="p-0">
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-xs">
                            {/* Información del Cliente */}
                            <div className="space-y-2 col-span-1 md:col-span-2">
                              <h4 className="font-medium text-xs mb-3 pb-2 border-b border-muted-foreground/20">Información del Cliente</h4>
                              <div className="grid grid-cols-5 gap-1">
                                <span className="text-muted-foreground col-span-2">Dirección:</span>
                                <span className="font-medium col-span-3 whitespace-pre-wrap break-words" title={item.customer.address}>
                                  {item.customer.address}
                                </span>
                                <span className="text-muted-foreground col-span-2">Medidor Antiguo:</span>
                                <span className="font-medium col-span-3">{item.customer.old_meter}</span>
                                <span className="text-muted-foreground col-span-2">Lectura:</span>
                                <span className="font-medium col-span-3">{item.reading}</span>
                              </div>
                            </div>
                            {/* Detalles del Medidor */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-xs mb-3 pb-2 border-b border-muted-foreground/20">Detalles del Medidor</h4>
                              <div className="grid grid-cols-5 gap-1">
                                <span className="text-muted-foreground col-span-2">Número:</span>
                                <span className="font-medium col-span-3">{item.meter.meter_number}</span>

                                <span className="text-muted-foreground col-span-2">Código:</span>
                                <span className="font-medium col-span-3">{item.meter.verification_code}</span>
                              </div>
                            </div>
                            {/* Historial */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-xs mb-3 pb-2 border-b border-muted-foreground/20">Historial</h4>
                              {item.histories && item.histories.length > 0 ? (
                                <div className="space-y-4">
                                  {/* Creación */}
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">Creación</span>
                                      <span className="text-muted-foreground">
                                        {item.histories.find(h => h.action === "CREATE")?.updated_at
                                          ? new Date(item.histories.find(h => h.action === "CREATE")?.updated_at ?? "").toLocaleDateString('es-PE', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                          })
                                          : "N/A"}
                                      </span>
                                    </div>
                                    <p className="font-medium flex items-center gap-1">
                                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                                      {item.histories.find(h => h.action === "CREATE")?.user?.names || "N/A"}
                                    </p>
                                  </div>

                                  {/* Actualización (si existe) */}
                                  {item.histories.some(h => h.action === "UPDATE") && (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Actualización</span>
                                        <span className="text-muted-foreground">
                                          {item.histories.find(h => h.action === "UPDATE")?.updated_at
                                            ? new Date(item.histories.find(h => h.action === "UPDATE")?.updated_at ?? "").toLocaleDateString('es-PE', {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric'
                                            })
                                            : "N/A"}
                                        </span>
                                      </div>
                                      <p className="font-medium flex items-center gap-1">
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                        {item.histories.findLast(h => h.action === "UPDATE")?.user?.names || "N/A"}
                                      </p>
                                      {item.histories.findLast(h => h.action === "UPDATE")?.details && (
                                        <div className="bg-muted/30 p-2 rounded mt-1">
                                          <p className="text-muted-foreground font-medium">Detalles:</p>
                                          <p className="whitespace-pre-wrap">{item.histories.findLast(h => h.action === "UPDATE")?.details}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-muted-foreground italic">No hay registros de historial</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
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