"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleData } from "@/types/types";
import { ActionButtons } from "@/components/custom/ActionButtons";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApiResponse {
    data: RoleData[];
    total: number;
}

interface Props {
    onEdit: (data: RoleData) => void;
    onDelete: (id: number) => void;
    fetchData: (params: { page: number; limit: number }) => Promise<ApiResponse>;
    refreshTrigger: number;
}

export default function RoleTable({ onEdit, onDelete, fetchData, refreshTrigger }: Props) {
    const [data, setData] = useState<RoleData[]>([]);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await fetchData({
                page,
                limit: rowsPerPage
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

    const handleRowsPerPageChange = (value: string) => {
        setRowsPerPage(Number(value));
        setPage(1);
    };

    const totalPages = Math.ceil(totalRows / rowsPerPage);

    return (
        <div className="space-y-4">
            <div className="rounded-md border relative">
                <ScrollArea className="h-[calc(100vh-320px)] w-full overflow-auto rounded-md border">
                    <Table className="table-auto w-full">
                        <TableHeader className="sticky top-0 bg-background z-10 shadow-md">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="px-4 py-2">#</TableHead>
                                <TableHead className="px-4 py-2">Nombre del rol</TableHead>
                                <TableHead className="px-4 py-2">Descripción</TableHead>
                                <TableHead className="px-4 py-2 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={`skeleton-${index}`}>
                                        {Array.from({ length: 5 }).map((_, cellIdx) => (
                                            <TableCell key={`skeleton-cell-${index}-${cellIdx}`}>
                                                <Skeleton className="h-4 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        No hay datos disponibles
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted">
                                        <TableCell className="px-4 py-2 font-medium">{item.id}</TableCell>
                                        <TableCell className="px-4 py-2">{item.name || "N/A"}</TableCell>
                                        <TableCell className="px-4 py-2">{item.description || "N/A"}</TableCell>
                                        <TableCell className="px-4 py-2 flex justify-end gap-2">
                                            <ActionButtons
                                                onEdit={() => onEdit(item)}
                                                onDelete={item.id ? () => onDelete(item.id) : undefined}
                                                editPermission="roles.update"
                                                deletePermission="roles.delete"
                                            />
                                        </TableCell>
                                    </TableRow>
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