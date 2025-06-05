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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FiX, FiSave, FiSearch, FiLoader } from "react-icons/fi";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { LotData } from "@/types/types";
import { useSession } from "next-auth/react";

const precatastralSchema = z.object({
  file_number: z.string().min(1, "Número de ficha requerido").regex(/^\d+$/, "Solo se permiten números"),
  inscription_number: z.string().min(1, "Número de inscripción requerido").regex(/^\d+$/, "Solo se permiten números"),
  customerId: z.number(),
  lotId: z.string().min(1, "Lote es requerido"),
  customer_name: z.string().min(1, "Nombre requerido"),
  customer_address: z.string().min(1, "Dirección requerida"),
  property: z.enum(["COMERCIAL", "DOMESTICO"]),
  is_located: z.enum(["SI", "NO"]).optional(),
  located_box: z.enum(["EXTERIOR", "INTERIOR"]),
  buried_connection: z.enum(["SI", "NO"]),
  has_meter: z.enum(["SI", "NO"]),
  reading: z.string().min(1, "Lectura requerida"),
  has_cover: z.enum(["SI", "NO"]),
  cover_state: z.enum(["BUENO", "MALO"]),
  has_box: z.enum(["SI", "NO"]),
  box_state: z.enum(["BUENO", "MALO"]),
  cover_material: z.string().min(1, "Material requerido"),
  keys: z.string().length(1, "Debe ser un solo dígito").regex(/^[0-2]$/, "Solo puede ser 0, 1 o 2"),
  observations: z.enum(["SIN_OBSERVACIONES", "MEDIDOR PROFUNDO", "RECHADO", "BRONCE"]),
  technicianId: z.number(),
  technician_dni: z.string().min(8, "DNI debe tener 8 dígitos").regex(/^\d+$/, "Solo números"),
  technician_name: z.string().min(1, "Nombre requerido")
});
type PrecatastralForm = z.infer<typeof precatastralSchema> & { id?: number };

const DEFAULT_VALUES: Partial<PrecatastralForm> = {
  file_number: "",
  inscription_number: "",
  lotId: "2",
  property: "DOMESTICO",
  is_located: "SI",
  located_box: "EXTERIOR",
  buried_connection: "NO",
  has_meter: "SI",
  has_box: "SI",
  box_state: "BUENO",
  has_cover: "SI",
  cover_state: "BUENO",
  cover_material: "",
  keys: "2",
  customerId: 0,
  customer_name: "",
  customer_address: "",
  technicianId: 0,
  technician_name: "",
  technician_dni: "",
  observations: "SIN_OBSERVACIONES",
  reading: "",
};

