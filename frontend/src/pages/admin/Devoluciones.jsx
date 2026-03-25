import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search, FileDown, Save, FileText, User, ArrowLeft, Eye, RefreshCcw, CheckCircle, XCircle, Plus, Box, Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatUtils';

const Devoluciones = () => {
    const apiBaseUrl = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`);
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
    const [facturasEmitidas, setFacturasEmitidas] = useState([]);
    const [devoluciones, setDevoluciones] = useState([]);
    const [formatosImpresion, setFormatosImpresion] = useState([]);
    const [formatoSeleccionado, setFormatoSeleccionado] = useState('');
    const [catalogoArticulos, setCatalogoArticulos] = useState([]);

    // Búsqueda
    const [searchTerm, setSearchTerm] = useState('');

    // Formulario de Nueva Devolución
    const initialStateForm = {
        caja: '', serieId: '', serieLiteral: '', numero: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: 'Devolución de factura procesada por garantía o error de digitación.'
    };
    const [formData, setFormData] = useState(initialStateForm);

    // Modal Formatos
    const [showModalFormato, setShowModalFormato] = useState(false);
    const [devParaImprimir, setDevParaImprimir] = useState(null);

    // Factura rastreada para devolver
    const [searchFacturaSerie, setSearchFacturaSerie] = useState('');
    const [searchFacturaNumero, setSearchFacturaNumero] = useState('');
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

    // ======= INICIALIZACIÓN =======
    useEffect(() => {
        cargarDatosMaestros();
    }, []);

    const showToast = (message, type = "success") => {
        setToastMessage({ text: message, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    const cargarHistorial = async () => {
        try {
            const res = await axios.get(`${apiBaseUrl}/api/devoluciones`);
            setDevoluciones(res.data);
        } catch (error) {
            console.error("Error obteniendo historial de devoluciones", error);
        }
    };

    const cargarDatosMaestros = async () => {
        try {
            setLoadingData(true);
            const [resCajas, resSeries, resFacturas, resDevoluciones, resFormatos, resArticulos] = await Promise.all([
                axios.get(`${apiBaseUrl}/api/cajas`),
                axios.get(`${apiBaseUrl}/api/series`),
                axios.get(`${apiBaseUrl}/api/ventas/facturas`),
                axios.get(`${apiBaseUrl}/api/devoluciones`),
                axios.get(`${apiBaseUrl}/api/formatos-impresion`),
                axios.get(`${apiBaseUrl}/api/articulos`)
            ]);

            setCajas(resCajas.data.filter(c => c.condicion));
            setCatalogoArticulos(resArticulos.data);

            // FILTRO ESTricto para DEVOLUCIONES
            const seriesDev = resSeries.data.filter(s => s.tipo === 'Devolución' && s.condicion);
            setSeries(seriesDev);

            // Filtrar solo facturas que estén "Emitidas" (no se puede devolver algo ya anulado)
            setFacturasEmitidas(resFacturas.data.filter(f => f.estado === 'Emitida'));
            setDevoluciones(resDevoluciones.data);

            const formatosActivos = resFormatos.data.filter(f => f.estado && f.tipo_documento === 'Devolución');
            setFormatosImpresion(formatosActivos);
            const defaultFormato = formatosActivos.find(f => f.predeterminado);
            if (defaultFormato) setFormatoSeleccionado(defaultFormato._id);
            else if (formatosActivos.length > 0) setFormatoSeleccionado(formatosActivos[0]._id);

            if (resCajas.data.length > 0) handleFormDataChange('caja', resCajas.data[0]._id);
            if (seriesDev.length > 0) handleSerieChange(seriesDev[0]);

        } catch (error) {
            console.error("Error cargando maestros:", error);
            showToast("Error cargando catálogos del sistema", "error");
        } finally {
            setLoadingData(false);
        }
    };

    // ======= MANEJO DEL FORMULARIO =======
    const handleFormDataChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleSerieChange = async (serieObj) => {
        if (!serieObj) return;
        handleFormDataChange('serieId', serieObj._id);
        handleFormDataChange('serieLiteral', serieObj.serie);
        try {
            const res = await axios.get(`${apiBaseUrl}/api/devoluciones/siguiente_correlativo/${serieObj._id}`);
            handleFormDataChange('numero', res.data.siguiente_numero);
        } catch (err) {
            console.error(err);
        }
    };

    const buscarFactura = () => {
        if (!searchFacturaSerie || !searchFacturaNumero) {
            showToast("Ingrese serie y número de la factura", "error");
            return;
        }

        const facturaEncontrada = facturasEmitidas.find(f =>
            f.serie.toUpperCase() === searchFacturaSerie.toUpperCase() &&
            f.numero === searchFacturaNumero.padStart(6, '0') // Asumiendo que se guardan con padding
        );

        if (facturaEncontrada) {
            setFacturaSeleccionada(facturaEncontrada);
            showToast("Factura encontrada. Verifique los datos antes de proceder.", "success");
        } else {
            setFacturaSeleccionada(null);
            showToast("Factura no encontrada o ya ha sido anulada/devuelta.", "error");
        }
    };


    const formatMoney = formatCurrency;

    // ======= ACCIONES CRUD =======
    const handleProcesarDevolucion = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!formData.caja || !facturaSeleccionada) {
            showToast("Complete los datos requeridos y busque una factura", "error");
            return;
        }

        if (!window.confirm(`¿Seguro que desea procesar la devolución de la Factura ${facturaSeleccionada.serie}-${facturaSeleccionada.numero}? Esta acción anulará la factura y restaurará el stock.`)) {
            return;
        }

        const payload = {
            facturaOrigenId: facturaSeleccionada._id,
            caja: formData.caja,
            serie: formData.serieLiteral || facturaSeleccionada.serie,
            numero: formData.numero || facturaSeleccionada.numero,
            fecha: formData.fecha || new Date().toISOString(),
            observaciones: formData.observaciones || "Devolución procesada automáticamente"
        };

        try {
            const res = await axios.post(`${apiBaseUrl}/api/devoluciones`, payload);
            
            showToast("Devolución procesada y factura anulada con éxito.", "success");

            const devGuardada = JSON.parse(JSON.stringify(res.data.devolucion));
            devGuardada.facturaOrigen = facturaSeleccionada;
            devGuardada.caja = cajas.find(c => c._id === formData.caja);

            if (puedeElegirFormato) {
                setDevParaImprimir(devGuardada);
                setShowModalFormato(true);
            } else {
                generarPDF(devGuardada);
            }

            // Reset
            setFacturaSeleccionada(null);
            setSearchFacturaSerie('');
            setSearchFacturaNumero('');
            setFormData(initialStateForm);
            await cargarDatosMaestros();
            setViewMode('list');

        } catch (error) {
            console.error("Error al procesar devolución:", error);
            showToast(error.response?.data?.error || "Error al procesar la devolución", "error");
        }
    };

    const handleVerPDFExistente = (devObj) => {
        const devEnriquecida = JSON.parse(JSON.stringify(devObj));
        
        if (devEnriquecida.facturaOrigen && devEnriquecida.facturaOrigen.detalles) {
            // ...
        }

        if (puedeElegirFormato) {
            setDevParaImprimir(devEnriquecida);
            setShowModalFormato(true);
        } else {
            generarPDF(devEnriquecida);
        }
    };

    // ======= MOTOR PDF =======
    const generarPDF = async (dataDevolucion, formatoIdOverride = null) => {
        try {
            const formatoId = formatoIdOverride || formatoSeleccionado;
            const formatoObj = formatosImpresion.find(f => f._id === formatoId);
            
            if (formatoObj?.tamano === 'Rollo POS') {
                return await generarTicketPOS(dataDevolucion, formatoObj);
            }

            // De lo contrario, usamos el formato Carta refinado
            return generarPDFCarta(dataDevolucion, formatoObj);
        } catch (error) {
            console.error("Error en despachador PDF:", error);
            showToast("Error al procesar el formato de impresión", "error");
        }
    };

    const generarPDFCarta = async (dataDevolucion, formatoObj) => {
        try {
            console.log("Generando PDF Carta (Devolución) Refinado...", dataDevolucion);
            const doc = new jsPDF('p', 'pt', 'letter');
            const pageW = doc.internal.pageSize.getWidth();
            const margen = 35;
            let y = margen;

            // Datos empresa y documento
            const empNombre = empresa?.nombre || 'MI EMPRESA';
            const empLogoUrl = empresa?.logoUrl || null;
            const tipoCambio = empresa?.valorDolar || 1;
            const facturaObj = dataDevolucion.facturaOrigen || {};
            const clienteObj = facturaObj.cliente || {};

            // 1. LOGO Y DATOS EMPRESA
            const logoW = 90, logoH = 55;
            const logoX = margen;
            const headerCenterX = margen + logoW + 15;
            const headerMaxW = pageW - headerCenterX - margen;

            if (empLogoUrl) {
                try {
                    const logoFullUrl = empLogoUrl.startsWith('http') ? empLogoUrl : `${apiBaseUrl}/${empLogoUrl}`;
                    const response = await fetch(logoFullUrl);
                    if (response.ok) {
                        const blob = await response.blob();
                        const base64Logo = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });
                        doc.addImage(base64Logo, 'JPEG', logoX, y, logoW, logoH);
                    }
                } catch (e) {
                    console.warn("Logo no disponible");
                }
            }

            doc.setFontSize(13).setFont('helvetica', 'bold').setTextColor(0, 0, 0);
            doc.text(empNombre.toUpperCase(), headerCenterX, y + 12);
            doc.setFontSize(8).setFont('helvetica', 'normal');
            const infoLineas = [
                empresa?.ruc ? `RUC: ${empresa.ruc} - Dirección: ${empresa.direccion || ''}` : `Dirección: ${empresa.direccion || ''}`,
                `Tel: ${empresa?.telefono || ''} / Cel: ${empresa?.celular || ''}`,
                `Email: ${empresa?.correo || ''}`
            ];
            infoLineas.forEach((line, i) => doc.text(line, headerCenterX, y + 24 + (i * 11), { maxWidth: headerMaxW }));

            // 2. TÍTULO SEPARADO
            y = 100;
            doc.setDrawColor(0, 0, 0).setLineWidth(1);
            doc.line(margen, y, pageW - margen, y);

            y += 15;
            doc.setFontSize(14).setFont('helvetica', 'bold').setTextColor(0, 0, 0);
            doc.text('COMPROBANTE DE DEVOLUCIÓN', pageW / 2, y + 10, { align: 'center' });
            
            y += 20;
            doc.line(margen, y, pageW - margen, y);
            y += 10;

            // 3. CAJAS DE DATOS (CLIENTE Y NÚMERO)
            const numBoxX = pageW - margen - 145;
            const numBoxY = y;
            const numBoxW = 145;
            const numBoxH = 50;
            doc.setLineWidth(0.8);
            doc.roundedRect(numBoxX, numBoxY, numBoxW, numBoxH, 3, 3);
            doc.setFontSize(11).setFont('helvetica', 'bold').setTextColor(150, 0, 0);
            doc.text(`DEV N° ${dataDevolucion.serie || 'DEV'}-${dataDevolucion.numero || '000'}`, numBoxX + numBoxW / 2, numBoxY + 14, { align: 'center' });
            doc.setTextColor(0, 0, 0).line(numBoxX, numBoxY + 18, numBoxX + numBoxW, numBoxY + 18);

            doc.setFontSize(7.5).setFont('helvetica', 'bold');
            const colW3 = numBoxW / 3;
            doc.text('DIA', numBoxX + colW3 * 0.5, numBoxY + 28, { align: 'center' });
            doc.text('MES', numBoxX + colW3 * 1.5, numBoxY + 28, { align: 'center' });
            doc.text('AÑO', numBoxX + colW3 * 2.5, numBoxY + 28, { align: 'center' });
            doc.line(numBoxX, numBoxY + 32, numBoxX + numBoxW, numBoxY + 32);
            const fechaReal = new Date(dataDevolucion.fecha || Date.now());
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
            doc.text(String(clienteObj.nombre || 'Consumidor Final'), clienteBoxX + 45, numBoxY + 14);
            doc.setFont('helvetica', 'normal');
            doc.text(`Factura Origen :`, clienteBoxX + 5, numBoxY + 28);
            doc.setFont('helvetica', 'bold');
            doc.text(`${facturaObj.serie || 'F'}-${facturaObj.numero || '000'}`, clienteBoxX + 65, numBoxY + 28);
            doc.setFont('helvetica', 'normal');
            doc.text(`Motivo :`, clienteBoxX + 5, numBoxY + 42);
            doc.text(String(dataDevolucion.motivo || 'No especificado'), clienteBoxX + 38, numBoxY + 42);

            y = numBoxY + numBoxH + 10;

            // 4. TABLA DE ARTÍCULOS
            const tableColumn = ['CODIGO', 'DESCRIPCION', 'CANTIDAD', 'P.U.', 'MOTIVO DETALLE', 'TOTAL'];
            
            // Priorizar detalles de la devolución, si no, usar los de la factura origen
            const detallesAFacturar = (dataDevolucion.detalles && dataDevolucion.detalles.length > 0) 
                ? dataDevolucion.detalles 
                : (facturaObj.detalles || []);

            const tableRows = detallesAFacturar.map(item => {
                // HIDRATACIÓN GLOBAL: Buscar en catálogo maestro si no viene poblado
                let articuloData = (typeof item.articulo === 'object' && item.articulo !== null) ? item.articulo : {};
                
                if ((typeof item.articulo === 'string' || !articuloData.codigo) && catalogoArticulos.length > 0) {
                    const artId = typeof item.articulo === 'string' ? item.articulo : item.articulo?._id;
                    const found = catalogoArticulos.find(a => a._id === artId);
                    if (found) articuloData = found;
                }

                // Si aún falla, intentamos en los detalles de la factura original
                if (!articuloData.codigo) {
                    const artId = typeof item.articulo === 'string' ? item.articulo : item.articulo?._id;
                    const match = facturaObj.detalles?.find(d => 
                        (typeof d.articulo === 'string' ? d.articulo : d.articulo?._id) === artId
                    );
                    if (match) {
                        articuloData = (typeof match.articulo === 'object' && match.articulo !== null) ? match.articulo : match;
                    }
                }

                return [
                    String(articuloData.codigo || item.codigo || (typeof item.articulo === 'string' ? item.articulo.substring(0, 8) : 'S/C')),
                    String(articuloData.nombre || item.nombre || 'Articulo Reingresado'),
                    String(item.cantidad || 0),
                    `C$ ${Number(item.precio_venta || 0).toFixed(2)}`,
                    String(item.motivo_detalle || '-'),
                    `C$ ${Number(item.subtotal || 0).toFixed(2)}`
                ];
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: y,
                theme: 'grid',
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 8, fontStyle: 'bold', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.5 },
                bodyStyles: { fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.4, textColor: [50, 0, 0] },
                columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 50, halign: 'center' }, 3: { cellWidth: 70, halign: 'right' }, 4: { cellWidth: 80 }, 5: { cellWidth: 70, halign: 'right' } },
                margin: { left: margen, right: margen }
            });

            y = doc.lastAutoTable.finalY + 15;

            // 5. TOTALES AL PIE
            const totalesH = 75;
            const totalH_necesario = totalesH + 20;

            if (y + totalH_necesario > doc.internal.pageSize.getHeight() - margen) {
                doc.addPage();
                y = margen + 10;
            }
            y = doc.internal.pageSize.getHeight() - margen - totalesH;

            const totalBoxW = 175;
            const totalBoxX = pageW - margen - totalBoxW;
            const adicionalBoxW = totalBoxX - margen - 8;
            const adicionalBoxX = margen;

            const subtotalVal = facturaObj.total_ventas || 0;
            const ivaVal = facturaObj.impuesto_total || 0;
            const totalCORD = facturaObj.total_factura || 0;
            const totalUSD = tipoCambio > 0 ? (totalCORD / tipoCambio) : 0;

            doc.setLineWidth(0.5).setDrawColor(0, 0, 0);
            doc.roundedRect(adicionalBoxX, y, adicionalBoxW, totalesH, 3, 3);
            doc.setFontSize(8.5).setFont('helvetica', 'bold').text('OBSERVACIONES', adicionalBoxX + adicionalBoxW / 2, y + 10, { align: 'center' });
            doc.line(adicionalBoxX, y + 14, adicionalBoxX + adicionalBoxW, y + 14);
            doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(50, 50, 50);
            const obsLines = doc.splitTextToSize('ESTE DOCUMENTO ES SOPORTE DE LA ANULACIÓN O DEVOLUCIÓN PARCIAL DE LA FACTURA INDICADA EN CABECERA.', adicionalBoxW - 12);
            obsLines.forEach((line, i) => doc.text(line, adicionalBoxX + 6, y + 30 + (i * 12)));

            doc.setTextColor(0, 0, 0).roundedRect(totalBoxX, y, totalBoxW, totalesH, 3, 3);
            doc.setFontSize(9).setFont('helvetica', 'bold').text('REF. FACTURA', totalBoxX + totalBoxW / 2, y + 10, { align: 'center' });
            doc.line(totalBoxX, y + 14, totalBoxX + totalBoxW, y + 14);

            doc.setFontSize(8).setFont('helvetica', 'normal');
            const valX = totalBoxX + totalBoxW - 6;
            doc.text('SUBTOTAL', totalBoxX + 6, y + 26);
            doc.text(`C$ ${Number(subtotalVal).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`, valX, y + 26, { align: 'right' });
            doc.text('IVA', totalBoxX + 6, y + 38);
            doc.text(`C$ ${Number(ivaVal).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`, valX, y + 38, { align: 'right' });
            doc.line(totalBoxX + 4, y + 42, totalBoxX + totalBoxW - 4, y + 42);
            doc.setFont('helvetica', 'bold').text('TOTAL FACTURA', totalBoxX + 6, y + 53);
            doc.text(`C$ ${Number(totalCORD).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`, valX, y + 53, { align: 'right' });
            doc.setFontSize(7.5).setFont('helvetica', 'italic').setTextColor(80, 80, 80).text(`(USD @ C$${tipoCambio})`, totalBoxX + 6, y + 64);
            doc.setFont('helvetica', 'bold').setTextColor(100, 0, 0).text(`$ ${Number(totalUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, valX, y + 64, { align: 'right' });

            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(150).text(`Página ${i} de ${totalPages}`, pageW - margen, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
            }

            const pdfOutput = doc.output('bloburl');
            window.open(pdfOutput, '_blank') || doc.save(`Devolucion_${dataDevolucion.numero || '000'}.pdf`);
        } catch (error) {
            console.error("ERROR PDF CARTA DEVOLUCION:", error);
            showToast("Error crítico al generar el PDF Carta.", "error");
        }
    };

    const generarTicketPOS = async (dataDevolucion, formatoObj) => {
        try {
            const facturaObj = dataDevolucion.facturaOrigen || {};
            const numItems = facturaObj.detalles?.length || 0;
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
            const clienteObj = facturaObj.cliente || {};

            // === LOGO (Si existe) ===
            if (empresa?.logoUrl) {
                try {
                    const logoFullUrl = empresa.logoUrl.startsWith('http') ? empresa.logoUrl : `${apiBaseUrl}/${empresa.logoUrl}`;
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
                    console.warn("Error logo ticket devolucion:", e);
                }
            }

            // === HEADER (DINÁMICO) ===
            doc.setFontSize(11).setFont('helvetica', 'bold');
            doc.text((empresa?.nombre || "GED SOLUTION").toUpperCase(), 113, y, alignCenter); y += 12;

            doc.setFontSize(8).setFont('helvetica', 'normal');
            doc.text("NOTA DE DEVOLUCIÓN", 113, y, alignCenter); y += 10;
            
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

            doc.setFontSize(10).setFont('helvetica', 'bold');
            doc.text(`DEV N° ${dataDevolucion.serie}-${dataDevolucion.numero}`, 113, y, alignCenter); y += 12;
            doc.text(`Ref: Factura ${facturaObj.serie}-${facturaObj.numero}`, 113, y, alignCenter); y += 12;
            
            doc.setFontSize(8).setFont('helvetica', 'normal');
            doc.text(`Fecha: ${new Date(dataDevolucion.fecha).toLocaleString()}`, 113, y, alignCenter); y += 10;

            doc.line(mLeft, y, mLeft + width, y); y += 10;

            doc.text(`Cliente: ${clienteObj.nombre || 'Consumidor Final'}`, mLeft, y); y += 10;
            
            doc.line(mLeft, y, mLeft + width, y); y += 12;

            // === DETALLES ===
            doc.setFontSize(7).setFont('helvetica', 'bold');
            doc.text("CANT DESCRIPCION", mLeft, y); 
            doc.text("SUBTOTAL", mLeft + width, y, { align: 'right' }); 
            y += 8;
            doc.line(mLeft, y, mLeft + width, y); y += 10;

            doc.setFont('helvetica', 'normal');
            const detallesAFacturar = (dataDevolucion.detalles && dataDevolucion.detalles.length > 0) 
                ? dataDevolucion.detalles 
                : (facturaObj.detalles || []);

            detallesAFacturar.forEach(item => {
                const cantStr = `${item.cantidad}x `;
                let articuloData = (typeof item.articulo === 'object' && item.articulo !== null) ? item.articulo : {};
                
                if ((typeof item.articulo === 'string' || !articuloData.nombre) && catalogoArticulos.length > 0) {
                    const artId = typeof item.articulo === 'string' ? item.articulo : item.articulo?._id;
                    const found = catalogoArticulos.find(a => a._id === artId);
                    if (found) articuloData = found;
                }

                if (!articuloData.nombre) {
                    const artId = typeof item.articulo === 'string' ? item.articulo : item.articulo?._id;
                    const match = facturaObj.detalles?.find(d => 
                        (typeof d.articulo === 'string' ? d.articulo : d.articulo?._id) === artId
                    );
                    if (match) {
                        articuloData = (typeof match.articulo === 'object' && match.articulo !== null) ? match.articulo : match;
                    }
                }
                
                let desc = articuloData.nombre || item.nombre || "Articulo";
                const descLines = doc.splitTextToSize(desc, 130);
                
                doc.text(`${cantStr}${descLines[0]}`, mLeft, y);
                doc.text(Number(item.subtotal || 0).toFixed(2), mLeft + width, y, { align: 'right' });
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
            doc.text(formatCurrency(facturaObj.total_ventas || 0), mLeft + width, y, { align: 'right' }); y += 12;
            
            const iPorcentaje = facturaObj.impuesto_total > 0 ? 15 : 0;
            doc.text(`IVA (${iPorcentaje}%):`, mLeft + 60, y); 
            doc.text(formatCurrency(facturaObj.impuesto_total || 0), mLeft + width, y, { align: 'right' }); y += 12;
            
            doc.setFontSize(11);
            doc.text("TOTAL C$:", mLeft + 50, y); 
            doc.text(formatCurrency(facturaObj.total_factura || 0), mLeft + width, y, { align: 'right' }); y += 15;

            // --- Conversión a Dólar ---
            const totalUSD = tipoCambio > 0 ? ((facturaObj.total_factura || 0) / tipoCambio) : 0;
            doc.setFontSize(10).setFont('helvetica', 'bold').setDrawColor(0).setTextColor(100, 0, 0); 
            doc.text("TOTAL USD:", mLeft + 50, y);
            doc.text(`$ ${Number(totalUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, mLeft + width, y, { align: 'right' });
            y += 10;
            doc.setFontSize(7).setFont('helvetica', 'italic').setTextColor(100);
            doc.text(`Cambio: 1 USD = C$ ${tipoCambio.toFixed(2)}`, 113, y, alignCenter);
            y += 15;

            // === FOOTER ===
            doc.setTextColor(0);
            doc.setFontSize(7).setFont('helvetica', 'normal');
            const txtPie = "ESTE DOCUMENTO ES SOPORTE DE DEVOLUCIÓN.";
            const msgLines = doc.splitTextToSize(txtPie, width);
            doc.text(msgLines, 113, y, alignCenter); 
            y += (msgLines.length * 10) + 10;
            
            doc.text("-", 113, y, alignCenter);

            window.open(doc.output('bloburl'), '_blank');
        } catch (error) {
            console.error("Error en generarTicketPOS Devolucion:", error);
        }
    };

    // ======= RENDERIZADO =======
    if (loadingData) {
        return <div className="p-8 text-center text-slate-500">Cargando devoluciones...</div>;
    }

    const devolucionesFiltradasLista = devoluciones.filter(d =>
        d.numero.includes(searchTerm) ||
        (d.facturaOrigen && d.facturaOrigen.cliente && d.facturaOrigen.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 w-full max-w-7xl mx-auto">

            {/* ====== VISTA: LISTA DE DEVOLUCIONES ====== */}
            {viewMode === 'list' && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                                <RefreshCcw className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Devoluciones</h1>
                                <p className="text-slate-500 dark:text-slate-400">Restauración de inventario y anulación de facturas.</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="text" placeholder="Buscar correlativo..."
                                    className="pl-10 pr-4 py-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500"
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (series.length > 0) handleSerieChange(series[0]);
                                    setViewMode('form');
                                }}
                                className="flex items-center justify-center px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all text-sm w-full sm:w-auto"
                            >
                                <Plus size={18} className="mr-2" /> Nueva Devolución
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Comp. Devolución</th>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Factura Anulada</th>
                                        <th className="px-6 py-4">Cliente</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {devolucionesFiltradasLista.length === 0 ? (
                                        <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No hay devoluciones registradas.</td></tr>
                                    ) : (
                                        devolucionesFiltradasLista.map(d => (
                                            <tr key={d._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-rose-600 dark:text-rose-400">{d.serie}-{d.numero}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    {new Date(d.fecha).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">
                                                    {d.facturaOrigen ? `${d.facturaOrigen.serie}-${d.facturaOrigen.numero}` : 'Desc.'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                                                    {d.facturaOrigen && d.facturaOrigen.cliente ? d.facturaOrigen.cliente.nombre : 'Consumidor Final'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleVerPDFExistente(d)}
                                                        className="p-1.5 text-slate-500 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded"
                                                        title="Reimprimir Comprobante"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
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

            {/* ====== VISTA: FORMULARIO DE DEVOLUCIÓN ====== */}
            {viewMode === 'form' && (
                <div className="animate-in fade-in duration-300 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setViewMode('list')}
                                className="p-2 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition-all"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
                                    Generar Devolución
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Esto anulará la factura original y devolverá el inventario a la bodega elegida.</p>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            {puedeElegirFormato && (
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Formato de Impresión</label>
                                    <select 
                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500 shadow-sm transition-all"
                                        value={formatoSeleccionado}
                                        onChange={(e) => setFormatoSeleccionado(e.target.value)}
                                    >
                                        {formatosImpresion.length > 0 ? (
                                            formatosImpresion.map(f => (
                                                <option key={f._id} value={f._id}>📄 {f.nombre} ({f.tamano})</option>
                                            ))
                                        ) : (
                                            <option value="">Sin formatos de Devolución</option>
                                        )}
                                    </select>
                                </div>
                            )}
                            <button
                                onClick={handleProcesarDevolucion}
                                className={`flex items-center px-6 py-2 ${facturaSeleccionada ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20 shadow-lg cursor-pointer' : 'bg-slate-300 text-slate-500 cursor-not-allowed'} text-white rounded-xl font-bold active:scale-95 transition-all text-sm`}
                                disabled={!facturaSeleccionada}
                            >
                                <Save size={16} className="mr-2" /> Guardar y Generar PDF
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col xl:flex-row gap-6">

                        {/* COLUMNA IZQUIERDA: CONTROLES DE DEVOLUCIÓN */}
                        <div className="w-full xl:w-1/3 flex flex-col gap-6">

                            {/* CAJA DE BÚSQUEDA */}
                            <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/30 shadow-sm space-y-4">
                                <h2 className="font-bold text-rose-800 dark:text-rose-300 flex items-center mb-4 text-sm">
                                    <Search size={16} className="mr-2" /> Buscar Factura a Devolver
                                </h2>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-rose-700/70 mb-1">Serie (Ej: F001)</label>
                                        <input
                                            type="text" placeholder="F001"
                                            className="w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2 text-sm outline-none uppercase font-mono"
                                            value={searchFacturaSerie} onChange={e => setSearchFacturaSerie(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-rose-700/70 mb-1">Número</label>
                                        <input
                                            type="text" placeholder="000123"
                                            className="w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2 text-sm outline-none font-mono"
                                            value={searchFacturaNumero} onChange={e => setSearchFacturaNumero(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') buscarFactura();
                                            }}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={buscarFactura}
                                    className="w-full py-2 bg-rose-600 text-white rounded-lg font-bold text-sm hover:bg-rose-500 transition-colors"
                                >
                                    Rastrear Factura Original
                                </button>
                            </div>

                            {/* DATOS DE DEVOLUCION */}
                            <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center mb-4 text-sm">
                                    <FileDown size={16} className="mr-2 text-rose-500" /> Comprobante Devolución
                                </h2>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Caja Receptora (*)</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                                        value={formData.caja} onChange={e => handleFormDataChange('caja', e.target.value)}
                                    >
                                        <option value="" disabled>Seleccione caja de retorno</option>
                                        {cajas.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Serie Dev</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-mono outline-none"
                                            value={formData.serieId} onChange={e => {
                                                const s = series.find(x => x._id === e.target.value);
                                                if (s) handleSerieChange(s);
                                            }}
                                        >
                                            <option value="" disabled>Serie...</option>
                                            {series.map(s => <option key={s._id} value={s._id}>{s.serie}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Correlativo</label>
                                        <input
                                            type="text" readOnly value={formData.numero}
                                            className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-500 font-mono font-bold text-center"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Fecha de Devolución (*)</label>
                                        <input
                                            type="date"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                                            value={formData.fecha} onChange={e => handleFormDataChange('fecha', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Motivo / Observaciones</label>
                                    <textarea
                                        rows="3"
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-slate-400 outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                                        value={formData.observaciones} onChange={e => handleFormDataChange('observaciones', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: LECTURA DE LA FACTURA */}
                        <div className="w-full xl:w-2/3 flex flex-col gap-6">
                            <div className={`bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px] transition-all duration-500 ${!facturaSeleccionada ? 'opacity-50 pointer-events-none grayscale' : ''}`}>

                                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center">
                                        <Box className="mr-2 text-slate-400" size={16} />
                                        Contenido a Restaurar de Factura Original {facturaSeleccionada ? `(${facturaSeleccionada.serie}-${facturaSeleccionada.numero})` : ''}
                                    </h3>
                                    {facturaSeleccionada && (
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center">
                                            <CheckCircle size={14} className="mr-1" /> Lista para revertir
                                        </span>
                                    )}
                                </div>

                                {/* CABECERA FACTURA ORIGINAL */}
                                {facturaSeleccionada && (
                                    <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Cliente Original</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white truncate" title={facturaSeleccionada.cliente?.nombre}>{facturaSeleccionada.cliente?.nombre || 'Consumidor Final'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Caja de Salida</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">{facturaSeleccionada.caja?.nombre || 'Desconocida'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Fecha Emisión</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">{new Date(facturaSeleccionada.fecha).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Gran Total</p>
                                            <p className="text-sm font-bold text-rose-600 font-mono">{formatMoney(facturaSeleccionada.total_factura)}</p>
                                        </div>
                                    </div>
                                )}

                                {/* DETALLE SOLO LECTURA */}
                                <div className="overflow-x-auto flex-grow bg-slate-50/30 dark:bg-slate-900/40">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 min-w-[150px]">Artículo / Referencia</th>
                                                <th className="px-4 py-3 text-center w-24">Cant Devuelta</th>
                                                <th className="px-4 py-3 text-right w-28">P.U. Original</th>
                                                <th className="px-4 py-3 text-right w-24">Descuento</th>
                                                <th className="px-4 py-3 text-right w-32">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {!facturaSeleccionada ? (
                                                <tr><td colSpan="5" className="px-6 py-16 text-center text-slate-400 text-sm">
                                                    Busque una factura a la izquierda para cargar los datos de reversión.
                                                </td></tr>
                                            ) : (
                                                facturaSeleccionada.detalles.map((item, idx) => {
                                                    // Intentar obtener el objeto artículo
                                                    let articuloObj = (typeof item.articulo === 'object' && item.articulo !== null) ? item.articulo : null;
                                                    
                                                    // HIDRATACIÓN: Si no hay objeto artículo, buscarlo en el catálogo maestro por su ID
                                                    if (!articuloObj && catalogoArticulos.length > 0) {
                                                        const artId = typeof item.articulo === 'string' ? item.articulo : item.articulo?._id;
                                                        articuloObj = catalogoArticulos.find(a => a._id === artId) || null;
                                                    }
                                                    
                                                    // Para la UI, privilegiamos los datos del objeto artículo (ya sea poblado o hidratado)
                                                    const codigoArt = articuloObj?.codigo || item.codigo || item.articulo;
                                                    const nombreArt = articuloObj?.nombre || item.nombre || "Artículo de Factura";

                                                    return (
                                                        <tr key={idx} className="border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-transparent">
                                                            <td className="px-6 py-3">
                                                                <p className="text-[10px] text-slate-500 font-mono">
                                                                    {String(codigoArt).length > 20 ? String(codigoArt).substring(0, 8) + '...' : String(codigoArt)}
                                                                </p>
                                                                <p className="text-xs text-slate-800 dark:text-slate-300">{nombreArt}</p>
                                                            </td>
                                                            <td className="px-6 py-3 text-center">
                                                                <span className="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded">
                                                                    {item.cantidad}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-right text-sm font-mono text-slate-500">
                                                                {formatMoney(item.precio_venta)}
                                                            </td>
                                                            <td className="px-6 py-3 text-right text-sm font-mono text-slate-500">
                                                                {formatMoney(item.descuento || 0)}
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white font-mono text-sm">
                                                                {formatMoney(item.subtotal)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notificaciones */}
            {toastMessage && (
                <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-xl font-medium text-white animate-in slide-in-from-bottom-5 ${toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                    {toastMessage.text}
                </div>
            )}

            {/* Modal de Selección de Formato */}
            {showModalFormato && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden transform animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Printer className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Seleccionar Formato de Impresión</h3>
                                <p className="text-xs text-slate-500">Elige el formato con el que deseas imprimir este comprobante.</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Formato Disponible</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                    value={formatoSeleccionado}
                                    onChange={(e) => setFormatoSeleccionado(e.target.value)}
                                >
                                    {formatosImpresion.map(f => (
                                        <option key={f._id} value={f._id}>
                                            {f.nombre} ({f.tamano})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={() => { setShowModalFormato(false); setDevParaImprimir(null); }}
                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={async () => {
                                        if (devParaImprimir) {
                                            await generarPDF(devParaImprimir, formatoSeleccionado);
                                            setShowModalFormato(false);
                                            setDevParaImprimir(null);
                                        }
                                    } }
                                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Imprimir</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Devoluciones;
