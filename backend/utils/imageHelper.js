const sharp = require('sharp');
const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * Comprime una imagen a WebP y la sube a Supabase Storage.
 * @param {Buffer} fileBuffer Buffer de la imagen original.
 * @param {string} bucket Nombre del bucket en Supabase.
 * @param {string} folder Carpeta dentro del bucket (opcional).
 * @returns {Promise<string>} URL pública de la imagen subida.
 */
exports.compressAndUpload = async (fileBuffer, bucket = 'gedsolution', folder = '') => {
    try {
        if (!supabase) {
            throw new Error('El cliente de Supabase no está configurado. Revisa las variables de entorno.');
        }

        // 1. Compresión y conversión a WebP usando Sharp
        const compressedBuffer = await sharp(fileBuffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true }) // Redimensionar si es muy grande
            .webp({ quality: 80 }) // Convertir a WebP con calidad 80%
            .toBuffer();

        // 2. Generar nombre de archivo único
        const fileName = `${folder ? folder + '/' : ''}${uuidv4()}.webp`;

        // 3. Subir a Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, compressedBuffer, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // 4. Obtener URL pública
        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    } catch (error) {
        console.error('Error en compressAndUpload:', error);
        throw new Error('Error al procesar o subir la imagen a la nube.');
    }
};
