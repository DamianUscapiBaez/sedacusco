"use client";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FiX, FiSave, FiLoader } from "react-icons/fi";
import { useEffect, useState } from "react";

const LotSchema = z.object({
    name: z.string().min(1, "Nombre del lote es requerido"),
    start_date: z.string(),
    end_date: z.string(),
    status: z.enum(["ACTIVE", "INACTIVE"])
});

type LotForm = z.infer<typeof LotSchema> & { id?: number };

const DEFAULT_VALUES: Partial<LotForm> = {
    name: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    status: "ACTIVE"
}

export default function LotDialog({ open, onClose, editData, onSubmit }: {
    open: boolean;
    onClose: () => void;
    editData: LotForm | null;
    onSubmit: (data: LotForm) => void;
}) {
    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<LotForm>({
        resolver: zodResolver(LotSchema),
        mode: "onChange",
        defaultValues: DEFAULT_VALUES
    });

    const [loading, setLoading] = useState({ save: false });

    const fetchGetLot = async (id: number) => {
        try {
            const response = await fetch(`/api/lot/getlot?id=${id}`);
            const result = await response.json();
            reset(result.data);
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    }

    useEffect(() => {
        if (open) {
            if (editData) {
                if (editData?.id) {
                    fetchGetLot(editData.id);
                }
            } else {
                reset(DEFAULT_VALUES);
            }
        }
    }, [open, editData, reset]);

    const handleFormSubmit = async (data: LotForm) => {
        setLoading({ ...loading, save: true });
        try {
            await onSubmit(data);
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setLoading({ ...loading, save: false });
        }
    };

    return (
        <Dialog open={open} maxWidth="xs" fullWidth onClose={onClose}>
            <DialogTitle className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
                {editData ? "✏️ Editar Lote" : "➕ Nuevo Lote"}
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
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <DialogContent dividers className="bg-gray-50 dark:bg-gray-900 dark:text-white space-y-5" sx={{ maxHeight: "90vh", overflowY: "auto" }}>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="name">Nombre del lote *</Label>
                            <Input
                                id="name"
                                {...register("name")}
                                className={`mt-2 ${errors.name ? "border-red-500" : ""}`}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500">{errors.name.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="start_date">Fecha Inicial *</Label>
                            <Input
                                id="start_date"
                                {...register("start_date")}
                                type="date"
                                className={`mt-2 ${errors.start_date ? "border-red-500" : ""}`}
                            />
                            {errors.start_date && (
                                <p className="text-xs text-red-500">{errors.start_date.message}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="end_date">Fecha Final *</Label>
                            <Input
                                id="end_date"
                                {...register("end_date")}
                                type="date"
                                className={`mt-2 ${errors.end_date ? "border-red-500" : ""}`}
                            />
                            {errors.end_date && (
                                <p className="text-xs text-red-500">{errors.end_date.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="status">Estado *</Label>
                        <Select
                            {...register("status")}
                            defaultValue={editData?.status || "ACTIVE"}
                            onValueChange={(value) => setValue("status", value as "ACTIVE" | "INACTIVE")}
                        >
                            <SelectTrigger className={`w-full mt-2 ${errors.status ? "border-red-500" : ""}`}>
                                <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACTIVE">Activo</SelectItem>
                                <SelectItem value="INACTIVE">Inactivo</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className="text-xs text-red-500">{errors.status.message}</p>
                        )}
                    </div>
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
                            disabled={loading.save || isSubmitting}
                        >
                            {loading.save || isSubmitting ? (
                                <FiLoader className="mr-2 animate-spin" />
                            ) : (
                                <FiSave className="mr-2" />
                            )}
                            {loading.save || isSubmitting ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </DialogActions>
            </form>
        </Dialog>
    );
}