export default function PreCatastralDialog({ open, onClose, editData, refreshTable }: { open: boolean; onClose: () => void; editData: PrecatastralForm | null; refreshTable: () => void; }) {
  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors, isSubmitting } } = useForm<PrecatastralForm>({
    resolver: zodResolver(precatastralSchema),
    mode: "onChange",
    defaultValues: DEFAULT_VALUES
  });

  const { data: session } = useSession();
  const [lots, setLots] = useState<LotData[]>([]);
  const [loading, setLoading] = useState({ inscription: false, technician: false, save: false });

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


  const fetchLots = async () => {
    try {
      const response = await fetch("/api/lot/listlots");
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      setLots(data.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleSearch = async (type: 'inscription' | 'technician') => {
    const field = type === 'inscription' ? 'inscription_number' : 'technician_dni';
    const value = watch(field)?.replace(/\D/g, '') || '';

    if (!value || (type === 'technician' && value.length !== 8)) {
      showAlert('Dato inválido', type === 'inscription' ? 'Ingrese una inscripción válida' : 'El DNI debe tener 8 dígitos', 'warning');
      return;
    }

    setLoading((prev) => ({ ...prev, [type]: true }));

    try {
      const endpoint =
        type === 'inscription'
          ? `/api/customer/searchcustomerinscription?inscription=${value}`
          : `/api/technician/searchtechniciandni?dni=${value}`;

      const response = await fetch(endpoint);
      const result = await response.json();

      if (!response.ok) {
        showAlert(
          'Error',
          result.message || `No se pudo obtener datos de ${type === 'inscription' ? 'cliente' : 'técnico'}`,
          response.status === 404 ? 'info' : 'error'
        );
        return;
      }

      if (type === 'inscription') {
        setValue('customerId', Number(result.id) || 0);
        setValue('customer_name', result.customer_name || '', { shouldValidate: true });
        setValue('customer_address', result.address || '', { shouldValidate: true });
      } else {
        setValue('technicianId', Number(result.id) || 0);
        setValue('technician_name', result.name || '', { shouldValidate: true });
      }
    } catch (error) {
      console.error(error);
      showAlert(
        'Error',
        `Error inesperado al buscar ${type === 'inscription' ? 'cliente' : 'técnico'}`,
        'error'
      );
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSave = async (data: any) => {
    setLoading((prev) => ({ ...prev, save: true }));
    try {
      // 1. Verificar sesión de usuario
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
      // 2. Preparar payload
      const payload = {
        ...data,
        [editData?.id ? "updated_by" : "created_by"]: userId,
      };

      const apiEndpoint = editData
        ? `/api/precatastral/updateprecatastral?id=${editData?.id}` // URL de actualización
        : "/api/precatastral/newprecatastral"; // URL de creación

      const method = editData ? "PUT" : "POST"; // Método PUT si estamos actualizando

      // 3. Enviar solicitud
      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();


      if (result?.message) {
        showAlert("Error", result.message || "Algo salió mal al guardar.", "error");
        return;
      } else {
        showAlert("¡Guardado exitosamente!", editData?.id
          ? "El registro fue actualizado correctamente."
          : "El registro fue creado correctamente.",
          "success"
        );

        refreshTable();
        if (!editData?.id) {
          clearFields(); // Solo limpiar si es creación nueva
        } else {
          onClose(); // Cerrar diálogo si es edición
        }
      }
    } catch (error: any) {
      console.error("❌ Error al guardar:", error);
      showAlert(
        "Error",
        error.message || "Ocurrió un error inesperado. Intenta nuevamente.",
        "error"
      );
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const response = await fetch(`/api/precatastral/getprecatastral?id=${id}`);
      const result = await response.json();

      if (!response.ok) {
        showAlert('Error', result.error || 'No se pudo obtener el registro', 'error');
        return;
      }
      reset(result.data);

      if (result.data.customer) {
        setValue('customerId', result.data.customer.id || 0);
        setValue('customer_name', result.data.customer.customer_name || '');
        setValue('customer_address', result.data.customer.address || '');
        setValue('inscription_number', result.data.customer.inscription || '');
      }

      if (result.data.technician) {
        setValue('technicianId', result.data.technician.id || 0);
        setValue('technician_name', result.data.technician.name || '');
        setValue('technician_dni', result.data.technician.dni || '');
      }

    } catch (error) {
      console.error(error);
      showAlert('Error', 'Error inesperado al obtener el registro', 'error');
    }
  };

  const onError = (errors: any) => {
    console.error("❌ Errores de validación:", errors);
    // Muestra errores específicos
    Object.entries(errors).forEach(([key, value]) => {
      console.log(`${key}:`, (value as any)?.message);
    });
  };

  const clearFields = () => {
    reset(DEFAULT_VALUES);
  };


  useEffect(() => {
    if (!open) return;

    if (editData?.id) {
      handleEdit(editData.id);
    } else {
      clearFields();
    }
    reset(DEFAULT_VALUES, { keepErrors: false });
    fetchLots();
    // Si la sesión contiene el lote del usuario, actualizamos el estado
    if (session?.user?.lot?.id) {
      setValue("lotId", session.user.lot.id.toString());
    }
  }, [open, editData?.id, session?.user?.lot?.id]); // Dependencias optimizadas

  return (
    <Dialog open={open} maxWidth="xl" fullWidth>
      <DialogTitle className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        {editData ? "✏️ Editar Pre Catastro" : "➕ Nuevo Pre Catastro"}
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
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-3">
            {/* Columna Izquierda */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-lg font-semibold">📋 Datos Generales</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label form="file_number">Nro FICHA *</Label>
                  <Input
                    {...register("file_number")}
                    className={`mt-2 ${errors.file_number ? "border-red-500" : ""}`}
                    maxLength={5}
                  />
                  {errors.file_number && (
                    <p className="text-xs text-red-500 mt-1">{errors.file_number.message}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <input type="hidden" {...register('customerId')} />
                  <Label>Nro Inscripción *</Label>
                  <div className="flex gap-2">
                    <Input
                      {...register("inscription_number")}
                      maxLength={9}
                      className={`mt-2 ${errors.inscription_number ? "border-red-500" : ""}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearch('inscription')}
                      className="mt-2"
                    >
                      {loading.inscription ? 'Buscando...' : <FiSearch className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.inscription_number && (
                    <p className="text-xs text-red-500 mt-1">{errors.inscription_number.message}</p>
                  )}
                </div>
                <div className="col-span-1">
                  <Label>Ubicado</Label>
                  <div className="flex items-center mt-2">
                    <Button
                      type="button"
                      variant={watch("is_located") === "SI" ? "default" : "outline"}
                      onClick={() => setValue("is_located", "SI")}
                      className="rounded-r-none w-1/2"
                    >
                      Sí
                    </Button>
                    <Button
                      type="button"
                      variant={watch("is_located") === "NO" ? "default" : "outline"}
                      onClick={() => setValue("is_located", "NO")}
                      className="rounded-l-none w-1/2"
                    >
                      No
                    </Button>
                  </div>
                </div>
                <div className="col-s">
                  <Label htmlFor="lotId">Lote</Label>
                  <Controller
                    name="lotId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value} // Set default value to "2" if field.value is undefined
                        onValueChange={(value) => {
                          field.onChange(value);
                          setValue("lotId", value);
                        }}
                      >
                        <SelectTrigger className={`w-full mt-2 ${errors.lotId ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-auto">
                          {lots.map((item) => (
                            <SelectItem key={item.id} value={item.id.toString()} className="capitalize">
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.lotId && (
                    <p className="text-xs text-red-500 mt-1">{errors.lotId.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Nombre del usuario</Label>
                  <Input
                    {...register("customer_name")}
                    disabled
                    className={`mt-2 ${errors.customer_name ? "border-red-500" : ""}`}
                  />
                  {errors.customer_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.customer_name.message}</p>
                  )}
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Input
                    {...register("customer_address")}
                    disabled
                    className={`mt-2 ${errors.customer_address ? "border-red-500" : ""}`}

                  />
                  {errors.customer_address && (
                    <p className="text-xs text-red-500 mt-1">{errors.customer_address.message}</p>
                  )}
                </div>
                <div>
                  <Label>Predio *</Label>
                  <Controller
                    name="property"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setValue("property", value as any, { shouldValidate: true });
                        }}
                      >
                        <SelectTrigger className={`w-full mt-2 ${errors.property ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DOMESTICO">DOMÉSTICO</SelectItem>
                          <SelectItem value="COMERCIAL">COMERCIAL</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.property && (
                    <p className="text-xs text-red-500 mt-1">Seleccione un tipo de predio</p>
                  )}
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">🛠️ Detalles Técnicos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { name: "located_box", label: "Ubic. Caja *", options: ["EXTERIOR", "INTERIOR"], colSpan: { base: 2, sm: 1, md: 1 } },
                    { name: "buried_connection", label: "Conex. Enterrada *", options: ["SI", "NO"], colSpan: { base: 2, sm: 1, md: 1 } },
                    { name: "has_meter", label: "Medidor *", options: ["SI", "NO"], colSpan: { base: 2, sm: 1, md: 1 } },
                    { name: "reading", label: "Lectura *", type: "input", colSpan: { base: 2, sm: 1, md: 1 } },
                    { name: "keys", label: "Llaves (0-2) *", type: "input", colSpan: { base: 2, sm: 1, md: 1 } },
                    { name: "has_cover", label: "¿Tiene Tapa? *", options: ["SI", "NO"], colSpan: { base: 2, sm: 1, md: 1 } },
                    { name: "cover_state", label: "Estado Tapa *", options: ["BUENO", "MALO"], colSpan: { base: 2, sm: 1, md: 1 } },
                    { name: "cover_material", label: "Material Tapa *", type: "input", colSpan: { base: 2, sm: 2, md: 2 } },
                    { name: "has_box", label: "¿Tiene Caja? *", options: ["SI", "NO"], colSpan: { base: 2, sm: 1, md: 1 } },
                    { name: "box_state", label: "Estado Caja *", options: ["BUENO", "MALO"], colSpan: { base: 2, sm: 1, md: 1 } },
                    { name: "observations", label: "Observaciones", options: ["SIN OBSERVACIONES", "MEDIDOR PROFUNDO", "RECHADO", "BRONCE"], colSpan: { base: 2, sm: 2, md: 2 } },
                  ].map((field) => {
                    const colSpanClass =
                      `${field.colSpan?.base ? `col-span-${field.colSpan.base}` : "col-span-1"} 
                      ${field.colSpan?.sm ? `sm:col-span-${field.colSpan.sm}` : ""} 
                      ${field.colSpan?.md ? `md:col-span-${field.colSpan.md}` : ""}`.trim();

                    return (
                      <div key={field.name} className={colSpanClass}>
                        <Label className="mb-2">{field.label}</Label>
                        {field.type === "input" ? (
                          <Input
                            {...register(field.name as keyof PrecatastralForm)}
                            onChange={(e) => {
                              if (field.name === "keys") {
                                setValue("keys", e.target.value.replace(/[^0-2]/g, ""), { shouldValidate: true });
                              } else {
                                setValue(field.name as keyof PrecatastralForm, e.target.value, { shouldValidate: true });
                              }
                            }}
                            maxLength={field.name === "keys" ? 1 : undefined}
                            className={`w-full ${errors[field.name as keyof typeof errors] ? "border-red-500" : ""}`}
                          />
                        ) : (
                          <Controller
                            name={field.name as keyof PrecatastralForm}
                            control={control}
                            render={({ field: controllerField }) => (
                              <Select
                                value={controllerField.value !== undefined ? String(controllerField.value) : undefined}
                                onValueChange={(value) => {
                                  controllerField.onChange(value);
                                  setValue(field.name as keyof PrecatastralForm, value as any, { shouldValidate: true });
                                }}
                              >
                                <SelectTrigger className={`w-full ${errors[field.name as keyof typeof errors] ? "border-red-500" : ""}`}>
                                  <SelectValue placeholder="Seleccione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        )}
                        {errors[field.name as keyof typeof errors] && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[field.name as keyof typeof errors]?.message?.toString()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-2xl border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">👷 Técnico</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>DNI Técnico *</Label>
                    <div className="flex gap-2">
                      <input type="hidden" {...register('technicianId')} />
                      <Input
                        {...register("technician_dni")}
                        maxLength={8}
                        className={`mt-2 ${errors.technician_dni ? "border-red-500" : ""}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSearch('technician')}
                        disabled={loading.technician || (watch("technician_dni") || '').length !== 8}
                        className="mt-2"
                      >
                        {loading.technician ? 'Buscando...' : <FiSearch className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.technician_dni && (
                      <p className="text-xs text-red-500 mt-1">{errors.technician_dni.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Nombre Técnico *</Label>
                    <Input
                      {...register("technician_name")}
                      disabled
                      className={`mt-2 bg-gray-100 dark:bg-gray-700 ${errors.technician_name ? "border-red-500" : ""}`}
                    />
                    {errors.technician_name && (
                      <p className="text-xs text-red-500 mt-1">{errors.technician_name.message}</p>
                    )}
                  </div>
                </div>
              </div>
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