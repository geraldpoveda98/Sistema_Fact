import { API_BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    Users, Plus, Pencil, Trash2, X, CheckCircle, XCircle,
    Search, MapPin, Mail, Globe, Phone, PhoneCall, FileText, Info
} from 'lucide-react';

const Proveedores = () => {
    const { user } = useAuth();
    

    const [proveedores, setProveedores] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // UI states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Formularios y Selecciones
    const initialForm = {
        _id: null,
        nombre: '',
        descripcion: '',
        direccion: '',
        correo: '',
        web_oficial: '',
        ruc: '',
        telefono_1: '',
        telefono_2: '',
        contacto_nombre: '',
        contacto_telefono: '',
        estado: true
    };
    const [formData, setFormData] = useState(initialForm);
    const [selectedProv, setSelectedProv] = useState(null);

    // Toast auto-hide
    useEffect(() => {
        if (status.message) {
            const timer = setTimeout(() => setStatus({ type: '', message: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // Fetch data
    const fetchProveedores = async (search = '') => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/proveedores?search=${search}`);
            setProveedores(res.data);
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al cargar proveedores' });
        }
    };

    useEffect(() => {
        // Debounce simple para la búsqueda
        const timer = setTimeout(() => {
            fetchProveedores(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchProveedores();
    }, []);

    // Handlers
    const openNew = () => {
        setFormData(initialForm);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEdit = (prov) => {
        setFormData(prov);
        setIsEditing(true);
        setIsDetailOpen(false); // Cerramos detalle si estaba abierto
        setIsModalOpen(true);
    };

    const openDetail = (prov) => {
        setSelectedProv(prov);
        setIsDetailOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Desea eliminar este proveedor definitivamente?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/proveedores/${id}`);
            fetchProveedores(searchTerm);
            setIsDetailOpen(false);
            setStatus({ type: 'success', message: 'Proveedor eliminado' });
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al eliminar proveedor' });
        }
    };

    const handleToggleEstado = async (prov) => {
        try {
            const res = await axios.put(`${API_BASE_URL}/api/proveedores/${prov._id}`, { estado: !prov.estado });
            setProveedores(prev => prev.map(p => p._id === prov._id ? res.data : p));
            if (selectedProv && selectedProv._id === prov._id) setSelectedProv(res.data);
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al cambiar estado' });
        }
    };

    const saveProveedor = async (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = { ...formData, usuario_creacion: user?.id || user?._id };
        try {
            if (isEditing) {
                await axios.put(`${API_BASE_URL}/api/proveedores/${formData._id}`, payload);
                setStatus({ type: 'success', message: 'Proveedor actualizado' });
            } else {
                await axios.post(`${API_BASE_URL}/api/proveedores`, payload);
                setStatus({ type: 'success', message: 'Proveedor creado' });
            }
            setIsModalOpen(false);
            fetchProveedores(searchTerm);
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Error al guardar' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Proveedores</h1>
                        <p className="text-slate-500 dark:text-slate-400 transition-colors">Gestiona la información de tus proveedores y contactos.</p>
                    </div>
                </div>

                <button onClick={openNew} className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5">
                    <Plus size={20} /><span>Agregar Proveedor</span>
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

            {/* BARRA DE BÚSQUEDA */}
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre de proveedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium"
                    />
                </div>
            </div>

            {/* GRILLA DE TARJETAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
                {proveedores.map(prov => (
                    <div key={prov._id} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                        <div className={`h-1.5 w-full ${prov.estado ? 'bg-emerald-500' : 'bg-slate-400'} transition-colors`}></div>

                        <div className="p-5 flex-1 flex flex-col pt-6">
                            {/* Estado badge */}
                            <div className="absolute top-4 right-4">
                                <span className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-md font-bold tracking-wide ${prov.estado ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                    {prov.estado ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 pr-16 truncate" title={prov.nombre}>{prov.nombre}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[40px]">{prov.descripcion || <span className="italic opacity-50">Sin descripción</span>}</p>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                    <FileText size={16} className="text-slate-400 mr-2 shrink-0" />
                                    <span className="truncate"><strong>RUC:</strong> {prov.ruc || 'N/A'}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                    <Users size={16} className="text-slate-400 mr-2 shrink-0" />
                                    <span className="truncate"><strong>Contacto:</strong> {prov.contacto_nombre || 'N/A'}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                    <Mail size={16} className="text-slate-400 mr-2 shrink-0" />
                                    <span className="truncate">{prov.correo || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="flex w-full border-t border-slate-100 dark:border-slate-800/50 justify-between bg-slate-50 dark:bg-slate-900/80">
                            <button onClick={() => openDetail(prov)} className="flex-1 flex justify-center items-center text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 py-3 transition-colors font-medium text-sm">
                                <Info size={16} className="mr-2" /> Detalles
                            </button>
                        </div>
                    </div>
                ))}
                {proveedores.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        No hay proveedores que coincidan con la búsqueda.
                    </div>
                )}
            </div>

            {/* ---------------- MODAL FORMULARIO PROVEEDOR ---------------- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                                <div className="w-2 h-6 bg-amber-500 rounded-full mr-3"></div>
                                {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={saveProveedor} className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent">
                            <div className="space-y-4">
                                {/* Info Basica */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombre (*)</label>
                                        <input required type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Descripción</label>
                                        <textarea rows="2" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium resize-none" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Dirección</label>
                                        <input type="text" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">RUC</label>
                                        <input type="text" value={formData.ruc} onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium tracking-wider" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Correo Electrónico</label>
                                        <input type="email" value={formData.correo} onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Web Oficial</label>
                                        <input type="text" value={formData.web_oficial} onChange={(e) => setFormData({ ...formData, web_oficial: e.target.value })} placeholder="Ej: www.ejemplo.com"
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium" />
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 dark:border-slate-800 my-6"></div>

                                {/* Telefonos */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Teléfono 1</label>
                                        <input type="tel" value={formData.telefono_1} onChange={(e) => setFormData({ ...formData, telefono_1: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Teléfono 2</label>
                                        <input type="tel" value={formData.telefono_2} onChange={(e) => setFormData({ ...formData, telefono_2: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium" />
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 dark:border-slate-800 my-6"></div>

                                {/* Contacto */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <h3 className="text-sm font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase mb-2">Información del Contacto</h3>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombre Contacto</label>
                                        <input type="text" value={formData.contacto_nombre} onChange={(e) => setFormData({ ...formData, contacto_nombre: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Teléfono / Extensión Contacto</label>
                                        <input type="text" value={formData.contacto_telefono} onChange={(e) => setFormData({ ...formData, contacto_telefono: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium" />
                                    </div>
                                </div>

                                <div className="p-4 mt-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Proveedor Activo</span>
                                    <div className={`relative inline-block w-12 h-6 rounded-full transition-colors cursor-pointer ${formData.estado ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}
                                        onClick={() => setFormData(p => ({ ...p, estado: !p.estado }))}>
                                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${formData.estado ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>

                            </div>

                            <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 gap-3 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-2 -mb-2 z-10">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                                <button type="submit" disabled={loading} className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30 hover:-translate-y-0.5'}`}>
                                    {loading ? '...' : 'Guardar Proveedor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ---------------- MODAL DETALLES PROVEEDOR ---------------- */}
            {isDetailOpen && selectedProv && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-t-3xl">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
                                <Users className="text-amber-500 mr-3" size={28} />
                                Detalles del Proveedor
                            </h2>
                            <button onClick={() => setIsDetailOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent">
                            <div className="mb-6 flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{selectedProv.nombre}</h1>
                                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">{selectedProv.descripcion || 'Sin descripción detallada.'}</p>
                                </div>
                                <span className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-bold tracking-wide border ${selectedProv.estado ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                                    {selectedProv.estado ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">

                                <div className="space-y-4">
                                    <div className="flex items-start text-sm">
                                        <FileText size={18} className="text-amber-500 mr-3 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">RUC</p>
                                            <p className="text-slate-600 dark:text-slate-400 font-mono tracking-wide">{selectedProv.ruc || 'No registrado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start text-sm">
                                        <MapPin size={18} className="text-amber-500 mr-3 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">Dirección</p>
                                            <p className="text-slate-600 dark:text-slate-400">{selectedProv.direccion || 'No registrada'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start text-sm">
                                        <Mail size={18} className="text-amber-500 mr-3 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">Correo Electrónico</p>
                                            <a href={`mailto:${selectedProv.correo}`} className="text-cyan-600 dark:text-cyan-400 hover:underline">{selectedProv.correo || 'No registrado'}</a>
                                        </div>
                                    </div>
                                    <div className="flex items-start text-sm">
                                        <Globe size={18} className="text-amber-500 mr-3 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">Sitio Web</p>
                                            <a href={selectedProv.web_oficial?.startsWith('http') ? selectedProv.web_oficial : `https://${selectedProv.web_oficial}`} target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline">{selectedProv.web_oficial || 'No registrado'}</a>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 md:border-l md:border-slate-200 md:dark:border-slate-700 md:pl-6">
                                    <div className="flex items-start text-sm">
                                        <Phone size={18} className="text-amber-500 mr-3 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-300">Teléfonos Principales</p>
                                            <p className="text-slate-600 dark:text-slate-400">{selectedProv.telefono_1 || 'No registrado'}</p>
                                            {selectedProv.telefono_2 && <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedProv.telefono_2}</p>}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Contacto Directo</p>
                                        <div className="flex items-start text-sm mb-3">
                                            <Users size={18} className="text-indigo-500 mr-3 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-bold text-slate-700 dark:text-slate-300">Nombre</p>
                                                <p className="text-slate-600 dark:text-slate-400">{selectedProv.contacto_nombre || 'No registrado'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start text-sm">
                                            <PhoneCall size={18} className="text-indigo-500 mr-3 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-bold text-slate-700 dark:text-slate-300">Teléfono / Extensión</p>
                                                <p className="text-slate-600 dark:text-slate-400">{selectedProv.contacto_telefono || 'No registrado'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-center text-slate-400 mt-6">
                                Registrado el {new Date(selectedProv.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Botones de acción del Modal de Detalles */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-b-3xl shrink-0 flex gap-3">
                            <button onClick={() => handleToggleEstado(selectedProv)} className={`flex-1 flex justify-center items-center py-2.5 rounded-xl font-bold transition-colors border ${selectedProv.estado ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/60' : 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/60'}`}>
                                {selectedProv.estado ? <><XCircle size={18} className="mr-2" /> Desactivar</> : <><CheckCircle size={18} className="mr-2" /> Activar</>}
                            </button>
                            <button onClick={() => openEdit(selectedProv)} className="flex-1 flex justify-center items-center py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5">
                                <Pencil size={18} className="mr-2" /> Editar
                            </button>
                            <button onClick={() => handleDelete(selectedProv._id)} className="flex-1 flex justify-center items-center py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5">
                                <Trash2 size={18} className="mr-2" /> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Proveedores;
