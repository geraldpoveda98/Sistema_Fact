import { API_BASE_URL } from '../../config';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Users, UserPlus, Pencil, Trash2, Camera, Upload, X, ShieldCheck } from 'lucide-react';
import Webcam from 'react-webcam';

const ALL_PERMISSIONS = [
    'Escritorio', 'Ventas', 'Gestion de Ventas', 'Bodega',
    'Almacen', 'Compras', 'Gestion de Compras', 'Administracion'
];

const Usuarios = () => {
    

    const [usuarios, setUsuarios] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Webcam State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const webcamRef = useRef(null);
    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);

    // Toast Notification
    const [status, setStatus] = useState({ type: '', message: '' });

    const initialFormState = {
        _id: null,
        nombre: '', tipo_documento: 'Cédula', num_documento: '',
        direccion: '', telefono: '', celular: '', email: '',
        cargo: '', login: '', clave: '', condicion: true,
        permisos: []
    };

    const [formData, setFormData] = useState(initialFormState);

    // Auto-hide Toast
    useEffect(() => {
        if (status.message) {
            const timer = setTimeout(() => setStatus({ type: '', message: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const fetchUsuarios = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/usuarios`);
            setUsuarios(res.data);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            setStatus({ type: 'error', message: 'No se pudieron cargar los usuarios' });
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    // Form handlers
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (permission) => {
        setFormData(prev => {
            const hasPerm = prev.permisos.includes(permission);
            const newPerms = hasPerm
                ? prev.permisos.filter(p => p !== permission)
                : [...prev.permisos, permission];
            return { ...prev, permisos: newPerms };
        });
    };

    // File handling
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            setStatus({ type: 'error', message: 'La imagen excede los 20MB' });
            return;
        }

        setFotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setFotoPreview(reader.result);
        reader.readAsDataURL(file);
        setIsCameraOpen(false);
    };

    // DataURL to File object for Webcam
    const dataURLtoFile = (dataurl, filename) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const capturePhoto = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            setFotoPreview(imageSrc);
            const file = dataURLtoFile(imageSrc, 'cam-photo.jpg');
            setFotoFile(file);
            setIsCameraOpen(false);
        }
    };

    // Modal Actions
    const openNewModal = () => {
        setFormData(initialFormState);
        setFotoFile(null);
        setFotoPreview(null);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setFormData({
            ...user,
            clave: '' // Don't show password, leave blank unless wanting to change
        });
        setFotoPreview(user.fotoUrl?.startsWith('http') ? user.fotoUrl : (user.fotoUrl ? `${API_BASE_URL}${user.fotoUrl}` : null));
        setFotoFile(null);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este usuario definitivamente?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/usuarios/${id}`);
            fetchUsuarios();
            setStatus({ type: 'success', message: 'Usuario eliminado' });
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al eliminar usuario' });
        }
    };

    // Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        const dataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            if (key !== '_id' && key !== 'permisos' && key !== 'clave') {
                dataToSend.append(key, formData[key] || '');
            }
        });

        // Solo adjuntar si el usuario la escribió, si no, se omite
        if (formData.clave && formData.clave.trim() !== '') {
            dataToSend.append('clave', formData.clave);
        }

        // Append current permissions as JSON string
        dataToSend.append('permisos', JSON.stringify(formData.permisos));

        // Append File if a new photo or webcam shot was taken
        if (fotoFile) {
            dataToSend.append('foto', fotoFile);
        }

        try {
            if (isEditing) {
                // Ignore empty password on edit
                if (!formData.clave) dataToSend.delete('clave');
                await axios.put(`${API_BASE_URL}/api/usuarios/${formData._id}`, dataToSend);
                setStatus({ type: 'success', message: 'Usuario actualizado' });
            } else {
                await axios.post(`${API_BASE_URL}/api/usuarios`, dataToSend);
                setStatus({ type: 'success', message: 'Usuario creado exitosamente' });
            }
            setIsModalOpen(false);
            fetchUsuarios();
        } catch (error) {
            const msg = error.response?.data?.error || 'Error al guardar el usuario';
            setStatus({ type: 'error', message: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Usuarios</h1>
                        <p className="text-slate-500 dark:text-slate-400 transition-colors">Gestión de accesos y perfiles del sistema</p>
                    </div>
                </div>
                <button onClick={openNewModal} className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5">
                    <UserPlus size={20} />
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            {/* Notificación Flotante (Toast) */}
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

            {/* Listado de Usuarios (Grid Normal) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {usuarios.map(user => (
                    <div key={user._id} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all group">
                        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-md flex items-center justify-center overflow-hidden mb-4 relative">
                            {user.fotoUrl ? (
                                <img src={user.fotoUrl?.startsWith('http') ? user.fotoUrl : `${API_BASE_URL}${user.fotoUrl}`} alt={user.nombre} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-slate-400">{user.nombre.charAt(0).toUpperCase()}</span>
                            )}
                            {/* Status Indicator */}
                            <span className={`absolute bottom-1 right-2 w-4 h-4 border-2 border-white dark:border-slate-800 rounded-full ${user.condicion ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate w-full">{user.nombre}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{user.cargo || 'Sin un cargo definido'}</p>
                        <div className="text-xs bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 px-3 py-1 rounded-full mb-4">
                            @{user.login}
                        </div>

                        <div className="flex w-full mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 justify-between">
                            <button onClick={() => openEditModal(user)} className="flex-1 flex justify-center items-center text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 py-2 transition-colors">
                                <Pencil size={18} className="mr-2" /> Editar
                            </button>
                            <div className="w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                            <button onClick={() => handleDelete(user._id)} className="flex-1 flex justify-center items-center text-slate-500 hover:text-red-600 dark:hover:text-red-400 py-2 transition-colors">
                                <Trash2 size={18} className="mr-2" /> Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Formulario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-6xl rounded-3xl shadow-2xl relative flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">

                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
                                <div className="w-3 h-8 bg-violet-500 rounded-full mr-3"></div>
                                {isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100/50 dark:bg-slate-800/50 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent">
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                                {/* Columna Izquierda: Perfil y Cámara */}
                                <div className="xl:col-span-4 flex flex-col items-center">
                                    <div className="w-full bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center mb-6">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Fotografía</h3>

                                        {!isCameraOpen ? (
                                            <>
                                                <div className="w-48 h-48 mx-auto -full bg-slate-200 dark:bg-slate-800 border-4 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden mb-6 relative group rounded-2xl">
                                                    {fotoPreview ? (
                                                        <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-slate-400 font-medium">Sin Foto</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 justify-center">
                                                    <label className="cursor-pointer flex items-center justify-center px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-800/50 dark:text-emerald-400 rounded-xl font-medium transition-all flex-1">
                                                        <Upload size={18} className="mr-2" /> Subir
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                                    </label>
                                                    <button type="button" onClick={() => setIsCameraOpen(true)} className="flex items-center justify-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-400 rounded-xl font-medium transition-all flex-1">
                                                        <Camera size={18} className="mr-2" /> Cámara
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center w-full">
                                                <div className="w-full max-w-[200px] h-48 bg-black rounded-2xl overflow-hidden mb-4 border border-slate-700 flex items-center">
                                                    <Webcam
                                                        audio={false}
                                                        ref={webcamRef}
                                                        screenshotFormat="image/jpeg"
                                                        videoConstraints={{ facingMode: "user" }}
                                                        className="w-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex gap-2 w-full">
                                                    <button type="button" onClick={capturePhoto} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-xl font-bold flex items-center justify-center">
                                                        <Camera size={18} className="mr-2" /> Tomar
                                                    </button>
                                                    <button type="button" onClick={() => setIsCameraOpen(false)} className="px-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-xl flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-800/50">
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Estado de la cuenta</label>
                                        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div className={`relative inline-block w-12 h-6 rounded-full transition-colors cursor-pointer ${formData.condicion === true ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}
                                                onClick={() => setFormData(p => ({ ...p, condicion: !p.condicion }))}>
                                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${formData.condicion === true ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </div>
                                            <span className={`font-bold text-sm ${formData.condicion ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                                {formData.condicion ? 'ACTIVO' : 'DADO DE BAJA'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Columna Derecha: Formulario Completo y Permisos */}
                                <div className="xl:col-span-8 flex flex-col gap-8">

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Datos Personales</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombre (*)</label>
                                                <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all font-medium" />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Tipo de Documento (*)</label>
                                                <select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all font-medium">
                                                    <option value="Cédula">Cédula</option>
                                                    <option value="Pasaporte">Pasaporte</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Número de Documento (*)</label>
                                                <input required type="text" name="num_documento" value={formData.num_documento} onChange={handleChange}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all font-medium" />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Dirección</label>
                                                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all" />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Teléfono Fijo</label>
                                                <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Celular / Móvil</label>
                                                <input type="tel" name="celular" value={formData.celular} onChange={handleChange}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Email</label>
                                                <input type="email" name="email" value={formData.email} onChange={handleChange}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Cargo</label>
                                                <input type="text" name="cargo" value={formData.cargo} onChange={handleChange}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Acceso al Sistema</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-violet-50 dark:bg-violet-900/10 p-5 rounded-2xl border border-violet-100 dark:border-violet-900/30">
                                            <div>
                                                <label className="block text-sm font-bold text-violet-900 dark:text-violet-300 mb-1">Login (Usaurio) (*)</label>
                                                <input required type="text" name="login" value={formData.login} onChange={handleChange}
                                                    className="w-full bg-white dark:bg-slate-800 border-2 border-violet-200 dark:border-violet-700/50 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:border-violet-500 focus:outline-none transition-all font-bold" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-violet-900 dark:text-violet-300 mb-1">Clave de Acceso {isEditing ? '(Opcional/Cambiar)' : '(*)'}</label>
                                                <input required={!isEditing} type="password" name="clave" value={formData.clave} onChange={handleChange} placeholder={isEditing ? '******' : ''}
                                                    className="w-full bg-white dark:bg-slate-800 border-2 border-violet-200 dark:border-violet-700/50 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:border-violet-500 focus:outline-none transition-all font-mono" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                                            <ShieldCheck size={20} className="text-emerald-500" /> Permisos Operativos
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {ALL_PERMISSIONS.map(perm => (
                                                <label key={perm} className={`flex items-center p-4 rounded-2xl border cursor-pointer select-none transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-[0.98] ${formData.permisos.includes(perm)
                                                    ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-500/30'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                                    }`}>
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 shrink-0 transition-colors ${formData.permisos.includes(perm) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                        <ShieldCheck size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0 mr-3">
                                                        <span className={`block text-xs font-bold uppercase tracking-wider mb-0.5 ${formData.permisos.includes(perm) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                            Módulo
                                                        </span>
                                                        <span className={`block text-sm font-bold truncate ${formData.permisos.includes(perm) ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                            {perm}
                                                        </span>
                                                    </div>
                                                    <div className="relative inline-block w-10 h-5 rounded-full shrink-0">
                                                        <div className={`absolute top-0 bottom-0 left-0 right-0 rounded-full transition-colors ${formData.permisos.includes(perm) ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                                        <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${formData.permisos.includes(perm) ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                    </div>
                                                    <input
                                                        type="checkbox" className="hidden"
                                                        checked={formData.permisos.includes(perm)}
                                                        onChange={() => handleSwitchChange(perm)}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Form Actions (Sticky inside scroll) */}
                            <div className="flex justify-end pt-5 mt-6 border-t border-slate-200 dark:border-slate-800 gap-3 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-2 -mb-2 z-10">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={loading} className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/30 hover:-translate-y-0.5'}`}>
                                    {loading ? 'Guardando...' : 'Guardar Perfil'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Usuarios;
