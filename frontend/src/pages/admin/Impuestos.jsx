import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Receipt, Plus, Pencil, Trash2, X, Percent, CheckCircle, XCircle } from 'lucide-react';

const Impuestos = () => {
    const { user } = useAuth();
    const apiBaseUrl = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`);

    const [impuestos, setImpuestos] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const initialFormState = {
        _id: null,
        documento_aplicar: 'Venta',
        descripcion: '',
        porcentaje: '',
        condicion: true
    };

    const [formData, setFormData] = useState(initialFormState);

    // Auto-hide Toast
    useEffect(() => {
        if (status.message) {
            const timer = setTimeout(() => setStatus({ type: '', message: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const fetchImpuestos = async () => {
        try {
            const res = await axios.get(`${apiBaseUrl}/api/impuestos`);
            setImpuestos(res.data);
        } catch (error) {
            console.error('Error cargando impuestos:', error);
            setStatus({ type: 'error', message: 'No se pudieron cargar los impuestos' });
        }
    };

    useEffect(() => {
        fetchImpuestos();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const openNewModal = () => {
        setFormData(initialFormState);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (impuesto) => {
        setFormData(impuesto);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Desea eliminar este impuesto definitivamente?')) return;
        try {
            await axios.delete(`${apiBaseUrl}/api/impuestos/${id}`);
            fetchImpuestos();
            setStatus({ type: 'success', message: 'Impuesto eliminado' });
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al eliminar el impuesto' });
        }
    };

    const handleToggleState = async (impuesto) => {
        try {
            const res = await axios.put(`${apiBaseUrl}/api/impuestos/${impuesto._id}`, { condicion: !impuesto.condicion });
            setImpuestos(prev => prev.map(i => i._id === impuesto._id ? res.data : i));
            setStatus({ type: 'success', message: `Impuesto ${impuesto.condicion ? 'Desactivado' : 'Activado'}` });
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al cambiar estado' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        const payload = {
            ...formData,
            usuario_creacion: user?.id || user?._id // Soporta ambos formatos de objeto devuelto por Login
        };

        try {
            if (isEditing) {
                await axios.put(`${apiBaseUrl}/api/impuestos/${formData._id}`, payload);
                setStatus({ type: 'success', message: 'Impuesto actualizado' });
            } else {
                await axios.post(`${apiBaseUrl}/api/impuestos`, payload);
                setStatus({ type: 'success', message: 'Impuesto creado exitosamente' });
            }
            setIsModalOpen(false);
            fetchImpuestos();
        } catch (error) {
            const msg = error.response?.data?.error || 'Error al guardar el impuesto';
            setStatus({ type: 'error', message: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                        <Receipt className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Impuestos</h1>
                        <p className="text-slate-500 dark:text-slate-400 transition-colors">Gestión de porcentajes de impuestos aplicables</p>
                    </div>
                </div>
                <button onClick={openNewModal} className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-rose-500/30 transition-all hover:-translate-y-0.5">
                    <Plus size={20} />
                    <span>Nuevo Impuesto</span>
                </button>
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

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {impuestos.map(impuesto => (
                    <div key={impuesto._id} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm hover:shadow-md transition-all group overflow-hidden">

                        {/* Status bar */}
                        <div className={`h-1.5 w-full ${impuesto.condicion ? 'bg-emerald-500' : 'bg-slate-400'} transition-colors`}></div>

                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 ${impuesto.documento_aplicar === 'Venta'
                                    ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400'
                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                                    }`}>
                                    {impuesto.documento_aplicar}
                                </div>

                                <button
                                    onClick={() => handleToggleState(impuesto)}
                                    className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${impuesto.condicion ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                                    title={impuesto.condicion ? 'Desactivar' : 'Activar'}
                                >
                                    {impuesto.condicion ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                    <span className="font-medium">{impuesto.condicion ? 'Activo' : 'Inactivo'}</span>
                                </button>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-2" title={impuesto.descripcion}>
                                {impuesto.descripcion}
                            </h3>

                            <div className="flex items-center space-x-1 mt-2">
                                <span className="text-3xl font-black text-rose-500 dark:text-rose-400">{impuesto.porcentaje}</span>
                                <Percent className="w-5 h-5 text-rose-500/70" />
                            </div>

                            <div className="mt-auto pt-4 flex flex-col space-y-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>Creado por: <strong className="text-slate-700 dark:text-slate-300">{impuesto.usuario_creacion?.nombre || 'Desconocido'}</strong></span>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="flex w-full mt-auto border-t border-slate-100 dark:border-slate-800/50 justify-between bg-slate-50 dark:bg-slate-900/80">
                            <button onClick={() => openEditModal(impuesto)} className="flex-1 flex justify-center items-center text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 py-2.5 transition-colors font-medium text-sm">
                                <Pencil size={16} className="mr-2" /> Editar
                            </button>
                            <div className="w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                            <button onClick={() => handleDelete(impuesto._id)} className="flex-1 flex justify-center items-center text-slate-500 hover:text-red-600 dark:hover:text-red-400 py-2.5 transition-colors font-medium text-sm">
                                <Trash2 size={16} className="mr-2" /> Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl relative flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">

                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
                                <div className="w-3 h-8 bg-rose-500 rounded-full mr-3"></div>
                                {isEditing ? 'Editar Impuesto' : 'Crear Impuesto'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100/50 dark:bg-slate-800/50 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-rose-500/20 scrollbar-track-transparent">
                            <div className="space-y-5">

                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Documento a Aplicar (*)</label>
                                    <select required name="documento_aplicar" value={formData.documento_aplicar} onChange={handleChange}
                                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all font-medium appearance-none">
                                        <option value="Venta">Venta</option>
                                        <option value="Compra">Compra</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Descripción del Impuesto (*)</label>
                                    <input required type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Ej. IVA 15%"
                                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all font-medium" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Porcentaje de Impuesto (%) (*)</label>
                                    <div className="relative">
                                        <input required type="number" step="0.01" min="0" max="100" name="porcentaje" value={formData.porcentaje} onChange={handleChange} placeholder="0.00"
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all font-bold text-lg" />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                            <Percent className="w-5 h-5 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Estado Inicial (Activo)</span>
                                    <div className={`relative inline-block w-12 h-6 rounded-full transition-colors cursor-pointer ${formData.condicion ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}
                                        onClick={() => setFormData(p => ({ ...p, condicion: !p.condicion }))}>
                                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${formData.condicion ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>

                            </div>

                            {/* Actions */}
                            <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 gap-3 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-2 -mb-2 z-10">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={loading} className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30 hover:-translate-y-0.5'}`}>
                                    {loading ? 'Guardando...' : 'Guardar Impuesto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Impuestos;
