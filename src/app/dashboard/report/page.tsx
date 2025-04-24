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

export default function ReportPage() {
  const { data: session } = useSession();
  const [reportType, setReportType] = useState<"instalados" | "lote">("instalados");
  const [selectedLot, setSelectedLot] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lots, setLots] = useState<LotData[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const fetchLots = async () => {
    try {
      const response = await fetch("/api/lot/listlots");
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      setLots(data.data);

      // Si hay un lote en la sesión, seleccionarlo por defecto
      if (session?.user?.lot?.id) {
        const userLotId = session.user.lot.id.toString();
        if (data.data.some((lot: LotData) => lot.id.toString() === userLotId)) {
          setSelectedLot(userLotId);
        }
      }
    } catch (error) {
      console.error("Error fetching lots:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los lotes",
        timer: 1500
      });
    }
  };
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      let apiUrl = "";
      let fileName = "";

      // Validaciones del lado del cliente para el reporte de instalados
      if (reportType === "instalados") {
        if (!dateRange.start || !dateRange.end) {
          // Usamos Swal.fire directamente en lugar de throw para evitar el error en consola
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "Debe seleccionar ambas fechas",
            showConfirmButton: true
          });
          return; // Salimos de la función
        }

        // Validar que fecha inicio no sea mayor que fecha fin
        if (new Date(dateRange.start) > new Date(dateRange.end)) {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "La fecha de inicio no puede ser mayor a la fecha final",
            showConfirmButton: true
          });
          return; // Salimos de la función
        }

        apiUrl = `/api/report/reportdates?startDate=${dateRange.start}&endDate=${dateRange.end}`;
        fileName = `Reporte_Instalados_${dateRange.start}_a_${dateRange.end}_${currentDate}.xlsx`;
      } else {
        if (!selectedLot) {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "Debe seleccionar un lote",
            showConfirmButton: true
          });
          return; // Salimos de la función
        }
        const lotName = lots.find(lot => lot.id.toString() === selectedLot)?.name || "Lote";
        apiUrl = `/api/report/reportlot?lot=${selectedLot}`;
        fileName = `Reporte_${lotName}_${currentDate}.xlsx`;
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = errorData.error;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          console.log("No se pudo parsear la respuesta de error", e);
        }

        await Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          showConfirmButton: true
        });
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName.replace(/\s+/g, '_');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100);

      await Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Reporte "${fileName}" generado correctamente`,
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      console.log("Error generating report:", error); // Usamos console.log en lugar de console.error

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Error al generar el reporte",
        showConfirmButton: true
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchLots();
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
            {reportType === "instalados" ? "Reporte por Fecha" : "Reporte por Lote"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {reportType === "instalados" ? (
            <div className="space-y-6">
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
          ) : (
            <>
              <div className="space-y-2">
                <Label>Seleccionar Lote</Label>
                <Select
                  value={selectedLot}
                  onValueChange={setSelectedLot}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un lote">
                      {selectedLot ? lots.find(l => l.id.toString() === selectedLot)?.name : "Selecciona un lote"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id.toString()}>
                        {lot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating ||
                (reportType === "instalados" && (!dateRange.start || !dateRange.end)) ||
                (reportType === "lote" && !selectedLot)
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