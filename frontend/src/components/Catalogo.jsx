import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Package, Search, Filter, Loader2, Plus, X, Upload, Check, AlertCircle, FileSpreadsheet, FileText } from 'lucide-react';
import Barcode from 'react-barcode';
import { useAuth } from '../context/AuthContext';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { formatCurrency } from '../utils/formatUtils';

const Catalogo = () => {
    const { empresa } = useAuth();
    const apiBaseUrl = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`); // Definir a nivel de componente
    const [articulos, setArticulos] = useState([]);
    const [empresaData, setEmpresaData] = useState(null); // Nuevo estado para datos de empresa en tiempo real
    const [categorias, setCategorias] = useState([]);
    const [modelos, setModelos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    const initialState = {
        _id: '',
        idcategoria: '',
        idmodelo: '',
        codigo: '',
        nombre: '',
        descripcion: '',
        stock_minimo: 0,
        costo_inventario: 0,
        precio_venta: 0,
        tipo_calculo_precio: 'Manual',
        condicion: true,
        numeroParte: '',
        fabricante: '',
        vehiculosCompatibles: ''
    };

    const [formData, setFormData] = useState(initialState);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [artRes, catRes, modRes, empRes] = await Promise.all([
                axios.get(`${apiBaseUrl}/api/articulos`),
                axios.get(`${apiBaseUrl}/api/categorias`),
                axios.get(`${apiBaseUrl}/api/modelos`),
                axios.get(`${apiBaseUrl}/api/empresa`)
            ]);
            setArticulos(artRes.data);
            setCategorias(catRes.data.filter(c => c.condicion));
            setModelos(modRes.data.filter(m => m.condicion));
            setEmpresaData(empRes.data);
        } catch (error) {
            console.error("Error cargando el catálogo:", error);
        } finally {
            setLoading(false);
        }
    };

    const articulosFiltrados = articulos.filter(art =>
        art.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        art.codigo.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleExportExcel = () => {
        const dataToExport = articulosFiltrados.map(art => ({
            'Código': art.codigo,
            'Nombre': art.nombre,
            'Categoría': art.idcategoria?.nombre || 'N/A',
            'Modelo': art.idmodelo?.nombre || 'N/A',
            'No. Parte': art.numeroParte || 'N/A',
            'Fabricante': art.fabricante || 'N/A',
            'Stock': art.stock,
            'Precio': art.precio_venta
        }));
        exportToExcel(dataToExport, 'Catalogo_Repuestos', 'Repuestos');
    };

    const handleExportPDF = () => {
        const columns = [
            { header: 'Código', key: 'codigo' },
            { header: 'Nombre', key: 'nombre' },
            { header: 'Categoría', key: (art) => art.idcategoria?.nombre || 'N/A' },
            { header: 'No. Parte', key: 'numeroParte' },
            { header: 'Stock', key: 'stock' },
            { header: 'Precio', key: 'precio_venta' }
        ];
        exportToPDF(columns, articulosFiltrados, 'Catalogo_Repuestos', 'Catálogo de Repuestos');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const submitData = new FormData();

            // Agregar todos los campos al FormData
            Object.keys(formData).forEach(key => {
                if (key !== 'imagen' && key !== '_id') {
                    submitData.append(key, formData[key]);
                }
            });

            if (selectedFile) {
                submitData.append('imagen', selectedFile);
            }

            if (editMode) {
                await axios.put(`${apiBaseUrl}/api/articulos/${formData._id}`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await axios.post(`${apiBaseUrl}/api/articulos`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            await cargarDatos();
            setShowModal(false);
        } catch (error) {
            console.error("Error guardando artículo:", error);
            alert(error.response?.data?.error || "Error al guardar el artículo");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este artículo?')) {
            try {
                await axios.delete(`${apiBaseUrl}/api/articulos/${id}`);
                cargarDatos();
            } catch (error) {
                alert(error.response?.data?.error || "Error al eliminar");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-cyan-500 w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent transition-colors">
                        Catálogo de Repuestos
                    </h2>
                    <p className="dark:text-slate-400 text-slate-500 text-sm mt-1 transition-colors">Gestión de inventario y precios</p>
                </div>

                <div className="w-full sm:w-auto flex gap-3 flex-wrap sm:flex-nowrap">
                    <div className="relative flex-grow sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 z-10">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar código o nombre..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 dark:bg-slate-800/50 bg-white border dark:border-slate-700/50 border-slate-300 rounded-xl text-sm dark:text-white text-slate-800 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all dark:placeholder-slate-500 placeholder-slate-400"
                        />
                    </div>
                    <button className="p-2 dark:bg-slate-800/50 bg-white border dark:border-slate-700/50 border-slate-300 dark:text-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <Filter size={18} />
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="p-2 dark:bg-emerald-500/10 bg-emerald-50 border dark:border-emerald-500/20 border-emerald-200 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors flex items-center gap-2 px-3"
                        title="Exportar a Excel"
                    >
                        <FileSpreadsheet size={18} />
                        <span className="hidden lg:inline text-xs font-bold">Excel</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="p-2 dark:bg-rose-500/10 bg-rose-50 border dark:border-rose-500/20 border-rose-200 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors flex items-center gap-2 px-3"
                        title="Exportar a PDF"
                    >
                        <FileText size={18} />
                        <span className="hidden lg:inline text-xs font-bold">PDF</span>
                    </button>
                    <button
                        onClick={() => { setFormData(initialState); setEditMode(false); setPreviewImage(null); setSelectedFile(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-medium shadow-lg shadow-cyan-500/20 transition-all font-sm"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Agregar Repuesto</span>
                    </button>
                </div>
            </div>


            {/* Grid de Cards Premium */}
            {articulosFiltrados.length === 0 ? (
                <div className="text-center py-12 dark:bg-slate-800/20 bg-slate-50 border dark:border-slate-700/30 border-slate-200 rounded-2xl transition-colors">
                    <Package className="mx-auto h-12 w-12 text-slate-500 mb-3" />
                    <h3 className="text-lg font-medium dark:text-slate-300 text-slate-600">No se encontraron repuestos</h3>
                    <p className="text-slate-500 text-sm mt-1">Intenta con otros términos de búsqueda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {articulosFiltrados.map((item) => (
                        <div key={item._id} className="group dark:bg-slate-800/40 bg-white backdrop-blur-sm border dark:border-slate-700/50 border-slate-200 rounded-2xl overflow-hidden hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
                            
                            {/* Imagen del Producto */}
                            <div className="h-44 bg-slate-100 dark:bg-slate-900/50 relative overflow-hidden flex items-center justify-center border-b dark:border-slate-700/50 border-slate-100">
                                {item.imagen ? (
                                    <img 
                                        src={item.imagen.startsWith('http') ? item.imagen : `${apiBaseUrl}/${item.imagen}`} 
                                        alt={item.nombre} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <Package className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                                ) }
                                
                                {/* Badge de Precio */}
                                <div className="absolute top-3 right-3">
                                    <div className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg font-black font-mono shadow-lg shadow-cyan-600/30 text-sm">
                                        {formatCurrency(
                                            item.tipo_calculo_precio === 'Automatico'
                                                ? (Number(item.costo_inventario || 0) * (1 + ((empresaData?.porcentajeCosto || empresa?.porcentajeCosto || 0) / 100)))
                                                : Number(item.precio_venta || 0)
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Header de la Card */}
                            <div className="p-5 border-b dark:border-slate-700/50 border-slate-100">
                                <div className="flex justify-between items-start mb-2 text-[10px] font-bold uppercase tracking-tighter">
                                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-md border border-indigo-500/20">
                                        {item.codigo}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-md border ${item.stock > item.stock_minimo
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                        : item.stock > 0
                                            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                        }`}>
                                        Stock: {item.stock}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold dark:text-white text-slate-800 leading-tight mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                                    {item.nombre}
                                </h3>
                                <p className="text-[11px] dark:text-slate-400 text-slate-500 font-medium">
                                    {item.idcategoria?.nombre} • {item.idmodelo?.nombre}
                                </p>
                            </div>

                            {/* Body de la Card */}
                            <div className="p-5 dark:bg-slate-900/30 bg-slate-50/50 transition-colors">
                                <p className="text-sm dark:text-slate-400 text-slate-600 line-clamp-2 min-h-[40px]">
                                    {item.descripcion || 'Sin descripción disponible.'}
                                </p>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setFormData({
                                                ...item,
                                                costo_inventario: item.costo_inventario || 0,
                                                idcategoria: item.idcategoria?._id || '',
                                                idmodelo: item.idmodelo?._id || ''
                                            });
                                            setEditMode(true);
                                            setPreviewImage(item.imagen ? (item.imagen.startsWith('http') ? item.imagen : `${apiBaseUrl}/${item.imagen}`) : null);
                                            setSelectedFile(null);
                                            setShowModal(true);
                                        }}
                                        className="flex-1 py-1.5 dark:bg-slate-800 bg-white hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white text-slate-700 text-xs font-medium rounded-lg border dark:border-slate-700 border-slate-300 transition-colors"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL DE REPUESTOS */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                        {/* Cabecera del Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                <Package className="mr-2 text-cyan-500" size={24} />
                                {editMode ? 'Editar Repuesto' : 'Nuevo Repuesto'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Cuerpo del Modal (Scrolleable) */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Columna Izquierda: Datos Básicos */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Repuesto (*)</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
                                            placeholder="Ej. Amortiguador Delantero"
                                            value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">No. Parte (Opcional)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
                                                placeholder="Ej. 12345-ABC"
                                                value={formData.numeroParte || ''} onChange={e => setFormData({ ...formData, numeroParte: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fabricante / Marca (Opcional)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
                                                placeholder="Ej. Bosch, Toyota"
                                                value={formData.fabricante || ''} onChange={e => setFormData({ ...formData, fabricante: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vehículos Compatibles (Opcional)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
                                            placeholder="Ej. Hilux 2015-2020, Corolla"
                                            value={formData.vehiculosCompatibles || ''} onChange={e => setFormData({ ...formData, vehiculosCompatibles: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoría (*)</label>
                                            <select
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50 custom-select"
                                                value={formData.idcategoria} onChange={e => setFormData({ ...formData, idcategoria: e.target.value })}
                                            >
                                                <option value="" disabled>Seleccione...</option>
                                                {categorias.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Modelo (*)</label>
                                            <select
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50 custom-select"
                                                value={formData.idmodelo} onChange={e => setFormData({ ...formData, idmodelo: e.target.value })}
                                            >
                                                <option value="" disabled>Seleccione...</option>
                                                {modelos.map(m => <option key={m._id} value={m._id}>{m.nombre}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción Corta</label>
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none"
                                            rows="3" placeholder="Información técnica general..."
                                            value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                        ></textarea>
                                    </div>

                                    {/* Generador de Código */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Código/SKU Único (*)</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono tracking-wider mb-3"
                                            placeholder="Ej. PROD-001"
                                            value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                        />
                                        {formData.codigo && (
                                            <div className="flex justify-center bg-white p-3 rounded-lg border border-slate-200 overflow-hidden">
                                                <Barcode value={formData.codigo} height={40} width={1.5} fontSize={14} background="#ffffff" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Columna Derecha: Finanzas e Imagen */}
                                <div className="space-y-6">

                                    {/* Imagen */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fotografía (Max 20MB)</label>
                                        <div
                                            className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl h-48 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors overflow-hidden cursor-pointer"
                                            onClick={() => fileInputRef.current.click()}
                                        >
                                            {previewImage ? (
                                                <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                        <Upload className="text-cyan-600 dark:text-cyan-400" size={24} />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Click para subir imagen</p>
                                                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP</p>
                                                </>
                                            )}
                                            <input
                                                type="file" className="hidden" ref={fileInputRef} accept="image/png, image/jpeg, image/webp"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setSelectedFile(file);
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setPreviewImage(reader.result);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Datos Financieros */}
                                    <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Stock Mínimo</label>
                                            <input
                                                type="number" min="0" required
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
                                                value={formData.stock_minimo} onChange={e => setFormData({ ...formData, stock_minimo: e.target.value })}
                                            />
                                        </div>

                                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cálculo de Precio de Venta</label>
                                            <div className="flex bg-slate-200/50 dark:bg-slate-900 rounded-xl p-1 mb-3">
                                                <button
                                                    type="button"
                                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${formData.tipo_calculo_precio === 'Manual' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                    onClick={() => setFormData({ ...formData, tipo_calculo_precio: 'Manual' })}
                                                >
                                                    Manual
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${formData.tipo_calculo_precio === 'Automatico' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                    onClick={() => setFormData({ ...formData, tipo_calculo_precio: 'Automatico' })}
                                                >
                                                    Automático ({empresaData?.porcentajeCosto || empresa?.porcentajeCosto || 0}%)
                                                </button>
                                            </div>

                                            <div className="relative">
                                                {formData.tipo_calculo_precio === 'Automatico' ? (
                                                    <div className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent rounded-xl px-4 py-3 text-lg font-mono font-black text-emerald-600 dark:text-emerald-400 cursor-not-allowed">
                                                        {formatCurrency((Number(formData.costo_inventario) || 0) * (1 + ((empresaData?.porcentajeCosto || empresa?.porcentajeCosto || 0) / 100)))}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">C$</span>
                                                        <input
                                                            type="text" required
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-4 py-3 text-lg font-mono font-black text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                                                            value={formData.precio_venta !== undefined && formData.precio_venta !== null ? formData.precio_venta.toString().split('.').map((p, i) => i === 0 ? p.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : p).join('.') : ""}
                                                            onChange={e => {
                                                                let val = e.target.value.replace(/[^0-9.]/g, '');
                                                                const parts = val.split('.');
                                                                if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                                                                setFormData({ ...formData, precio_venta: val })
                                                            }}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                            {formData.tipo_calculo_precio === 'Automatico' && (
                                                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                                                    <AlertCircle size={10} />
                                                    El precio se calculará en el servidor sumando un {empresaData?.porcentajeCosto || empresa?.porcentajeCosto}% de utilidad al Costo.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer del Modal */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={handleSubmit}
                                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-70"
                            >
                                {submitting ? (
                                    <><Loader2 className="animate-spin mr-2" size={18} /> Guardando...</>
                                ) : (
                                    <><Check className="mr-2" size={18} /> {editMode ? 'Guardar Cambios' : 'Crear Repuesto'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;
