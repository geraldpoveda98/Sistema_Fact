import { API_BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users, Plus, Edit2, Trash2, ShieldBan, CheckCircle, Search, MoreVertical, CreditCard, LayoutGrid, X, Mail, Phone, MapPin, FileText, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

const Clientes = () => {
    
    const { user } = useAuth();

    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Formulario de Cliente
    const initForm = {
        id: null,
        nombre: '',
        tipo_documento: 'DNI',
        num_documento: '',
        telefono1: '',
        telefono2: '',
        email: '',
        direccion: '',
        comentario: '',
        credito: false
    };

    const [formData, setFormData] = useState(initForm);
    const [isEditing, setIsEditing] = useState(false);

    const [activeDropdown, setActiveDropdown] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.dropdown-container')) setActiveDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchClientes();
    }, []);

    const showToast = (message, type = "success") => {
        setToastMessage({ text: message, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/clientes`);
            setClientes(response.data);
        } catch (error) {
            console.error("Error cargando clientes:", error);
            showToast("No se pudieron cargar los clientes", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            delete payload.id;

            if (isEditing) {
                await axios.put(`${API_BASE_URL}/api/clientes/${formData.id}`, payload);
                showToast("Cliente actualizado correctamente");
            } else {
                await axios.post(`${API_BASE_URL}/api/clientes`, payload);
                showToast("Cliente creado exitosamente");
            }
            closeModal();
            fetchClientes();
        } catch (error) {
            showToast(error.response?.data?.error || "Error al guardar el cliente", "error");
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await axios.patch(`${API_BASE_URL}/api/clientes/${id}/estado`);
            showToast(`Cliente ${currentStatus ? 'deshabilitado' : 'habilitado'}`);
            fetchClientes();
            setActiveDropdown(null);
        } catch (error) {
            showToast("Error al cambiar estado", "error");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Seguro que desea ELIMINAR permanentemente este cliente?")) {
            try {
                await axios.delete(`${API_BASE_URL}/api/clientes/${id}`);
                showToast("Cliente eliminado de la base de datos");
                fetchClientes();
                setActiveDropdown(null);
            } catch (error) {
                showToast("Error al eliminar el cliente", "error");
            }
        }
    };

    const openCreateModal = () => {
        setFormData(initForm);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const editItem = (cliente) => {
        setFormData({
            id: cliente._id,
            nombre: cliente.nombre,
            tipo_documento: cliente.tipo_documento || 'DNI',
            num_documento: cliente.num_documento || '',
            telefono1: cliente.telefono1 || '',
            telefono2: cliente.telefono2 || '',
            email: cliente.email || '',
            direccion: cliente.direccion || '',
            comentario: cliente.comentario || '',
            credito: cliente.credito || false
        });
        setIsEditing(true);
        setActiveDropdown(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData(initForm);
        setIsEditing(false);
    };

    const filteredClientes = clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.num_documento && c.num_documento.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.telefono1 && c.telefono1.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleExportExcel = () => {
        const dataToExport = filteredClientes.map(c => ({
            'Nombre': c.nombre,
            'Tipo Doc': c.tipo_documento || 'N/A',
            'Nro Doc': c.num_documento || 'N/A',
            'Teléfono 1': c.telefono1 || 'N/A',
            'Teléfono 2': c.telefono2 || 'N/A',
            'Email': c.email || 'N/A',
            'Dirección': c.direccion || 'N/A',
            'Crédito': c.credito ? 'Sí' : 'No',
            'Estado': c.estado ? 'Activo' : 'Inactivo'
        }));
        exportToExcel(dataToExport, 'Directorio_Clientes', 'Clientes');
    };

    const handleExportPDF = () => {
        const columns = [
            { header: 'Nombre', key: 'nombre' },
            { header: 'Documento', key: (c) => `${c.tipo_documento || ''} ${c.num_documento || ''}` },
            { header: 'Teléfono', key: 'telefono1' },
            { header: 'Email', key: 'email' },
            { header: 'Crédito', key: (c) => c.credito ? 'Sí' : 'No' }
        ];
        exportToPDF(columns, filteredClientes, 'Directorio_Clientes', 'Directorio de Clientes');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 relative">

            {/* Header Módulo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Clientes</h1>
                        <p className="text-slate-500 dark:text-slate-400">Directorio de clientes para gestión de ventas y proformas.</p>
                    </div>
                </div>

                <button
                    onClick={openCreateModal}
                    className="flex items-center justify-center px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-500/20 transition-all active:scale-95 w-full sm:w-auto"
                >
                    <Plus size={18} className="mr-2" /> Agregar Cliente
                </button>
            </div>

            {/* Buscador Superior */}
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 w-full sm:w-1/2 md:w-2/3">
                    <div className="relative flex-grow">
                        <Search className="text-slate-400 absolute left-4 top-3.5" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente por nombre, DNI, teléfono o email..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleExportExcel}
                        className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                        title="Exportar a Excel"
                    >
                        <FileSpreadsheet size={18} />
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                        title="Exportar a PDF"
                    >
                        <FileText size={18} />
                    </button>
                </div>
                <div className="flex gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <div className="text-center px-4 md:px-6 border-r border-slate-200 dark:border-slate-700">
                        <p className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">{filteredClientes.length}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</p>
                    </div>
                    <div className="text-center px-4 md:px-6 border-r border-slate-200 dark:border-slate-700">
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {filteredClientes.filter(c => c.credito).length}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Con Crédito</p>
                    </div>
                    <div className="text-center px-4 md:px-6">
                        <p className="text-2xl font-black text-slate-600 dark:text-slate-400 font-mono">
                            {filteredClientes.filter(c => !c.estado).length}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inactivos</p>
                    </div>
                </div>
            </div>

            {/* Cuadrícula de Tarjetas Horizontales (Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-500">Cargando base de datos de clientes...</div>
                ) : filteredClientes.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Users size={40} className="mx-auto mb-3 opacity-20 text-slate-500" />
                        <h3 className="font-bold text-slate-700 dark:text-slate-300">No hay clientes registrados</h3>
                        <p className="text-sm text-slate-500 mt-1">Haga clic en el botón superior para añadir su primer cliente.</p>
                    </div>
                ) : (
                    filteredClientes.map(c => (
                        <div key={c._id} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-violet-200 dark:hover:border-violet-500/30 transition-colors dropdown-container relative group">

                            {/* Cabecera Tarjeta */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-3 rounded-xl ${!c.estado ? 'bg-slate-100 dark:bg-slate-800' : 'bg-violet-50 dark:bg-violet-900/20'}`}>
                                        <Users className={`w-8 h-8 ${!c.estado ? 'text-slate-400' : 'text-violet-500 dark:text-violet-400'}`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center space-x-2">
                                            <h3 className={`font-bold text-lg max-w-[160px] truncate ${!c.estado ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`} title={c.nombre}>
                                                {c.nombre}
                                            </h3>
                                        </div>
                                        <div className="flex items-center space-x-2 mt-0.5">
                                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-slate-500">{c.tipo_documento}</span>
                                            <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">{c.num_documento || 'S/N'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Insignias y Dropdown */}
                                <div className="flex items-center space-x-2">
                                    {c.credito && (
                                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] px-2 py-1 rounded font-black flex items-center" title="Crédito Autorizado">
                                            <CreditCard size={12} className="mr-1" /> CRÉDITO
                                        </span>
                                    )}
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === c._id ? null : c._id)}
                                            className="p-1.5 text-slate-400 hover:text-violet-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent dark:border-slate-700/50"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeDropdown === c._id && (
                                            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-100">
                                                <button onClick={() => editItem(c)} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
                                                    <Edit2 size={16} className="mr-2 text-blue-500" /> Editar Registro
                                                </button>
                                                <button onClick={() => handleToggleStatus(c._id, c.estado)} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
                                                    <ShieldBan size={16} className={`mr-2 ${c.estado ? 'text-amber-500' : 'text-emerald-500'}`} /> {c.estado ? 'Deshabilitar' : 'Habilitar'}
                                                </button>
                                                <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                                                <button onClick={() => handleDelete(c._id)} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium flex items-center">
                                                    <Trash2 size={16} className="mr-2" /> Eliminar Permanente
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Detalles Tarjeta (Grilla Interna) */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 grid grid-cols-2 gap-y-3 gap-x-4 border border-slate-100 dark:border-slate-700/50">
                                <div className="col-span-1 border-r border-slate-200 dark:border-slate-700/50 pr-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                                        <Phone size={10} className="mr-1" /> Teléfono Principal
                                    </p>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono truncate">{c.telefono1 || 'N/A'}</p>
                                </div>
                                <div className="col-span-1 pl-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                                        <Mail size={10} className="mr-1" /> Correo Electrónico
                                    </p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={c.email}>{c.email || 'N/A'}</p>
                                </div>

                                <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                                        <MapPin size={10} className="mr-1" /> Dirección Fija
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2" title={c.direccion}>{c.direccion || 'Sin dirección registrada.'}</p>
                                </div>

                                {(c.comentario || c.telefono2) && (
                                    <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700/50 flex space-x-2 text-xs text-slate-500">
                                        {c.telefono2 && <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full flex items-center font-mono"><Phone size={10} className="mr-1" /> {c.telefono2}</span>}
                                        {c.comentario && <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full flex items-center truncate max-w-[150px]" title={c.comentario}><FileText size={10} className="mr-1" /> Notas Adjuntas</span>}
                                    </div>
                                )}
                            </div>

                            {/* Overlay de deshabilitado parcial */}
                            {!c.estado && (
                                <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/60 rounded-2xl pointer-events-none border-2 border-slate-200 dark:border-slate-700"></div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* ====== MODAL FORMULARIO DE CLIENTE ====== */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                <Users size={20} className="mr-2 text-violet-500" />
                                {isEditing ? 'Editar Cliente Existente' : 'Registrar Nuevo Cliente'}
                            </h2>
                            <button onClick={closeModal} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body Modal (Scrollable) */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900">
                            <form id="cliente-form" onSubmit={handleSubmit} className="space-y-5">

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del cliente (*)</label>
                                    <input
                                        type="text" required autoFocus placeholder="Empresa o Persona Física"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white transition-shadow"
                                        value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo Documento</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
                                            value={formData.tipo_documento} onChange={e => setFormData({ ...formData, tipo_documento: e.target.value })}
                                        >
                                            <option value="DNI">DNI/Cédula</option>
                                            <option value="RUC">RUC</option>
                                            <option value="Pasaporte">Pasaporte</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nro. Documento</label>
                                        <input
                                            type="text" placeholder="Ej: 000-000000-0000A"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
                                            value={formData.num_documento} onChange={e => setFormData({ ...formData, num_documento: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Teléfono Principal</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                                            <input
                                                type="text" placeholder="Número Celular"
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
                                                value={formData.telefono1} onChange={e => setFormData({ ...formData, telefono1: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Teléfono Alternativo (Opcional)</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                                            <input
                                                type="text" placeholder="Otro Teléfono"
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
                                                value={formData.telefono2} onChange={e => setFormData({ ...formData, telefono2: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                                        <input
                                            type="email" placeholder="correo@ejemplo.com"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
                                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Dirección del Cliente</label>
                                        <textarea
                                            rows="3" placeholder="Dirección exacta de facturación/envío"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white resize-none"
                                            value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Comentario adicional</label>
                                        <textarea
                                            rows="3" placeholder="Notas internas, referencias..."
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white resize-none"
                                            value={formData.comentario} onChange={e => setFormData({ ...formData, comentario: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>

                                {/* TOGGLE CREDITO */}
                                <div className="flex items-center p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/50 rounded-xl mt-2">
                                    <input
                                        type="checkbox" id="creditoCheckModal"
                                        className="w-5 h-5 text-violet-600 rounded bg-white dark:bg-slate-900 border-slate-300 focus:ring-violet-500 mr-3 cursor-pointer"
                                        checked={formData.credito} onChange={e => setFormData({ ...formData, credito: e.target.checked })}
                                    />
                                    <div className="flex flex-col cursor-pointer" onClick={() => setFormData({ ...formData, credito: !formData.credito })}>
                                        <label className="font-bold text-slate-800 dark:text-violet-300 select-none flex items-center text-lg">
                                            <CreditCard size={18} className="mr-2" /> Habilitar Crédito
                                        </label>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">Permitir a este cliente realizar compras al crédito.</span>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer Modal */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end space-x-3">
                            <button
                                type="button" onClick={closeModal}
                                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit" form="cliente-form"
                                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-violet-500/20 flex items-center"
                            >
                                {isEditing ? <><Edit2 size={18} className="mr-2" /> Actualizar Cliente</> : <><Plus size={18} className="mr-2" /> Guardar Cliente</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notificaciones Globales */}
            {toastMessage && (
                <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-xl font-medium text-white animate-in slide-in-from-bottom-5 ${toastMessage.type === 'error' ? 'bg-rose-600 shadow-rose-500/30' : 'bg-emerald-600 shadow-emerald-500/30'
                    }`}>
                    {toastMessage.text}
                </div>
            )}
        </div>
    );
};

export default Clientes;
