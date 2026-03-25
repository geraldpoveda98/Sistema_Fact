import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Layers, Plus, Pencil, Trash2, X, CheckCircle, XCircle, CreditCard, Box, Hash } from 'lucide-react';

const Series = () => {
    const { user } = useAuth();
    const apiBaseUrl = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`);

    // Estado principal
    const [activeTab, setActiveTab] = useState('series'); // 'series' | 'cajas'

    // Datos y estados
    const [cajas, setCajas] = useState([]);
    const [series, setSeries] = useState([]);
    const [proveedores, setProveedores] = useState([]);

    // UI states
    const [isCajaModalOpen, setIsCajaModalOpen] = useState(false);
    const [isSerieModalOpen, setIsSerieModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isEnUso, setIsEnUso] = useState(false);

    // Formularios
    const initialCajaForm = { _id: null, nombre: '', condicion: true };
    const [cajaForm, setCajaForm] = useState(initialCajaForm);

    const initialSerieForm = {
        _id: null,
        documento: 'Venta',
        tipo: 'Factura',
        serie: '',
        caja: '',
        proveedor: '',
        correlativo_actual: 1,
        condicion: true
    };
    const [serieForm, setSerieForm] = useState(initialSerieForm);

    // Toast auto-hide
    useEffect(() => {
        if (status.message) {
            const timer = setTimeout(() => setStatus({ type: '', message: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // Fetch data
    const fetchCajas = async () => {
        try {
            const res = await axios.get(`${apiBaseUrl}/api/cajas`);
            setCajas(res.data);
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al cargar cajas' });
        }
    };

    const fetchSeries = async () => {
        try {
            const res = await axios.get(`${apiBaseUrl}/api/series`);
            setSeries(res.data);
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al cargar series' });
        }
    };

    const fetchProveedores = async () => {
        try {
            const res = await axios.get(`${apiBaseUrl}/api/proveedores`);
            setProveedores(res.data);
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al cargar proveedores' });
        }
    };

    useEffect(() => {
        fetchCajas();
        fetchSeries();
        fetchProveedores();
    }, []);

    // -------------------------------------------------------------
    // HANDLERS CAJAS
    // -------------------------------------------------------------
    const openNewCaja = () => {
        setCajaForm(initialCajaForm);
        setIsEditing(false);
        setIsCajaModalOpen(true);
    };

    const openEditCaja = (caja) => {
        setCajaForm(caja);
        setIsEditing(true);
        setIsCajaModalOpen(true);
    };

    const handleDeleteCaja = async (id) => {
        if (!window.confirm('¿Desea eliminar esta caja definitivamente?')) return;
        try {
            await axios.delete(`${apiBaseUrl}/api/cajas/${id}`);
            fetchCajas();
            setStatus({ type: 'success', message: 'Caja eliminada' });
            // Refrescar series por si acaso la caja estaba asignada
            fetchSeries();
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al eliminar caja' });
        }
    };

    const handleToggleCajaEstado = async (caja) => {
        try {
            const res = await axios.put(`${apiBaseUrl}/api/cajas/${caja._id}`, { condicion: !caja.condicion });
            setCajas(prev => prev.map(c => c._id === caja._id ? res.data : c));
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al cambiar estado de la caja' });
        }
    };

    const saveCaja = async (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = { ...cajaForm, usuario_creacion: user?.id || user?._id };
        try {
            if (isEditing) {
                await axios.put(`${apiBaseUrl}/api/cajas/${cajaForm._id}`, payload);
                setStatus({ type: 'success', message: 'Caja actualizada' });
            } else {
                await axios.post(`${apiBaseUrl}/api/cajas`, payload);
                setStatus({ type: 'success', message: 'Caja creada' });
            }
            setIsCajaModalOpen(false);
            fetchCajas();
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Error al guardar caja' });
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // HANDLERS SERIES
    // -------------------------------------------------------------
    const openNewSerie = () => {
        setSerieForm(initialSerieForm);
        setIsEditing(false);
        setIsEnUso(false);
        setIsSerieModalOpen(true);
    };

    const openEditSerie = async (serie) => {
        setSerieForm({
            ...serie,
            caja: serie.caja?._id || '',
            correlativo_actual: String(serie.correlativo_actual || 0).padStart(6, '0')
        });
        setIsEditing(true);
        setIsSerieModalOpen(true);
        setIsEnUso(false);

        // Verificar si la serie está en uso
        try {
            const res = await axios.get(`${apiBaseUrl}/api/series/uso/${serie._id}`);
            setIsEnUso(res.data.enUso);
        } catch (error) {
            console.error("Error verificando uso de serie:", error);
        }
    };

    const handleDeleteSerie = async (id) => {
        if (!window.confirm('¿Desea eliminar esta serie definitivamente?')) return;
        try {
            await axios.delete(`${apiBaseUrl}/api/series/${id}`);
            fetchSeries();
            setStatus({ type: 'success', message: 'Serie eliminada' });
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al eliminar serie' });
        }
    };

    const handleToggleSerieEstado = async (serie) => {
        try {
            const res = await axios.put(`${apiBaseUrl}/api/series/${serie._id}`, { condicion: !serie.condicion });
            setSeries(prev => prev.map(s => s._id === serie._id ? res.data : s));
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al cambiar estado de la serie' });
        }
    };

    const saveSerie = async (e) => {
        e.preventDefault();
        setLoading(true);

        let payload = { 
            ...serieForm, 
            usuario_creacion: user?.id || user?._id,
            correlativo_actual: serieForm.correlativo_actual === '' ? 1 : Number(serieForm.correlativo_actual)
        };

        // Reglas de negocio UI: 
        if (payload.documento === 'Compra') {
            payload.caja = null; // Compras no usan caja en esta UI
        }

        try {
            if (payload.documento === 'Compra') {
                if (!payload.proveedor) {
                    setStatus({ type: 'error', message: 'Debe seleccionar un proveedor' });
                    setLoading(false);
                    return;
                }
            }

            if (isEditing) {
                await axios.put(`${apiBaseUrl}/api/series/${serieForm._id}`, payload);
                setStatus({ type: 'success', message: 'Serie actualizada' });
            } else {
                await axios.post(`${apiBaseUrl}/api/series`, payload);
                setStatus({ type: 'success', message: 'Serie creada' });
            }
            setIsSerieModalOpen(false);
            fetchSeries();
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Error al guardar serie' });
        } finally {
            setLoading(false);
        }
    };

    // Funciones auxiliares para opciones de UI
    const getTiposDisponibles = (doc) => {
        if (doc === 'Venta') return ['Proforma', 'Factura', 'Devolución'];
        if (doc === 'Compra') return ['Ingreso', 'Devolución'];
        return [];
    };

    // Render principal
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
                        <Layers className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Series y Cajas</h1>
                        <p className="text-slate-500 dark:text-slate-400 transition-colors">Configuración de consecutivos, cajas y control documental.</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('series')}
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'series' ? 'bg-white dark:bg-slate-700 shadow-sm text-fuchsia-600 dark:text-fuchsia-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Ver Series
                    </button>
                    <button
                        onClick={() => setActiveTab('cajas')}
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'cajas' ? 'bg-white dark:bg-slate-700 shadow-sm text-fuchsia-600 dark:text-fuchsia-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Ver Cajas
                    </button>
                </div>
            </div>

            {/* Notification Toast */}
            {status.message && (
                <div onClick={() => setStatus({ type: '', message: '' })}
                    className={`fixed top-20 right-4 sm:top-6 sm:right-6 z-[100] p-4 rounded-xl shadow-2xl border transition-all animate-in slide-in-from-top-8 fade-in duration-300 flex items-center gap-3 backdrop-blur-xl cursor-pointer hover:scale-[1.02] ${status.type === 'error'
                        ? 'bg-red-50/90 dark:bg-red-950/90 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400'
                        : 'bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                        }`}>
                    <div className="flex flex-col pr-8">
                        <span className="font-bold text-sm">{status.type === 'error' ? 'Error' : 'Éxito'}</span>
                        <span className="font-medium text-sm opacity-90">{status.message}</span>
                    </div>
                    <button className="absolute top-2 right-2 p-1 opacity-50 hover:opacity-100 rounded-md">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* BARRA DE ACCIONES SEGÚN TAB */}
            <div className="flex justify-end">
                {activeTab === 'series' ? (
                    <button onClick={openNewSerie} className="flex items-center space-x-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-fuchsia-500/30 transition-all hover:-translate-y-0.5">
                        <Plus size={20} /><span>Agregar Serie</span>
                    </button>
                ) : (
                    <button onClick={openNewCaja} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5">
                        <Plus size={20} /><span>Agregar Caja</span>
                    </button>
                )}
            </div>

            {/* ---------------- VISTA SERIES ---------------- */}
            {activeTab === 'series' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-300">
                    {series.map(serie => (
                        <div key={serie._id} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm hover:shadow-md transition-all group overflow-hidden relative">

                            <div className={`h-1.5 w-full ${serie.condicion ? 'bg-emerald-500' : 'bg-slate-400'} transition-colors`}></div>

                            <div className="p-5 flex-1 flex flex-col pt-6">
                                {/* Estado badge absoluto arriba der */}
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={() => handleToggleSerieEstado(serie)}
                                        className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer ${serie.condicion ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                                        title={serie.condicion ? 'Desactivar' : 'Activar'}
                                    >
                                        {serie.condicion ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                        <span className="font-medium hidden sm:inline">{serie.condicion ? 'Activa' : 'Inactiva'}</span>
                                    </button>
                                </div>

                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${serie.documento === 'Venta' ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400' : 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400'}`}>
                                    <Hash size={24} />
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{serie.serie}</h3>

                                <div className="space-y-1 mb-4">
                                    <div className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                        <span className="w-20 text-slate-400 font-normal">Doc:</span>
                                        <span className={`px-2 py-0.5 rounded-md text-xs uppercase tracking-wide ${serie.documento === 'Venta' ? 'bg-cyan-50 dark:bg-cyan-900/30' : 'bg-fuchsia-50 dark:bg-fuchsia-900/30'}`}>{serie.documento}</span>
                                    </div>
                                    <div className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                        <span className="w-20 text-slate-400 font-normal">Tipo:</span>
                                        <span>{serie.tipo}</span>
                                    </div>
                                    <div className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                        <span className="w-20 text-slate-400 font-normal">Caja:</span>
                                        <span className="flex items-center text-indigo-600 dark:text-indigo-400">
                                            {serie.caja ? <><Box size={14} className="mr-1" /> {serie.caja.nombre}</> : <span className="text-slate-400 font-normal italic">N/A</span>}
                                        </span>
                                    </div>
                                    {serie.documento === 'Compra' && (
                                        <div className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                            <span className="w-20 text-slate-400 font-normal">Proveedor:</span>
                                            <span className="truncate">{serie.proveedor || <span className="text-slate-400 font-normal italic">S/D</span>}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                        <span className="w-20 text-slate-400 font-normal">Inicia:</span>
                                        <span className="font-mono text-fuchsia-600 dark:text-fuchsia-400">{String(serie.correlativo_actual || 0).padStart(6, '0')}</span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 flex flex-col text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                                    <span>Creado por: <strong className="text-slate-700 dark:text-slate-300">{serie.usuario_creacion?.nombre || 'S/D'}</strong></span>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex w-full border-t border-slate-100 dark:border-slate-800/50 justify-between bg-slate-50 dark:bg-slate-900/80">
                                <button onClick={() => openEditSerie(serie)} className="flex-1 flex justify-center items-center text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 py-2.5 transition-colors font-medium text-sm">
                                    <Pencil size={16} className="mr-2" /> Editar
                                </button>
                                <div className="w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                                <button onClick={() => handleDeleteSerie(serie._id)} className="flex-1 flex justify-center items-center text-slate-500 hover:text-red-600 dark:hover:text-red-400 py-2.5 transition-colors font-medium text-sm">
                                    <Trash2 size={16} className="mr-2" /> Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                    {series.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                            No hay series registradas aún.
                        </div>
                    )}
                </div>
            )}

            {/* ---------------- VISTA CAJAS ---------------- */}
            {activeTab === 'cajas' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-300">
                    {cajas.map(caja => (
                        <div key={caja._id} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            <div className={`h-1.5 w-full ${caja.condicion ? 'bg-emerald-500' : 'bg-slate-400'} transition-colors`}></div>
                            <div className="p-5 flex-1 flex flex-col item-center">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center">
                                        <CreditCard size={20} />
                                    </div>
                                    <button
                                        onClick={() => handleToggleCajaEstado(caja)}
                                        className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${caja.condicion ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                                        title={caja.condicion ? 'Desactivar' : 'Activar'}
                                    >
                                        {caja.condicion ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 truncate">{caja.nombre}</h3>
                                <p className={`text-sm font-medium ${caja.condicion ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>{caja.condicion ? 'Caja Activa' : 'Caja Inactiva'}</p>

                                <div className="mt-auto pt-6 flex flex-col text-xs text-slate-400">
                                    <span>Creador: {caja.usuario_creacion?.nombre || 'Desconocido'}</span>
                                </div>
                            </div>

                            <div className="flex w-full border-t border-slate-100 dark:border-slate-800/50 justify-between bg-slate-50 dark:bg-slate-900/80">
                                <button onClick={() => openEditCaja(caja)} className="flex-1 flex justify-center items-center text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 py-2.5 transition-colors font-medium text-sm">
                                    <Pencil size={16} className="mr-2" /> Editar
                                </button>
                                <div className="w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                                <button onClick={() => handleDeleteCaja(caja._id)} className="flex-1 flex justify-center items-center text-slate-500 hover:text-red-600 dark:hover:text-red-400 py-2.5 transition-colors font-medium text-sm">
                                    <Trash2 size={16} className="mr-2" /> Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                    {cajas.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                            No hay cajas registradas aún.
                        </div>
                    )}
                </div>
            )}

            {/* ---------------- MODAL FORMULARIO CAJA ---------------- */}
            {isCajaModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                                <div className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></div>
                                {isEditing ? 'Editar Caja' : 'Nueva Caja'}
                            </h2>
                            <button onClick={() => setIsCajaModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={saveCaja} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombre de la Caja (*)</label>
                                <input required type="text" value={cajaForm.nombre} onChange={(e) => setCajaForm({ ...cajaForm, nombre: e.target.value })} placeholder="Ej. Caja Principal"
                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium" />
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Caja Activa</span>
                                <div className={`relative inline-block w-12 h-6 rounded-full transition-colors cursor-pointer ${cajaForm.condicion ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}
                                    onClick={() => setCajaForm(p => ({ ...p, condicion: !p.condicion }))}>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${cajaForm.condicion ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsCajaModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                                <button type="submit" disabled={loading} className={`flex-1 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}>
                                    {loading ? '...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ---------------- MODAL FORMULARIO SERIE ---------------- */}
            {isSerieModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl relative flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                                <div className="w-2 h-6 bg-fuchsia-500 rounded-full mr-3"></div>
                                {isEditing ? 'Editar Serie' : 'Nueva Serie'}
                            </h2>
                            <button onClick={() => setIsSerieModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={saveSerie} className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-fuchsia-500/20 scrollbar-track-transparent">
                            {isEnUso && (
                                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                                    <XCircle size={14} />
                                    <span>Esta serie ya está en uso por documentos. Los campos críticos han sido bloqueados por seguridad.</span>
                                </div>
                            )}
                            <div className="space-y-4">

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Documento (*)</label>
                                        <select required disabled={isEnUso} value={serieForm.documento} onChange={(e) => {
                                            const newDoc = e.target.value;
                                            const newTipos = getTiposDisponibles(newDoc);
                                            setSerieForm({ ...serieForm, documento: newDoc, tipo: newTipos[0], caja: newDoc === 'Compra' ? '' : serieForm.caja });
                                        }} className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-all font-medium">
                                            <option value="Venta">Venta</option>
                                            <option value="Compra">Compra</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Tipo de Documento (*)</label>
                                        <select required disabled={isEnUso} value={serieForm.tipo} onChange={(e) => setSerieForm({ ...serieForm, tipo: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-all font-medium">
                                            {getTiposDisponibles(serieForm.documento).map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Serie Asignada (*)</label>
                                        <input required disabled={isEnUso} type="text" value={serieForm.serie} onChange={(e) => setSerieForm({ ...serieForm, serie: e.target.value.toUpperCase() })} placeholder="Ej. PRF00"
                                            className={`w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-all font-bold tracking-widest uppercase ${isEnUso ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Inicia en Número (*)</label>
                                        <input 
                                            required 
                                            disabled={isEnUso}
                                            type="text" 
                                            value={serieForm.correlativo_actual} 
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setSerieForm({ ...serieForm, correlativo_actual: val });
                                            }} 
                                            placeholder="000001"
                                            className={`w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-all font-bold font-mono ${isEnUso ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 flex justify-between px-1">
                                            <span>Format: 000000</span>
                                            <span>Muestra: <strong className="text-fuchsia-500">{String(serieForm.correlativo_actual || 0).padStart(6, '0')}</strong></span>
                                        </p>
                                    </div>
                                </div>

                                {/* CAJA, habilitado solo si Documento VENTA */}
                                {serieForm.documento === 'Venta' && (
                                    <div className="transition-opacity">
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Caja Asignada (*)</label>
                                        <select required value={serieForm.caja} onChange={(e) => setSerieForm({ ...serieForm, caja: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium">
                                            <option value="">-- Seleccionar Caja --</option>
                                            {cajas.map(c => (
                                                <option key={c._id} value={c._id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* PROVEEDOR, habilitado solo si Documento COMPRA */}
                                {serieForm.documento === 'Compra' && (
                                    <div className="transition-opacity">
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Comprador / Proveedor (*)</label>
                                        {proveedores.length > 0 ? (
                                            <select 
                                                required 
                                                value={serieForm.proveedor} 
                                                onChange={(e) => setSerieForm({ ...serieForm, proveedor: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium"
                                            >
                                                <option value="">-- Seleccionar Proveedor --</option>
                                                {proveedores.map(p => (
                                                    <option key={p._id} value={p.nombre}>{p.nombre}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
                                                No hay proveedores registrados. Debe registrar un proveedor antes de crear series de compra.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Serie Activa</span>
                                    <div className={`relative inline-block w-12 h-6 rounded-full transition-colors cursor-pointer ${serieForm.condicion ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}
                                        onClick={() => setSerieForm(p => ({ ...p, condicion: !p.condicion }))}>
                                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${serieForm.condicion ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>

                            </div>

                            <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 gap-3 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-2 -mb-2 z-10">
                                <button type="button" onClick={() => setIsSerieModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                                <button 
                                    type="submit" 
                                    disabled={loading || (serieForm.documento === 'Compra' && proveedores.length === 0)} 
                                    className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${loading || (serieForm.documento === 'Compra' && proveedores.length === 0) ? 'bg-slate-400 cursor-not-allowed' : 'bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-500/30 hover:-translate-y-0.5'}`}
                                >
                                    {loading ? '...' : 'Generar Serie'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Series;
