import { API_BASE_URL } from '../../config';
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Search, Calendar, Filter, FileText, User, Hash, Box, Wallet, Building2, Tag, Info, AlertTriangle, AlertCircle } from 'lucide-react';

const ComprasPorFecha = () => {
    const { token } = useAuth();
    

    // Filtros de búsqueda
    const [filtros, setFiltros] = useState({
        fechaInicio: '',
        fechaFin: '',
        estado: 'Todos', // 'Todos', 'Ingresos', 'Devolución'
        search: ''
    });

    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Ejecutar búsqueda
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Construir QueryString
            const params = new URLSearchParams();
            if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
            if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
            if (filtros.estado && filtros.estado !== 'Todos') params.append('estado', filtros.estado);
            if (filtros.search) params.append('search', filtros.search);

            const res = await axios.get(`${API_BASE_URL}/api/compras/consultar?${params.toString()}`);
            setCompras(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al consultar las compras.');
        } finally {
            setLoading(false);
        }
    };

    // Formatear Fecha
    const formatFecha = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('es-NI', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    // Formatear Moneda
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(amount);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Consulta Compras por Fecha</h1>
                        <p className="text-slate-500 dark:text-slate-400 transition-colors">Filtros avanzados para auditoría y revisión de adquisiciones.</p>
                    </div>
                </div>
            </div>

            {/* Panel de Filtros */}
            <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Fecha Inicio */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Fecha Inicio</label>
                        <input type="date" value={filtros.fechaInicio} onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium" />
                    </div>

                    {/* Fecha Fin */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Fecha Fin</label>
                        <input type="date" value={filtros.fechaFin} onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium" />
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Estado / Tipo</label>
                        <select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium">
                            <option value="Todos">Todos</option>
                            <option value="Ingresos">Ingresos</option>
                            <option value="Devolución">Devolución</option>
                            <option value="Anulado">Anulado</option>
                        </select>
                    </div>

                    {/* Búsqueda Keyword */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Búsqueda General</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Search size={16} />
                            </div>
                            <input type="text" placeholder="Usuario, Proveedor..." value={filtros.search} onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
                    <button type="button" onClick={() => { setFiltros({ fechaInicio: '', fechaFin: '', estado: 'Todos', search: '' }); setCompras([]); }} className="px-6 py-2.5 rounded-xl font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mr-3">
                        Limpiar Filtros
                    </button>
                    <button type="submit" disabled={loading} className="flex flex-row items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Search size={18} /> {loading ? 'Buscando...' : 'Buscar Compras'}
                    </button>
                </div>
            </form>

            {/* Errores */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Resultados (Desktop View) */}
            {compras.length > 0 ? (
                <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                                    <th className="p-4 whitespace-nowrap">Fecha</th>
                                    <th className="p-4 whitespace-nowrap">Usuario</th>
                                    <th className="p-4 whitespace-nowrap">Comprobante</th>
                                    <th className="p-4 whitespace-nowrap">Proveedor</th>
                                    <th className="p-4 whitespace-nowrap">Comprador</th>
                                    <th className="p-4 text-right whitespace-nowrap">Subtotal</th>
                                    <th className="p-4 text-right whitespace-nowrap">Impuesto</th>
                                    <th className="p-4 text-right whitespace-nowrap">Total Ingreso</th>
                                    <th className="p-4 text-center whitespace-nowrap">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-medium">
                                {compras.map(compra => (
                                    <tr key={compra._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatFecha(compra.fecha)}</td>
                                        <td className="p-4 text-slate-800 dark:text-slate-200">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-slate-400" /> {compra.usuario?.nombre || 'S/D'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-1 rounded-md w-max">
                                                <FileText size={14} /> {compra.comprobante}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-800 dark:text-slate-200">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={14} className="text-slate-400 shrink-0" />
                                                <span className="truncate max-w-[150px]" title={compra.proveedor}>{compra.proveedor}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">
                                            {compra.comprador || <span className="italic opacity-50">N/A</span>}
                                        </td>
                                        <td className="p-4 text-right text-slate-600 dark:text-slate-300">{formatCurrency(compra.total_compra)}</td>
                                        <td className="p-4 text-right text-slate-500 dark:text-slate-400">
                                            {compra.total_impuesto > 0 ? (
                                                <div className="flex flex-col items-end">
                                                    <span>{formatCurrency(compra.total_impuesto)}</span>
                                                    <span className="text-[10px] text-fuchsia-500">{compra.impuesto_nombre || `Impuesto`} ({compra.impuesto_porcentaje}%)</span>
                                                </div>
                                            ) : (
                                                <span className="opacity-50">C$ 0.00</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-emerald-600 dark:text-emerald-400 font-black text-base whitespace-nowrap">{formatCurrency(compra.total_ingreso)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold tracking-wide 
                                                ${compra.estado === 'Ingresos' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    compra.estado === 'Devolución' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {compra.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                !loading && !error && (
                    <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/50">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-1">Sin Resultados</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
                            Ajusta los filtros de arriba y presiona "Buscar Compras" para visualizar los registros.
                        </p>
                    </div>
                )
            )}
        </div>
    );
};

export default ComprasPorFecha;
