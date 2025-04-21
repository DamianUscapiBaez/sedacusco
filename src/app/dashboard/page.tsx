"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BsSpeedometer } from 'react-icons/bs';
import { IoDocumentText } from "react-icons/io5";
import { LotData } from '@/types/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

type DocumentData = {
  _count: {
    updatedPreCatastrals: number;
    updatedActHistories: number;
  };
  names: string;
};

export default function DashboardPage() {
  const [lots, setLots] = useState<LotData[]>([]);
  const [totals, setTotals] = useState({
    installed: 0,
    preInstalled: 0
  });
  const [selectedLot, setSelectedLot] = useState("2");
  const [selectedFilter, setSelectedFilter] = useState("hoy");
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<DocumentData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Función genérica para fetch con manejo de errores
  const fetchData = useCallback(async <T,>(url: string): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`Error fetching data from ${url}:`, err);
      setError(`Error al cargar datos: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Obtener lista de lotes
  const fetchLots = useCallback(async () => {
    const data = await fetchData<{ data: LotData[] }>("/api/lot/listlots");
    if (data) setLots(data.data);
  }, [fetchData]);

  // Obtener totales
  const fetchTotals = useCallback(async (lotId: string) => {
    const [installed, preInstalled] = await Promise.all([
      fetchData<{ count: number }>(`/api/act/totalinstalled?lot=${lotId}`),
      fetchData<{ count: number }>(`/api/precatastral/totalinstalled?lot=${lotId}`)
    ]);

    if (installed && preInstalled) {
      setTotals({
        installed: installed.count,
        preInstalled: preInstalled.count
      });
    }
  }, [fetchData]);

  // Obtener datos para el gráfico
  const fetchChartData = useCallback(async () => {
    const data = await fetchData<{ data: DocumentData[] }>(
      `/api/user/getdocuments?lot=${selectedLot}&filterType=${selectedFilter}`
    );
    if (data) setChartData(data.data);
  }, [fetchData, selectedLot, selectedFilter]);

  // Efectos secundarios
  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  useEffect(() => {
    fetchTotals(selectedLot);
    fetchChartData();
  }, [fetchTotals, fetchChartData, selectedLot, selectedFilter]);

  // Manejadores de cambio
  const handleLotChange = useCallback((value: string) => {
    setSelectedLot(value);
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setSelectedFilter(value);
  }, []);

  // Opciones del select
  const lotOptions = useMemo(() => (
    lots.map((item) => (
      <SelectItem key={item.id} value={item.id.toString()}>
        {item.name}
      </SelectItem>
    ))
  ), [lots]);

  // Datos formateados para el gráfico
  const formattedChartData = useMemo(() => {
    return chartData.map(item => ({
      name: item.names,
      Actas: item._count.updatedActHistories,
      PreCatastro: item._count.updatedPreCatastrals
    }));
  }, [chartData]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Encabezado y Selector */}
        <Card className="p-5 rounded-lg shadow-md">
          <CardContent className="flex flex-row justify-between gap-4">
            <CardTitle className="text-2xl font-bold">Dashboard</CardTitle>
            <div>
              <Label className="w-full mb-2 text-sm font-medium">Seleccionar Lote</Label>
              <Select value={selectedLot} onValueChange={handleLotChange}>
                <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {lotOptions}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarjetas */}
          <div className="space-y-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Actas Instaladas
                </CardTitle>
                <div className={`p-2 rounded-lg ${isLoading ? 'bg-gray-100' : 'bg-blue-100'}`}>
                  <BsSpeedometer className={`w-5 h-5 ${isLoading ? 'text-gray-400 animate-pulse' : 'text-blue-600'}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? (
                    <div className="h-8 w-24 rounded animate-pulse" />
                  ) : (
                    totals.installed.toLocaleString()
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Total acumulado</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pre Catastro
                </CardTitle>
                <div className={`p-2 rounded-lg ${isLoading ? 'bg-gray-100' : 'bg-green-100'}`}>
                  <IoDocumentText className={`w-5 h-5 ${isLoading ? 'text-gray-400 animate-pulse' : 'text-green-600'}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? (
                    <div className="h-8 w-24 rounded animate-pulse" />
                  ) : (
                    totals.preInstalled.toLocaleString()
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Total acumulado</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico */}
          <Card className="lg:col-span-2 p-6 rounded-lg shadow-sm">
            <CardHeader className="flex items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">
                Distribución por Técnico
              </CardTitle>
              <Select value={selectedFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filtro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="h-[280px]">
              {formattedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="Actas"
                      fill="#3B82F6"
                      name="Actas Instaladas"
                    />
                    <Bar
                      dataKey="PreCatastro"
                      fill="#10B981"
                      name="Pre Catastro"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {isLoading ? 'Cargando datos...' : 'No hay datos disponibles'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}