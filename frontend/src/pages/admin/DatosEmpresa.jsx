import { API_BASE_URL } from '../../config';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BuildingOfficeIcon, PhotoIcon, ServerIcon } from '@heroicons/react/24/outline';

const DatosEmpresa = () => {
    const [formData, setFormData] = useState({
        nombre: '', ruc: '', direccion: '', telefono: '',
        celular: '', web: '', correo: '',
        porcentajeCosto: 30, valorDolar: 36.5
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [currentLogo, setCurrentLogo] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    // Cargar datos actuales
    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/empresa`);
                if (res.data) {
                    setFormData({
                        nombre: res.data.nombre || '',
                        ruc: res.data.ruc || '',
                        direccion: res.data.direccion || '',
                        telefono: res.data.telefono || '',
                        celular: res.data.celular || '',
                        web: res.data.web || '',
                        correo: res.data.correo || '',
                        porcentajeCosto: res.data.porcentajeCosto || 30,
                        valorDolar: res.data.valorDolar || 36.5
                    });
                    if (res.data.logoUrl) {
                        setCurrentLogo(`${API_BASE_URL}${res.data.logoUrl}`);
                    }
                }
            } catch (error) {
                console.error("Error cargando datos de empresa", error);
            }
        };
        fetchDatos();
    }, [API_BASE_URL]);

    // Auto-ocultar notificación (Toast flotante) después de 4 segundos
    useEffect(() => {
        if (status.message) {
            const timer = setTimeout(() => {
                setStatus({ type: '', message: '' });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // Manejar cambios en inputs de texto
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Manejar subida de archivo PNG
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validaciones
        if (file.type !== 'image/png') {
            setStatus({ type: 'error', message: 'El logo debe estar en formato PNG.' });
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            setStatus({ type: 'error', message: 'El archivo excede el límite de 20MB.' });
            return;
        }

        setStatus({ type: '', message: '' });
        setLogoFile(file);

        // Crear vista previa local
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Enviar formulario (FormData para soportar archivo)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        const dataToSend = new FormData();
        // Agregar textos
        Object.keys(formData).forEach(key => {
            dataToSend.append(key, formData[key]);
        });
        // Agregar archivo si existe
        if (logoFile) {
            dataToSend.append('logo', logoFile);
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/api/empresa`, dataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStatus({ type: 'success', message: '¡Datos Guardados Exitosamente!' });
            if (res.data.empresa.logoUrl) {
                setCurrentLogo(`${API_BASE_URL}${res.data.empresa.logoUrl}`);
                setLogoPreview(null); // Limpiar preview local al guardar
                setLogoFile(null);
            }
            // Forzar recarga ligera para que AuthContext tome los nuevos Mensajes de Facturación/Proformas sin cerrar sesión
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            setStatus({ type: 'error', message: 'Hubo un error al guardar la configuración.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center space-x-3 text-cyan-500 dark:text-cyan-400 mb-8 border-b dark:border-slate-800 border-slate-200 pb-4 transition-colors">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <BuildingOfficeIcon className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold dark:text-white text-slate-800 transition-colors">Datos de la Empresa</h1>
                    <p className="dark:text-slate-400 text-slate-500 transition-colors">Configuración global del sistema RPM.</p>
                </div>
            </div>

            {/* Notificación Flotante (Toast) */}
            {status.message && (
                <div
                    onClick={() => setStatus({ type: '', message: '' })}
                    className={`fixed top-20 right-4 sm:top-6 sm:right-6 z-[100] p-4 rounded-xl shadow-2xl border transition-all animate-in slide-in-from-top-8 fade-in duration-300 flex items-center gap-3 backdrop-blur-xl cursor-pointer hover:scale-[1.02] ${status.type === 'error'
                        ? 'bg-red-50/90 dark:bg-red-950/90 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400'
                        : 'bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                        }`}
                >
                    {status.type === 'error' ? (
                        <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    ) : (
                        <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    )}
                    <div className="flex flex-col pr-4">
                        <span className="font-bold text-sm">{status.type === 'error' ? 'Error al Guardar' : 'Operación Exitosa'}</span>
                        <span className="font-medium text-sm opacity-90">{status.message}</span>
                    </div>
                    <button className="absolute top-2 right-2 p-1 opacity-50 hover:opacity-100 transition-opacity rounded-md hover:bg-black/5 dark:hover:bg-white/10">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Sección 1: Información General */}
                <div className="dark:bg-slate-900/50 bg-white rounded-2xl p-6 border dark:border-slate-800 border-slate-200 transition-colors shadow-sm">
                    <h2 className="text-xl font-bold dark:text-white text-slate-800 mb-6 flex items-center transition-colors">
                        <span className="w-2 h-6 bg-cyan-500 rounded-full mr-3"></span>
                        Información General
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold dark:text-slate-400 text-slate-600 mb-2 transition-colors">Nombre de la Empresa</label>
                            <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                                className="w-full dark:bg-slate-800/80 bg-slate-50 border dark:border-slate-700 border-slate-300 rounded-lg px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold dark:text-slate-400 text-slate-600 mb-2 transition-colors">Código RUC</label>
                            <input type="text" name="ruc" value={formData.ruc} onChange={handleChange}
                                className="w-full dark:bg-slate-800/80 bg-slate-50 border dark:border-slate-700 border-slate-300 rounded-lg px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium uppercase" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold dark:text-slate-400 text-slate-600 mb-2 transition-colors">Dirección de la Empresa</label>
                            <textarea name="direccion" value={formData.direccion} onChange={handleChange} rows="2"
                                className="w-full dark:bg-slate-800/80 bg-slate-50 border dark:border-slate-700 border-slate-300 rounded-lg px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold dark:text-slate-400 text-slate-600 mb-2 transition-colors">Teléfono Fijo</label>
                            <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                                className="w-full dark:bg-slate-800/80 bg-slate-50 border dark:border-slate-700 border-slate-300 rounded-lg px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold dark:text-slate-400 text-slate-600 mb-2 transition-colors">Celular</label>
                            <input type="tel" name="celular" value={formData.celular} onChange={handleChange}
                                className="w-full dark:bg-slate-800/80 bg-slate-50 border dark:border-slate-700 border-slate-300 rounded-lg px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold dark:text-slate-400 text-slate-600 mb-2 transition-colors">Página Web</label>
                            <input type="url" name="web" value={formData.web} onChange={handleChange} placeholder="https://"
                                className="w-full dark:bg-slate-800/80 bg-slate-50 border dark:border-slate-700 border-slate-300 rounded-lg px-4 py-3 dark:text-cyan-400 text-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold dark:text-slate-400 text-slate-600 mb-2 transition-colors">Correo Electrónico</label>
                            <input type="email" name="correo" value={formData.correo} onChange={handleChange}
                                className="w-full dark:bg-slate-800/80 bg-slate-50 border dark:border-slate-700 border-slate-300 rounded-lg px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium" />
                        </div>
                    </div>
                </div>

                {/* Sección 2: Branding (Logo) y Ajustes Base */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tarjeta Logo */}
                    <div className="dark:bg-slate-900/50 bg-white rounded-2xl p-6 border dark:border-slate-800 border-slate-200 flex flex-col items-center justify-center text-center transition-colors shadow-sm">
                        <PhotoIcon className="w-10 h-10 text-slate-500 mb-4" />
                        <h3 className="text-lg font-bold dark:text-white text-slate-800 mb-2 transition-colors">Logo Principal (PNG)</h3>
                        <p className="text-sm dark:text-slate-400 text-slate-500 mb-6 transition-colors">Este logo se usará en el Login, Facturas y Reportes. (Máx 20MB)</p>

                        <div className="w-40 h-40 dark:bg-slate-800 bg-slate-50 rounded-2xl border-2 border-dashed dark:border-slate-600 border-slate-300 flex items-center justify-center overflow-hidden mb-6 relative group transition-colors">
                            {logoPreview || currentLogo ? (
                                <img src={logoPreview || currentLogo} alt="Logo Preview" className="max-w-full max-h-full object-contain p-2" />
                            ) : (
                                <span className="text-slate-500 font-medium">Sin Logo</span>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-2 px-4 rounded-lg transform scale-95 group-hover:scale-100 transition-all">
                                    Cambiar
                                    <input type="file" accept=".png" className="hidden" onChange={handleFileChange} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta Configuraciones Operativas */}
                    <div className="dark:bg-slate-900/50 bg-white rounded-2xl p-6 border dark:border-slate-800 border-slate-200 transition-colors shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <ServerIcon className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
                            <h3 className="text-lg font-bold dark:text-white text-slate-800 transition-colors">Características del Sistema</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="dark:bg-slate-800/30 bg-slate-50 p-4 rounded-xl border dark:border-slate-700/50 border-slate-200 transition-colors">
                                <label className="flex items-center justify-between text-sm font-semibold dark:text-white text-slate-800 mb-2 transition-colors">
                                    Calcular Costo (%)
                                    <span className="text-xs bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 px-2 py-1 rounded-md">Inventario</span>
                                </label>
                                <p className="text-xs dark:text-slate-400 text-slate-500 mb-3 transition-colors">Incremento automático a aplicar sobre el precio de compra del producto para definir la venta base.</p>
                                <div className="relative">
                                    <input type="number" name="porcentajeCosto" value={formData.porcentajeCosto} onChange={handleChange} min="0" step="0.1"
                                        className="w-full dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-300 rounded-lg pl-4 pr-10 py-3 dark:text-cyan-400 text-cyan-600 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors" />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                        <span className="dark:text-slate-400 text-slate-500 font-bold">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="dark:bg-slate-800/30 bg-slate-50 p-4 rounded-xl border dark:border-slate-700/50 border-slate-200 transition-colors">
                                <label className="flex items-center justify-between text-sm font-semibold dark:text-white text-slate-800 mb-2 transition-colors">
                                    Conversión del Dólar (C$)
                                    <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:bg-green-500/20 dark:text-green-400 px-2 py-1 rounded-md">Moneda</span>
                                </label>
                                <p className="text-xs dark:text-slate-400 text-slate-500 mb-3 transition-colors">Valor actual del dólar estadounidense frente al Córdoba para facturación bimoneda.</p>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <span className="dark:text-slate-400 text-slate-500 font-bold font-mono">C$</span>
                                    </div>
                                    <input type="number" name="valorDolar" value={formData.valorDolar} onChange={handleChange} min="0" step="0.01"
                                        className="w-full dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-300 rounded-lg pl-11 pr-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono font-bold transition-colors" />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t dark:border-slate-800 border-slate-200 transition-colors">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-8 rounded-xl shadow-lg shadow-cyan-500/20 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                    >
                        {loading ? 'Guardando...' : 'Guardar y Aplicar Cambios'}
                    </button>
                </div>
            </form >
        </div >
    );
};

export default DatosEmpresa;
