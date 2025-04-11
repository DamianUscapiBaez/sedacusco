"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FiX, FiSave, FiSearch, FiLoader } from "react-icons/fi";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

const actSchema = z.object({
    lot: z.enum(["1", "2"]),
    file_number: z.string().min(1, "Número de ficha requerido").regex(/^\d+$/, "Solo se permiten números"),
    inscription_number: z.string().min(1, "Número de inscripción requerido").regex(/^\d+$/, "Solo se permiten números"),
    file_date: z.string(),
    file_time: z.string().optional(),
    customer_id: z.number(),
    customer_name: z.string().min(1, "Nombre requerido"),
    customer_address: z.string().min(1, "Dirección requerida"),
    old_meter: z.string().min(1, "Medidor Antiguo requerido"),
    reading: z.string().min(1, "Lectura requerida"),
    observations: z.enum(["SIN OBSERVACIONES", "MEDIDOR PROFUNDO", "RECHADO", "BRONCE"]).optional(),
    technician_id: z.number(),
    technician_dni: z.string().min(8, "DNI debe tener 8 dígitos").regex(/^\d+$/, "Solo números"),
    technician_name: z.string().min(1, "Nombre requerido"),
    // Campos añadidos que estaban en el formulario pero no en el schema
    meterrenovation_id: z.number(),
    meter_number: z.string().min(10, "Debe tener 10 caracteres (DA24 + 6 dígitos)").regex(/^DA24\d{6}$/, "Formato inválido. Debe ser DA24 seguido de 6 dígitos (ej: DA24000000)"),
    verification_code: z.string().min(1, "Código de verificación requerido"),
    rotating_pointer: z.enum(["SI", "NO"]).optional(),
    meter_security_seal: z.enum(["SI", "NO"]).optional(),
    reading_impossibility_viewer: z.enum(["SI", "NO"]).optional()
});

type ActForm = z.infer<typeof actSchema> & { id?: number };

