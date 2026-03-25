import { API_BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Search, Calendar, PackageX, FileText, Download, Plus, X, AlertCircle, Save, Check, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

const ComprasDevoluciones = () => {
    const { user } = useAuth();
    

    const [devoluciones, setDevoluciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filtros
    const [mes, setMes] = useState(new Date().getMonth() + 1); // 1-12
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para Nueva Devolucion
    const [isNuevoModalOpen, setIsNuevoModalOpen] = useState(false);
    const [ingresosDisponibles, setIngresosDisponibles] = useState([]);
    const [bBuscandoIngresos, setBBuscandoIngresos] = useState(false);
    
    // El ingreso actualmente elegido en el modal
    const [ingresoSeleccionado, setIngresoSeleccionado] = useState(''); 
    const [ingresoObj, setIngresoObj] = useState(null);
    
    // Array para manejar la tabla de devolución en RAM
    const [detallesDevolucion, setDetallesDevolucion] = useState([]); 
    
    const [isSaving, setIsSaving] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const meses = [
        { id: 1, nombre: 'Enero' }, { id: 2, nombre: 'Febrero' }, { id: 3, nombre: 'Marzo' },
        { id: 4, nombre: 'Abril' }, { id: 5, nombre: 'Mayo' }, { id: 6, nombre: 'Junio' },
        { id: 7, nombre: 'Julio' }, { id: 8, nombre: 'Agosto' }, { id: 9, nombre: 'Septiembre' },
        { id: 10, nombre: 'Octubre' }, { id: 11, nombre: 'Noviembre' }, { id: 12, nombre: 'Diciembre' }
    ];

    const anios = Array.from(new Array(10), (val, index) => new Date().getFullYear() - 5 + index); // +/- 5 años

    useEffect(() => {
        fetchDevoluciones();
    }, [mes, anio]); // Recargar al cambiar mes o año

    const fetchDevoluciones = async () => {
        try {
            setLoading(true);
            setError(null);
            // El backend filtrará `estado=Devolución` además de las fechas
            const response = await axios.get(`${API_BASE_URL}/api/compras/consultar`, {
                params: {
                    estado: 'Devolución',
                    mes,
                    anio
                }
            });
            setDevoluciones(response.data);
        } catch (err) {
            console.error("Error al obtener devoluciones:", err);
            setError("No se pudieron cargar las devoluciones.");
        } finally {
            setLoading(false);
        }
    };

    // Búsqueda adicional en cliente (Frontend)
    const filteredDevoluciones = devoluciones.filter(dev => {
        const query = searchTerm.toLowerCase();
        return (
            dev.comprobante?.toLowerCase().includes(query) ||
            dev.proveedor?.nombre?.toLowerCase().includes(query) ||
            dev.comprador?.toLowerCase().includes(query)
        );
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(amount);
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-NI', options);
    };    // ===== FUNCIONES DEL MODAL DE DEVOLUCIÓN =====
    const openNuevoModal = async () => {
        setIsNuevoModalOpen(true);
        setIngresoSeleccionado('');
        setIngresoObj(null);
        setDetallesDevolucion([]);
        
        try {
            setBBuscandoIngresos(true);
            const res = await axios.get(`${API_BASE_URL}/api/compras/para-conteo`);
            setIngresosDisponibles(res.data);
        } catch (error) {
            console.error(error);
            showToast("Error cargando compras disponibles", "error");
        } finally {
            setBBuscandoIngresos(false);
        }
    };

    const handleSelectIngreso = (e) => {
        const idStr = e.target.value;
        setIngresoSeleccionado(idStr);
        const obj = ingresosDisponibles.find(i => i._id === idStr);
        setIngresoObj(obj);
        
        if (obj && obj.detalles) {
            const mapped = obj.detalles.map(d => ({
                articulo_id: d.articulo_id,
                codigo: d.codigo,
                nombre: d.nombre,
                categoria: d.categoria,
                modelo: d.modelo,
                cantidad_comprada: d.cantidad_esperada,
                cantidad_devolver: 0
            }));
            setDetallesDevolucion(mapped);
        } else {
            setDetallesDevolucion([]);
        }
    };

    const handleUpdateCantidad = (articulo_id, value) => {
        const num = parseInt(value) || 0;
        setDetallesDevolucion(prev => prev.map(d => {
            if (d.articulo_id === articulo_id) {
                const max = d.cantidad_comprada;
                const finalNum = num > max ? max : (num < 0 ? 0 : num);
                return { ...d, cantidad_devolver: finalNum };
            }
            return d;
        }));
    };

    const showToast = (msg, type = "success") => {
        setToastMessage({ message: msg, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleSubmitDevolucion = async (e) => {
        e.preventDefault();
        
        const itemsToReturn = detallesDevolucion.filter(d => d.cantidad_devolver > 0);
        
        if (itemsToReturn.length === 0) {
            return showToast("Debe especificar al menos 1 repuesto para devolver", "error");
        }
        
        const payload = {
            fecha: new Date().toISOString(),
            usuario: user.id || user._id,
            comprobante: `DEV-${ingresoObj.comprobante.split(' - ')[0]}`,
            tipo_comprobante: 'devolucion',
            serie: 'DEV',
            numero: Date.now().toString().slice(-6),
            proveedor: ingresoObj.proveedor_id || null,
            comprador: user.nombre,
            impuesto_nombre: 'Exento',
            impuesto_porcentaje: 0,
            total_compra: 0,
            total_impuesto: 0,
            total_ingreso: 0, 
            estado: 'Devolución',
            detalles: itemsToReturn.map(d => ({
                articulo: d.articulo_id,
                cantidad: d.cantidad_devolver,
                precio_compra: 0,
                subtotal: 0
            }))
        };

        try {
            setIsSaving(true);
            await axios.post(`${API_BASE_URL}/api/compras/devolucion`, payload);
            showToast("Devolución registrada exitosamente, stock actualizado");
            setIsNuevoModalOpen(false);
            fetchDevoluciones(); // recarga la tabla
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.error || "Error al registrar la devolución", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportExcel = () => {
        const dataToExport = filteredDevoluciones.map(dev => ({
            'Fecha': formatDate(dev.fecha),
            'Proveedor': dev.proveedor?.nombre || 'N/A',
            'Usuario': dev.usuario?.nombre || 'N/A',
            'Documento': dev.comprobante,
            'Comprador': dev.comprador,
            'Total Compra': dev.total_compra,
            'Impuesto': dev.total_impuesto,
            'Total Devuelto': dev.total_ingreso,
            'Estado': dev.estado
        }));
        exportToExcel(dataToExport, 'Devoluciones_Compras', 'Devoluciones');
    };

    const handleExportPDF = () => {
        const columns = [
            { header: 'Fecha', key: (dev) => formatDate(dev.fecha) },
            { header: 'Proveedor', key: (dev) => dev.proveedor?.nombre || 'N/A' },
            { header: 'Documento', key: 'comprobante' },
            { header: 'Total Devuelto', key: 'total_ingreso' }
        ];
        exportToPDF(columns, filteredDevoluciones, 'Devoluciones_Compras', 'Historial de Devoluciones de Compras');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                        <PackageX className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Devoluciones de Compras</h1>
                        <p className="text-slate-500 dark:text-slate-400">Consulte el historial de compras devueltas a proveedores.</p>
                    </div>
                </div>
                <button
                    onClick={openNuevoModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl shadow-lg shadow-rose-500/20 font-medium transition-all"
                >
                    <Plus size={20} />
                    <span>Nueva Devolución</span>
                </button>
            </div>

            {/* Panel de Filtros */}
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-end gap-6">

                {/* Selector de Mes */}
                <div className="w-full md:w-1/4">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                        <Calendar size={16} className="mr-2 text-indigo-500" /> Seleccionar Mes de
                    </label>
                    <select
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                        value={mes}
                        onChange={(e) => setMes(e.target.value)}
                    >
                        {meses.map(m => (
                            <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Selector de Año */}
                <div className="w-full md:w-1/4">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">del Año</label>
                    <select
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                        value={anio}
                        onChange={(e) => setAnio(e.target.value)}
                    >
                        {anios.map(a => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>

                <div className="w-full md:w-2/4 flex items-end gap-2">
                    <div className="flex-grow relaitve">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Buscar en resultados:</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar proveedor, comprador o documento..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
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

            {/* Tabla de Resultados */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-center">Opciones</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Proveedor</th>
                                <th className="px-6 py-4">Usuario Sistema</th>
                                <th className="px-6 py-4 text-center">Documento</th>
                                <th className="px-6 py-4">Comprador</th>
                                <th className="px-6 py-4 text-right cursor-help" title="Subtotal sin impuestos">Total Compra</th>
                                <th className="px-6 py-4 text-center">Impuesto</th>
                                <th className="px-6 py-4 text-right">Total Impuesto</th>
                                <th className="px-6 py-4 text-right text-rose-600 dark:text-rose-400">Total Devuelto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="11" className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                        Cargando devoluciones...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="11" className="px-6 py-12 text-center text-rose-500 bg-rose-50 dark:bg-rose-900/10">
                                        {error}
                                    </td>
                                </tr>
                            ) : filteredDevoluciones.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="px-6 py-16 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
                                            <PackageX size={32} />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">No se encontraron registros</p>
                                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Pruebe seleccionando otro mes u otro año</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDevoluciones.map((dev) => (
                                    <tr key={dev._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">

                                        <td className="px-6 py-3 text-center">
                                            <button
                                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                title="Ver Detalles"
                                            >
                                                <FileText size={18} />
                                            </button>
                                        </td>

                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                                            {formatDate(dev.fecha)}
                                        </td>

                                        <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-200">
                                            {dev.proveedor?.nombre || '-'}
                                        </td>

                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                                            {dev.usuario?.nombre || '-'}
                                        </td>

                                        <td className="px-6 py-3 text-center">
                                            <span className="px-2 py-1 text-xs font-bold font-mono tracking-widest rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
                                                {dev.comprobante}
                                            </span>
                                        </td>

                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                                            {dev.comprador || '-'}
                                        </td>

                                        {/* Montos Monetarios */}
                                        <td className="px-6 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                                            {formatCurrency(dev.total_compra)}
                                        </td>

                                        <td className="px-6 py-3 text-center">
                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                {dev.impuesto_nombre ? `${dev.impuesto_nombre} (${dev.impuesto_porcentaje}%)` : 'N/A'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-3 text-right font-mono text-slate-500 dark:text-slate-400">
                                            {formatCurrency(dev.total_impuesto)}
                                        </td>

                                        <td className="px-6 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                            {formatCurrency(dev.total_ingreso)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Estadístico Rápido */}
                {filteredDevoluciones.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">
                            Mostrando {filteredDevoluciones.length} devolucione(s)
                        </span>
                        <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold">
                            <span>Total Devuelto este periodo:</span>
                            <span className="text-lg font-mono">
                                {formatCurrency(filteredDevoluciones.reduce((acc, current) => acc + current.total_ingreso, 0))}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* COMPONENTE TOAST DE NOTIFICACIÓN SIMPLE */}
            {toastMessage && (
                <div className={`fixed bottom-4 right-4 z-[999] px-6 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 ${
                    toastMessage.type === 'error' 
                    ? 'bg-rose-500 text-white border-rose-600' 
                    : 'bg-emerald-500 text-white border-emerald-600'
                }`}>
                    {toastMessage.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
                    <span className="font-medium">{toastMessage.message}</span>
                </div>
            )}

            {/* MODAL DE NUEVA DEVOLUCIÓN */}
            {isNuevoModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh]">
                        {/* Cabecera */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <PackageX className="text-rose-500" /> Registrar Nueva Devolución
                            </h2>
                            <button onClick={() => setIsNuevoModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                                <X size={24} />
                            </button>
                        </div>
                        
                        {/* Cuerpo Scrolleable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* Panel Selección de Ingreso */}
                            <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                    Seleccionar Factura Afectada (Ingreso Original)
                                </label>
                                {bBuscandoIngresos ? (
                                    <div className="flex items-center gap-3 text-indigo-500 font-medium">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div> 
                                        Cargando compras disponibles...
                                    </div>
                                ) : (
                                    <select 
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium custom-select"
                                        value={ingresoSeleccionado}
                                        onChange={handleSelectIngreso}
                                    >
                                        <option value="" disabled>Seleccione una compra histórica...</option>
                                        {ingresosDisponibles.map(compra => (
                                            <option key={compra._id} value={compra._id}>
                                                {compra.comprobante} - Fecha: {formatDate(compra.fecha)}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Detalles Seleccionados */}
                            {ingresoObj && (
                                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-100 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
                                        <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                                            Artículos de la Compra (Stock a Disminuir)
                                        </h3>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">Código</th>
                                                <th className="px-4 py-3">Repuesto</th>
                                                <th className="px-4 py-3 text-center">Cant. Comprada</th>
                                                <th className="px-4 py-3 text-center">Cant. a Devolver</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {detallesDevolucion.map((det) => (
                                                <tr key={det.articulo_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-3 font-mono text-xs">{det.codigo}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                                                        {det.nombre}
                                                        <span className="block text-[10px] text-slate-400 font-normal">{det.categoria} - {det.modelo}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                                                        {det.cantidad_comprada}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input 
                                                            type="number"
                                                            min="0"
                                                            max={det.cantidad_comprada}
                                                            className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-center font-bold text-rose-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-shadow"
                                                            value={det.cantidad_devolver === 0 ? '' : det.cantidad_devolver}
                                                            onChange={(e) => handleUpdateCantidad(det.articulo_id, e.target.value)}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                            {detallesDevolucion.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                                                        Esta compra no tiene artículos registrados.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        </div>

                        {/* Pie de Modal */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsNuevoModalOpen(false)}
                                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitDevolucion}
                                disabled={isSaving || !ingresoObj}
                                className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-medium shadow-lg shadow-rose-500/20 transition-all"
                            >
                                {isSaving ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <Save size={18} />
                                )}
                                Registrar Devolución
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComprasDevoluciones;
