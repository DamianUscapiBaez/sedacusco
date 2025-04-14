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
import PasswordInput from "@/components/custom/password";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FiX, FiSave, FiLoader } from "react-icons/fi";
import { useEffect, useState } from "react";
import { RoleData } from "@/types/types";



const TechnicianSchema = z.object({
    dni: z.string().min(1, "Dni requerido"),
    name: z.string().min(1, "Nombre de usuario requerido")
});

type TechnicianForm = z.infer<typeof TechnicianSchema> & { id?: number };

export default function TechnicianDialog({ open, onClose, editData, onSubmit }: {
    open: boolean;
    onClose: () => void;
    editData: TechnicianForm | null;
    onSubmit: (data: TechnicianForm) => void;
}) {
    const { register, handleSubmit, watch, setValue, control, reset, formState: { errors, isSubmitting } } = useForm<TechnicianForm>({
        resolver: zodResolver(TechnicianSchema),
        mode: "onChange"
    });
    const [loading, setLoading] = useState({ save: false });
    const fetchGetTechnician = async (id: number) => {
        try {
            const response = await fetch(`/api/technician/gettechnician?id=${id}`);
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
                    fetchGetTechnician(editData.id);
                }
            } else {
                reset({
                    dni: "",
                    name: ""
                });
            }
        }
    }, [open, editData, reset]);

    const handleFormSubmit = async (data: TechnicianForm) => {
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
                {editData ? "✏️ Editar Tecnico" : "➕ Nuevo Tecnico"}
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
                            <Label htmlFor="dni">DNI *</Label>
                            <Input
                                id="dni"
                                {...register("dni")}
                                className={`mt-2 ${errors.dni ? "border-red-500" : ""}`}
                            />
                            {errors.dni && (
                                <p className="text-xs text-red-500">{errors.dni.message}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="name">Nombre de Tecnico *</Label>
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