"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiChevronLeft, FiChevronRight, FiSearch, FiChevronDown, FiChevronUp } from "react-icons/fi";
import React, { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RiResetRightFill } from "react-icons/ri";
import { ActionButtons } from "@/components/custom/ActionButtons";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { LabeledData } from "@/types/types";

interface ApiResponse {
  data: LabeledData[];
  total: number;
}

interface FetchDataParams {
  page: number;
  limit: number;
  box?: string;
  meter?: string;
}



interface LabeledTableProps {
  onEdit: (data: LabeledData) => void;
  onDelete: (id: number) => void;
  fetchData: (params: FetchDataParams) => Promise<ApiResponse>;
}

export default function LabeledTable({ onEdit, onDelete, fetchData }: LabeledTableProps) {
  // Estados principales
  const [data, setData] = useState<LabeledData[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  // Estados de búsqueda
  const [searchValues, setSearchValues] = useState({
    box: "",
    meter: ""
  });
  const [appliedFilters, setAppliedFilters] = useState({
    box: "",
    meter: ""
  });

  // Carga de datos con memoización
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchData({
        page,
        limit: rowsPerPage,
        ...(appliedFilters.box && { box: appliedFilters.box }),
        ...(appliedFilters.meter && { meter: appliedFilters.meter })
      });
      setData(result.data);
      setTotalRows(result.total);
      setExpandedRows([]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, appliedFilters, fetchData]);

  // Efecto para cargar datos cuando cambian las dependencias
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manejadores de eventos
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters(searchValues);
    setPage(1); // Resetear a primera página al buscar
  };

  const handleReset = () => {
    setSearchValues({ box: "", meter: "" });
    setAppliedFilters({ box: "", meter: "" });
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleRowExpand = (id: number) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value));
    setPage(1);
  };

  // Cálculos
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Input
          name="box"
          placeholder="Buscar caja..."
          value={searchValues.box}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          className="h-8 text-sm flex-1 min-w-[150px]"
        />
        <Input
          name="meter"
          placeholder="Buscar medidor..."
          value={searchValues.meter}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          className="h-8 text-sm flex-1 min-w-[150px]"
        />
        <Button
          onClick={handleSearch}
          size="sm"
          className="h-8"
          disabled={loading}
        >
          <FiSearch className="h-3 w-3 mr-1" />
          Buscar
        </Button>
        <Button
          onClick={handleReset}
          size="sm"
          className="h-8"
          variant="outline"
          disabled={(!searchValues.box && !searchValues.meter) || loading}
        >
          <RiResetRightFill className="h-3 w-3 mr-1" />
          Resetear
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-md border relative">
        <ScrollArea className="h-[calc(100vh-380px)] w-full overflow-auto">
          <Table className="table-fixed w-full">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>Nombre Caja</TableHead>
                <TableHead>Cant. Medidores</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {Array.from({ length: 6 }).map((_, cellIdx) => (
                      <TableCell key={`skeleton-cell-${index}-${cellIdx}`}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {appliedFilters.box || appliedFilters.meter
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
                          {expandedRows.includes(item.id) ? (
                            <FiChevronUp className="h-4 w-4" />
                          ) : (
                            <FiChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="py-1 text-xs">{item.id}</TableCell>
                      <TableCell className="py-1 text-xs">{item.name}</TableCell>
                      <TableCell className="py-1 text-xs">{item.meters?.length || 0}</TableCell>
                      <TableCell className="py-1 text-xs">{item.lot.name}</TableCell>
                      <TableCell className="py-1 text-xs">{item.createdAt}</TableCell>
                      <TableCell className="py-1 flex justify-end gap-1">
                        <ActionButtons
                          onEdit={() => onEdit(item)}
                          onDelete={() => onDelete(item.id)}
                          editPermission="labeled.update"
                          deletePermission="labeled.delete"
                        />
                      </TableCell>
                    </TableRow>
                    {expandedRows.includes(item.id) && (
                      <TableRow className="bg-muted/5">
                        <TableCell colSpan={6} className="p-0">
                          <div className="px-3 py-2 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                              </svg>
                              <span>Medidores ({item?.meters?.length || 0})</span>
                            </div>
                            {item?.meters && item.meters.length > 0 ? (
                              <ScrollArea className="w-full">
                                <div className="flex gap-2 py-1">
                                  {item.meters.map((meter) => (
                                    <div
                                      key={meter.id}
                                      className="min-w-[180px] border rounded-md p-2 bg-background hover:bg-muted/50 transition-colors"
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium">#{meter.id}</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                                        <span className="text-muted-foreground">Antiguo:</span>
                                        <span>{meter.old_meter || '-'}</span>
                                        <span className="text-muted-foreground">Lectura:</span>
                                        <span className={meter.reading === 'ILEGIBLE' ? 'text-orange-500' : 'text-green-600'}>
                                          {meter.reading}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <ScrollBar orientation="horizontal" />
                              </ScrollArea>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="8" x2="12" y2="12"></line>
                                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                No hay medidores registrados
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
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
              <SelectValue placeholder={rowsPerPage.toString()} />
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