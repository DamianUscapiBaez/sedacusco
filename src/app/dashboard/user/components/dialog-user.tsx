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

const UserSchema = z.object({
    names: z.string().optional(),
    username: z.string().min(1, "Nombre de usuario requerido"),
    password: z.string(),
    role_id: z.string().min(1, "Rol requerido"),
    status: z.enum(["ACTIVE", "INACTIVE"]),
});

type UserForm = z.infer<typeof UserSchema> & { id?: number };

export default function UserDialog({ open, onClose, editData, onSubmit }: {
    open: boolean;
    onClose: () => void;
    editData: UserForm | null;
    onSubmit: (data: UserForm) => void;
}) {
    const { register, handleSubmit, setValue, control, reset, formState: { errors, isSubmitting } } = useForm<UserForm>({
        resolver: zodResolver(UserSchema),
        mode: "onChange"
    });
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [loading, setLoading] = useState({ save: false });

    const fetchRoles = async () => {
        try {
            const response = await fetch("/api/role/listuserrole");
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            const data = await response.json();
            setRoles(data.data);
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    const fetchGetUser = async (id: number) => {
        try {
            const response = await fetch(`/api/user/getuser?id=${id}`);
            const result = await response.json();
            reset(result.data);
            setValue("role_id", result.data.role.id.toString());
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    }

    useEffect(() => {
        if (open) {
            fetchRoles();
            if (editData) {
                if (editData?.id) {
                    fetchGetUser(editData.id);
                }
            } else {
                reset({
                    names: "",
                    username: "",
                    password: "",
                    role_id: "",
                    status: "ACTIVE",
                });
            }
        }
    }, [open, editData, reset]);

    const handleFormSubmit = async (data: UserForm) => {
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
                {editData ? "✏️ Editar Usuario" : "➕ Nuevo Usuario"}
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
                            <Label htmlFor="names">Nombres</Label>
                            <Input
                                id="names"
                                {...register("names")}
                                className="mt-2"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="username">Nombre de Usuario *</Label>
                            <Input
                                id="username"
                                {...register("username")}
                                className={`mt-2 ${errors.username ? "border-red-500" : ""}`}
                            />
                            {errors.username && (
                                <p className="text-xs text-red-500">{errors.username.message}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="password">Password *</Label>
                            <PasswordInput
                                id="password"
                                {...register("password")}
                                placeholder="••••••••"
                                className="mt-2"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="role">Rol *</Label>
                            <Controller
                                name="role_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setValue("role_id", value);
                                        }}
                                    >
                                        <SelectTrigger className={`w-full mt-2 ${errors.role_id ? "border-red-500" : ""}`}>
                                            <SelectValue placeholder="Seleccionar rol" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 overflow-auto">
                                            {roles.map((item) => (
                                                <SelectItem key={item.id} value={item.id.toString()} className="capitalize">
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.role_id && (
                                <p className="text-xs text-red-500">{errors.role_id.message}</p>
                            )}
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