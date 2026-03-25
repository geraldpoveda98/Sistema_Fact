import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Calendar, Search, Calculator, CheckSquare, Save, Receipt,
    Banknote, FileText, ArrowRightLeft, CreditCard, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatUtils';

const CierreCaja = () => {
    const apiBaseUrl = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`);
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);

    // Filtros
    const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
    const [cajaSeleccionada, setCajaSeleccionada] = useState('Todas');
    const [tipoDocumento, setTipoDocumento] = useState('Todos');

    // Datos
    const [totales, setTotales] = useState({ total_ventas: 0, impuesto_total: 0, total_factura: 0, total_credito: 0 });
    const [ventasActivas, setVentasActivas] = useState([]);
    const [ventasHistoricas, setVentasHistoricas] = useState([]);

    // Seleccionados para pasar a historial
    const [seleccionados, setSeleccionados] = useState([]);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        fetchCierre();
    }, [fechaInicio, fechaFin, cajaSeleccionada, tipoDocumento]);

    const showToast = (message, type = "success") => {
        setToastMessage({ text: message, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const fetchCierre = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${apiBaseUrl}/api/ventas/cierre-caja`, {
                params: { fechaInicio, fechaFin, caja: cajaSeleccionada, tipoDocumento }
            });
            setTotales(response.data.totales);
            setVentasActivas(response.data.activas);
            setVentasHistoricas(response.data.historicas);
            setSeleccionados([]);
        } catch (error) {
            console.error("Error cargando cierre:", error);
            showToast("No se pudieron cargar los datos", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleSeleccion = (id) => {
        setSeleccionados(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleTodos = () => {
        if (seleccionados.length === ventasActivas.length) {
            setSeleccionados([]); // Desmarcar todos
        } else {
            setSeleccionados(ventasActivas.map(v => v._id)); // Marcar todos
        }
    };

    const pasarAHistorial = async () => {
        if (seleccionados.length === 0) {
            showToast("Seleccione al menos un documento", "error");
            return;
        }

        if (window.confirm(`¿Seguro que desea pasar ${seleccionados.length} documentos a Histórico?`)) {
            try {
                await axios.post(`${apiBaseUrl}/api/ventas/pasar-historial`, { ventasIds: seleccionados });
                showToast("Documentos archivados exitosamente");
                fetchCierre(); // Recargar tablas
            } catch (error) {
                showToast("Error al procesar el cierre", "error");
            }
        }
    };

    const formatMoney = formatCurrency;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('es-NI', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    // Componente de Fila de Tabla Reutilizable
    const FilaTabla = ({ v, isActiva }) => (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-200 dark:border-slate-700/50">
            {isActiva && (
                <td className="px-4 py-3 text-center">
                    <input
                        type="checkbox"
                        checked={seleccionados.includes(v._id)}
                        onChange={() => toggleSeleccion(v._id)}
                        className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer"
                    />
                </td>
            )}
            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">{formatDate(v.fecha)}</td>
            <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-300">{v.usuario?.nombre || 'Sistema'}</td>
            <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{v.cliente?.nombre || 'Consumidor Final'}</td>
            <td className="px-4 py-3 text-xs text-slate-500"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{v.comprobante}</span></td>
            <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">{v.caja}</td>
            <td className="px-4 py-3 text-sm font-bold font-mono text-slate-800 dark:text-slate-200">{v.serie}-{v.numero}</td>
            <td className="px-4 py-3 text-sm text-right font-mono text-slate-600 dark:text-slate-400">{formatMoney(v.total_ventas)}</td>
            <td className="px-4 py-3 text-sm text-right font-mono text-rose-500">{formatMoney(v.impuesto_total)}</td>
            <td className="px-4 py-3 text-sm text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatMoney(v.total_factura)}</td>
            <td className="px-4 py-3 text-sm text-right font-mono text-amber-500">{formatMoney(v.total_credito)}</td>
            <td className="px-4 py-3 text-center">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isActiva ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                    {v.estado}
                </span>
            </td>
        </tr>
    );

    const handleExportExcel = (data, fileName) => {
        const dataToExport = data.map(v => ({
            'Fecha': formatDate(v.fecha),
            'Usuario': v.usuario?.nombre || 'N/A',
            'Cliente': v.cliente?.nombre || 'Consumidor Final',
            'Comprobante': v.comprobante,
            'Caja': v.caja,
            'Nro': `${v.serie}-${v.numero}`,
            'Total Ventas': v.total_ventas,
            'Impuesto': v.impuesto_total,
            'Total Factura': v.total_factura,
            'Total Crédito': v.total_credito,
            'Estado': v.estado
        }));
        exportToExcel(dataToExport, fileName, 'Ventas');
    };

    const handleExportPDF = (data, fileName, title) => {
        const columns = [
            { header: 'Fecha', key: (v) => formatDate(v.fecha) },
            { header: 'Cliente', key: (v) => v.cliente?.nombre || 'Consumidor Final' },
            { header: 'N°', key: (v) => `${v.serie}-${v.numero}` },
            { header: 'Subtotal', key: 'total_ventas' },
            { header: 'IVA', key: 'impuesto_total' },
            { header: 'Total', key: 'total_factura' },
            { header: 'Crédito', key: 'total_credito' }
        ];
        exportToPDF(columns, data, fileName, title);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">

            {/* Header Módulo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Calculator className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Consulta de Ventas (Cierre)</h1>
                        <p className="text-slate-500 dark:text-slate-400">Genera cierres de caja y consulta facturas por fecha.</p>
                    </div>
                </div>

                {/* Botón Flotante para Generar Mock (Solo Pruebas) TODO: Quitar en Producción */}
                <button
                    onClick={async () => { await axios.post(`${apiBaseUrl}/api/ventas/mock`); fetchCierre(); showToast("Venta de prueba generada", "success"); }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
                >
                    + Venta de Prueba
                </button>
            </div>

            {/* CINTA DE FILTROS SUPERIOR */}
            <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Fecha Inicio</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                                type="date"
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Fecha Fin</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                                type="date"
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Lista de Cajas</label>
                        <select
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner font-medium"
                            value={cajaSeleccionada} onChange={(e) => setCajaSeleccionada(e.target.value)}
                        >
                            <option value="Todas">-- Todas las Cajas --</option>
                            <option value="Caja Principal 1">Caja Principal 1</option>
                            <option value="Caja Secundaria 2">Caja Secundaria 2</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tipo de Documento</label>
                        <select
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner font-medium"
                            value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)}
                        >
                            <option value="Todos">-- Todos --</option>
                            <option value="Factura">Factura</option>
                            <option value="Recibo">Recibo</option>
                            <option value="Ticket">Ticket</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* TABLA PRINCIPAL (VENTAS ACTIVAS) */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center">
                        <Receipt size={18} className="mr-2 text-indigo-500" /> Transacciones Activas
                    </h3>
                    <div className="flex items-center gap-2 w-1/2 min-w-[300px]">
                        <div className="relative flex-grow">
                            <Search className="text-slate-400 absolute left-3 top-2" size={16} />
                            <input type="text" placeholder="Buscar en tabla..." className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                        </div>
                        <button
                            onClick={() => handleExportExcel(ventasActivas, 'Ventas_Activas')}
                            className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                            title="Exportar a Excel"
                        >
                            <FileSpreadsheet size={18} />
                        </button>
                        <button
                            onClick={() => handleExportPDF(ventasActivas, 'Ventas_Activas', 'Ventas Activas')}
                            className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                            title="Exportar a PDF"
                        >
                            <FileText size={18} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-4 py-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={seleccionados.length === ventasActivas.length && ventasActivas.length > 0}
                                        onChange={toggleTodos}
                                        className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer"
                                    />
                                </th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Usuario</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Comprobante</th>
                                <th className="px-4 py-3">Caja Facturada</th>
                                <th className="px-4 py-3">Número</th>
                                <th className="px-4 py-3 text-right">Total Ventas</th>
                                <th className="px-4 py-3 text-right text-rose-500">Impuesto</th>
                                <th className="px-4 py-3 text-right">Total Factura</th>
                                <th className="px-4 py-3 text-right">Total Crédito</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="12" className="px-4 py-8 text-center text-slate-500 animate-pulse">Cargando transacciones...</td></tr>
                            ) : ventasActivas.length === 0 ? (
                                <tr><td colSpan="12" className="px-4 py-12 text-center text-slate-500"><Banknote size={32} className="mx-auto mb-3 opacity-30" />No se encontraron registros activos en este rango de fechas.</td></tr>
                            ) : (
                                ventasActivas.map(v => <FilaTabla key={v._id} v={v} isActiva={true} />)
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer Tabla Principal -> Botón de Pasa a Histórico */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
                    <p className="text-sm text-slate-500 font-medium">Mostrando {ventasActivas.length} registros activos</p>
                    <button
                        onClick={pasarAHistorial}
                        disabled={seleccionados.length === 0}
                        className={`flex items-center px-6 py-2 rounded-xl font-bold transition-all shadow-lg ${seleccionados.length > 0
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95'
                                : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none'
                            }`}
                    >
                        <Save size={18} className="mr-2" /> Cerrar y Pasar a Histórico ({seleccionados.length})
                    </button>
                </div>
            </div>

            {/* SECCIÓN CENTRAL DE TOTALES (4 CARDS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 dark:bg-blue-400/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <Banknote className="w-8 h-8 text-blue-500 mb-4" />
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total de Ventas</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">{formatMoney(totales.total_ventas)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 dark:bg-rose-400/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <CheckSquare className="w-8 h-8 text-rose-500 mb-4" />
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total de Impuesto</p>
                    <p className="text-3xl font-black text-rose-500 mt-1 font-mono">{formatMoney(totales.impuesto_total)}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl p-5 shadow-xl shadow-emerald-500/20 relative overflow-hidden transform hover:-translate-y-1 transition-transform">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                    <Receipt className="w-8 h-8 text-emerald-100 mb-4" />
                    <p className="text-sm font-bold text-emerald-100 uppercase tracking-wider">Total de Factura</p>
                    <p className="text-3xl font-black mt-1 font-mono">{formatMoney(totales.total_factura)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 dark:bg-amber-400/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <CreditCard className="w-8 h-8 text-amber-500 mb-4" />
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total de Crédito</p>
                    <p className="text-3xl font-black text-amber-500 mt-1 font-mono">{formatMoney(totales.total_credito)}</p>
                </div>
            </div>

            {/* TABLA INFERIOR (DOCUMENTOS HISTÓRICOS) */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden opacity-90">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                    <h3 className="font-bold text-slate-600 dark:text-slate-300 flex items-center">
                        <FileText size={18} className="mr-2 text-slate-400" /> Documentos pasados a Histórico
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExportExcel(ventasHistoricas, 'Ventas_Historicas')}
                            className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                            title="Exportar a Excel"
                        >
                            <FileSpreadsheet size={16} />
                        </button>
                        <button
                            onClick={() => handleExportPDF(ventasHistoricas, 'Ventas_Historicas', 'Ventas Históricas')}
                            className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                            title="Exportar a PDF"
                        >
                            <FileText size={16} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity">
                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Usuario</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Comprobante</th>
                                <th className="px-4 py-3">Caja Facturada</th>
                                <th className="px-4 py-3">Número</th>
                                <th className="px-4 py-3 text-right">Total Ventas</th>
                                <th className="px-4 py-3 text-right">Impuesto</th>
                                <th className="px-4 py-3 text-right">Total Factura</th>
                                <th className="px-4 py-3 text-right">Total Crédito</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventasHistoricas.length === 0 ? (
                                <tr><td colSpan="11" className="px-4 py-8 text-center text-slate-400 text-sm">No se encontraron documentos históricos.</td></tr>
                            ) : (
                                ventasHistoricas.map(v => <FilaTabla key={v._id} v={v} isActiva={false} />)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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

export default CierreCaja;
