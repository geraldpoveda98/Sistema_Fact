import { API_BASE_URL } from '../../config';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Calculator, Plus, Trash2, Search, FileDown,
    Save, FileText, User, MapPin, Phone, Mail, Box, ArrowLeft, Eye, XCircle, Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatUtils';

const Proformas = () => {
    
    const { user, empresa } = useAuth();
    const normalize = (str) => str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "";
    const tienePermiso = (p) => user?.permisos?.some(perm => normalize(perm).includes(normalize(p)));
    
    const esAdmin = tienePermiso('admin') || normalize(user?.cargo).includes('admin') || tienePermiso('administracion');
    const puedeElegirFormato = esAdmin || tienePermiso('venta') || tienePermiso('ventas') || normalize(user?.cargo).includes('venta');

    // ======= ESTADOS =======
    const [viewMode, setViewMode] = useState('list'); // 'list' o 'form'
    const [loadingData, setLoadingData] = useState(true);
    const [toastMessage, setToastMessage] = useState(null);

    // Listas de la BD
    const [cajas, setCajas] = useState([]);
    const [series, setSeries] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [impuestos, setImpuestos] = useState([]);
    const [articulos, setArticulos] = useState([]);
    const [proformas, setProformas] = useState([]); // Historial general
    const [formatosImpresion, setFormatosImpresion] = useState([]);
    const [formatoSeleccionado, setFormatoSeleccionado] = useState('');
    const [modalReimpresion, setModalReimpresion] = useState(null); // {doc} para el mini-modal de formato

    // Búsqueda para la tabla principal
    const [searchTerm, setSearchTerm] = useState('');

    // Formulario de Nueva Proforma
    const initialStateForm = {
        caja: '', serieId: '', serieLiteral: '', numero: '',
        fecha: new Date().toISOString().split('T')[0],
        clienteId: '', impuestoId: '', tipo_pago: 'Efectivo', diasCredito: ''
    };
    const [formData, setFormData] = useState(initialStateForm);
    const [clienteDetalle, setClienteDetalle] = useState({ documento: '', direccion: '', telefono1: '', telefono2: '', email: '' });
    const [impuestoActual, setImpuestoActual] = useState(null);
    const [carrito, setCarrito] = useState([]);

    // Modal de Artículos
    const [isArticulosModalOpen, setIsArticulosModalOpen] = useState(false);
    const [articuloSearch, setArticuloSearch] = useState('');
    const searchInputRef = useRef(null);

    // ======= INICIALIZACIÓN =======
    useEffect(() => {
        cargarDatosMaestros();
    }, []);

    const showToast = (message, type = "success") => {
        setToastMessage({ text: message, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const cargarProformasHistorial = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/proformas`);
            setProformas(res.data);
        } catch (error) {
            console.error("Error obteniendo historial de proformas", error);
        }
    };

    const cargarDatosMaestros = async () => {
        try {
            setLoadingData(true);
            const [resCajas, resSeries, resClientes, resImpuestos, resArticulos, resProformas, resFormatos] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/cajas`),
                axios.get(`${API_BASE_URL}/api/series`),
                axios.get(`${API_BASE_URL}/api/clientes`),
                axios.get(`${API_BASE_URL}/api/impuestos`),
                axios.get(`${API_BASE_URL}/api/articulos`),
                axios.get(`${API_BASE_URL}/api/proformas`),
                axios.get(`${API_BASE_URL}/api/formatos-impresion`)
            ]);

            setCajas(resCajas.data.filter(c => c.condicion));
            const seriesProforma = resSeries.data.filter(s => s.tipo === 'Proforma' && s.condicion);
            setSeries(seriesProforma);
            setClientes(resClientes.data.filter(c => c.estado));
            setImpuestos(resImpuestos.data.filter(i => i.condicion && i.documento_aplicar === 'Venta'));
            setArticulos(resArticulos.data.filter(a => a.condicion));
            setProformas(resProformas.data);

            const formatosActivos = resFormatos.data.filter(f => f.estado && f.tipo_documento === 'Proforma');
            setFormatosImpresion(formatosActivos);
            const defaultFormato = formatosActivos.find(f => f.predeterminado);
            if(defaultFormato) setFormatoSeleccionado(defaultFormato._id);
            else if(formatosActivos.length > 0) setFormatoSeleccionado(formatosActivos[0]._id);

            if (resCajas.data.length > 0) handleFormDataChange('caja', resCajas.data[0]._id);
            if (seriesProforma.length > 0) handleSerieChange(seriesProforma[0]);
            if (resImpuestos.data.length > 0) handleImpuestoChange(resImpuestos.data[0]);

        } catch (error) {
            console.error("Error cargando maestros:", error);
            showToast("Error cargando catálogos del sistema", "error");
        } finally {
            setLoadingData(false);
        }
    };

    // ======= MANEJO DEL FORMULARIO =======
    const handleFormDataChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSerieChange = async (serieObj) => {
        if (!serieObj) return;
        handleFormDataChange('serieId', serieObj._id);
        handleFormDataChange('serieLiteral', serieObj.serie);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/proformas/siguiente_correlativo/${serieObj._id}`);
            handleFormDataChange('numero', res.data.siguiente_numero);
        } catch (err) {
            console.error(err);
        }
    };

    const handleClienteChange = (clienteId) => {
        handleFormDataChange('clienteId', clienteId);
        const cl = clientes.find(c => c._id === clienteId);
        if (cl) {
            setClienteDetalle({
                documento: cl.num_documento || 'N/A',
                direccion: cl.direccion || 'Sin dirección',
                telefono1: cl.telefono1 || '',
                telefono2: cl.telefono2 || '',
                email: cl.email || 'N/A'
            });
        } else {
            setClienteDetalle({ documento: '', direccion: '', telefono1: '', telefono2: '', email: '' });
        }
    };

    const handleImpuestoChange = (impuestoObj) => {
        handleFormDataChange('impuestoId', impuestoObj._id);
        setImpuestoActual(impuestoObj);
    };

    // ======= CARRITO =======
    const toggleArticulosModal = () => {
        setIsArticulosModalOpen(!isArticulosModalOpen);
        if (!isArticulosModalOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    };

    const agregarAlCarrito = (articulo, evt = null) => {
        if (evt) evt.preventDefault();

        setCarrito(prev => {
            const index = prev.findIndex(item => item.articulo._id === articulo._id);
            if (index >= 0) {
                const nuevo = [...prev];
                nuevo[index].cantidad += 1;
                // Subtotal con descuento porcentual: (Cant * Precio) * (1 - Desc/100)
                const descPorc = nuevo[index].descuento || 0;
                nuevo[index].subtotal = (nuevo[index].cantidad * nuevo[index].precio_venta) * (1 - descPorc / 100);
                return nuevo;
            } else {
                return [...prev, {
                    articulo: articulo,
                    cantidad: 1,
                    precio_venta: articulo.precio_venta || 0,
                    descuento: 0,
                    subtotal: articulo.precio_venta || 0
                }];
            }
        });
        showToast("Artículo agregado", "success");
        // No limpiamos el search aquí si viene del modal para permitir escaneo continuo
        // setArticuloSearch(''); 
        searchInputRef.current?.focus();
    };

    const eliminarDelCarrito = (index) => setCarrito(prev => prev.filter((_, i) => i !== index));

    const actualizarFilaCarrito = (index, campo, valor) => {
        setCarrito(prev => {
            const nuevo = [...prev];
            let numValor = valor;

            if (typeof valor === 'string') {
                // Soporte para comas y puntos
                numValor = valor.replace(',', '.');
            }

            if (campo === 'descuento') {
                nuevo[index][campo] = parseInt(numValor) || 0;
            } else {
                nuevo[index][campo] = parseFloat(numValor) || 0;
            }

            if (campo === 'cantidad' || campo === 'precio_venta' || campo === 'descuento') {
                const descPorc = nuevo[index].descuento || 0;
                const cant = nuevo[index].cantidad || 0;
                const precio = nuevo[index].precio_venta || 0;
                nuevo[index].subtotal = (cant * precio) * (1 - descPorc / 100);
            }
            return nuevo;
        });
    };

    const articulosFiltrados = articulos.filter(a =>
        (a.codigo && a.codigo.toLowerCase().includes(articuloSearch.toLowerCase())) ||
        (a.nombre && a.nombre.toLowerCase().includes(articuloSearch.toLowerCase())) ||
        (a.numeroParte && a.numeroParte.toLowerCase().includes(articuloSearch.toLowerCase())) ||
        (a.fabricante && a.fabricante.toLowerCase().includes(articuloSearch.toLowerCase())) ||
        (a.vehiculosCompatibles && a.vehiculosCompatibles.length > 0 && a.vehiculosCompatibles[0].toLowerCase().includes(articuloSearch.toLowerCase()))
    );

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && articulosFiltrados.length === 1) {
            e.preventDefault();
            agregarAlCarrito(articulosFiltrados[0]);
        }
    };

    // ======= CÁLCULOS =======
    const subtotalGeneral = carrito.reduce((acc, item) => acc + item.subtotal, 0);
    const ivaCalculado = impuestoActual ? (subtotalGeneral * (impuestoActual.porcentaje / 100)) : 0;
    const totalPagar = subtotalGeneral + ivaCalculado;
    const totalCredito = formData.tipo_pago === 'Crédito' ? totalPagar : 0;

    const formatMoney = formatCurrency;

    // ======= ACCIONES CRUD =======
    const handleGuardarImprimir = async () => {
        if (!formData.caja || !formData.serieId || !formData.clienteId || carrito.length === 0) {
            showToast("Complete los datos requeridos y agregue al menos un artículo", "error");
            return;
        }

        const payload = {
            caja: formData.caja,
            serie: formData.serieLiteral,
            numero: formData.numero,
            fecha: formData.fecha,
            cliente: formData.clienteId,
            impuesto: formData.impuestoId,
            tipo_pago: formData.tipo_pago,
            detalles: carrito.map(item => ({
                articulo: item.articulo._id,
                cantidad: item.cantidad,
                precio_venta: item.precio_venta,
                descuento: item.descuento,
                subtotal: item.subtotal
            })),
            subtotal: subtotalGeneral,
            iva: ivaCalculado,
            total: totalPagar,
            dias_credito: formData.tipo_pago === 'Crédito' ? parseInt(formData.diasCredito || 0) : 0,
            observaciones: formData.observaciones || ''
        };

        try {
            const res = await axios.post(`${API_BASE_URL}/api/proformas`, payload);
            showToast("Proforma guardada exitosamente. Generando PDF...");

            // Render PDF pasándole toda la data enriquecida (necesitamos emular los populate de cliente)
            const profAGuardar = JSON.parse(JSON.stringify(res.data.proforma));
            profAGuardar.cliente = clientes.find(c => c._id === formData.clienteId);
            profAGuardar.caja = cajas.find(c => c._id === formData.caja);
            profAGuardar.impuesto = impuestoActual;
            // A los detalles les integramos el objeto articulo completo para leer nombre y codigo
            profAGuardar.detalles = profAGuardar.detalles.map(d => ({
                ...d,
                articulo: articulos.find(a => a._id === d.articulo)
            }));

            generarPDF(profAGuardar);

            // Reset y Volver a Lista
            setCarrito([]);
            setFormData(initialStateForm);
            setClienteDetalle({ documento: '', direccion: '', telefono1: '', telefono2: '', email: '' });
            // Recargar el correlativo para que la próxima proforma use el número correcto
            if (series.length > 0) {
                await handleSerieChange(series[0]);
            }
            await cargarProformasHistorial();
            setViewMode('list');

        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.error || "Error al procesar la proforma", "error");
        }
    };

    const handleAnularProforma = async (id) => {
        if (window.confirm("¿Seguro que desea anular esta proforma?")) {
            try {
                await axios.patch(`${API_BASE_URL}/api/proformas/${id}/estado`, { estado: 'Anulada' });
                showToast("Proforma Anulada", "success");
                cargarProformasHistorial();
            } catch (error) {
                showToast("Error anulando proforma", "error");
            }
        }
    };

    const handleVerPDFExistente = (proformaObj, formatoId = null) => {
        // Si se pasa un formatoId específico (desde el modal de reimpresión), lo usamos
        // si no, usará el que esté en el estado global 'formatoSeleccionado'
        const fId = formatoId || formatoSeleccionado;
        
        const profEnriquecida = JSON.parse(JSON.stringify(proformaObj));
        profEnriquecida.detalles = profEnriquecida.detalles.map(d => {
            const articuloInfo = articulos.find(a => a._id === d.articulo) || { nombre: 'Desc', codigo: 'N/A' };
            return {
                ...d,
                articulo: typeof d.articulo === 'object' ? d.articulo : articuloInfo
            };
        });
        
        // Pasamos el ID del formato directamente a generarPDF como segundo parámetro (opcional)
        generarPDF(profEnriquecida, fId);
    };

    // ======= MOTOR PDF - FORMATO CARTA =======
    const generarPDF = async (dataProforma, formatoIdOverride = null) => {
        try {
            console.log("Iniciando generación de PDF Carta...", dataProforma);
            const formatoAplicarId = formatoIdOverride || formatoSeleccionado;
            const formatoObj = formatosImpresion.find(f => f._id === formatoAplicarId);
            const esTicket = formatoObj?.tamano === 'Rollo POS';

            if (esTicket) {
                await generarTicketPOS(dataProforma, formatoObj);
                return;
            }

            const doc = new jsPDF('p', 'pt', 'letter');
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const margen = 35;
            let y = margen;

            // ---- Datos de empresa (dinámicos) ----
            const empNombre = empresa?.nombre || 'MI EMPRESA';
            const empRuc = empresa?.ruc || '';
            const empDir = empresa?.direccion || '';
            const empTel = empresa?.telefono || '';
            const empCel = empresa?.celular || '';
            const empEmail = empresa?.correo || '';
            const empLogoUrl = empresa?.logoUrl || null;
            const tipoCambio = empresa?.valorDolar || 1;

            // ---- Datos del documento ----
            const clienteObj = dataProforma.cliente || {};
            const impuestoObj = dataProforma.impuesto || null;
            const impPorcentaje = impuestoObj?.porcentaje ?? (impuestoObj?.valor ?? 0);

            // ===== ENCABEZADO: LOGO + DATOS EMPRESA =====
            const logoW = 90, logoH = 55;
            const logoX = margen;
            const headerCenterX = margen + logoW + 15;
            const headerMaxW = pageW - headerCenterX - margen;

            // Logo (si existe)
            if (empLogoUrl) {
                try {
                    console.log("Cargando logo desde:", empLogoUrl);
                    const logoFullUrl = empLogoUrl.startsWith('http') ? empLogoUrl : `${API_BASE_URL}/${empLogoUrl}`;
                    const response = await fetch(logoFullUrl);
                    if (response.ok) {
                        const blob = await response.blob();
                        const reader = new FileReader();
                        const base64Logo = await new Promise((resolve, reject) => {
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                        doc.addImage(base64Logo, 'JPEG', logoX, y, logoW, logoH);
                    } else {
                        throw new Error(`HTTP ${response.status}`);
                    }
                } catch (e) {
                    console.warn("No se pudo cargar el logo, continuando sin él:", e);
                    doc.setFillColor(245, 245, 245);
                    doc.roundedRect(logoX, y, logoW, logoH, 4, 4, 'F');
                    doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(180, 180, 180);
                    doc.text('LOGO', logoX + logoW / 2, y + logoH / 2 + 4, { align: 'center' });
                    doc.setTextColor(0, 0, 0);
                }
            } else {
                doc.setFillColor(245, 245, 245);
                doc.roundedRect(logoX, y, logoW, logoH, 4, 4, 'F');
                doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(180, 180, 180);
                doc.text('LOGO', logoX + logoW / 2, y + logoH / 2 + 4, { align: 'center' });
                doc.setTextColor(0, 0, 0);
            }

            // Nombre empresa (derecha del logo)
            doc.setFontSize(13).setFont('helvetica', 'bold').setTextColor(0, 0, 0);
            doc.text(empNombre.toUpperCase(), headerCenterX, y + 12);
            doc.setFontSize(8).setFont('helvetica', 'normal');
            const infoLineas = [];
            if (empRuc) infoLineas.push(`RUC: ${empRuc}${empDir ? ' - Dirección: ' + empDir : ''}`);
            else if (empDir) infoLineas.push(`Dirección: ${empDir}`);
            const telStr = [empTel && `Teléfono: ${empTel}`, empCel && `Cels: ${empCel}`].filter(Boolean).join(' / ');
            if (telStr) infoLineas.push(telStr);
            if (empEmail) infoLineas.push(`Email: ${empEmail}`);

            infoLineas.forEach((linea, i) => {
                doc.text(String(linea), headerCenterX, y + 24 + (i * 11), { maxWidth: headerMaxW });
            });

            // ===== TÍTULO DEL DOCUMENTO =====
            y = 100;
            doc.setDrawColor(0, 0, 0).setLineWidth(1);
            doc.line(margen, y, pageW - margen, y);
            
            y += 15;
            const tipoDoc = dataProforma.tipo_pago === 'Crédito'
                ? `PROFORMA CRÉDITO (${dataProforma.dias_credito || 0} DÍAS)`
                : 'PROFORMA CONTADO';

            doc.setFontSize(14).setFont('helvetica', 'bold').setTextColor(0, 0, 0);
            doc.text(tipoDoc, pageW / 2, y + 10, { align: 'center' });
            
            y += 20;
            doc.line(margen, y, pageW - margen, y);
            y += 10;

            // ===== RECUADROS DE CABECERA (CLIENTE Y NÚMERO) =====
            const numBoxX = pageW - margen - 145;
            const numBoxY = y;
            const numBoxW = 145;
            const numBoxH = 50;
            doc.setLineWidth(0.8);
            doc.roundedRect(numBoxX, numBoxY, numBoxW, numBoxH, 3, 3);
            doc.setFontSize(11).setFont('helvetica', 'bold');
            doc.text(`N° ${dataProforma.serie || 'PRF'}-${dataProforma.numero || '000'}`, numBoxX + numBoxW / 2, numBoxY + 14, { align: 'center' });
            doc.line(numBoxX, numBoxY + 18, numBoxX + numBoxW, numBoxY + 18);

            // DIA MES AÑO
            doc.setFontSize(7.5).setFont('helvetica', 'bold');
            const colW3 = numBoxW / 3;
            doc.text('DIA', numBoxX + colW3 * 0.5, numBoxY + 28, { align: 'center' });
            doc.text('MES', numBoxX + colW3 * 1.5, numBoxY + 28, { align: 'center' });
            doc.text('AÑO', numBoxX + colW3 * 2.5, numBoxY + 28, { align: 'center' });
            doc.line(numBoxX, numBoxY + 32, numBoxX + numBoxW, numBoxY + 32);
            const fechaReal = new Date(dataProforma.fecha || Date.now());
            doc.setFontSize(8).setFont('helvetica', 'normal');
            doc.text(String(fechaReal.getUTCDate()).padStart(2, '0'), numBoxX + colW3 * 0.5, numBoxY + 44, { align: 'center' });
            doc.text(String(fechaReal.getUTCMonth() + 1).padStart(2, '0'), numBoxX + colW3 * 1.5, numBoxY + 44, { align: 'center' });
            doc.text(String(fechaReal.getUTCFullYear()), numBoxX + colW3 * 2.5, numBoxY + 44, { align: 'center' });

            const clienteBoxX = margen;
            const clienteBoxW = numBoxX - margen - 8;
            doc.roundedRect(clienteBoxX, numBoxY, clienteBoxW, numBoxH, 3, 3);
            doc.setFontSize(8).setFont('helvetica', 'normal');
            doc.text(`Cliente :`, clienteBoxX + 5, numBoxY + 14);
            doc.setFont('helvetica', 'bold');
            doc.text(String(clienteObj.nombre || ''), clienteBoxX + 45, numBoxY + 14);
            doc.setFont('helvetica', 'normal');
            doc.text(`Cédula :`, clienteBoxX + clienteBoxW / 2 + 5, numBoxY + 14);
            doc.text(String(clienteObj.num_documento || 'N/A'), clienteBoxX + clienteBoxW / 2 + 42, numBoxY + 14);
            const telCliente = [clienteObj.telefono1, clienteObj.telefono2].filter(Boolean).join(' / ');
            doc.text(`Cel.:`, clienteBoxX + 5, numBoxY + 28);
            doc.text(String(telCliente || ''), clienteBoxX + 30, numBoxY + 28);
            doc.text(`Email:`, clienteBoxX + clienteBoxW / 2 + 5, numBoxY + 28);
            doc.text(String(clienteObj.email || ''), clienteBoxX + clienteBoxW / 2 + 32, numBoxY + 28);
            const dirLines = doc.splitTextToSize(`Dirección : ${clienteObj.direccion || ''}`, clienteBoxW - 10);
            doc.text(String(dirLines[0] || ''), clienteBoxX + 5, numBoxY + 42);

            y = numBoxY + numBoxH + 10;

            // ===== TABLA DE ARTÍCULOS =====
            const tableColumn = ['CODIGO', 'DESCRIPCION', 'CANTIDAD', 'P.U.', 'DSCTO', 'SUBTOTAL'];
            const tableRows = (dataProforma.detalles || []).map(item => {
                const art = item.articulo || {};
                return [
                    String(art.codigo || 'N/A'),
                    String(art.nombre || 'Desconocido'),
                    String(item.cantidad || 0),
                    `C$ ${Number(item.precio_venta || 0).toFixed(2)}`,
                    `${Number(item.descuento || 0).toFixed(0)}%`,
                    `C$ ${Number(item.subtotal || 0).toFixed(2)}`
                ];
            });

            console.log("Generando tabla autoTable...");
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: y,
                theme: 'grid',
                headStyles: {
                    fillColor: [220, 230, 255],
                    textColor: [0, 0, 0],
                    fontSize: 8,
                    fontStyle: 'bold',
                    halign: 'center',
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5
                },
                bodyStyles: {
                    fontSize: 8,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.4,
                    textColor: [0, 0, 50]
                },
                columnStyles: {
                    0: { cellWidth: 60, halign: 'left' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 55, halign: 'center' },
                    3: { cellWidth: 70, halign: 'right' },
                    4: { cellWidth: 50, halign: 'right' },
                    5: { cellWidth: 80, halign: 'right' }
                },
                margin: { left: margen, right: margen }
            });

            y = doc.lastAutoTable.finalY + 12;

            // ===== TOTALES AL FINAL DE LA HOJA =====
            const totalesH = 75;
            const totalH_necesario = totalesH + 20;

            if (y + totalH_necesario > doc.internal.pageSize.getHeight() - margen) {
                doc.addPage();
                y = margen + 10;
            }
            
            // Empujar al fondo de la hoja actual (última)
            y = doc.internal.pageSize.getHeight() - margen - totalesH;

            const totalBoxW = 175;
            const totalBoxX = pageW - margen - totalBoxW;
            const adicionalBoxW = totalBoxX - margen - 8;
            const adicionalBoxX = margen;

            const subtotalVal = dataProforma.subtotal || 0;
            const ivaVal = dataProforma.iva || 0;
            const totalCORD = dataProforma.total || 0;
            const totalUSD = tipoCambio > 0 ? (totalCORD / tipoCambio) : 0;

            const txtPie = formatoObj?.mensaje_pie || empresa?.mensaje_proforma || 'PROFORMA VÁLIDA POR 15 DÍAS. Precios sujetos a cambio sin previo aviso.';
            const adicionalLines = doc.splitTextToSize(String(txtPie), adicionalBoxW - 12);

            // Caja ADICIONAL
            doc.setLineWidth(0.5).setDrawColor(0, 0, 0);
            doc.roundedRect(adicionalBoxX, y, adicionalBoxW, totalesH, 3, 3);
            doc.setFontSize(8.5).setFont('helvetica', 'bold').setTextColor(0, 0, 0);
            doc.text('ADICIONAL', adicionalBoxX + adicionalBoxW / 2, y + 10, { align: 'center' });
            doc.line(adicionalBoxX, y + 14, adicionalBoxX + adicionalBoxW, y + 14);
            doc.setFontSize(7.5).setFont('helvetica', 'normal').setTextColor(30, 30, 100);
            const maxLineas = Math.min(adicionalLines.length, 5);
            adicionalLines.slice(0, maxLineas).forEach((line, i) => {
                doc.text(String(line), adicionalBoxX + 6, y + 24 + (i * 10));
            });

            // Caja TOTALES
            doc.setTextColor(0, 0, 0);
            doc.roundedRect(totalBoxX, y, totalBoxW, totalesH, 3, 3);
            doc.setFontSize(9).setFont('helvetica', 'bold');
            doc.text('TOTALES', totalBoxX + totalBoxW / 2, y + 10, { align: 'center' });
            doc.line(totalBoxX, y + 14, totalBoxX + totalBoxW, y + 14);

            doc.setFontSize(8).setFont('helvetica', 'normal');
            const valX = totalBoxX + totalBoxW - 6;

            doc.text('SUBTOTAL', totalBoxX + 6, y + 26);
            doc.text(`C$ ${Number(subtotalVal).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`, valX, y + 26, { align: 'right' });

            doc.text('IVA', totalBoxX + 6, y + 38);
            doc.text(`C$ ${Number(ivaVal).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`, valX, y + 38, { align: 'right' });

            doc.line(totalBoxX + 4, y + 42, totalBoxX + totalBoxW - 4, y + 42);

            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL A PAGAR', totalBoxX + 6, y + 53);
            doc.text(`C$ ${Number(totalCORD).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`, valX, y + 53, { align: 'right' });

            doc.setFontSize(7.5).setFont('helvetica', 'italic').setTextColor(80, 80, 80);
            doc.text(`(Equivalente en USD @ C$${tipoCambio})`, totalBoxX + 6, y + 64);
            doc.setFont('helvetica', 'bold').setTextColor(0, 100, 0);
            doc.text(`$ ${Number(totalUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, valX, y + 64, { align: 'right' });

            // ===== PAGINACIÓN =====
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(150);
                doc.text(`Página ${i} de ${totalPages}`, pageW - margen, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
            }

            console.log("Abriendo PDF Proforma...");
            const pdfOutput = doc.output('bloburl');
            const newWindow = window.open(pdfOutput, '_blank');
            
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                console.warn("Popup bloqueado, intentando descarga directa...");
                doc.save(`Proforma_${dataProforma.numero || '000'}.pdf`);
                showToast("Ventana emergente bloqueada. El PDF se ha descargado automáticamente.", "success");
            }

        } catch (error) {
            console.error("ERROR GENERANDO PDF PROFORMA:", error);
            showToast("Error crítico al generar el PDF. Revisa la consola.", "error");
        }
    };

    const generarTicketPOS = async (dataProforma, formatoObj) => {
        try {
            const numItems = dataProforma.detalles?.length || 0;
            const hasLogo = !!empresa?.logoUrl;
            const logoH = hasLogo ? 60 : 0;
            const baseHeight = 320 + logoH;
            const itemHeight = 25;
            const totalHeight = baseHeight + (numItems * itemHeight) + 120;
            
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: [226, totalHeight]
            });

            const mLeft = 10;
            const width = 206; 
            let y = 15;
            const alignCenter = { align: 'center', maxWidth: width };
            const tipoCambio = empresa?.valorDolar || 1;
            const clienteObj = dataProforma.cliente || {};

            // === LOGO (Si existe) ===
            if (empresa?.logoUrl) {
                try {
                    const logoFullUrl = empresa.logoUrl.startsWith('http') ? empresa.logoUrl : `${API_BASE_URL}/${empresa.logoUrl}`;
                    const response = await fetch(logoFullUrl);
                    if (response.ok) {
                        const blob = await response.blob();
                        const reader = new FileReader();
                        const base64Logo = await new Promise((resolve, reject) => {
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                        const lW = 80, lH = 50;
                        doc.addImage(base64Logo, 'JPEG', (226 - lW) / 2, y, lW, lH);
                        y += lH + 10;
                    }
                } catch (e) {
                    console.warn("Error logo ticket proforma:", e);
                }
            }

            // === HEADER (DINÁMICO) ===
            doc.setFontSize(11).setFont('helvetica', 'bold');
            doc.text((empresa?.nombre || "GED SOLUTION").toUpperCase(), 113, y, alignCenter); y += 12;

            doc.setFontSize(8).setFont('helvetica', 'normal');
            if (empresa?.mensaje_proforma) {
                const subHeaderLines = doc.splitTextToSize(empresa.mensaje_proforma, width);
                doc.text(subHeaderLines, 113, y, alignCenter);
                y += (subHeaderLines.length * 9);
            }

            if (empresa?.ruc) { doc.text(`RUC: ${empresa.ruc}`, 113, y, alignCenter); y += 10; }
            if (empresa?.direccion) { 
                const dirLines = doc.splitTextToSize(`DIR: ${empresa.direccion}`, width);
                doc.text(dirLines, 113, y, alignCenter); 
                y += (dirLines.length * 9); 
            }
            const tels = [empresa?.telefono, empresa?.celular].filter(Boolean).join(' / ');
            if (tels) { doc.text(`TEL: ${tels}`, 113, y, alignCenter); y += 10; }
            y += 5;

            doc.setLineWidth(0.5);
            doc.line(mLeft, y, mLeft + width, y); y += 10;

            // === TIPO / NUMERO ===
            doc.setFontSize(10).setFont('helvetica', 'bold');
            let tipoText = dataProforma.tipo_pago === 'Crédito' ? `PROFORMA CRED (${dataProforma.dias_credito || 0}D)` : "PROFORMA CONTADO";
            doc.text(tipoText, 113, y, alignCenter); y += 12;
            
            doc.setFontSize(11);
            doc.text(`N° ${dataProforma.serie}-${dataProforma.numero}`, 113, y, alignCenter); y += 12;
            
            doc.setFontSize(8).setFont('helvetica', 'normal');
            doc.text(`Fecha: ${new Date(dataProforma.fecha).toLocaleString()}`, 113, y, alignCenter); y += 10;

            doc.line(mLeft, y, mLeft + width, y); y += 10;

        // === CLIENTE ===
        doc.text(`Cliente: ${clienteObj.nombre || 'N/A'}`, mLeft, y); y += 10;
        if(clienteObj.num_documento) { doc.text(`RUC/ID: ${clienteObj.num_documento}`, mLeft, y); y += 10; }
        
        doc.line(mLeft, y, mLeft + width, y); y += 12;

        // === DETALLES ===
        doc.setFontSize(7).setFont('helvetica', 'bold');
        doc.text("CANT DESCRIPCION", mLeft, y); 
        doc.text("TOTAL", mLeft + width, y, { align: 'right' }); 
        y += 8;
        doc.line(mLeft, y, mLeft + width, y); y += 10;

        doc.setFont('helvetica', 'normal');
        dataProforma.detalles.forEach(item => {
            const art = item.articulo || {};
            const cantStr = `${item.cantidad}x `;
            let desc = String(art.nombre || 'Articulo');
            
            const descLines = doc.splitTextToSize(desc, 130);
            
            doc.text(`${cantStr}${descLines[0]}`, mLeft, y);
            doc.text(Number(item.subtotal).toFixed(2), mLeft + width, y, { align: 'right' });
            y += 10;
            
            if(descLines.length > 1) {
                for(let i=1; i<descLines.length; i++) {
                    doc.text(`   ${descLines[i]}`, mLeft, y);
                    y += 10;
                }
            }
        });

        doc.line(mLeft, y, mLeft + width, y); y += 10;

        // === TOTALES ===
        doc.setFontSize(9).setFont('helvetica', 'bold');
        doc.text("SUBTOTAL:", mLeft + 60, y); 
        doc.text(formatCurrency(dataProforma.subtotal), mLeft + width, y, { align: 'right' }); y += 12;
        
        const iPorcentaje = dataProforma.impuesto?.porcentaje || 0;
        doc.text(`IVA (${iPorcentaje}%):`, mLeft + 60, y); 
        doc.text(formatCurrency(dataProforma.iva), mLeft + width, y, { align: 'right' }); y += 12;
        
        doc.setFontSize(11);
        doc.text("TOTAL C$:", mLeft + 50, y); 
        doc.text(formatCurrency(dataProforma.total), mLeft + width, y, { align: 'right' }); y += 15;

        // --- Conversión a Dólar ---
        const totalUSD = tipoCambio > 0 ? (dataProforma.total / tipoCambio) : 0;
        doc.setFontSize(10).setFont('helvetica', 'bold').setDrawColor(0).setTextColor(0, 80, 0);
        doc.text("TOTAL USD:", mLeft + 50, y);
        doc.text(`$ ${Number(totalUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, mLeft + width, y, { align: 'right' });
        y += 10;
        doc.setFontSize(7).setFont('helvetica', 'italic').setTextColor(100);
        doc.text(`Cambio: 1 USD = C$ ${tipoCambio.toFixed(2)}`, 113, y, alignCenter);
        y += 15;

        // === FOOTER ===
        doc.setTextColor(0);
        doc.setFontSize(7).setFont('helvetica', 'normal');
        const txtGlobal = empresa?.mensaje_proforma || 'PROFORMA VÁLIDA POR 15 DÍAS.';
        const txtElegido = formatoObj?.mensaje_pie || txtGlobal;
        const msgLines = doc.splitTextToSize(txtElegido, width);
        doc.text(msgLines, 113, y, alignCenter); 
        y += (msgLines.length * 10) + 10;
        
        doc.text("-", 113, y, alignCenter);

        window.open(doc.output('bloburl'), '_blank');
        } catch (error) {
            console.error("Error en generarTicketPOS:", error);
        }
    };

    // ======= RENDERIZADO =======
    if (loadingData) {
        return <div className="p-8 text-center text-slate-500">Cargando módulos y catálogos...</div>;
    }

    const proformasFiltradasLista = proformas.filter(p =>
        p.numero.includes(searchTerm) ||
        (p.cliente && p.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 w-full max-w-7xl mx-auto">

            {/* ====== VISTA: LISTA DE PROFORMAS ====== */}
            {viewMode === 'list' && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Proformas</h1>
                                <p className="text-slate-500 dark:text-slate-400">Historial y gestión de proformas emitidas.</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="text" placeholder="Buscar por número o cliente..."
                                    className="pl-10 pr-4 py-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={async () => {
                                    setCarrito([]);
                                    setFormData(initialStateForm);
                                    setClienteDetalle({ documento: '', direccion: '', telefono1: '', telefono2: '', email: '' });
                                    if (series.length > 0) await handleSerieChange(series[0]);
                                    if (cajas.length > 0) handleFormDataChange('caja', cajas[0]._id);
                                    if (impuestos.length > 0) handleImpuestoChange(impuestos[0]);
                                    setViewMode('form');
                                }}
                                className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all text-sm w-full sm:w-auto"
                            >
                                <Plus size={18} className="mr-2" /> Nueva Proforma
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Comprobante</th>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Cliente</th>
                                        <th className="px-6 py-4 text-center">Estado</th>
                                        <th className="px-6 py-4 text-right">Total</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {proformasFiltradasLista.length === 0 ? (
                                        <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No hay proformas registradas o que coincidan con la búsqueda.</td></tr>
                                    ) : (
                                        proformasFiltradasLista.map(p => (
                                            <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.serie}-{p.numero}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    {new Date(p.fecha).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">
                                                    {p.cliente ? p.cliente.nombre : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${p.estado === 'Emitida' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' :
                                                        p.estado === 'Anulada' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                                                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                        {p.estado}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatMoney(p.total)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center flex-nowrap space-x-2">
                                                        <button
                                                            onClick={() => setModalReimpresion({ doc: p })}
                                                            className="p-1.5 text-slate-500 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded tooltip-trigger"
                                                            title="Reimprimir Proforma"
                                                        >
                                                            <Printer size={16} />
                                                        </button>
                                                        {p.estado === 'Emitida' && (
                                                            <button
                                                                onClick={() => handleAnularProforma(p._id)}
                                                                className="p-1.5 text-slate-500 hover:text-rose-600 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900 rounded tooltip-trigger"
                                                                title="Anular"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ====== VISTA: FORMULARIO DE NUEVA PROFORMA ====== */}
            {viewMode === 'form' && (
                <div className="animate-in slide-in-from-right-8 duration-300 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setViewMode('list')}
                                className="p-2 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl transition-all"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nueva Proforma</h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Registrando comprobante en sistema.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {puedeElegirFormato && (
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Formato de Impresión</label>
                                    <select 
                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                                        value={formatoSeleccionado}
                                        onChange={(e) => setFormatoSeleccionado(e.target.value)}
                                    >
                                        {formatosImpresion.length > 0 ? (
                                            formatosImpresion.map(f => (
                                                <option key={f._id} value={f._id}>📄 {f.nombre} ({f.tamano})</option>
                                            ))
                                        ) : (
                                            <option value="">Sin formatos de Proforma</option>
                                        )}
                                    </select>
                                </div>
                            )}

                            <button
                                onClick={handleGuardarImprimir}
                                className="flex items-center px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all text-sm"
                            >
                                <FileDown size={16} className="mr-2" /> Imprimir y Guardar
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col xl:flex-row gap-6">
                        {/* COLUMNA IZQUIERDA (CABECERA Y CLIENTE) */}
                        <div className="w-full xl:w-1/3 flex flex-col gap-6">

                            {/* Tarjeta de Datos de Emisión */}
                            <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center mb-4 text-sm">
                                    <Box size={16} className="mr-2 text-indigo-500" /> Datos de Emisión
                                </h2>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Caja (*)</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.caja} onChange={e => handleFormDataChange('caja', e.target.value)}
                                    >
                                        <option value="" disabled>Seleccione una caja</option>
                                        {cajas.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Serie</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={formData.serieId} onChange={e => {
                                                const s = series.find(x => x._id === e.target.value);
                                                if (s) handleSerieChange(s);
                                            }}
                                        >
                                            <option value="" disabled>Seleccione serie</option>
                                            {series.map(s => <option key={s._id} value={s._id}>{s.serie}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Número</label>
                                        <input
                                            type="text" readOnly value={formData.numero}
                                            className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-500 font-mono font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Fecha (*)</label>
                                    <input
                                        type="date" value={formData.fecha} onChange={e => handleFormDataChange('fecha', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Impuesto</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={formData.impuestoId} onChange={e => {
                                                const imp = impuestos.find(i => i._id === e.target.value);
                                                if (imp) handleImpuestoChange(imp);
                                            }}
                                        >
                                            {impuestos.map(i => <option key={i._id} value={i._id}>{i.descripcion} ({i.porcentaje}%)</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Pago</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={formData.tipo_pago} onChange={e => {
                                                handleFormDataChange('tipo_pago', e.target.value);
                                                if(e.target.value !== 'Crédito') handleFormDataChange('diasCredito', '');
                                            }}
                                        >
                                            {['Efectivo', 'Tarjeta', 'Crédito', 'Transferencia', 'Cheque'].map(op => <option key={op} value={op}>{op}</option>)}
                                        </select>
                                    </div>
                                    {formData.tipo_pago === 'Crédito' && (
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Días de Crédito</label>
                                            <input
                                                type="number" min="0" value={formData.diasCredito}
                                                onChange={e => handleFormDataChange('diasCredito', e.target.value)}
                                                placeholder="Ej: 15, 30"
                                                className="w-full bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 text-sm text-indigo-900 dark:text-indigo-300 outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tarjeta de Cliente */}
                            <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center mb-4 text-sm">
                                    <User size={16} className="mr-2 text-indigo-500" /> Cliente
                                </h2>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Cliente (*)</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                        value={formData.clienteId} onChange={e => handleClienteChange(e.target.value)}
                                    >
                                        <option value="" disabled>Seleccione clente...</option>
                                        {clientes.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-3 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 mt-2">
                                    <div className="flex items-start">
                                        <MapPin size={14} className="text-slate-400 mt-1 mr-2 flex-shrink-0" />
                                        <p className="text-xs text-slate-600 dark:text-slate-400 break-words">{clienteDetalle.direccion || 'Dirección...'}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <Phone size={14} className="text-slate-400 mr-2 flex-shrink-0" />
                                        <p className="text-xs text-slate-600 dark:text-slate-400">{clienteDetalle.telefono1} {clienteDetalle.telefono2 ? `/ ${clienteDetalle.telefono2}` : ''}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <Mail size={14} className="text-slate-400 mr-2 flex-shrink-0" />
                                        <p className="text-xs text-slate-600 dark:text-slate-400">{clienteDetalle.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA (CARRITO Y TOTALES) */}
                        <div className="w-full xl:w-2/3 flex flex-col gap-6">

                            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Artículos en Proforma</h3>
                                    <button
                                        onClick={toggleArticulosModal}
                                        className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors flex items-center"
                                    >
                                        <Plus size={14} className="mr-1" /> + Agregar Repuestos
                                    </button>
                                </div>

                                <div className="overflow-x-auto flex-grow">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-2 py-3 text-center w-10">Opc</th>
                                                <th className="px-4 py-3 min-w-[150px]">Descripción</th>
                                                <th className="px-2 py-3 text-center w-16">Cant</th>
                                                <th className="px-4 py-3 text-right w-24">P.U.</th>
                                                <th className="px-4 py-3 text-right w-20">Desc %</th>
                                                <th className="px-4 py-3 text-right w-28">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {carrito.length === 0 ? (
                                                <tr><td colSpan="6" className="px-4 py-16 text-center text-slate-400 text-sm">
                                                    <Calculator size={32} className="mx-auto mb-3 opacity-20" />
                                                    El carrito está vacío.
                                                </td></tr>
                                            ) : (
                                                carrito.map((item, idx) => (
                                                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                        <td className="px-4 py-2 text-center">
                                                            <button onClick={() => eliminarDelCarrito(idx)} className="text-slate-400 hover:text-rose-500 p-1">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={item.articulo.nombre}>{item.articulo.nombre}</p>
                                                            <p className="text-[10px] text-slate-500 font-mono">CÓD: {item.articulo.codigo} {item.articulo.numeroParte ? `| NP: ${item.articulo.numeroParte}` : ''}</p>
                                                        </td>
                                                        <td className="px-2 py-2 text-center">
                                                            <input
                                                                type="number" min="1" value={item.cantidad}
                                                                onChange={(e) => actualizarFilaCarrito(idx, 'cantidad', e.target.value)}
                                                                className="w-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-1 py-1 text-center text-sm font-bold outline-none focus:border-indigo-500"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            <input
                                                                type="text" value={item.precio_venta}
                                                                readOnly={!esAdmin}
                                                                onChange={(e) => actualizarFilaCarrito(idx, 'precio_venta', e.target.value)}
                                                                className={`w-20 bg-transparent border-b border-transparent ${!esAdmin ? 'text-slate-400 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 font-bold border-indigo-500/30'} px-1 py-1 text-right text-sm font-mono outline-none`}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            <input
                                                                type="number" min="0" max="100" step="1" value={item.descuento || ''} placeholder="0%"
                                                                onChange={(e) => actualizarFilaCarrito(idx, 'descuento', e.target.value)}
                                                                className="w-12 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 px-1 py-1 text-right text-sm font-mono text-rose-500 outline-none font-bold"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white font-mono text-sm">
                                                            {formatMoney(item.subtotal)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                    <div className="space-y-2 w-full md:w-1/2 lg:w-1/3">
                                        <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                                            <span className="font-bold">SUBTOTAL</span>
                                            <span className="font-mono">{formatMoney(subtotalGeneral)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                                            <span className="font-bold">IVA ({impuestoActual ? impuestoActual.porcentaje : 0}%)</span>
                                            <span className="font-mono">{formatMoney(ivaCalculado)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-lg text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                                            <span className="font-black">TOTAL</span>
                                            <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">{formatMoney(totalPagar)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== MODAL CATÁLOGO DE ARTÍCULOS ====== */}
            {isArticulosModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col my-auto h-[90vh]">

                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-900 text-white rounded-t-2xl flex justify-between items-center">
                            <h2 className="text-lg font-bold flex items-center"><Search size={18} className="mr-2" /> Agregar Repuestos</h2>
                            <button onClick={toggleArticulosModal} className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                            <div className="relative">
                                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Buscar por código original, parte o nombre de repuesto..."
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 rounded-xl text-slate-900 dark:text-white outline-none shadow-sm font-medium transition-all"
                                    value={articuloSearch}
                                    onChange={e => setArticuloSearch(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            const filtrados = articulosFiltrados;
                                            if (filtrados.length === 1) {
                                                e.preventDefault();
                                                agregarAlCarrito(filtrados[0]);
                                                setArticuloSearch(''); // Limpiar para el siguiente escaneo
                                            }
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto p-2 flex-grow">
                            <div className="space-y-2">
                                {articulosFiltrados.slice(0, 50).map(a => (
                                    <div 
                                        key={a._id} 
                                        className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3 hover:border-indigo-500/50 hover:bg-indigo-50/10 dark:hover:bg-indigo-500/5 transition-all flex items-center gap-4 group cursor-pointer"
                                        onClick={() => {
                                            agregarAlCarrito(a);
                                            // Si se agrega manualmente no limpiamos el buscador para no confundir al usuario
                                        }}
                                    >
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border dark:border-slate-700">
                                            {a.imagen ? (
                                                <img 
                                                    src={a.imagen.startsWith('http') ? a.imagen : `${API_BASE_URL}/${a.imagen}`} 
                                                    alt={a.nombre} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Box className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                                            )}
                                        </div>
                                        
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate uppercase pr-4">{a.nombre}</h4>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg leading-none mb-1">{formatMoney(a.precio_venta)}</p>
                                                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-black uppercase ring-1 ring-inset ${a.stock > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-600/20'}`}>
                                                        EXISTENCIA: {a.stock}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-bold font-mono">
                                                    CÓD: {a.codigo}
                                                </span>
                                                {a.numeroParte && (
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-bold font-mono">
                                                        NP: {a.numeroParte}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-all shadow-sm">
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                ))}
                                {articulosFiltrados.length === 0 && (
                                    <div className="py-12 text-center">
                                        <Search size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-500 font-medium">No se encontraron repuestos con ese criterio.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                            <button 
                                onClick={toggleArticulosModal}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                            >
                                Listo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MINI-MODAL: Selección de Formato para Reimprimir ===== */}
            {modalReimpresion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                            🖨️ Seleccionar Formato de Impresión
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                            Elige el formato con el que deseas reimprimir esta proforma.
                        </p>
                        <select
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 mb-5"
                            value={formatoSeleccionado}
                            onChange={(e) => setFormatoSeleccionado(e.target.value)}
                        >
                            {formatosImpresion.length > 0 ? (
                                formatosImpresion.map(f => (
                                    <option key={f._id} value={f._id}>📄 {f.nombre} ({f.tamano})</option>
                                ))
                            ) : (
                                <option value="">Sin formatos configurados</option>
                            )}
                        </select>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setModalReimpresion(null)}
                                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => { handleVerPDFExistente(modalReimpresion.doc, formatoSeleccionado); setModalReimpresion(null); }}
                                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
                            >
                                🖨️ Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notificaciones */}
            {toastMessage && (
                <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-xl font-medium text-white animate-in slide-in-from-bottom-5 ${toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
                    }`}>
                    {toastMessage.text}
                </div>
            )}
        </div>
    );
};

export default Proformas;
