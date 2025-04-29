"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FiX, FiSave, FiPlus, FiTrash2, FiLoader } from "react-icons/fi";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LotData } from "@/types/types";
import { useSession } from "next-auth/react";

// Schema de validación
const boxSchema = z.object({
    lotId: z.string().min(1, "Debe seleccionar un lote"),
    name: z.string()
        .min(1, "El nombre es requerido")
        .max(50, "El nombre no puede exceder 50 caracteres"),
    meter_number: z.string().optional(),
    meter_reading: z.string().optional(),
});

type BoxForm = z.infer<typeof boxSchema> & {
    id?: number;
    meters?: MeterItem[];
};

type MeterItem = {
    old_meter: string;
    reading: string;
};

const DEFAULT_VALUES: BoxForm = {
    lotId: "",
    name: "",
    meter_number: "",
    meter_reading: "",
    meters: []
};

export default function LabeledDialog({
    open,
    onClose,
    editData,
    refreshTable
}: {
    open: boolean;
    onClose: () => void;
    editData: BoxForm | null;
    refreshTable: () => void;
}) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        control,
        setError,
        clearErrors,
        formState: { errors, isValid }
    } = useForm<BoxForm>({
        resolver: zodResolver(boxSchema),
        mode: "onChange",
        defaultValues: DEFAULT_VALUES
    });

    const { data: session } = useSession();
    const [meterItems, setMeterItems] = useState<MeterItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lots, setLots] = useState<LotData[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info') => {
        Swal.fire({
            title,
            text,
            icon,
            timer: 2500,
            showConfirmButton: false,
            customClass: {
                container: 'swal2-container-custom !z-[99999]',
                popup: '!z-[99999]',
            },
        });
    };

    // Agregar medidor a la lista
    const addMeterItem = () => {
        const meterNumber = watch("meter_number")?.trim();
        const meterReading = watch("meter_reading")?.trim();

        // Validaciones
        if (!meterNumber || !meterReading) {
            if (!meterNumber) {
                setError("meter_number", {
                    type: "required",
                    message: "Número de medidor requerido"
                });
            }
            if (!meterReading) {
                setError("meter_reading", {
                    type: "required",
                    message: "Lectura requerida"
                });
            }
            return;
        }

        // Verificar duplicados
        if (meterItems.some(item => item.old_meter === meterNumber)) {
            setError("meter_number", {
                type: "duplicate",
                message: "Este medidor ya existe"
            });
            return;
        }

        // Agregar a la lista
        setMeterItems(prev => [...prev, {
            old_meter: meterNumber,
            reading: meterReading
        }]);

        // Limpiar campos
        setValue("meter_number", "");
        setValue("meter_reading", "");
        clearErrors(["meter_number", "meter_reading"]);
    };

    // Eliminar medidor de la lista
    const removeMeterItem = (meterNumber: string) => {
        setMeterItems(prev => prev.filter(item => item.old_meter !== meterNumber));
    };

    // Obtener lista de lotes
    const fetchLots = async () => {
        try {
            const response = await fetch("/api/lot/listlots");
            if (!response.ok) throw new Error("Error al obtener lotes");
            const data = await response.json();
            setLots(data.data);
        } catch (error) {
            console.error("Error fetching lots:", error);
            showAlert("Error", "No se pudieron cargar los lotes", "error");
        }
    };

    // Obtener datos de caja para edición
    const fetchLabeledData = async (id: number) => {
        try {
            const response = await fetch(`/api/labeled/getlabeled?id=${id}`);
            if (!response.ok) throw new Error("Error al obtener datos");

            const result = await response.json();
            if (result.data) {
                reset({
                    lotId: result.data.lot.id.toString() || "",
                    name: result.data.name,
                    meter_number: "",
                    meter_reading: ""
                });
                setMeterItems(result.data.meters || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            showAlert("Error", "No se pudieron cargar los datos", "error");
        }
    };

    // Guardar o actualizar caja
    const handleSave = async (data: BoxForm) => {
        if (meterItems.length === 0) {
            showAlert("Error", "Debe agregar al menos un medidor", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                id: editData?.id,
                lotId: data.lotId,
                name: data.name.trim(),
                meters: meterItems
            };

            const endpoint = editData?.id
                ? `/api/labeled/updatelabeled`
                : '/api/labeled/newlabeled';
            const method = editData?.id ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al guardar");
            }

            showAlert(
                "Éxito",
                editData?.id ? "Caja actualizada" : "Caja creada",
                "success"
            );

            refreshTable();
            handleClose();
        } catch (error: any) {
            console.error("Error:", error);
            showAlert("Error", error.message || "Error al procesar", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cerrar diálogo y resetear
    const handleClose = () => {
        reset(DEFAULT_VALUES);
        setMeterItems([]);
        onClose();
    };

    // Efectos iniciales
    useEffect(() => {
        if (open) {
            if (editData?.id) {
                fetchLabeledData(editData.id);
            } else {
                reset(DEFAULT_VALUES);
                setMeterItems([]);
                // Si el lote está disponible en la sesión y no estamos editando
                if (session?.user?.lot?.id) {
                    setValue("lotId", session.user.lot.id.toString());
                }
            }
        }
        fetchLots();
    }, [open, editData, reset]);

    return (
        <Dialog open={open} maxWidth="sm" fullWidth>
            <DialogTitle className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
                {editData ? "✏️ Editar Caja" : "➕ Nueva Caja"}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit(handleSave)}>
                <DialogContent dividers className="bg-gray-50 dark:bg-gray-900 dark:text-white space-y-5" sx={{ maxHeight: "90vh", overflowY: "auto" }}>
                    {/* Campos principales */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Nombre */}
                        <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="name" className="text-sm font-medium">
                                Nombre de la caja *
                            </Label>
                            <Input
                                id="name"
                                {...register("name")}
                                className={`${errors.name ? "border-red-500" : ""}`}
                                placeholder="Ej: Caja Principal"
                                disabled={isSubmitting}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Lote */}
                        <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="lotId" className="text-sm font-medium">
                                Lote *
                            </Label>
                            <Controller
                                name="lotId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger className={`w-full ${errors.lotId ? "border-red-500" : ""}`}>
                                            <SelectValue placeholder="Seleccione lote" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {lots.map((lot) => (
                                                <SelectItem
                                                    key={lot.id}
                                                    value={lot.id.toString()}
                                                    className="capitalize"
                                                >
                                                    {lot.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.lotId && (
                                <p className="text-sm text-red-500 mt-1">{errors.lotId.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Agregar medidores */}
                    <div className="p-4 rounded-lg border">
                        <h3 className="font-medium mb-4">
                            Agregar Medidores
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Número de medidor */}
                            <div className="space-y-2">
                                <Label htmlFor="meter_number">
                                    N° de Medidor *
                                </Label>
                                <Input
                                    id="meter_number"
                                    {...register("meter_number")}
                                    className={errors.meter_number ? "border-red-500" : ""}
                                    placeholder="Ej: 12345678"
                                    disabled={isSubmitting}
                                />
                                {errors.meter_number && (
                                    <p className="text-sm text-red-500">{errors.meter_number.message}</p>
                                )}
                            </div>

                            {/* Lectura */}
                            <div className="space-y-2">
                                <Label htmlFor="meter_reading">
                                    Lectura *
                                </Label>
                                <Input
                                    id="meter_reading"
                                    {...register("meter_reading")}
                                    className={errors.meter_reading ? "border-red-500" : ""}
                                    placeholder="Ej: 12345"
                                    disabled={isSubmitting}
                                />
                                {errors.meter_reading && (
                                    <p className="text-sm text-red-500">{errors.meter_reading.message}</p>
                                )}
                            </div>

                            {/* Botón agregar */}
                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    onClick={addMeterItem}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    disabled={isSubmitting || !watch("meter_number") || !watch("meter_reading")}
                                >
                                    <FiPlus className="mr-2" />
                                    Agregar
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de medidores */}
                    {meterItems.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <ScrollArea className="h-[200px]">
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead className="w-[150px]">Medidor</TableHead>
                                            <TableHead>Lectura</TableHead>
                                            <TableHead className="w-[100px] text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {meterItems.map((item) => (
                                            <TableRow key={item.old_meter}>
                                                <TableCell className="font-medium">{item.old_meter}</TableCell>
                                                <TableCell>{item.reading}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeMeterItem(item.old_meter)}
                                                        className="text-red-600 hover:text-red-800"
                                                        disabled={isSubmitting}
                                                    >
                                                        <FiTrash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}
                </DialogContent>

                <DialogActions className="sticky bottom-0 bg-gray-100 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            type="button"
                            className="w-full sm:w-auto border-gray-300 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            <FiX className="mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isLoading || isSubmitting}
                        >
                            {isLoading || isSubmitting ? (
                                <FiLoader className="mr-2 animate-spin" />
                            ) : (
                                <FiSave className="mr-2" />
                            )}
                            {isLoading || isSubmitting ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </DialogActions>
            </form>
        </Dialog>
    );
}