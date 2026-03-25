import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Plus, Edit, Trash2, Printer, CheckCircle,
    XCircle, FileText, FileSignature, Receipt, Image as ImageIcon
} from 'lucide-react';

const FormatosFacturacion = () => {
    const apiBaseUrl = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`);

    // ======== ESTADOS ========
    const [formatos, setFormatos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const initialFormState = {
        nombre: '',
        tipo_documento: 'Factura',
        tamano: 'Carta',
        mensaje_pie: '',
        predeterminado: false
    };
    const [formData, setFormData] = useState(initialFormState);
    const [editId, setEditId] = document.useState ? useState(null) : React.useState(null);

    // ======== INICIALIZACIÓN ========
    useEffect(() => {
        cargarFormatos();
    }, []);

    const showToast = (message, type = "success") => {
        setToastMessage({ text: message, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const cargarFormatos = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${apiBaseUrl}/api/formatos-impresion`);
            setFormatos(res.data);
        } catch (error) {
            console.error("Error cargando formatos", error);
            showToast("Error al cargar los formatos", "error");
        } finally {
            setLoading(false);
        }
    };

    // ======== MANEJO DEL FORMULARIO ========
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const openModal = (formato = null) => {
        if (formato) {
            setEditId(formato._id);
            setFormData({
                nombre: formato.nombre,
                tipo_documento: formato.tipo_documento,
                tamano: formato.tamano,
                mensaje_pie: formato.mensaje_pie || '',
                predeterminado: formato.predeterminado
            });
        } else {
            setEditId(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditId(null);
        setFormData(initialFormState);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await axios.put(`${apiBaseUrl}/api/formatos-impresion/${editId}`, formData);
                showToast("Formato actualizado con éxito");
            } else {
                await axios.post(`${apiBaseUrl}/api/formatos-impresion`, formData);
                showToast("Formato creado con éxito");
            }
            cargarFormatos();
            closeModal();
        } catch (error) {
            console.error("Error al guardar:", error);
            showToast(error.response?.data?.error || "Error al guardar formato", "error");
        }
    };

    const handleToggleEstado = async (id) => {
        try {
            await axios.patch(`${apiBaseUrl}/api/formatos-impresion/${id}/estado`);
            cargarFormatos();
        } catch (error) {
            showToast("Error al cambiar estado", "error");
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm("¿Seguro que deseas eliminar este formato? Si está en uso podrías causar errores.")) {
            try {
                await axios.delete(`${apiBaseUrl}/api/formatos-impresion/${id}`);
                showToast("Formato eliminado");
                cargarFormatos();
            } catch (error) {
                showToast("Error al eliminar", "error");
            }
        }
    };

    // Helper visuales
    const getTipoIcon = (tipo) => {
        switch (tipo) {
            case 'Factura': return <FileText className="text-blue-500" />;
            case 'Proforma': return <FileSignature className="text-amber-500" />;
            case 'Devolución': return <Receipt className="text-rose-500" />;
            default: return <FileText className="text-slate-500" />;
        }
    };

    const getTipoBadgeColor = (tipo) => {
        switch (tipo) {
            case 'Factura': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case 'Proforma': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
            case 'Devolución': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando formatos de impresión...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 w-full max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Printer className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Formatos de Facturación</h1>
                        <p className="text-slate-500 dark:text-slate-400">Administra las plantillas y tamaños de impresión para tus documentos comerciales.</p>
                    </div>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all text-sm"
                >
                    <Plus size={18} className="mr-2" /> Nuevo Formato
                </button>
            </div>

            {/* Grid de Formatos */}
            {formatos.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <Printer className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">No hay formatos disponibles</h3>
                    <p className="text-slate-500 mt-2">Crea tu primer formato de impresión comercial.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {formatos.map(formato => (
                        <div
                            key={formato._id}
                            className={`bg-white dark:bg-slate-900/80 rounded-2xl border ${formato.predeterminado ? 'border-indigo-500 shadow-indigo-500/10 shadow-lg' : 'border-slate-200 dark:border-slate-800 shadow-sm'} p-5 flex flex-col relative transition-all hover:shadow-md block`}
                        >
                            {/* Insignia Predeterminado */}
                            {formato.predeterminado && (
                                <div className="absolute -top-3 -right-3 bg-indigo-500 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-md flex items-center">
                                    <CheckCircle size={12} className="mr-1" /> Activo por Defecto
                                </div>
                            )}

                            {/* Insignia Inactivo */}
                            {!formato.estado && (
                                <div className="absolute top-4 right-4 bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] uppercase font-black px-2 py-0.5 rounded flex items-center">
                                    Inactivo
                                </div>
                            )}

                            <div className="flex gap-4 items-start mb-4">
                                <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${!formato.estado ? 'grayscale opacity-50' : ''}`}>
                                    {getTipoIcon(formato.tipo_documento)}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg ${!formato.estado ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                        {formato.nombre}
                                    </h3>
                                    <span className={`inline-block mt-1 px-2.5 py-0.5 text-[10px] uppercase font-bold rounded-lg border ${getTipoBadgeColor(formato.tipo_documento)}`}>
                                        Aplica en: {formato.tipo_documento}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 flex-grow text-sm mb-6">
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                                    <span className="text-slate-500 font-medium">Tamaño de Papel</span>
                                    <strong className="text-slate-800 dark:text-slate-200 flex items-center">
                                        <ImageIcon size={14} className="mr-1.5 text-slate-400" /> {formato.tamano}
                                    </strong>
                                </div>
                                <div className="pt-2">
                                    <span className="text-slate-500 font-medium block mb-1">Nota al Pie de Documento:</span>
                                    <p className="text-slate-600 dark:text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 line-clamp-3">
                                        "{formato.mensaje_pie || 'Sin mensaje configurado'}"
                                    </p>
                                </div>
                            </div>

                            {/* Opciones */}
                            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                                <button
                                    onClick={() => handleToggleEstado(formato._id)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border flex justify-center items-center transition-colors ${formato.estado
                                        ? 'text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-900 dark:hover:bg-amber-900/20'
                                        : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900 dark:hover:bg-emerald-900/20'
                                        }`}
                                >
                                    {formato.estado ? <XCircle size={14} className="mr-1" /> : <CheckCircle size={14} className="mr-1" />}
                                    {formato.estado ? 'Desactivar' : 'Activar'}
                                </button>

                                <button
                                    onClick={() => openModal(formato)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                                    title="Editar Formato"
                                >
                                    <Edit size={16} />
                                </button>

                                <button
                                    onClick={() => handleEliminar(formato._id)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900/50 transition-colors"
                                    title="Eliminar Formato"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Formulario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm shadow-xl animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh] sm:max-h-[85vh]">

                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30 shrink-0 rounded-t-3xl">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                <Printer className="mr-2 text-indigo-500" size={24} />
                                {editId ? 'Editar Formato' : 'Crear Formato'}
                            </h2>
                            <button type="button" onClick={closeModal} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                            <div className="p-6 space-y-6 overflow-y-auto grow">
                                {/* Sección principal */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">Aplica a Documento</label>
                                        <div className="relative">
                                            <select
                                                name="tipo_documento"
                                                value={formData.tipo_documento}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
                                                required
                                            >
                                                <option value="Factura">📝 Factura de Venta</option>
                                                <option value="Proforma">📑 Proforma / Cotización</option>
                                                <option value="Devolución">📦 Ticket de Devolución</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">Tamaño Físico</label>
                                        <div className="relative">
                                            <select
                                                name="tamano"
                                                value={formData.tamano}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
                                                required
                                            >
                                                <option value="Carta">📄 Tamaño Carta</option>
                                                <option value="Rollo POS">🧾 Ticket POS / Térmico</option>
                                                <option value="Oficial DGI">🏛️ Formato Oficial DGI</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">Nombre o Alias del Formato</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Impresión Rollo Caja Principal"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                        required
                                    />
                                </div>

                                {/* Editor de Texto de Pie */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">Nota al Pie de Página (Opcional)</label>
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-medium">Textos Legales / Agradecimientos</span>
                                    </div>
                                    <div className="relative group">
                                        <textarea
                                            name="mensaje_pie"
                                            value={formData.mensaje_pie}
                                            onChange={handleInputChange}
                                            rows="3"
                                            placeholder="Ingrese el mensaje que saldrá al final del documento..."
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all dark:text-slate-300"
                                        ></textarea>
                                    </div>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">Este texto tiene prioridad y será el que se imprima en lugar de los textos globales de Datos de Empresa.</p>
                                </div>

                                {/* Interruptor Predeterminado estilo iOS */}
                                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 transition-colors">
                                    <label className="flex items-center cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                name="predeterminado"
                                                checked={formData.predeterminado}
                                                onChange={handleInputChange}
                                                className="peer sr-only"
                                            />
                                            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer-checked:bg-indigo-500 transition-colors duration-300"></div>
                                            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 peer-checked:translate-x-5 shadow-sm"></div>
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <span className="block text-sm font-bold text-indigo-900 dark:text-indigo-400">Establecer como Predeterminado</span>
                                            <span className="block text-xs text-indigo-700/70 dark:text-indigo-400/70 mt-0.5">Si se activa, este formato se seleccionará automáticamente para imprimir una {formData.tipo_documento.toLowerCase()}.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 flex-wrap shrink-0 rounded-b-3xl">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
                                >
                                    {editId ? 'Guardar Cambios' : 'Crear Formato'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toasts */}
            {toastMessage && (
                <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-xl font-medium text-white animate-in slide-in-from-bottom-5 ${toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
                    }`}>
                    {toastMessage.text}
                </div>
            )}
        </div>
    );
};

export default FormatosFacturacion;
