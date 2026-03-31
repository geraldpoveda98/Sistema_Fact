const Empresa = require('../models/Empresa');
// fs y path para manejar eliminación de logos viejos si es necesario
const fs = require('fs');
const path = require('path');

// Obtener datos de la empresa (Singleton: Solo habrá 1 documento)
exports.getEmpresa = async (req, res) => {
    try {
        let empresa = await Empresa.findOne();
        if (!empresa) {
            // Si es la primera vez, crear uno por defecto
            empresa = new Empresa();
            await empresa.save();
        }
        res.json(empresa);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor obteniendo datos de empresa.' });
    }
};

// Actualizar datos de la empresa y subir Logo nuevo
exports.updateEmpresa = async (req, res) => {
    try {
        const updateData = req.body;

        let empresa = await Empresa.findOne();
        if (!empresa) {
            empresa = new Empresa();
        }

        // Si se subió un nuevo logo, procesarlo, comprimirlo y subirlo a Supabase Storage
        if (req.file) {
            const imageHelper = require('../utils/imageHelper');
            const publicUrl = await imageHelper.compressAndUpload(req.file.buffer, 'images', 'logos');
            updateData.logoUrl = publicUrl;
        }

        // Se usa findOneAndUpdate o se ajustan los campos de empresa directamente
        empresa.nombre = updateData.nombre || empresa.nombre;
        empresa.ruc = updateData.ruc || empresa.ruc;
        empresa.direccion = updateData.direccion || empresa.direccion;
        empresa.telefono = updateData.telefono || empresa.telefono;
        empresa.celular = updateData.celular || empresa.celular;
        empresa.web = updateData.web || empresa.web;
        empresa.correo = updateData.correo || empresa.correo;
        empresa.logoUrl = updateData.logoUrl || empresa.logoUrl;

        const oldPorcentaje = empresa.porcentajeCosto;
        if (updateData.porcentajeCosto !== undefined) {
            empresa.porcentajeCosto = Number(updateData.porcentajeCosto);
        }
        
        if (updateData.valorDolar !== undefined) {
            empresa.valorDolar = Number(updateData.valorDolar);
        }

        await empresa.save();

        // Si el porcentaje cambió, recalcular precios de artículos en modo Automático
        if (updateData.porcentajeCosto !== undefined && Number(updateData.porcentajeCosto) !== oldPorcentaje) {
            const Articulo = require('../models/Articulo');
            const nuevoPorcentaje = Number(updateData.porcentajeCosto) / 100;
            
            const articulosManuales = await Articulo.find({ tipo_calculo_precio: 'Automatico' });
            
            for (const art of articulosManuales) {
                const costoBase = art.costo_inventario || 0;
                art.precio_venta = costoBase * (1 + nuevoPorcentaje);
                await art.save();
            }
            console.log(`✅ Recalculados ${articulosManuales.length} artículos al nuevo margen del ${updateData.porcentajeCosto}%`);
        }

        res.json({ message: 'Datos de empresa actualizados y precios recalculados con éxito.', empresa });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor actualizando datos de empresa.' });
    }
};
