import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search, FileSpreadsheet, FileText, AlertTriangle, Layers, ArrowDownToLine, Archive, CheckCircle2, XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Importaciones para Exportar
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ListaInventario = () => {
    const apiBaseUrl = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`);
    const { user } = useAuth();

    const [articulos, setArticulos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroStock, setFiltroStock] = useState('todos'); // 'todos' | 'bajos'

    useEffect(() => {
        fetchInventario();
    }, []);

    const fetchInventario = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${apiBaseUrl}/api/articulos`);
            setArticulos(response.data);
        } catch (error) {
            console.error("Error al cargar inventario:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtro Dual (Buscador Textual + Select Riesgo)
    const filteredArticulos = articulos.filter(art => {
        const matchesSearch =
            art.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            art.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            art.idcategoria?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            art.idmodelo?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStock = filtroStock === 'todos' ? true : (art.stock <= art.stock_minimo);

        return matchesSearch && matchesStock;
    });

    // ===== LÓGICA EXCEL =====
    const handleExportExcel = () => {
        if (filteredArticulos.length === 0) return alert("No hay datos para exportar.");

        const exportData = filteredArticulos.map(art => ({
            "Código": art.codigo,
            "Nombre": art.nombre,
            "Descripción": art.descripcion || 'N/A',
            "No. Parte": art.numeroParte || '-',
            "Fabricante": art.fabricante || '-',
            "Categoría": art.idcategoria?.nombre || 'General',
            "Modelo": art.idmodelo?.nombre || 'General',
            "Stock Actual": art.stock,
            "Inv. Mínimo": art.stock_minimo,
            "Estado": art.condicion ? 'Activo' : 'Inactivo',
            "Nivel de Alerta": art.stock <= art.stock_minimo ? 'Bajo Stock' : 'Estable'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Inventario");
        XLSX.writeFile(wb, `Reporte_Inventario_${new Date().toLocaleDateString('es-NI')}.xlsx`);
    };

    // ===== LÓGICA PDF =====
    const handleExportPDF = () => {
        if (filteredArticulos.length === 0) return alert("No hay datos para exportar.");

        const doc = new jsPDF('landscape');
        doc.text("Reporte de Inventario de Almacén", 14, 15);
        doc.setFontSize(10);
        doc.text(`Fecha generada: ${new Date().toLocaleDateString('es-NI')} - RPM v2.0`, 14, 22);

        const tableColumn = ["Código", "No.Parte", "Nombre", "Marca", "Categoría", "Stock", "Mínimo", "Estado"];
        const tableRows = [];

        filteredArticulos.forEach(art => {
            const rowData = [
                art.codigo,
                art.numeroParte || '-',
                art.nombre,
                art.fabricante || '-',
                art.idcategoria?.nombre || '-',
                art.idmodelo?.nombre || '-',
                art.stock.toString(),
                art.stock_minimo.toString(),
                art.condicion ? "Activo" : "Inactivo"
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'striped',
            headStyles: { fillColor: [8, 145, 178] }, // cyan-600
        });

        doc.save(`Reporte_Inventario_${new Date().toLocaleDateString('es-NI')}.pdf`);
    };


    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">

            {/* CABECERA (Header) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Layers className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Lista de Inventario</h1>
                        <p className="text-slate-500 dark:text-slate-400">Verifique existencias, umbrales y exporte sus reportes.</p>
                    </div>
                </div>

                {/* Botones de Exportación */}
                <div className="flex space-x-3 w-full md:w-auto">
                    <button
                        onClick={handleExportExcel}
                        className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    >
                        <FileSpreadsheet size={16} className="mr-2" /> Excel
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                    >
                        <FileText size={16} className="mr-2" /> PDF
                    </button>
                </div>
            </div>

            {/* FILTROS (Barra de Control Superior) */}
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">

                <div className="relative w-full md:w-2/3">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar repuestos por código o nombre..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="w-full md:w-1/3 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl p-1">
                    <button
                        onClick={() => setFiltroStock('todos')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${filtroStock === 'todos' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Todo el Stock
                    </button>
                    <button
                        onClick={() => setFiltroStock('bajos')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${filtroStock === 'bajos' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <AlertTriangle size={14} className="mr-1.5" /> Bajos/Agotados
                    </button>
                </div>

            </div>

            {/* TABLA PRINCIPAL (DataGrid Custom) */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-mono text-indigo-600 dark:text-indigo-400">Código</th>
                                <th className="px-6 py-4">No. Parte</th>
                                <th className="px-6 py-4">Nombre</th>
                                <th className="px-6 py-4">Descripción</th>
                                <th className="px-6 py-4">Marca</th>
                                <th className="px-6 py-4">Categoría</th>
                                <th className="px-6 py-4">Modelo</th>
                                <th className="px-6 py-4 text-center">Imagen</th>
                                <th className="px-6 py-4 text-center font-black">Stock</th>
                                <th className="px-6 py-4 text-center text-slate-500">Inv. Mínimo</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="px-6 py-12 text-center text-slate-500 animate-pulse">
                                        Calculando métricas de inventario...
                                    </td>
                                </tr>
                            ) : filteredArticulos.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="px-6 py-16 text-center text-slate-500">
                                        <Archive size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
                                        No se encontraron registros de repuestos en bodega.
                                    </td>
                                </tr>
                            ) : (
                                filteredArticulos.map(art => {
                                    // Determinar si hay alerta de stock
                                    const isLowStock = art.stock <= art.stock_minimo;

                                    return (
                                        <tr key={art._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${isLowStock ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`}>

                                            <td className="px-6 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                                                {art.codigo}
                                            </td>
                                            <td className="px-6 py-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                                {art.numeroParte || '-'}
                                            </td>
                                            <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">
                                                {art.nombre}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="truncate max-w-[200px] text-slate-500" title={art.descripcion}>
                                                    {art.descripcion || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-slate-700 dark:text-slate-300 font-medium">
                                                {art.fabricante || '-'}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {art.idcategoria?.nombre || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {art.idmodelo?.nombre || 'General'}
                                                </span>
                                            </td>

                                            {/* Imagen del Artículo */}
                                            <td className="px-6 py-3 text-center">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto overflow-hidden flex items-center justify-center">
                                                    {art.imagen ? (
                                                        <img 
                                                            src={art.imagen.startsWith('http') ? art.imagen : `${apiBaseUrl}/${art.imagen}`} 
                                                            alt={art.codigo} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400">N/A</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Sémaforo de Stocks */}
                                            <td className="px-6 py-3 text-center">
                                                <div className={`px-3 py-1.5 rounded-xl font-bold font-mono inline-block ${isLowStock
                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 animate-pulse'
                                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                    }`}>
                                                    {art.stock}
                                                    {isLowStock && <AlertTriangle size={14} className="inline ml-2 -mt-1" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center font-mono text-slate-500 dark:text-slate-400 font-medium">
                                                {art.stock_minimo}
                                            </td>

                                            {/* Estado Visual */}
                                            <td className="px-6 py-3 text-center">
                                                {art.condicion ? (
                                                    <CheckCircle2 size={18} className="text-emerald-500 mx-auto" title="Activo" />
                                                ) : (
                                                    <XCircle size={18} className="text-rose-500 mx-auto" title="Inactivo" />
                                                )}
                                            </td>

                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Tabla (Contadores) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-semibold text-slate-500">
                    <span>Total de Referencias Analizadas:</span>
                    <span className="bg-white dark:bg-slate-900 px-3 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                        {filteredArticulos.length} repuestos {filtroStock === 'bajos' ? 'con riesgo' : 'en total'}
                    </span>
                </div>

            </div>
        </div>
    );
};

export default ListaInventario;
