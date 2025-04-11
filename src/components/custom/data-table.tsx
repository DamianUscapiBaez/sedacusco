import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import { Pagination } from "@mui/material"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[],
    data: TData[],
    searchparam: string,
    limit: number,
    setLimit: (lim: number) => void,
    setPage: (pag: number) => void
    page: number,
    totalPages: number,
}

export function DataTable<TData, TValue>({ data, columns, searchparam, setPage, limit, setLimit, page, totalPages }: DataTableProps<TData, TValue>) {

    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const table = useReactTable({
        data,
        columns,
        initialState: {
            pagination: {
                "pageIndex": page - 1, // Ajusta el índice de página a base 0
                "pageSize": limit
            }
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            columnFilters
        },
    })

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setPage(page);
    };

    React.useEffect(() => { }, [page, limit])
    return (
        <div className="w-full">
            <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-6 p-1">
                    <Label htmlFor="searchTable">
                        Buscar
                    </Label>
                    <Input
                        id="searchTable"
                        placeholder={`Buscar`}
                        value={(table.getColumn(searchparam)?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn(searchparam)?.setFilterValue(event.target.value)
                        }
                        className="w-full mt-2 py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="col-span-5"></div>
                <div className="col-span-12 md:col-span-1 p-1">
                    <p className='text-sm mb-2'>Filas</p>
                    <Select onValueChange={(e) => { setLimit(parseInt(e)); }} defaultValue={limit.toString()}>
                        <SelectTrigger className="w-full" >
                            <SelectValue placeholder="# filas" />
                        </SelectTrigger>
                        <SelectContent className="w-full" >
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="overflow-x-auto mt-2">
                <table className="w-full table-auto shadow-md rounded-md">
                    <thead className="bg-gray-100">
                        <tr>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <React.Fragment key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase border-b border-gray-200"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className={row.getIsSelected() ? "bg-blue-50" : ""}>
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm font-medium">
                                    sin resultados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                    Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </div>
                <div className="space-x-2">
                    <Pagination size="small" page={page} count={totalPages || 0} onChange={handlePageChange} />
                </div>
                <div className="text-sm text-gray-600">
                    Total registros {totalPages}
                </div>
            </div>
        </div>
    )
}