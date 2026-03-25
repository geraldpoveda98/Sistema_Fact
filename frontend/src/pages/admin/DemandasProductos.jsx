import { API_BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart3, PieChart, TrendingUp, Download, FileSpreadsheet, FileText, Search, Activity
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Colores modernos para Gráficos
const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b'];

const DemandasProductos = () => {
    

    // State
    const [demandas, setDemandas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch data - Por ahora simularemos cálculos basados en Artículos si no hay un endpoint de demanda
    // Lo ideal será luego tener un endpoint /api/articulos/demanda que haga el JOIN con compras/ventas
    const fetchDemandas = async () => {
        try {
            setLoading(true);
            // Reutilizamos el endpoint de artículos para extraer la información base de productos
            const res = await axios.get(`${API_BASE_URL}/api/articulos`);
            const dataBase = res.data;

            // Mapeamos para crear una estructura con demanda (mock o real si existe un endpoint específico luego)
            let totalGeneral = 0;
            const dataProcesada = dataBase.map((art, index) => {
                // Como no hay histórico de ventas aún, usaremos el `stock` o generaremos un número aleatorio simulando la demanda
                // Nota: Esto debe ser reemplazado por los datos reales de facturación/ventas en el backend.
                const demandaSimulada = art.stock > 0 ? art.stock * (Math.floor(Math.random() * 5) + 1) : Math.floor(Math.random() * 100);
                totalGeneral += demandaSimulada;
                return {
                    id: art._id,
                    codigo: art.codigo,
                    nombre: art.nombre,
                    descripcion: art.descripcion || 'Sin descripción',
                    categoria: art.categoria?.nombre || 'General',
                    demanda: demandaSimulada,
                }
            }).sort((a, b) => b.demanda - a.demanda); // Ordenar mayor a menor demanda

            // Calcular Porcentajes y Acumulados (Análisis ABC)
            let acumulado = 0;
            const dataFinal = dataProcesada.map(item => {
                const porcentaje = totalGeneral > 0 ? (item.demanda / totalGeneral) * 100 : 0;
                acumulado += porcentaje;

                // Clasificación ABC básica (A: 0-80%, B: 80-95%, C: 95-100%)
                let claseABC = 'C';
                if (acumulado <= 80) claseABC = 'A';
                else if (acumulado <= 95) claseABC = 'B';

                return {
                    ...item,
                    porcentaje: porcentaje.toFixed(2),
                    acumulado: acumulado.toFixed(2),
                    claseABC
                };
            });

            setDemandas(dataFinal);
        } catch (error) {
            console.error("Error cargando la demanda", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDemandas();
    }, []);

    // Preparar Datos para Gráficas
    // 1. Porcentaje por Categoría
    const catMap = {};
    demandas.forEach(d => {
        catMap[d.categoria] = (catMap[d.categoria] || 0) + d.demanda;
    });
    const dataCategoria = Object.keys(catMap).map(cat => ({ name: cat, value: catMap[cat] })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

    // 2. Ventas por Demanda ABC
    const abcMap = { A: 0, B: 0, C: 0 };
    demandas.forEach(d => abcMap[d.claseABC] += d.demanda);
    const dataABC = [
        { name: 'Clase A (Alta Demanda)', value: abcMap.A },
        { name: 'Clase B (Media)', value: abcMap.B },
        { name: 'Clase C (Baja)', value: abcMap.C },
    ];

    // 3. General por pieza (Top 10)
    const dataPiezas = demandas.slice(0, 10).map(d => ({
        name: d.nombre.length > 15 ? d.nombre.substring(0, 15) + '...' : d.nombre,
        demanda: d.demanda
    }));

    // Filtrado para tabla
    const filteredDemandas = demandas.filter(d =>
        d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // EXPORTACIÓN A EXCEL
    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredDemandas.map(d => ({
            'Código': d.codigo,
            'Nombre': d.nombre,
            'Descripción': d.descripcion,
            'Categoría': d.categoria,
            'Demanda (Uds)': d.demanda,
            '% Participación': d.porcentaje + '%',
            '% Acumulado': d.acumulado + '%',
            'Clasificación ABC': d.claseABC
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Demanda");
        XLSX.writeFile(workbook, "Reporte_Demanda_Productos.xlsx");
    };

    // EXPORTACIÓN A PDF
    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Reporte: Demanda Analítica de Productos (ABC)", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableColumn = ["Código", "Nombre", "Categoría", "Demanda", "% Part.", "% Acum.", "Clase"];
        const tableRows = [];

        filteredDemandas.forEach(d => {
            const rowData = [
                d.codigo,
                d.nombre.substring(0, 20),
                d.categoria,
                d.demanda.toString(),
                `${d.porcentaje}%`,
                `${d.acumulado}%`,
                d.claseABC
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [14, 165, 233] }, // Color cyan 500
        });

        doc.save("Reporte_Demanda_Productos.pdf");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Demandas de Productos</h1>
                        <p className="text-slate-500 dark:text-slate-400 transition-colors">Análisis de rotación y clasificación ABC de inventario.</p>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button onClick={exportToExcel} className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5">
                        <FileSpreadsheet size={18} /><span>Excel</span>
                    </button>
                    <button onClick={exportToPDF} className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-rose-500/30 transition-all hover:-translate-y-0.5">
                        <FileText size={18} /><span>PDF</span>
                    </button>
                </div>
            </div>

            {/* CHARTS ROW */}
            {loading ? (
                <div className="h-64 flex items-center justify-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Calculando métricas analíticas...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pie Chart: Categoria */}
                    <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[350px]">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center"><PieChart size={18} className="mr-2 text-indigo-500" /> Porcentaje por Categoría</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie data={dataCategoria} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {dataCategoria.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart: ABC */}
                    <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[350px]">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center"><TrendingUp size={18} className="mr-2 text-emerald-500" /> Ventas por Demanda (ABC)</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataABC} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
                                        {dataABC.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart: General por pieza */}
                    <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[350px]">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center"><BarChart3 size={18} className="mr-2 text-cyan-500" /> Demanda General por Pieza (Top 10)</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataPiezas} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="demanda" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={15} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* TABLA DE DEMANDA */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                    <h3 className="font-bold text-slate-800 dark:text-white">Análisis Detallado</h3>

                    <div className="relative w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar producto o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Demanda</th>
                                <th className="px-6 py-4 font-semibold">Código</th>
                                <th className="px-6 py-4 font-semibold">Nombre</th>
                                <th className="px-6 py-4 font-semibold hidden md:table-cell">Descripción</th>
                                <th className="px-6 py-4 font-semibold">Categoría</th>
                                <th className="px-6 py-4 font-semibold text-right">Porcentaje</th>
                                <th className="px-6 py-4 font-semibold text-right">Acumulado</th>
                                <th className="px-6 py-4 font-semibold text-center">Clas. ABC</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                            {filteredDemandas.length > 0 ? (
                                filteredDemandas.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-base">{item.demanda}</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">{item.codigo}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.nombre}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell truncate max-w-[200px]" title={item.descripcion}>
                                            {item.descripcion}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                {item.categoria}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-300">{item.porcentaje}%</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-300">{item.acumulado}%</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                                ${item.claseABC === 'A' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' :
                                                    item.claseABC === 'B' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50' :
                                                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                                }`}>
                                                {item.claseABC}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        {loading ? 'Cargando datos...' : 'No se encontraron datos coincidentes.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default DemandasProductos;
