import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    PackagePlus, Search, Plus, Trash2, Save, X, LayoutList, ChevronDown, List, Eye, ShieldBan, FileText, FileSpreadsheet, Check
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatUtils';

const ComprasIngresos = () => {
    const { user } = useAuth();
    const apiBaseUrl = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`);

    // ===== ESTADOS: MODALES =====
    const [isNuevoModalOpen, setIsNuevoModalOpen] = useState(false);

    // ===== ESTADOS: NUEVO INGRESO =====
    const [proveedores, setProveedores] = useState([]);
    const [series, setSeries] = useState([]);
    const [impuestos, setImpuestos] = useState([]);

    const [ingreso, setIngreso] = useState({
        tipo_comprobante: 'factura',
        serie: '',
        numero: '',
        proveedor: '',
        fecha: new Date().toISOString().split('T')[0],
        impuesto: null,
    });
    const [detalles, setDetalles] = useState([]);

    const [isArticulosModalOpen, setIsArticulosModalOpen] = useState(false);
    const [searchTermModal, setSearchTermModal] = useState('');
    const [articulosDb, setArticulosDb] = useState([]);

    // ===== ESTADOS: HISTORIAL =====
    const [historialIngresos, setHistorialIngresos] = useState([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
    const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());
    const [searchTermHistorial, setSearchTermHistorial] = useState('');

    const meses = [
        { id: 1, nombre: 'Enero' }, { id: 2, nombre: 'Febrero' }, { id: 3, nombre: 'Marzo' },
        { id: 4, nombre: 'Abril' }, { id: 5, nombre: 'Mayo' }, { id: 6, nombre: 'Junio' },
        { id: 7, nombre: 'Julio' }, { id: 8, nombre: 'Agosto' }, { id: 9, nombre: 'Septiembre' },
        { id: 10, nombre: 'Octubre' }, { id: 11, nombre: 'Noviembre' }, { id: 12, nombre: 'Diciembre' }
    ];
    const anios = Array.from(new Array(10), (val, index) => new Date().getFullYear() - 5 + index);

    // ===== ESTADOS GLOBALES =====
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    // ===== EFECTOS =====
    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchHistorial();
    }, [filtroMes, filtroAnio]);

    const showToast = (message, type = "success") => {
        setToastMessage({ text: message, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // ----- LOGICA NUEVO INGRESO -----
    const fetchInitialData = async () => {
        try {
            const [provRes, seriesRes, impRes, artRes] = await Promise.all([
                axios.get(`${apiBaseUrl}/api/proveedores`),
                axios.get(`${apiBaseUrl}/api/series`),
                axios.get(`${apiBaseUrl}/api/impuestos`),
                axios.get(`${apiBaseUrl}/api/articulos`)
            ]);

            setProveedores(provRes.data.filter(p => p.estado));
            setSeries(seriesRes.data.filter(s => s.documento === 'Compra' && s.tipo === 'Ingreso' && s.condicion));

            // Ajuste campos Impuestos según modelo (condicion, documento_aplicar, descripcion)
            const impuestosCompra = impRes.data.filter(i => i.condicion && i.documento_aplicar === 'Compra');
            setImpuestos(impuestosCompra);

            if (impuestosCompra.length > 0 && !ingreso.impuesto) {
                const defaultImp = impuestosCompra.find(i => i.descripcion.toUpperCase().includes('IVA')) || impuestosCompra[0];
                setIngreso(prev => ({ ...prev, impuesto: defaultImp }));
            }
            setArticulosDb(artRes.data.filter(a => a.condicion));
        } catch (error) {
            console.error(error);
            showToast("Error al cargar catálogos", "error");
        }
    };

    const subtotal = detalles.reduce((acc, obj) => acc + (obj.cantidad * obj.precio_compra), 0);
    const montoImpuesto = ingreso.impuesto ? subtotal * (ingreso.impuesto.porcentaje / 100) : 0;
    const total = subtotal + montoImpuesto;

    const handleAddArticuloToDetalle = (articulo) => {
        const index = detalles.findIndex(d => d.articulo._id === articulo._id);
        if (index !== -1) {
            // Si ya existe, lo quitamos (Toggle)
            setDetalles(detalles.filter(d => d.articulo._id !== articulo._id));
            showToast(`${articulo.nombre} quitado de la lista`, "info");
        } else {
            // Si no existe, lo agregamos
            setDetalles([...detalles, { articulo: articulo, cantidad: 1, precio_compra: 0, subtotal: 0 }]);
            showToast(`${articulo.nombre} agregado al recibo`);
        }
    };

    const handleDetalleChange = (id, field, value) => {
        setDetalles(detalles.map(d => {
            if (d.articulo._id === id) {
                const updated = { ...d, [field]: Number(value) >= 0 ? Number(value) : 0 };
                updated.subtotal = updated.cantidad * updated.precio_compra;
                return updated;
            }
            return d;
        }));
    };

    const handleSerieChange = async (serieVal) => {
        const serieObj = series.find(s => s.serie === serieVal);
        setIngreso(prev => ({ ...prev, serie: serieVal }));
        
        if (!serieObj) {
            setIngreso(prev => ({ ...prev, numero: '' }));
            return;
        }

        const fullUrl = `${apiBaseUrl}/api/compras/siguiente_correlativo/${serieObj._id}`;
        console.log("Fetching correlativo from:", fullUrl);
        try {
            const res = await axios.get(fullUrl);
            console.log("Correlativo response:", res.data);
            setIngreso(prev => ({ ...prev, numero: res.data.siguiente_numero }));
        } catch (err) {
            console.error("Error al obtener correlativo:", err);
            setIngreso(prev => ({ ...prev, numero: '' }));
            const errorMsg = err.response?.data?.error || err.message || "No se pudo obtener el correlativo";
            showToast(errorMsg, "error");
        }
    };

    const handleRemoveDetalle = (id) => setDetalles(detalles.filter(d => d.articulo._id !== id));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ingreso.proveedor || !ingreso.serie || !ingreso.numero) return showToast("Faltan datos de cabecera", "error");
        if (detalles.length === 0) return showToast("Agregue al menos un artículo", "error");

        const payload = {
            fecha: new Date(ingreso.fecha).toISOString(),
            usuario: user.id || user._id,
            comprobante: `${ingreso.tipo_comprobante} - ${ingreso.serie}-${ingreso.numero}`,
            tipo_comprobante: ingreso.tipo_comprobante,
            serie: ingreso.serie,
            numero: ingreso.numero,
            proveedor: ingreso.proveedor,
            comprador: user.nombre,
            impuesto_nombre: ingreso.impuesto ? ingreso.impuesto.descripcion : '',
            impuesto_porcentaje: ingreso.impuesto ? ingreso.impuesto.porcentaje : 0,
            total_compra: subtotal,
            total_impuesto: montoImpuesto,
            total_ingreso: total,
            estado: 'Ingresos',
            detalles: detalles.map(d => ({
                articulo: d.articulo._id,
                cantidad: d.cantidad,
                precio_compra: d.precio_compra,
                subtotal: d.subtotal
            }))
        };

        try {
            setLoading(true);
            await axios.post(`${apiBaseUrl}/api/compras`, payload);
            showToast("¡Ingreso registrado exitosamente!");
            setDetalles([]);
            setIngreso({ ...ingreso, numero: '' });
            fetchInitialData(); // Refrescar stocks
            fetchHistorial(); // Refrescar historial
            setIsNuevoModalOpen(false); // Cierra modal principal
        } catch (error) {
            showToast(error.response?.data?.error || "Error al registrar", "error");
        } finally {
            setLoading(false);
        }
    };

    // ----- LOGICA HISTORIAL -----
    const fetchHistorial = async () => {
        try {
            setLoadingHistorial(true);
            const res = await axios.get(`${apiBaseUrl}/api/compras/consultar`, {
                params: {
                    estado: 'Ingresos', // Traer todo lo que sea Ingreso normal
                    mes: filtroMes,
                    anio: filtroAnio
                }
            });
            setHistorialIngresos(res.data);
        } catch (error) {
            console.error(error);
            showToast("Error al cargar el historial", "error");
        } finally {
            setLoadingHistorial(false);
        }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(amount);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-NI', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    const filteredHistorial = historialIngresos.filter(inv => {
        const query = searchTermHistorial.toLowerCase();
        return (
            inv.comprobante?.toLowerCase().includes(query) ||
            inv.proveedor?.nombre?.toLowerCase().includes(query) ||
            inv.comprador?.toLowerCase().includes(query)
        );
    });

    const filteredArticulosModal = articulosDb.filter(art => {
        const query = searchTermModal.toLowerCase();
        return (
            art.nombre?.toLowerCase().includes(query) ||
            art.codigo?.toLowerCase().includes(query) ||
            art.numero_parte?.toLowerCase().includes(query)
        );
    });

    const handleExportExcel = () => {
        const dataToExport = filteredHistorial.map(inv => ({
            'Fecha': formatDate(inv.fecha),
            'Proveedor': inv.proveedor?.nombre || 'N/A',
            'Usuario': inv.usuario?.nombre || 'N/A',
            'Documento': inv.comprobante,
            'Comprador': inv.comprador,
            'Total Compra': inv.total_compra,
            'Impuesto': inv.total_impuesto,
            'Total Ingreso': inv.total_ingreso,
            'Estado': inv.estado
        }));
        exportToExcel(dataToExport, 'Ingresos_Compras', 'Ingresos');
    };

    const handleExportPDF = () => {
        const columns = [
            { header: 'Fecha', key: (inv) => formatDate(inv.fecha) },
            { header: 'Proveedor', key: (inv) => inv.proveedor?.nombre || 'N/A' },
            { header: 'Documento', key: 'comprobante' },
            { header: 'Subtotal', key: 'total_compra' },
            { header: 'Impuesto', key: 'total_impuesto' },
            { header: 'Total', key: 'total_ingreso' }
        ];
        exportToPDF(columns, filteredHistorial, 'Ingresos_Compras', 'Historial de Ingresos de Compras');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">

            {/* Header General */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex-shrink-0">
                        <PackagePlus className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ingresos de Compras</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Bodega e Historial de facturas recibidas.</p>
                    </div>
                </div>

                {/* BOTON NUEVO INGRESO */}
                <div className="flex">
                    <button
                        onClick={() => setIsNuevoModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center transition-all bg-emerald-600 text-white shadow-emerald-500/30 shadow-lg hover:bg-emerald-500 active:scale-95"
                    >
                        <Plus size={18} className="mr-2" /> Nuevo Ingreso
                    </button>
                </div>
            </div>

            {/* ====== VISTA PRINCIPAL: HISTORIAL ====== */}
            <div className="animate-in slide-in-from-left-4 duration-300 space-y-6">

                {/* Filtros Modalidad Historial */}
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-end gap-6">
                    <div className="w-full md:w-1/4">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mes de:</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                            value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}
                        >
                            {meses.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                    </div>
                    <div className="w-full md:w-1/4">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Año:</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                            value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}
                        >
                            {anios.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="w-full md:w-2/4 flex items-end gap-2">
                        <div className="flex-grow relative">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Buscar en listado:</label>
                            <Search className="absolute left-3 top-9 text-slate-400" size={18} />
                            <input
                                type="text" placeholder="Provedor, Cajero, Comprobante..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
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

                {/* Tabla Historial */}
                <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-center">Opciones</th>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Proveedor</th>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Documento</th>
                                    <th className="px-6 py-4">Comprador</th>
                                    <th className="px-6 py-4 text-right">Total Compra</th>
                                    <th className="px-6 py-4 text-center">Impuesto</th>
                                    <th className="px-6 py-4 text-right">Monto Imp.</th>
                                    <th className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400">Total Ingreso</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                                {loadingHistorial ? (
                                    <tr><td colSpan="11" className="px-6 py-12 text-center text-slate-500 animate-pulse">Consultando historial al servidor...</td></tr>
                                ) : filteredHistorial.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="px-6 py-16 text-center text-slate-500">
                                            <List size={32} className="mx-auto mb-3 opacity-30" />
                                            No se encontraron ingresos de compras en este periodo.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHistorial.map((inv) => (
                                        <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-2 text-center dropdown-container relative">
                                                <button onClick={() => alert("Función 'Ver Detalles PDF' en desarrollo.")} className="p-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 rounded-lg transition-colors" title="Ver Detalles Factura">
                                                    <FileText size={16} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-3">{formatDate(inv.fecha)}</td>
                                            <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">{inv.proveedor?.nombre || '-'}</td>
                                            <td className="px-6 py-3 text-slate-500">{inv.usuario?.nombre || '-'}</td>
                                            <td className="px-6 py-3"><span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-300 text-xs">{inv.comprobante}</span></td>
                                            <td className="px-6 py-3 text-slate-500">{inv.comprador}</td>
                                            <td className="px-6 py-3 text-right font-mono text-slate-700 dark:text-slate-300">{formatCurrency(inv.total_compra)}</td>
                                            <td className="px-6 py-3 text-center text-xs text-slate-500">{inv.impuesto_nombre || 'N/A'}</td>
                                            <td className="px-6 py-3 text-right font-mono text-slate-500">{formatCurrency(inv.total_impuesto)}</td>
                                            <td className="px-6 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(inv.total_ingreso)}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    {inv.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ====== MODAL: FORMULARIO NUEVO INGRESO ====== */}
            {isNuevoModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-7xl rounded-3xl shadow-2xl flex flex-col max-h-full overflow-hidden zoom-in-95 animate-in duration-200 border border-slate-200 dark:border-slate-800">
                        
                        {/* HEADER MODAL NUEVO */}
                        <div className="px-6 py-4 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
                            <h2 className="text-xl font-bold flex items-center text-slate-800 dark:text-white">
                                <PackagePlus className="w-6 h-6 mr-3 text-emerald-500" /> Registrar Nuevo Ingreso
                            </h2>
                            <button onClick={() => setIsNuevoModalOpen(false)} className="text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* CUERPO MODAL NUEVO */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* PANEL IZQUIERDO: CABECERA DE INGRESO */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-white dark:bg-slate-900/70 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                                            <LayoutList size={18} className="mr-2 text-indigo-500" />
                                            Datos Previos
                                        </h3>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo Comprobante (*)</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 appearance-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    value={ingreso.tipo_comprobante}
                                                    onChange={(e) => setIngreso({ ...ingreso, tipo_comprobante: e.target.value })}
                                                >
                                                    <option value="factura">Factura</option>
                                                    <option value="boleta">Boleta</option>
                                                    <option value="ticket">Ticket</option>
                                                    <option value="guia">Guía de Remisión</option>
                                                    <option value="inicial">Carga Inicial</option>
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Serie (*)</label>
                                                <div className="relative">
                                                    <select
                                                        required
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        value={ingreso.serie}
                                                        onChange={(e) => handleSerieChange(e.target.value)}
                                                    >
                                                        <option value="">-- Sel --</option>
                                                        {series.map(s => <option key={s._id} value={s.serie}>{s.serie}</option>)}
                                                    </select>
                                                    <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Número (*)</label>
                                                <input
                                                    type="text" required placeholder="000000"
                                                    className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl px-4 py-2.5 outline-none cursor-not-allowed font-mono"
                                                    value={ingreso.numero} readOnly
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Proveedor (*)</label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    value={ingreso.proveedor} onChange={(e) => setIngreso({ ...ingreso, proveedor: e.target.value })}
                                                >
                                                    <option value="">Seleccione Proveedor</option>
                                                    {proveedores.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Emisión (*)</label>
                                            <input
                                                type="date" required
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 color-scheme-dark"
                                                value={ingreso.fecha} onChange={(e) => setIngreso({ ...ingreso, fecha: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Impuesto a aplicar</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    value={ingreso.impuesto ? ingreso.impuesto._id : ''}
                                                    onChange={(e) => {
                                                        const imp = impuestos.find(i => i._id === e.target.value);
                                                        setIngreso({ ...ingreso, impuesto: imp || null });
                                                    }}
                                                >
                                                    <option value="">Ninguno (0%)</option>
                                                    {impuestos.map(i => <option key={i._id} value={i._id}>{i.descripcion} - {i.porcentaje}%</option>)}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PANEL DERECHO: DETALLES DE ARTICULOS */}
                                <div className="lg:col-span-3 space-y-6">
                                    <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
                                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                            <h3 className="font-bold text-slate-800 dark:text-white">Artículos del Comprobante</h3>
                                            <button
                                                type="button" onClick={() => setIsArticulosModalOpen(true)}
                                                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-md transition-all active:scale-95"
                                            >
                                                <Plus size={18} /><span>Catálogo de Repuestos</span>
                                            </button>
                                        </div>
                                        <div className="flex-1 min-h-[350px]">
                                            <div className="overflow-x-auto h-full max-h-[450px] custom-scrollbar">
                                                <table className="w-full text-left text-sm whitespace-nowrap">
                                                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                                        <tr>
                                                            <th className="px-6 py-4 text-center w-16">Opc.</th>
                                                            <th className="px-6 py-4">Artículo</th>
                                                            <th className="px-6 py-4 w-32">Cantidad</th>
                                                            <th className="px-6 py-4 w-40">Precio Compra</th>
                                                            <th className="px-6 py-4 text-right w-32">Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                                                        {detalles.length > 0 ? (
                                                            detalles.map((det) => (
                                                                <tr key={det.articulo._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                                    <td className="px-6 py-3 text-center">
                                                                        <button
                                                                            type="button" onClick={() => handleRemoveDetalle(det.articulo._id)}
                                                                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                                        ><Trash2 size={18} /></button>
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        <div className="flex items-center space-x-3">
                                                                            <div>
                                                                                <p className="font-bold text-slate-900 dark:text-white">{det.articulo.nombre}</p>
                                                                                <p className="text-xs text-slate-500 font-mono">{det.articulo.codigo}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        <input
                                                                            type="number" min="1" step="1" required
                                                                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-center rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-mono"
                                                                            value={det.cantidad || ''} onChange={(e) => handleDetalleChange(det.articulo._id, 'cantidad', e.target.value)}
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-3 relative">
                                                                        <span className="absolute left-8 top-[1.1rem] text-slate-400 font-medium text-xs">C$</span>
                                                                        <input
                                                                            type="number" min="0" step="0.01" required
                                                                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-right rounded-lg pl-8 pr-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                                                                            value={det.precio_compra || ''} onChange={(e) => handleDetalleChange(det.articulo._id, 'precio_compra', e.target.value)}
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                                                        {formatCurrency(det.subtotal)}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="5" className="px-6 py-16 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-900/20">
                                                                    <PackagePlus size={32} className="mx-auto mb-3 opacity-40 text-slate-400" />
                                                                    <p className="font-semibold text-slate-600 dark:text-slate-400">No hay repuestos adheridos al ingreso.</p>
                                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Haga clic en el botón superior derecho para buscar en el catálogo.</p>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* TOTALES O RESUMEN ADJUNTO ABAJO */}
                                        <div className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row justify-end items-center gap-6 z-10">
                                            <div className="w-full max-w-xs space-y-3">
                                                <div className="flex justify-between text-sm font-semibold">
                                                    <span className="text-slate-500">SUBTOTAL</span><span className="text-slate-800 dark:text-slate-200 font-mono">{formatCurrency(subtotal)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm font-semibold border-b border-slate-200 dark:border-slate-700 pb-3">
                                                    <span className="text-slate-500">{ingreso.impuesto?.descripcion || 'IMPUESTO'}</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-mono">{formatCurrency(montoImpuesto)}</span>
                                                </div>
                                                <div className="flex justify-between text-xl font-black">
                                                    <span className="text-slate-900 dark:text-white">TOTAL</span>
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(total)}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="submit" disabled={loading || detalles.length === 0}
                                                className={`px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center ${loading || detalles.length === 0 ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white w-full sm:w-auto shadow-emerald-500/30'}`}
                                            >
                                                <Save size={20} className="mr-2" /> {loading ? 'Procesando...' : 'Guardar Ingreso'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== MODAL INTERNO: BUSCADOR DE ARTÍCULOS ====== */}
            {isArticulosModalOpen && isNuevoModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden zoom-in-95 animate-in">
                        <div className="px-6 py-4 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                                <Search className="w-5 h-5 mr-2 text-indigo-500" />
                                Catálogo de Repuestos
                            </h2>
                            <button onClick={() => setIsArticulosModalOpen(false)} className="text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div className="relative">
                                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por código original, parte o nombre de repuesto..." 
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-12 pr-4 py-3 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                                    value={searchTermModal} 
                                    onChange={e => setSearchTermModal(e.target.value)} 
                                    autoFocus 
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/30 custom-scrollbar">
                            {filteredArticulosModal.length > 0 ? (
                                filteredArticulosModal.map(art => {
                                    const isSelected = detalles.some(d => d.articulo._id === art._id);
                                    return (
                                        <div key={art._id} 
                                            className={`flex justify-between items-center p-3 rounded-2xl border transition-all duration-300 group overflow-hidden ${isSelected 
                                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-500/5' 
                                                : 'bg-white hover:bg-indigo-50/50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 shadow-sm'}`}
                                        >
                                            <div className="flex px-2 space-x-4 items-center">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors ${isSelected 
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800' 
                                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                                    <PackagePlus className={`w-6 h-6 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                                                </div>
                                                <div>
                                                    <p className={`font-bold leading-tight transition-colors ${isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-100'}`}>{art.nombre}</p>
                                                    <div className="flex items-center mt-1 space-x-2">
                                                        <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border transition-colors ${isSelected 
                                                            ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50' 
                                                            : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50'}`}>Fact: {art.codigo}</span>
                                                        {art.numero_parte && <span className="text-[11px] font-mono text-slate-500">P/N: {art.numero_parte}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-6 items-center">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Actual</p>
                                                    <p className={`font-black font-mono ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{art.stock}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleAddArticuloToDetalle(art)} 
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 border ${isSelected 
                                                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' 
                                                        : 'bg-slate-50 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-indigo-600 dark:hover:text-white border-slate-200 dark:border-slate-700 hover:border-indigo-600'}`}
                                                >
                                                    {isSelected ? <Check size={24} /> : <Plus size={24} />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-16">
                                    <Search size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                                    <p className="text-slate-500 font-medium">No se encontraron repuestos con esa descripción.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <button 
                                onClick={() => setIsArticulosModalOpen(false)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold font-sm shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center"
                            >
                                <Check size={18} className="mr-2" />
                                Listo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts */}
            {toastMessage && (
                <div className={`fixed bottom-6 right-6 z-[60] px-6 py-4 rounded-xl font-bold text-white shadow-xl flex items-center animate-in slide-in-from-bottom-5 duration-300 ${toastMessage.type === 'error' ? 'bg-rose-600 shadow-rose-600/20' : 'bg-emerald-600 shadow-emerald-600/20'}`}>
                    {toastMessage.type === 'error' ? <ShieldBan className="w-5 h-5 mr-3" /> : <Save className="w-5 h-5 mr-3" />}
                    {toastMessage.text}
                </div>
            )}

        </div>
    );
};

export default ComprasIngresos;
