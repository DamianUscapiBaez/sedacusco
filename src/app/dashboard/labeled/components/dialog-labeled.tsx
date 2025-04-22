"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
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

// Schema validation mejorado con mensajes más descriptivos
const boxSchema = z.object({
    name: z.string().min(1, "El nombre de la caja es requerido").max(50, "El nombre no puede exceder los 50 caracteres"),
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
        setError,
        clearErrors,
        formState: { errors, isValid }
    } = useForm<BoxForm>({
        resolver: zodResolver(boxSchema),
        mode: "onChange",
        defaultValues: DEFAULT_VALUES
    });

    const [meterItems, setMeterItems] = useState<MeterItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info') => {
        Swal.fire({
            title,
            text,
            icon,
            timer: 2500,
            showConfirmButton: false,
        });
    };

    const addMeterItem = () => {
        const meterNumber = watch("meter_number")?.trim();
        const meterReading = watch("meter_reading")?.trim();

        // Limpiar errores previos
        setValue("meter_number", meterNumber || "");
        setValue("meter_reading", meterReading || "");

        // Validar campos
        let hasError = false;

        if (!meterNumber) {
            setError("meter_number", {
                type: "required",
                message: "El número de medidor es requerido"
            });
            hasError = true;
        }

        if (!meterReading) {
            setError("meter_reading", {
                type: "required",
                message: "La lectura es requerida"
            });
            hasError = true;
        }

        if (hasError) return;

        // Verificar duplicados
        const isDuplicate = meterItems.some(item => item.old_meter === meterNumber);
        if (isDuplicate) {
            setError("meter_number", {
                type: "duplicate",
                message: "Este medidor ya existe en la lista"
            });
            return;
        }

        // Agregar el medidor
        setMeterItems(prev => [...prev, {
            old_meter: meterNumber!,
            reading: meterReading!
        }]);

        // Limpiar campos
        setValue("meter_number", "");
        setValue("meter_reading", "");
        clearErrors(["meter_number", "meter_reading"]);
    };

    const removeMeterItem = (old_meter: string) => {
        setMeterItems(prev => prev.filter(item => item.old_meter !== old_meter));
    };

    const handleSave = async (data: BoxForm) => {
        if (meterItems.length === 0) {
            showAlert("Error", "Debe agregar al menos un medidor", "error");
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                name: data.name.trim(),
                meters: meterItems
            };

            const endpoint = editData?.id
                ? `/api/labeled/updatelabeled?id${editData.id}`
                : '/api/labeled/newlabeled';

            const method = editData?.id ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al procesar la solicitud");
            }

            showAlert(
                "Éxito",
                editData?.id ? "Caja actualizada correctamente" : "Caja creada correctamente",
                "success"
            );

            refreshTable();
            onClose();
            reset(DEFAULT_VALUES);
            setMeterItems([]);
        } catch (error: any) {
            console.error("Error:", error);
            showAlert("Error", error.message || "Ocurrió un error al guardar", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLabeledData = async (id: number) => {
        try {
            const response = await fetch(`/api/labeled/getlabeled?id=${id}`);
            if (!response.ok) throw new Error("Error al obtener datos");

            const result = await response.json();
            if (result.data) {
                reset({
                    name: result.data.name,
                    meter_number: "",
                    meter_reading: ""
                });
                setMeterItems(result.data.meters || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            showAlert("Error", "No se pudieron cargar los datos de la caja", "error");
        }
    };

    useEffect(() => {
        if (open) {
            if (editData?.id) {
                fetchLabeledData(editData.id);
            } else {
                reset(DEFAULT_VALUES);
                setMeterItems([]);
            }
        }
    }, [open, editData]);

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            onClose={onClose}
            slotProps={{
                paper: {
                    sx: { borderRadius: '12px', overflow: 'visible' }
                }
            }}
        >
            <DialogTitle className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-md">
                <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold">
                        {editData ? "✏️ Editar Caja" : "➕ Nueva Caja"}
                    </span>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </div>
            </DialogTitle>

            <form onSubmit={handleSubmit(handleSave)}>
                <DialogContent dividers className="bg-gray-50 dark:bg-gray-900 p-6 space-y-6">
                    {/* Nombre de la caja */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                            Nombre de la caja *
                        </Label>
                        <Input
                            id="name"
                            {...register("name")}
                            className={`text-gray-900 dark:text-gray-100 ${errors.name ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
                            placeholder="Ej: Caja Principal"
                            disabled={isLoading}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500 mt-2">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Agregar medidores */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4">
                            Agregar Medidores
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="meter_number" className="text-gray-700 dark:text-gray-300">
                                    N° de Medidor *
                                </Label>
                                <Input
                                    id="meter_number"
                                    {...register("meter_number")}
                                    className={errors.meter_number ? "border-red-500 focus:ring-red-500" : "mt-2 text-gray-900 dark:text-gray-100 focus:ring-blue-500"}
                                    placeholder="Ej: 12345678"
                                    disabled={isLoading}
                                />
                                {errors.meter_number && (
                                    <p className="text-sm text-red-500 mt-1">{errors.meter_number.message}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="meter_reading" className="text-gray-700 dark:text-gray-300">
                                    Lectura *
                                </Label>
                                <Input
                                    id="meter_reading"
                                    {...register("meter_reading")}
                                    className={errors.meter_reading ? "border-red-500 focus:ring-red-500" : "mt-2 text-gray-900 dark:text-gray-100 focus:ring-blue-500"}
                                    placeholder="Ej: 12345"
                                    disabled={isLoading}
                                />
                                {errors.meter_reading && (
                                    <p className="text-sm text-red-500 mt-1">{errors.meter_reading.message}</p>
                                )}
                            </div>

                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    onClick={addMeterItem}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    disabled={isLoading || !watch("meter_number") || !watch("meter_reading")}
                                >
                                    <FiPlus className="mr-2" />
                                    Agregar
                                </Button>
                            </div>
                        </div>
                    </div>
                    {/* Tabla de medidores */}
                    {meterItems.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <ScrollArea className="h-[200px]">
                                    <Table>
                                        <TableHeader className="bg-gray-100 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead className="w-[150px]">N° de Medidor</TableHead>
                                                <TableHead>Lectura</TableHead>
                                                <TableHead className="w-[100px] text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {meterItems.map((item) => (
                                                <TableRow key={item.old_meter}>
                                                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">{item.old_meter}</TableCell>
                                                    <TableCell className="text-gray-900 dark:text-gray-100">{item.reading}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeMeterItem(item.old_meter)}
                                                            className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                                                            disabled={isLoading}
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
                        </div>
                    )}
                </DialogContent>

                <DialogActions className="bg-gray-100 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        type="button"
                        disabled={isLoading}
                    >
                        <FiX className="mr-2" />
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || !isValid || meterItems.length === 0}
                    >
                        {isLoading ? (
                            <FiLoader className="mr-2 animate-spin" />
                        ) : (
                            <FiSave className="mr-2" />
                        )}
                        {isLoading ? "Guardando..." : "Guardar"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}