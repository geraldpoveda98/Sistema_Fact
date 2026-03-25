import { API_BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Tag, Plus, Edit2, Trash2, ShieldBan, CheckCircle, Search, MoreVertical, LayoutGrid, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Categorias = () => {
    
    const { user } = useAuth();

    // Estados principales
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estados de Formulario
    const initForm = { id: null, nombre: '', descripcion: '' };
    const [formData, setFormData] = useState(initForm);
    const [isEditing, setIsEditing] = useState(false);

    // UI states
    const [activeDropdown, setActiveDropdown] = useState(null); // ID de la tarjeta con menú abierto
    const [toastMessage, setToastMessage] = useState(null);

    // Click afuera para cerrar dropdowns
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.dropdown-container')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchCategorias();
    }, []);

    const showToast = (message, type = "success") => {
        setToastMessage({ text: message, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // FETCH: Obtener Categorías
    const fetchCategorias = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/categorias`);
            setCategorias(response.data);
        } catch (error) {
            console.error("Error cargando categorías:", error);
            showToast("No se pudieron cargar las categorías de la base de datos.", "error");
        } finally {
            setLoading(false);
        }
    };

    // ACTION: Guardar / Actualizar
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                // PUT: Actualizar
                await axios.put(`${API_BASE_URL}/api/categorias/${formData.id}`, {
                    nombre: formData.nombre,
                    descripcion: formData.descripcion
                });
                showToast("Categoría actualizada correctamente");
            } else {
                // POST: Crear
                await axios.post(`${API_BASE_URL}/api/categorias`, {
                    nombre: formData.nombre,
                    descripcion: formData.descripcion
                });
                showToast("Categoría creada exitosamente");
            }

            closeModal();
            fetchCategorias();

        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.error || "Ocurrió un error al guardar", "error");
        }
    };

    const openCreateModal = () => {
        setFormData(initForm);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData(initForm);
        setIsEditing(false);
    };

    // ACTION: Cambiar Estado
    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await axios.patch(`${API_BASE_URL}/api/categorias/${id}/estado`);
            showToast(`Categoría ${currentStatus ? 'deshabilitada' : 'habilitada'}`);
            fetchCategorias();
            setActiveDropdown(null);
        } catch (error) {
            showToast("Error al cambiar estado", "error");
        }
    };

    // ACTION: Eliminar
    const handleDelete = async (id) => {
        if (window.confirm("¿Seguro que desea ELIMINAR permanentemente esta categoría? (Esto fallará si existen artículos usando esta categoría)")) {
            try {
                await axios.delete(`${API_BASE_URL}/api/categorias/${id}`);
                showToast("Categoría eliminada del sistema");
                fetchCategorias();
                setActiveDropdown(null);
            } catch (error) {
                showToast("Error al eliminar la categoría. Revise dependencias.", "error");
            }
        }
    };

    // UTIL: Cargar para edición
    const editItem = (categoria) => {
        setFormData({ id: categoria._id, nombre: categoria.nombre, descripcion: categoria.descripcion || '' });
        setIsEditing(true);
        setActiveDropdown(null);
        setIsModalOpen(true);
    };

    // Lógica Front-End
    const filteredCategorias = categorias.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.descripcion && c.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    );


    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            {/* Header del módulo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
                        <Tag className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Categorías</h1>
                        <p className="text-slate-500 dark:text-slate-400">Administre las clasificaciones del Almacén.</p>
                    </div>
                </div>

                <button
                    onClick={openCreateModal}
                    className="flex items-center justify-center px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-fuchsia-500/20 transition-all active:scale-95 w-full sm:w-auto"
                >
                    <Plus size={18} className="mr-2" /> Agregar Categoría
                </button>
            </div>

            <div className="w-full">
                {/* Listado y Search */}
                <div className="space-y-6">

                    {/* Buscador Superior */}
                    <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center relative">
                        <Search className="text-slate-400 absolute left-8" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar categorías por nombre o descripción..."
                            className="w-full pl-12 pr-4 py-2 bg-transparent border-none outline-none text-slate-900 dark:text-white font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400">
                            {filteredCategorias.length} regs
                        </span>
                    </div>

                    {/* Grid de Tarjetas React */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                        {loading && categorias.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600 mx-auto mb-4"></div>
                                Cargando catálogo de categorías...
                            </div>
                        ) : filteredCategorias.length === 0 ? (
                            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                <LayoutGrid size={40} className="mx-auto mb-3 opacity-20 text-slate-500" />
                                <h3 className="font-bold text-slate-700 dark:text-slate-300">Sin resultados</h3>
                                <p className="text-sm text-slate-500 mt-1">No hay categorías que coincidan con su búsqueda o no ha creado ninguna aún.</p>
                            </div>
                        ) : (
                            filteredCategorias.map(cat => (
                                <div key={cat._id} className="relative bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-fuchsia-200 dark:hover:border-fuchsia-500/30 transition-all group dropdown-container">

                                    {/* Encabezado Tarjeta */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-fuchsia-600 dark:text-fuchsia-400 shadow-inner">
                                                <Tag size={18} />
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate" title={cat.nombre}>{cat.nombre}</h3>
                                        </div>

                                        {/* Dropdown Options */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === cat._id ? null : cat._id)}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeDropdown === cat._id && (
                                                <div className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-100">
                                                    <button onClick={() => editItem(cat)} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
                                                        <Edit2 size={16} className="mr-2 text-blue-500" /> Editar Categoría
                                                    </button>
                                                    <button onClick={() => { setActiveDropdown(null); alert(`Detalles extendidos para ${cat.nombre}:\n\n- Descripción: ${cat.descripcion || 'N/A'}\n- Estado: ${cat.condicion ? 'Activa' : 'Inactiva'}\n- ID Sistema: ${cat._id}`); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
                                                        <CheckCircle size={16} className="mr-2 text-emerald-500" /> Ver Detalles
                                                    </button>
                                                    <button onClick={() => handleToggleStatus(cat._id, cat.condicion)} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
                                                        <ShieldBan size={16} className={`mr-2 ${cat.condicion ? 'text-amber-500' : 'text-emerald-500'}`} /> {cat.condicion ? 'Deshabilitar' : 'Habilitar'}
                                                    </button>
                                                    <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                                                    <button onClick={() => handleDelete(cat._id)} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium flex items-center">
                                                        <Trash2 size={16} className="mr-2" /> Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cuerpo Tarjeta */}
                                    <div className="mb-4">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 h-10">
                                            {cat.descripcion || <span className="italic opacity-60">Sin descripción asignada</span>}
                                        </p>
                                    </div>

                                    {/* Footer Tarjeta: Estado */}
                                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                                        <span className="text-xs font-semibold text-slate-500">Estado en Almacén</span>
                                        {cat.condicion ? (
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center border border-emerald-200 dark:border-emerald-500/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                                                ACTIVA
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center border border-rose-200 dark:border-rose-500/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                                                INACTIVA
                                            </span>
                                        )}
                                    </div>

                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* ====== MODAL FORMULARIO DE CATEGORIAS ====== */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">

                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                <Tag size={20} className="mr-2 text-fuchsia-500" />
                                {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
                            </h2>
                            <button onClick={closeModal} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6 overflow-y-auto bg-white dark:bg-slate-900">
                            <form id="categoria-form" onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Categoría (*)</label>
                                    <input
                                        type="text" required autoFocus
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-fuchsia-500 text-slate-900 dark:text-white transition-shadow"
                                        value={formData.nombre}
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                                    <textarea
                                        rows="3"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-fuchsia-500 text-slate-900 dark:text-white transition-shadow resize-none"
                                        value={formData.descripcion}
                                        onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                    ></textarea>
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
                                type="submit" form="categoria-form"
                                className="px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-fuchsia-500/20 flex items-center"
                            >
                                {isEditing ? <><Edit2 size={18} className="mr-2" /> Actualizar</> : <><Plus size={18} className="mr-2" /> Guardar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toaster Notification */}
            {toastMessage && (
                <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-xl font-medium text-white animate-in slide-in-from-bottom-5 ${toastMessage.type === 'error' ? 'bg-rose-600 shadow-rose-500/30' : 'bg-emerald-600 shadow-emerald-500/30'
                    }`}>
                    {toastMessage.text}
                </div>
            )}
        </div>
    );
};

export default Categorias;
