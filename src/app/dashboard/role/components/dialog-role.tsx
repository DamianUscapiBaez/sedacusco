"use client";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Box
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FiX, FiSave, FiLoader, FiCheck, FiCheckSquare, FiSearch } from "react-icons/fi";
import { useEffect, useState } from "react";

const RoleSchema = z.object({
    name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
    description: z.string().optional(),
    permissions: z.array(z.number()).optional(),
});

type RoleForm = z.infer<typeof RoleSchema> & { id?: number };
type Permission = {
    id: number;
    name: string;
    description: string;
    category: string;
};

export default function RoleDialog({ open, onClose, editData, onSubmit }: {
    open: boolean;
    onClose: () => void;
    editData: RoleForm | null;
    onSubmit: (data: RoleForm) => void;
}) {
    const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<RoleForm>({
        resolver: zodResolver(RoleSchema),
        mode: "onChange"
    });

    const [loading, setLoading] = useState({
        save: false,
        permissions: true
    });
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categories, setCategories] = useState<string[]>([]);

    const filteredPermissions = permissions.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const permissionsByCategory = categories.map(category => ({
        category,
        permissions: filteredPermissions.filter(p => p.category === category)
    }));

    const fetchPermissions = async () => {
        try {
            const response = await fetch('/api/permission/listpermissionrole');
            const result = await response.json();
            const perms = result.data || [];
            setPermissions(perms);
            const uniqueCategories = Array.from(new Set(perms.map((p: Permission) => p.category)));
            setCategories(uniqueCategories as string[]);
        } catch (error) {
            console.error("Error fetching permissions:", error);
        } finally {
            setLoading({ ...loading, permissions: false });
        }
    };

    const fetchGetRole = async (id: number) => {
        try {
            const response = await fetch(`/api/role/getrole?id=${id}`);
            const result = await response.json();
            reset({
                ...result.data,
                permissions: result.data.permissions?.map((p: Permission) => p.id) || []
            });
        } catch (error) {
            console.error("Error fetching role:", error);
        }
    }

    useEffect(() => {
        if (open) {
            fetchPermissions();
            if (editData) {
                if (editData?.id) {
                    fetchGetRole(editData.id);
                }
            } else {
                reset({
                    name: "",
                    description: "",
                    permissions: []
                });
            }
        }
    }, [open, editData, reset]);

    const handlePermissionChange = (permissionId: number) => {
        const currentPermissions = watch("permissions") || [];
        if (currentPermissions.includes(permissionId)) {
            setValue(
                "permissions",
                currentPermissions.filter(id => id !== permissionId)
            );
        } else {
            setValue("permissions", [...currentPermissions, permissionId]);
        }
    };

    const handleFormSubmit = async (data: RoleForm) => {
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
        <Dialog open={open} maxWidth="lg" fullWidth onClose={onClose} className="fixed">
            <DialogTitle className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        {editData ? "✏️ Editar Rol" : "➕ Crear Nuevo Rol"}
                    </h2>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        className="text-white hover:bg-white/10"
                    >
                        <CloseIcon />
                    </IconButton>
                </div>
            </DialogTitle>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-[calc(100vh-200px)]">
                <DialogContent className="bg-gray-50 dark:bg-gray-900 p-6 flex-grow overflow-y-auto">
                    {/* Sección de información del rol */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            <FiCheckSquare className="text-blue-500" />
                            Información del Rol
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                                    Nombre del Rol <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    {...register("name")}
                                    className={`mt-1 text-gray-700 dark:text-gray-300 ${errors.name ? "border-red-500" : ""}`}
                                    placeholder="Ej: Administrador"
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">
                                    Descripción
                                </Label>
                                <Input
                                    id="description"
                                    {...register("description")}
                                    className="mt-1 text-gray-700 dark:text-gray-300 "
                                    placeholder="Ej: Acceso completo al sistema"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección de permisos */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                <FiCheck className="text-blue-500" />
                                Asignar Permisos
                            </h3>

                            <div className="relative w-full sm:w-64">
                                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                                <Input
                                    type="text"
                                    placeholder="Buscar permisos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 text-sm h-8"
                                />
                            </div>
                        </div>

                        {loading.permissions ? (
                            <div className="flex justify-center items-center py-12">
                                <FiLoader className="animate-spin text-blue-500 text-2xl" />
                            </div>
                        ) : (
                            <div>
                                {categories.length > 0 ? (
                                    <div className="space-y-6">
                                        {permissionsByCategory.map((group) => (
                                            group.permissions.length > 0 && (
                                                <div key={`group-${group.category}`} className="space-y-3">
                                                    <h4 className="text-md font-medium text-gray-800 dark:text-white capitalize border-b pb-2">
                                                        {group.category}
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                                        {group.permissions.map((permission) => (
                                                            <div
                                                                key={`perm-${permission.id}`}
                                                                className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                                                                    watch("permissions")?.includes(permission.id)
                                                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                                }`}
                                                                onClick={() => handlePermissionChange(permission.id)}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={watch("permissions")?.includes(permission.id) || false}
                                                                    onChange={() => { }}
                                                                    className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                                                />
                                                                <div className="ml-3">
                                                                    <Label className="block text-gray-800 dark:text-gray-200 font-medium">
                                                                        {permission.name}
                                                                    </Label>
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                                        {permission.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                        No hay categorías de permisos disponibles
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>

                {/* Botones fijos en la parte inferior */}
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