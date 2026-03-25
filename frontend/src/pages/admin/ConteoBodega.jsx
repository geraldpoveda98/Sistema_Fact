import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    ClipboardCheck, Plus, List, Search, CalendarDays, MoreVertical, Trash2, CheckCircle, ShieldAlert, FileSpreadsheet, FileText
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

const ConteoBodega = () => {
    const apiBaseUrl = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`);
    const { user } = useAuth();

    // ===== Estados: TABS =====
    const [activeTab, setActiveTab] = useState('nuevo'); // 'nuevo' | 'historial'

    // ===== Estados: NUEVO CONTEO =====
    const [compras, setCompras] = useState([]);
    const [compraSeleccionada, setCompraSeleccionada] = useState('');
    const [fechaConteo, setFechaConteo] = useState(new Date().toISOString().split('T')[0]);
    const [detallesConteo, setDetallesConteo] = useState([]);
    const [saving, setSaving] = useState(false);

    // ===== Estados: HISTORIAL =====
    const [historialConteos, setHistorialConteos] = useState([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
    const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());
    const [searchTermHistorial, setSearchTermHistorial] = useState('');
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Globales
    const [toastMessage, setToastMessage] = useState(null);

    const meses = [
        { id: 1, nombre: 'Enero' }, { id: 2, nombre: 'Febrero' }, { id: 3, nombre: 'Marzo' },
        { id: 4, nombre: 'Abril' }, { id: 5, nombre: 'Mayo' }, { id: 6, nombre: 'Junio' },
        { id: 7, nombre: 'Julio' }, { id: 8, nombre: 'Agosto' }, { id: 9, nombre: 'Septiembre' },
        { id: 10, nombre: 'Octubre' }, { id: 11, nombre: 'Noviembre' }, { id: 12, nombre: 'Diciembre' }
    ];
    const anios = Array.from(new Array(10), (val, index) => new Date().getFullYear() - 5 + index);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.dropdown-container')) setActiveDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (activeTab === 'nuevo') {
            fetchComprasParaConteo();
        } else {
            fetchHistorial();
        }
    }, [activeTab, filtroMes, filtroAnio]);

    const showToast = (message, type = "success") => {
        setToastMessage({ text: message, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // ----- LOGICA: NUEVO CONTEO -----
    const fetchComprasParaConteo = async () => {
        try {
            const res = await axios.get(`${apiBaseUrl}/api/compras/para-conteo`);
            setCompras(res.data);
        } catch (error) {
            showToast("Error al cargar comprobantes listos para conteo", "error");
        }
    };

    const handleSelectCompra = (e) => {
        const selectedId = e.target.value;
        setCompraSeleccionada(selectedId);

        if (!selectedId) {
            setDetallesConteo([]);
            return;
        }

        const compraTarget = compras.find(c => c._id === selectedId);
        if (compraTarget && compraTarget.detalles) {
            // Inicializar las columnas de conteo clonando la data original
            const initDetalles = compraTarget.detalles.map(d => ({
                ...d,
                conteo_fisico: d.cantidad_esperada // Sugerencia inicial
            }));
            setDetallesConteo(initDetalles);
        }
    };

    const handleConteoChange = (articuloId, newValue) => {
        setDetallesConteo(detallesConteo.map(det => {
            if (det.articulo_id === articuloId) {
                return { ...det, conteo_fisico: Number(newValue) >= 0 ? Number(newValue) : 0 };
            }
            return det;
        }));
    };

    const handleSaveConteo = async () => {
        if (!compraSeleccionada) return showToast("Seleccione un comprobante de compra.", "error");

        const payload = {
            compra: compraSeleccionada,
            fecha: new Date(fechaConteo).toISOString(),
            usuario: user.id || user._id,
            detalles: detallesConteo.map(d => ({
                articulo: d.articulo_id,
                cantidad_esperada: d.cantidad_esperada,
                conteo_fisico: d.conteo_fisico
            }))
        };

        try {
            setSaving(true);
            await axios.post(`${apiBaseUrl}/api/conteos`, payload);
            showToast("Auditoría guardada exitosamente");
            setCompraSeleccionada('');
            setDetallesConteo([]);
            // Podemos redirigir al historial para que vea el resultado
            setTimeout(() => setActiveTab('historial'), 1500);
        } catch (error) {
            showToast(error.response?.data?.error || "Error al guardar conteo", "error");
        } finally {
            setSaving(false);
        }
    };

    // ----- LOGICA: HISTORIAL -----
    const fetchHistorial = async () => {
        try {
            setLoadingHistorial(true);
            const res = await axios.get(`${apiBaseUrl}/api/conteos`, {
                params: { mes: filtroMes, anio: filtroAnio }
            });
            setHistorialConteos(res.data);
        } catch (error) {
            showToast("Error al cargar historial", "error");
        } finally {
            setLoadingHistorial(false);
        }
    };

    const filteredHistorial = historialConteos.filter(c => {
        const term = searchTermHistorial.toLowerCase();
        return (
            (c.usuario?.nombre || '').toLowerCase().includes(term) ||
            (c.compra?.comprobante || '').toLowerCase().includes(term) ||
            (c._id || '').toLowerCase().includes(term)
        );
    });

    const handleDeleteConteo = async (id) => {
        if (window.confirm("¿Seguro que desea eliminar esta auditoría de conteo?")) {
            try {
                await axios.delete(`${apiBaseUrl}/api/conteos/${id}`);
                showToast("Conteo eliminado con éxito");
                fetchHistorial();
                setActiveDropdown(null);
            } catch (e) {
                showToast("Error al eliminar", "error");
            }
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-NI');

    const handleExportExcel = () => {
        const dataToExport = filteredHistorial.map(c => ({
            'ID': c._id,
            'Fecha': formatDate(c.fecha),
            'Auditor': c.usuario?.nombre || 'N/A',
            'Items': c.total_items,
            'Comprobante': c.compra?.comprobante || 'N/A',
            'Estado': c.estado_diferencia === 'OK' ? 'Exacto' : 'Con Diferencias'
        }));
        exportToExcel(dataToExport, 'Historial_Conteos', 'Conteos');
    };

    const handleExportPDF = () => {
        const columns = [
            { header: 'Fecha', key: (c) => formatDate(c.fecha) },
            { header: 'Auditor', key: (c) => c.usuario?.nombre || 'N/A' },
            { header: 'Comprobante', key: (c) => c.compra?.comprobante || 'N/A' },
            { header: 'Items', key: 'total_items' },
            { header: 'Estado', key: (c) => c.estado_diferencia === 'OK' ? 'Exacto' : 'Diferencias' }
        ];
        exportToPDF(columns, filteredHistorial, 'Historial_Conteos', 'Historial de Conteos de Bodega');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">

            {/* CABECERA (Header) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                        <ClipboardCheck className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Conteo de Bodega</h1>
                        <p className="text-slate-500 dark:text-slate-400">Audite la mercancía contra los comprobantes de ingreso.</p>
                    </div>
                </div>

                {/* TABS NAVEGACIÓN */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('nuevo')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-all ${activeTab === 'nuevo' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Plus size={16} className="mr-2" /> Agregar Nuevo
                    </button>
                    <button
                        onClick={() => setActiveTab('historial')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-all ${activeTab === 'historial' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <List size={16} className="mr-2" /> Historial de Conteos
                    </button>
                </div>
            </div>

            {/* ====== VISTA: NUEVO CONTEO ====== */}
            {activeTab === 'nuevo' && (
                <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">

                    {/* Filtros Modalidad Agregar */}
                    <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-end gap-6">
                        <div className="w-full md:w-2/3">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Comprobantes de Compras:</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 shadow-inner font-medium text-slate-900 dark:text-white"
                                value={compraSeleccionada} onChange={handleSelectCompra}
                            >
                                <option value="">Seleccione Factura / Ingreso</option>
                                {compras.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.comprobante} ({formatDate(c.fecha)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full md:w-1/3">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Fecha (*):</label>
                            <div className="relative">
                                <CalendarDays className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="date" required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 shadow-inner font-medium"
                                    value={fechaConteo} onChange={(e) => setFechaConteo(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabla Interactiva de Conteo */}
                    <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-800 dark:text-white">Artículos a Auditar</h3>
                        </div>
                        <div className="overflow-x-auto min-h-[300px]">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 font-mono text-indigo-600 dark:text-indigo-400">Código</th>
                                        <th className="px-6 py-4">Artículo</th>
                                        <th className="px-6 py-4">Categoría</th>
                                        <th className="px-6 py-4">Modelo</th>
                                        <th className="px-6 py-4 text-center">Cantidad Esperada</th>
                                        <th className="px-6 py-4 text-center font-bold text-amber-600 dark:text-amber-400">Tú Conteo Físico</th>
                                        <th className="px-6 py-4 text-center w-32">Diferencia</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                                    {detallesConteo.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-16 text-center text-slate-500">
                                                <ClipboardCheck size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
                                                Seleccione un comprobante de compras válido arriba para cargar los ítems a verificar.
                                            </td>
                                        </tr>
                                    ) : (
                                        detallesConteo.map(det => {
                                            const diff = det.conteo_fisico - det.cantidad_esperada;
                                            return (
                                                <tr key={det.articulo_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-6 py-3 font-mono font-medium text-slate-600 dark:text-slate-400">{det.codigo}</td>
                                                    <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">{det.nombre}</td>
                                                    <td className="px-6 py-3 text-slate-500">{det.categoria}</td>
                                                    <td className="px-6 py-3 text-slate-500">{det.modelo}</td>
                                                    <td className="px-6 py-3 text-center text-lg font-mono text-slate-400">{det.cantidad_esperada}</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <input
                                                            type="number" min="0" step="1"
                                                            className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-center rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-amber-500 shadow-inner font-bold text-lg text-amber-600 dark:text-amber-400"
                                                            value={det.conteo_fisico === '' ? '' : det.conteo_fisico}
                                                            onChange={(e) => handleConteoChange(det.articulo_id, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        {diff === 0 ? (
                                                            <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs">OK (0)</span>
                                                        ) : diff > 0 ? (
                                                            <span className="px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold font-mono text-xs">+{diff} SOBRANTE</span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold font-mono text-xs">{diff} FALTANTE</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Area de Subida */}
                        {detallesConteo.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 p-6 flex justify-end">
                                <button
                                    onClick={handleSaveConteo} disabled={saving}
                                    className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center ${saving ? 'bg-slate-300 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 active:scale-95'}`}
                                >
                                    <ClipboardCheck size={20} className="mr-2" />
                                    {saving ? 'Validando...' : 'Finalizar y Guardar Auditoría'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ====== VISTA: HISTORIAL ====== */}
            {activeTab === 'historial' && (
                <div className="animate-in slide-in-from-left-4 duration-300 space-y-6">

                    {/* Filtros Modalidad Historial */}
                    <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-end gap-6">
                        <div className="w-full md:w-1/4">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Seleccionar Mes de:</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}
                            >
                                {meses.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            </select>
                        </div>
                        <div className="w-full md:w-1/4">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Del Año:</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}
                            >
                                {anios.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="w-full md:w-2/4 flex items-end gap-2">
                            <div className="flex-grow relative">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Buscar:</label>
                                <Search className="absolute left-3 top-9 text-slate-400" size={18} />
                                <input
                                    type="text" placeholder="Auditor o Comprobante..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={searchTermHistorial} onChange={(e) => setSearchTermHistorial(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleExportExcel}
                                className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                title="Exportar a Excel"
                            >
                                <FileSpreadsheet size={20} />
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                                title="Exportar a PDF"
                            >
                                <FileText size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Tarjetas Flexibles de Historial */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {loadingHistorial ? (
                            <div className="col-span-full py-12 text-center text-slate-500">Cargando base de datos de auditorías...</div>
                        ) : filteredHistorial.length === 0 ? (
                            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                <ClipboardCheck size={40} className="mx-auto mb-3 opacity-20 text-slate-500" />
                                <h3 className="font-bold text-slate-700 dark:text-slate-300">No hay Auditorías de Conteo</h3>
                                <p className="text-sm text-slate-500 mt-1">Registros limpios en este periodo.</p>
                            </div>
                        ) : (
                            filteredHistorial.map(c => (
                                <div key={c._id} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors dropdown-container relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 sm:p-3 bg-indigo-50 dark:bg-slate-800 rounded-xl">
                                                <ClipboardCheck className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-xs" title={c._id}>ID: ...{c._id.substring(c._id.length - 6)}</h3>
                                                    {c.estado_diferencia === 'OK' ? (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center border border-emerald-200 dark:border-emerald-500/20">
                                                            <CheckCircle size={10} className="mr-1" /> CONTEO EXACTO
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 flex items-center border border-rose-200 dark:border-rose-500/20">
                                                            <ShieldAlert size={10} className="mr-1" /> DIFERENCIAS (Revisión)
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 font-medium">{formatDate(c.fecha)}</p>
                                            </div>
                                        </div>

                                        {/* Dropdown Options */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === c._id ? null : c._id)}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent dark:border-slate-700/50"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {activeDropdown === c._id && (
                                                <div className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-100">
                                                    <button onClick={() => { setActiveDropdown(null); alert("Vista de Detalles en Desarrollo"); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
                                                        <List size={16} className="mr-2 text-indigo-500" /> Ver Detalles de Conteo
                                                    </button>
                                                    <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                                                    <button onClick={() => handleDeleteConteo(c._id)} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium flex items-center">
                                                        <Trash2 size={16} className="mr-2" /> Eliminar Permanente
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-sm">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Auditor</p>
                                            <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">{c.usuario?.nombre || 'Desconocido'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Items Verificados</p>
                                            <p className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{c.total_items} Filas</p>
                                        </div>
                                        <div className="lg:col-span-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Comprobante Origen</p>
                                            <p className="font-semibold text-slate-700 dark:text-slate-300 truncate" title={c.compra?.proveedor?.nombre}>
                                                <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-xs mr-2">{c.compra?.comprobante?.split(' - ')[0]}</span>
                                                {c.compra?.proveedor?.nombre || 'General'}
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Notificaciones */}
            {toastMessage && (
                <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-xl font-medium text-white animate-in slide-in-from-bottom-5 ${toastMessage.type === 'error' ? 'bg-rose-600 shadow-rose-500/30' : 'bg-emerald-600 shadow-emerald-500/30'
                    }`}>
                    {toastMessage.text}
                </div>
            )}
        </div>
    );
};

export default ConteoBodega;