export default function ActDialog({ open, onClose, editData, onSubmit }: { open: boolean; onClose: () => void; editData: ActForm | null; onSubmit: (data: ActForm) => void; }) {
    const { register, handleSubmit, watch, setValue, control, reset, formState: { errors, isSubmitting } } = useForm<ActForm>({
        resolver: zodResolver(actSchema),
        mode: "onChange"
    });

    const [loading, setLoading] = useState({ inscription: false, technician: false, save: false, meterrenovation: false });

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
    const handleSearch = async (type: 'inscription' | 'technician' | 'meterrenovation') => {
        const field = type === 'inscription' ? 'inscription_number' :
            type === 'technician' ? 'technician_dni' :
                'meter_number'; // Changed from 'meterrenovation_id' to 'meter_number'
        const value = String(watch(field) || '');

        // Validation checks
        if (!value ||
            (type === 'technician' && value.length !== 8) ||
            (type === 'meterrenovation' && !/^DA24\d{6}$/.test(value))) {
            showAlert('Dato inválido',
                type === 'inscription' ? 'Ingrese una inscripción válida' :
                    type === 'meterrenovation' ? 'Ingrese un número de medidor válido (Formato: DA24 + 6 dígitos)' :
                        'El DNI debe tener 8 dígitos',
                'warning');
            return;
        }

        setLoading((prev) => ({ ...prev, [type]: true }));

        try {
            const endpoint =
                type === 'inscription'
                    ? `/api/customer/searchcustomerinscription?inscription=${value}`
                    : type === 'meterrenovation'
                        ? `/api/meterrenovation/searchmeterrenovation?meter=${value}`
                        : `/api/technician/searchtechniciandni?dni=${value}`;

            const response = await fetch(endpoint);
            const result = await response.json();

            if (!response.ok) {
                showAlert(
                    'Error',
                    result.message || `No se pudo obtener datos de ${type === 'inscription' ? 'cliente' : type === 'meterrenovation' ? 'renovación' : 'técnico'}`,
                    response.status === 404 ? 'info' : 'error'
                );
                return;
            }

            if (type === 'inscription') {
                setValue('customer_id', Number(result.id) || 0);
                setValue('customer_name', result.customer_name || '', { shouldValidate: true });
                setValue('customer_address', result.address || '', { shouldValidate: true });
                setValue('old_meter', result.old_meter || '', { shouldValidate: true });
            } else if (type === 'meterrenovation') {  // Changed to else if and fixed typo
                setValue('meterrenovation_id', Number(result.id) || 0);
                setValue('meter_number', result.meter_number || '', { shouldValidate: true });
                setValue('verification_code', result.verification_code || '', { shouldValidate: true });
            } else {
                setValue('technician_id', Number(result.id) || 0);
                setValue('technician_name', result.name || '', { shouldValidate: true });
            }
        } catch (error) {
            console.error(error);
            showAlert(
                'Error',
                `Error inesperado al buscar ${type === 'inscription' ? 'cliente' : type === 'meterrenovation' ? 'renovación' : 'técnico'}`,
                'error'
            );
        } finally {
            setLoading((prev) => ({ ...prev, [type]: false }));
        }
    };

    const handleFormSubmit = async (data: any) => {
        setLoading((prev) => ({ ...prev, save: true })); // Activar loading

        try {
            await onSubmit(data);
            if (editData?.id) {
                onClose(); // Si está editando, cierra el diálogo
            }
            clearFields(); // Limpiar campos después de guardar
        } catch (error) {
            console.error("Error al guardar:", error);
        } finally {
            setLoading((prev) => ({ ...prev, save: false })); // Desactivar loading
        }
    };

    const handleEdit = async (id: number) => {
        try {
            const response = await fetch(`/api/act/getact?id=${id}`);
            const result = await response.json();

            if (!response.ok) {
                showAlert('Error', result.error || 'No se pudo obtener el registro', 'error');
                return;
            }
            reset(result.data);

            if (result.data.customer) {
                setValue('customer_id', result.data.customer.id || 0);
                setValue('customer_name', result.data.customer.customer_name || '');
                setValue('customer_address', result.data.customer.address || '');
                setValue('inscription_number', result.data.customer.inscription || '');
                setValue('old_meter', result.data.customer.old_meter || '');
            }

            if (result.data.technician) {
                setValue('technician_id', result.data.technician.id || 0);
                setValue('technician_name', result.data.technician.name || '');
                setValue('technician_dni', result.data.technician.dni || '');
            }


            if (result.data.meter) {
                setValue('meterrenovation_id', result.data.meter.id || 0);
                setValue('meter_number', result.data.meter.meter_number || '', { shouldValidate: true });
                setValue('verification_code', result.data.meter.verification_code || '', { shouldValidate: true });
            }

        } catch (error) {
            console.error(error);
            showAlert('Error', 'Error inesperado al obtener el registro', 'error');
        }
    };

    const clearFields = () => {
        setValue("file_date", new Date().toISOString().split('T')[0]);
        setValue("file_time", "");
        setValue("file_number", "");
        setValue("inscription_number", "");
        setValue("technician_id", 0)
        setValue("technician_name", "");
        setValue("technician_dni", "");
        setValue("lot", "2");
        setValue("rotating_pointer", "SI");
        setValue("meter_security_seal", "NO");
        setValue("reading_impossibility_viewer", "NO");
        setValue("observations", "SIN OBSERVACIONES");
        setValue("customer_id", 0);
        setValue("customer_name", "");
        setValue("customer_address", "");
        setValue("old_meter", "");
        setValue("reading", "");
        setValue("meterrenovation_id", 0);
        setValue("meter_number", "");
        setValue("verification_code", "");
    }
    const onError = (errors: any) => {
        console.error("❌ Errores de validación:", errors);
        Object.entries(errors).forEach(([key, value]) => {
            console.log(`${key}:`, (value as any)?.message);
        });
    };
    useEffect(() => {
        if (open) {
            if (editData?.id) {
                handleEdit(editData?.id)
            } else {
                clearFields()
            }
        }
    }, [open, editData]);
    return (
        <Dialog open={open} maxWidth="xl" fullWidth>
            <DialogTitle className="bg-gray-50 dark:bg-black dark:text-white relative flex items-center justify-between">
                {editData ? "✏️ Editar Acta" : "➕ Nueva Acta"}
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
                <DialogContent dividers className="bg-gray-50 dark:bg-black dark:text-white space-y-5" sx={{ maxHeight: "90vh", overflowY: "auto" }}>
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_2fr] gap-4">
                        {/* Columna Izquierda - Datos Generales */}
                        <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border shadow-sm space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    📋 Datos Generales
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="file_number">Nro FICHA *</Label>
                                        <Input
                                            id="file_number"
                                            {...register("file_number")}
                                            maxLength={5}
                                            className={`mt-2 ${errors.file_number ? "border-red-500" : ""}`}
                                        />
                                        {errors.file_number && (
                                            <p className="text-xs text-red-500">{errors.file_number.message}</p>
                                        )}
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <Label htmlFor="inscription_number">Nro Inscripción *</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="inscription_number"
                                                {...register("inscription_number")}
                                                maxLength={10}
                                                className={`mt-1 ${errors.inscription_number ? "border-red-500" : ""}`}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSearch('inscription')}
                                                disabled={loading.inscription}
                                                className="mt-1"
                                            >
                                                {loading.inscription ? 'Buscando...' : <FiSearch className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        {errors.inscription_number && (
                                            <p className="text-xs text-red-500">{errors.inscription_number.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="file_date">Fecha</Label>
                                        <Input
                                            id="file_date"
                                            {...register("file_date")}
                                            type="date"
                                            className={`mt-2 ${errors.file_date ? "border-red-500" : ""}`}
                                            max={new Date().toISOString().split('T')[0]}
                                            min={`${new Date().getFullYear()}-02-24`}
                                        />
                                        {errors.file_date && (
                                            <p className="text-xs text-red-500">{errors.file_date.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="file_time">Hora</Label>
                                        <Input
                                            id="file_time"
                                            {...register("file_time")}
                                            type="time"
                                            className={`mt-2 ${errors.file_time ? "border-red-500" : ""}`}
                                        />
                                        {errors.file_time && (
                                            <p className="text-xs text-red-500">{errors.file_time.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="lot">Lote</Label>
                                        <Controller
                                            name="lot"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    disabled
                                                    value={field.value}
                                                    onValueChange={(value) => field.onChange(value)}
                                                >
                                                    <SelectTrigger className={`w-full mt-2 ${errors.observations ? "border-red-500" : ""}`}>
                                                        <SelectValue placeholder="Seleccione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">Lote 1</SelectItem>
                                                        <SelectItem value="2">Lote 2</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input type="hidden" {...register('customer_id')} />
                                    <div className="space-y-1">
                                        <Label htmlFor="customer_name">Nombre del usuario</Label>
                                        <Input
                                            id="customer_name"
                                            {...register("customer_name")}
                                            disabled
                                            className={`mt-2 bg-gray-100 dark:bg-gray-700 ${errors.customer_name ? "border-red-500" : ""}`}
                                        />
                                        {errors.customer_name && (
                                            <p className="text-xs text-red-500">{errors.customer_name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="customer_address">Dirección</Label>
                                        <Input
                                            id="customer_address"
                                            {...register("customer_address")}
                                            disabled
                                            className={`mt-2 bg-gray-100 dark:bg-gray-700 ${errors.customer_address ? "border-red-500" : ""}`}
                                        />
                                        {errors.customer_address && (
                                            <p className="text-xs text-red-500">{errors.customer_address.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Sección de Reinstalación */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border shadow-sm">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    🛠️ Datos de Reinstalación
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input type="hidden" {...register('meterrenovation_id')} />
                                    <div className="space-y-1">
                                        <div className="space-y-1">
                                            <Label htmlFor="meter_number">Nro Medidor *</Label>
                                            <div className="relative">
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="meter_number"
                                                        maxLength={10}
                                                        placeholder="DA24000000"
                                                        {...register("meter_number", {
                                                            required: "Número de medidor es requerido",
                                                            pattern: {
                                                                value: /^DA24\d{6}$/,
                                                                message: "Formato: DA24 + 6 dígitos (ej: DA24000000)"
                                                            },
                                                            minLength: {
                                                                value: 10,
                                                                message: "Debe tener 10 caracteres"
                                                            },
                                                            maxLength: 10
                                                        })}
                                                        className={`mt-2 ${errors.meter_number ? "border-red-500" : ""}`}
                                                        onFocus={(e) => {
                                                            if (!e.target.value) e.target.value = "DA24";
                                                        }}
                                                        onChange={(e) => {
                                                            let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                                                            if (!val.startsWith("DA24")) val = "DA24" + val.replace(/^DA24/, "").slice(0, 6);
                                                            else val = "DA24" + val.slice(4).replace(/\D/g, "").slice(0, 6);
                                                            e.target.value = val;
                                                            register("meter_number").onChange(e);
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleSearch('meterrenovation')}
                                                        disabled={loading.meterrenovation}
                                                        className="mt-1"
                                                    >
                                                        {loading.meterrenovation ? 'Buscando...' : <FiSearch className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                                <p className="text-xs mt-2 text-red-500">
                                                    {errors.meter_number?.message}
                                                </p>
                                                <p className="text-xs mt-2 text-gray-500" hidden={!!errors.meter_number}>
                                                    Formato: DA24 + 6 dígitos (ej: DA24000000)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="verification_code">Código Verificación *</Label>
                                        <Input
                                            id="verification_code"
                                            disabled
                                            {...register("verification_code")}
                                            className={`mt-2 bg-gray-100 dark:bg-gray-700 ${errors.verification_code ? "border-red-500" : ""}`}
                                        />
                                        {errors.verification_code && (
                                            <p className="text-xs text-red-500">{errors.verification_code.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Columna Derecha - Detalles Técnicos */}
                        <div className="space-y-4">
                            {/* Sección de Instalación */}
                            <div className="bg-blue-50 dark:bg-red-900/20 p-4 rounded-xl border shadow-sm">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    🛠️ Datos de Instalación
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="old_meter">Medidor Antiguo *</Label>
                                        <Input
                                            id="old_meter"
                                            disabled
                                            {...register("old_meter")}
                                            className={`mt-2 bg-gray-100 dark:bg-gray-700 ${errors.old_meter ? "border-red-500" : ""}`}
                                        />
                                        {errors.old_meter && (
                                            <p className="text-xs text-red-500">{errors.old_meter.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="reading">Lectura *</Label>
                                        <Input
                                            id="reading"
                                            {...register("reading")}
                                            className={`mt-2 bg-gray-100 dark:bg-gray-700 ${errors.reading ? "border-red-500" : ""}`}
                                        />
                                        {errors.reading && (
                                            <p className="text-xs text-red-500">{errors.reading.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1 col-span-2">
                                        <Label htmlFor="observations">Observaciones</Label>
                                        <Controller
                                            name="observations"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={(value) => field.onChange(value)}
                                                >
                                                    <SelectTrigger className={`z-[99999] w-full mt-2 ${errors.observations ? "border-red-500" : ""}`}>
                                                        <SelectValue placeholder="Seleccione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="SIN OBSERVACIONES">Sin Observaciones</SelectItem>
                                                        <SelectItem value="MEDIDOR PROFUNDO">Medidor profundo</SelectItem>
                                                        <SelectItem value="RECHADO">Rechado</SelectItem>
                                                        <SelectItem value="BRONCE">Bronce</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>
                                <h4 className="mt-2 font-medium text-lg">📋 Reporte Visual</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                                    <div className="space-y-1">
                                        <p className="mb-2 text-sm">Punt. Med. Girando</p>
                                        <div className="flex">
                                            <Button
                                                type="button"
                                                variant={watch("rotating_pointer") === "SI" ? "default" : "outline"}
                                                onClick={() => setValue("rotating_pointer", "SI")}
                                                className="rounded-r-none w-1/2"
                                            >
                                                Sí
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={watch("rotating_pointer") === "NO" ? "default" : "outline"}
                                                onClick={() => setValue("rotating_pointer", "NO")}
                                                className="rounded-l-none w-1/2"
                                            >
                                                No
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="mb-2 text-sm">Med. c/ Precinto</p>
                                        <div className="flex">
                                            <Button
                                                type="button"
                                                variant={watch("meter_security_seal") === "SI" ? "default" : "outline"}
                                                onClick={() => setValue("meter_security_seal", "SI")}
                                                className="rounded-r-none w-1/2"
                                            >
                                                Sí
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={watch("meter_security_seal") === "NO" ? "default" : "outline"}
                                                onClick={() => setValue("meter_security_seal", "NO")}
                                                className="rounded-l-none w-1/2"
                                            >
                                                No
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="mb-2 text-sm">Visor c/ Impos. Lect.</p>
                                        <div className="flex">
                                            <Button
                                                type="button"
                                                variant={watch("reading_impossibility_viewer") === "SI" ? "default" : "outline"}
                                                onClick={() => setValue("reading_impossibility_viewer", "SI")}
                                                className="rounded-r-none w-1/2"
                                            >
                                                Sí
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={watch("reading_impossibility_viewer") === "NO" ? "default" : "outline"}
                                                onClick={() => setValue("reading_impossibility_viewer", "NO")}
                                                className="rounded-l-none w-1/2"
                                            >
                                                No
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Sección del Técnico */}
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border shadow-sm">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    👷 Datos Técnico
                                </h3>

                                <div className="grid sm:grid-cols-2 gap-3">
                                    <input type="hidden" {...register('technician_id')} />
                                    <div className="space-y-1">
                                        <Label htmlFor="technician_dni">DNI Técnico *</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="technician_dni"
                                                {...register("technician_dni")}
                                                maxLength={8}
                                                className={`mt-1 ${errors.technician_dni ? "border-red-500" : ""}`}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleSearch('technician')}
                                                disabled={loading.technician || (watch("technician_dni") || '').length !== 8}
                                                className="mt-1"
                                            >
                                                {loading.technician ? 'Buscando...' : <FiSearch className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        {errors.technician_dni && (
                                            <p className="text-xs text-red-500">{errors.technician_dni.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="technician_name">Nombre Técnico *</Label>
                                        <Input
                                            id="technician_name"
                                            disabled
                                            {...register("technician_name")}
                                            className={`mt-2 bg-gray-100 dark:bg-gray-700 ${errors.technician_name ? "border-red-500" : ""}`}
                                        />
                                        {errors.technician_name && (
                                            <p className="text-xs text-red-500">{errors.technician_name.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
                <DialogActions className="bg-gray-50 dark:bg-black dark:text-white " sx={{ flexDirection: "column", gap: 2, alignItems: "stretch", padding: 2 }}>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 w-full">
                        <Button variant="outline" onClick={onClose} type="button" className="w-full sm:w-auto">
                            <FiX className="mr-2" /> Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="w-full sm:w-auto"
                            disabled={loading.save || isSubmitting} // Desactivar el botón si está enviando
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
        </Dialog >
    );
}