"use client"

import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
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
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LotData } from "@/types/types";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

export default function ReportPage() {
  const { data: session } = useSession();
  const [reportType, setReportType] = useState<"act_dates" | "act_lot" | "labeled_lot">("act_dates");
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

      if (session?.user?.lot?.id) {
        const userLotId = session.user.lot.id.toString();
        if (data.data.some((lot: LotData) => lot.id.toString() === userLotId)) {
          setSelectedLot(userLotId);
        }
      }
    } catch (error) {
      console.error("Error fetching lots:", error);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      let apiUrl = "";
      let fileName = "";

      if (reportType === "act_dates") {
        if (!dateRange.start || !dateRange.end) {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "Debe seleccionar ambas fechas",
            showConfirmButton: true
          });
          return;
        }

        if (new Date(dateRange.start) > new Date(dateRange.end)) {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "La fecha de inicio no puede ser mayor a la fecha final",
            showConfirmButton: true
          });
          return;
        }

        apiUrl = `/api/report/reportactdates?startDate=${dateRange.start}&endDate=${dateRange.end}`;
        fileName = `Reporte_Instalados_${dateRange.start}_a_${dateRange.end}_${currentDate}.xlsx`;
      }
      if (reportType === "act_lot") {
        if (!selectedLot) {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "Debe seleccionar un lote",
            showConfirmButton: true
          });
          return;
        }
        const lotName = lots.find(lot => lot.id.toString() === selectedLot)?.name || "Lote";
        apiUrl = `/api/report/reportactlot?lot=${selectedLot}`;
        fileName = `Reporte_${lotName}_${currentDate}.xlsx`;
      }

      if (reportType === "labeled_lot") {
        if (!selectedLot) {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "Debe seleccionar un lote",
            showConfirmButton: true
          });
          return;
        }
        const lotName = lots.find(lot => lot.id.toString() === selectedLot)?.name || "Lote";
        apiUrl = `/api/report/reportlabeled?lot=${selectedLot}`;
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
      console.log("Error generating report:", error);

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
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Generador de Reportes</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Selecciona el tipo de reporte y completa los parámetros necesarios para generarlo.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Selector de tipo de reporte */}
        <Card className="border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-800 dark:text-white">
              Tipo de Reporte
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Selecciona el tipo de reporte que deseas generar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={reportType === "act_dates" ? "default" : "outline"}
                onClick={() => setReportType("act_dates")}
                className="gap-2 px-4 py-2 rounded-lg transition-all"
              >
                <FileText className="h-4 w-4" />
                <span>Actas por Fecha</span>
                {reportType === "act_dates" && <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
              <Button
                variant={reportType === "act_lot" ? "default" : "outline"}
                onClick={() => setReportType("act_lot")}
                className="gap-2 px-4 py-2 rounded-lg transition-all"
              >
                <FileText className="h-4 w-4" />
                <span>Actas por Lote</span>
                {reportType === "act_lot" && <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
              <Button
                variant={reportType === "labeled_lot" ? "default" : "outline"}
                onClick={() => setReportType("labeled_lot")}
                className="gap-2 px-4 py-2 rounded-lg transition-all"
              >
                <FileText className="h-4 w-4" />
                <span>Rotulado por lote</span>
                {reportType === "labeled_lot" && <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de parámetros */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-800 dark:text-white">
              Parámetros del Reporte
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {reportType === "act_dates"
                ? "Selecciona el rango de fechas para el reporte"
                : "Selecciona el lote para generar el reporte"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {reportType === "act_dates" &&
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rango de Fechas
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="h-4 w-4" />
                        <Label className="text-xs">Fecha inicial</Label>
                      </div>
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        disabled={isGenerating}
                        className="h-10 border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="h-4 w-4" />
                        <Label className="text-xs">Fecha final</Label>
                      </div>
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        disabled={isGenerating}
                        className="h-10 border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            }
            {
              reportType === "act_lot" &&
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Seleccionar Lote
                  </Label>
                  <Select
                    value={selectedLot}
                    onValueChange={setSelectedLot}
                    disabled={isGenerating}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 rounded-lg h-10">
                      <SelectValue placeholder="Selecciona un lote">
                        {selectedLot ? lots.find(l => l.id.toString() === selectedLot)?.name : "Selecciona un lote"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200 dark:border-gray-700">
                      {lots.map((lot) => (
                        <SelectItem
                          key={lot.id}
                          value={lot.id.toString()}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {lot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
            {
              reportType === "labeled_lot" &&
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Seleccionar Lote
                  </Label>
                  <Select
                    value={selectedLot}
                    onValueChange={setSelectedLot}
                    disabled={isGenerating}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 rounded-lg h-10">
                      <SelectValue placeholder="Selecciona un lote">
                        {selectedLot ? lots.find(l => l.id.toString() === selectedLot)?.name : "Selecciona un lote"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-200 dark:border-gray-700">
                      {lots.map((lot) => (
                        <SelectItem
                          key={lot.id}
                          value={lot.id.toString()}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {lot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating ||
                  (reportType === "act_dates" && (!dateRange.start || !dateRange.end)) ||
                  (reportType === "act_lot" && !selectedLot) ||
                  (reportType === "labeled_lot" && !selectedLot)
                }
                className="min-w-[180px] h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
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
    </div>
  );
}