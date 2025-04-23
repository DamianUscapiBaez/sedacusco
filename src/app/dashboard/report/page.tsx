"use client"

import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileText,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LotData } from "@/types/types";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
// import { useToast } from "@/components/ui/use-toast";

export default function ReportPage() {
  const { data: session } = useSession();
  // const { toast } = useToast();
  const [reportType, setReportType] = useState<"instalados" | "lote" | "completo">("instalados");
  const [selectedLot, setSelectedLot] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lots, setLots] = useState<LotData[]>([]);
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
  });
  const [monthRange, setMonthRange] = useState({
    start: "",
    end: ""
  });

  const fetchLots = async () => {
    try {
      const response = await fetch("/api/lot/listlots");
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      setLots(data.data);
    } catch (error) {
      console.error("Error fetching lots:", error);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      // Obtener fecha actual para el nombre del archivo
      const currentDate = new Date().toISOString().split('T')[0];
      let apiUrl = "";
      let fileName = "";

      if (reportType === "instalados") {
        if (!dateRange.start || !dateRange.end) {
          throw new Error("Debe seleccionar ambas fechas");
        }
        apiUrl = `/api/report/reportdates?startDate=${dateRange.start}&endDate=${dateRange.end}`;
        fileName = `Reporte_Instalados_${dateRange.start}_a_${dateRange.end}_${currentDate}.xlsx`;
      }
      else {
        if (!selectedLot) {
          throw new Error("Debe seleccionar un lote");
        }
        const lotName = lots.find(lot => lot.id.toString() === selectedLot)?.name || "Lote";
        apiUrl = `/api/report/reportlot?lotId=${selectedLot}`;

        // Si hay rango de meses, agregarlo
        if (monthRange.start && monthRange.end) {
          apiUrl += `&monthStart=${monthRange.start}&monthEnd=${monthRange.end}`;
          fileName = `Reporte_${lotName}_Meses_${monthRange.start}_a_${monthRange.end}_${currentDate}.xlsx`;
        } else {
          fileName = `Reporte_${lotName}_Completo_${currentDate}.xlsx`;
        }
      }

      // Realizar la petición
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
      }

      // Descargar el archivo
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName.replace(/\s+/g, '_'); // Reemplazar espacios por guiones bajos
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Swal.fire({
        icon: "success",
        title: "Reporte generado",
        text: `El archivo "${fileName}" se ha descargado correctamente`,
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      console.error("Error al generar reporte:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Ocurrió un error al generar el reporte",
        timer: 1500,
        showConfirmButton: false
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchLots();
    // Si la sesión contiene el lote del usuario, actualizamos el estado
    if (session?.user?.lot?.id) {
      setSelectedLot(session.user.lot.id.toString());
    }
  }, [session]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="flex gap-2">
          <Button
            variant={reportType === "instalados" ? "default" : "outline"}
            onClick={() => setReportType("instalados")}
          >
            <FileText className="mr-2 h-4 w-4" /> Por Fecha
          </Button>
          <Button
            variant={reportType === "lote" ? "default" : "outline"}
            onClick={() => setReportType("lote")}
          >
            <FileText className="mr-2 h-4 w-4" /> Por Lote
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-lg">
            {reportType === "instalados" && "Reporte por Fecha"}
            {reportType === "lote" && "Reporte por Lote"}
            {reportType === "completo" && "Reporte Completo (Fecha + Lote)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selector de Fechas (visible para reportes por fecha y completos) */}
          {(reportType === "instalados" || reportType === "completo") && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Rango de Fechas</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-xs">Fecha inicial</Label>
                  </div>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    disabled={isGenerating}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-xs">Fecha final</Label>
                  </div>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    disabled={isGenerating}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selector de Meses (solo para reporte por lote) */}
          {reportType === "lote" && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Rango de Meses (Opcional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Mes inicial</Label>
                  <Input
                    type="month"
                    value={monthRange.start}
                    onChange={(e) => setMonthRange({ ...monthRange, start: e.target.value })}
                    disabled={isGenerating}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Mes final</Label>
                  <Input
                    type="month"
                    value={monthRange.end}
                    onChange={(e) => setMonthRange({ ...monthRange, end: e.target.value })}
                    disabled={isGenerating}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botón de Generar */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating ||
                (reportType === "instalados" && (!dateRange.start || !dateRange.end)) ||
                (reportType === "lote" && !selectedLot) ||
                (reportType === "completo" && (!selectedLot || !dateRange.start || !dateRange.end))
              }
              className="min-w-[180px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generar Reporte
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}