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

// Enhanced schema validation
const boxSchema = z.object({
    name_box: z.string().min(1, "El nombre de la caja es requerido"),
    meter_number: z.string().optional(),
    meter_reading: z.string().optional(),
});

type BoxForm = z.infer<typeof boxSchema> & { id?: number };

type MeterItem = {
    id: string;
    meter_number: string;
    meter_reading: string;
};

const DEFAULT_VALUES: Partial<BoxForm> = {
    name_box: "",
    meter_number: "",
    meter_reading: ""
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
        handleSubmit: formHandleSubmit,
        watch,
        setValue,
        reset,
        clearErrors,
        formState: { errors, isSubmitting }
    } = useForm<BoxForm>({
        resolver: zodResolver(boxSchema),
        mode: "onChange",
        defaultValues: DEFAULT_VALUES
    });

    const [loading, setLoading] = useState({ save: false });
    const [meterItems, setMeterItems] = useState<MeterItem[]>([]);
    const [nextId, setNextId] = useState(1);

    const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info') => {
        Swal.fire({
            title,
            text,
            icon,
            timer: 2000,
            showConfirmButton: false,
            customClass: {
                container: 'swal2-container-custom !z-[99999]',
                popup: '!z-[99999]',
            },
        });
    };

    const addMeterItem = () => {
        const meterNumber = watch("meter_number");
        const meterReading = watch("meter_reading");

        if (!meterNumber || !meterReading) {
            showAlert("Error", "Por favor complete ambos campos del medidor", "error");
            return;
        }

        const newItem: MeterItem = {
            id: `item-${nextId}`,
            meter_number: meterNumber,
            meter_reading: meterReading
        };

        setMeterItems([...meterItems, newItem]);
        setNextId(nextId + 1);

        // Clear the input fields
        setValue("meter_number", "");
        setValue("meter_reading", "");
    };

    const removeMeterItem = (id: string) => {
        setMeterItems(meterItems.filter(item => item.id !== id));
    };

    const handleSave = async (data: BoxForm) => {
        setLoading({ save: true });

        try {
            // 1. Verify user session
            const sessionResponse = await fetch("/api/auth/session");
            if (!sessionResponse.ok) {
                throw new Error("Error al obtener la sesión del usuario");
            }

            const session = await sessionResponse.json();
            const userId = Number(session.user?.id);

            if (!userId) {
                showAlert(
                    "Error de autenticación",
                    "No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.",
                    "error"
                );
                return;
            }

            // 2. Prepare payload with meter items
            const payload = {
                name_box: data.name_box,
                meters: meterItems,
                [editData?.id ? "updated_by" : "created_by"]: userId,
            };

            // 3. Determine endpoint and method
            const apiEndpoint = editData
                ? `/api/box/updatebox?id=${editData.id}`
                : "/api/box/newbox";
            const method = editData ? "PUT" : "POST";

            // 4. Send request
            const response = await fetch(apiEndpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result?.error) {
                showAlert("Error", result.error || "Algo salió mal al guardar.", "error");
                return;
            } else {
                showAlert(
                    "¡Guardado exitosamente!",
                    editData?.id
                        ? "La caja fue actualizada correctamente."
                        : "La caja fue creada correctamente.",
                    "success"
                );

                refreshTable();
                if (!editData?.id) {
                    clearFields();
                }
                onClose();
            }
        } catch (error: any) {
            console.error("Error al guardar:", error);
            showAlert(
                "Error",
                error.message || "Ocurrió un error inesperado. Intenta nuevamente.",
                "error"
            );
        } finally {
            setLoading({ save: false });
        }
    };

    const clearFields = () => {
        reset(DEFAULT_VALUES);
        setMeterItems([]);
        setNextId(1);
    };

    useEffect(() => {
        if (open) {
            if (editData?.id) {
                // If editing, load the existing data
                reset({
                    name_box: editData.name_box || ""
                });
                // Here you would also load any existing meter items for this box
                // setMeterItems(editData.meters || []);
            } else {
                clearFields();
            }
        }
    }, [open, editData]);

    return (
        <Dialog
            open={open}
            maxWidth="md"
            fullWidth
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    overflow: 'hidden'
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
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </div>
            </DialogTitle>

            <form onSubmit={formHandleSubmit(handleSave)}>
                <DialogContent dividers className="bg-gray-50 dark:bg-gray-900 p-6 space-y-6">
                    {/* Box Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="name_box" className="text-gray-700 dark:text-gray-300">
                            Nombre de la caja *
                        </Label>
                        <Input
                            id="name_box"
                            {...register("name_box")}
                            className={`mt-1 ${errors.name_box ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
                            placeholder="Ej: Caja Principal"
                        />
                        {errors.name_box && (
                            <p className="text-sm text-red-500 mt-1">{errors.name_box.message}</p>
                        )}
                    </div>

                    {/* Meter Input Fields */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4">
                            Agregar Medidores
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="meter_number" className="text-gray-700 dark:text-gray-300">
                                    N° de Medidor
                                </Label>
                                <Input
                                    id="meter_number"
                                    {...register("meter_number")}
                                    className="focus:ring-blue-500"
                                    placeholder="Ej: 12345678"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="meter_reading" className="text-gray-700 dark:text-gray-300">
                                    Lectura
                                </Label>
                                <Input
                                    id="meter_reading"
                                    {...register("meter_reading")}
                                    className="focus:ring-blue-500"
                                    placeholder="Ej: 12345"
                                />
                            </div>

                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    onClick={addMeterItem}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    <FiPlus className="mr-2" />
                                    Agregar
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Meters Table */}
                    {meterItems.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-100 dark:bg-gray-800">
                                    <TableRow>
                                        <TableHead className="text-gray-700 dark:text-gray-300">N° de Medidor</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-300">Lectura</TableHead>
                                        <TableHead className="text-right text-gray-700 dark:text-gray-300">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {meterItems.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                                {item.meter_number}
                                            </TableCell>
                                            <TableCell>{item.meter_reading}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeMeterItem(item.id)}
                                                    className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                                                >
                                                    <FiTrash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>

                <DialogActions className="sticky bottom-0 bg-gray-100 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        type="button"
                        className="border-gray-300 hover:bg-gray-200 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                    >
                        <FiX className="mr-2" />
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={loading.save || isSubmitting}
                    >
                        {loading.save || isSubmitting ? (
                            <FiLoader className="mr-2 animate-spin" />
                        ) : (
                            <FiSave className="mr-2" />
                        )}
                        {loading.save || isSubmitting ? "Guardando..." : "Guardar"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}