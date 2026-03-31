/**
 * Genera una URL válida para una imagen, manejando URLs absolutas (Supabase),
 * strings Base64 (data:) y rutas relativas (backend local).
 * 
 * @param {string} path - La ruta o URL de la imagen.
 * @param {string} baseUrl - La URL base del backend (API_BASE_URL).
 * @returns {string|null} - La URL completa y corregida o null si no hay path.
 */
export const getImageUrl = (path, baseUrl) => {
    if (!path) return null;
    
    // Si ya es una URL absoluta o Base64, devolverla tal cual
    if (path.startsWith('http') || path.startsWith('data:')) {
        return path;
    }
    
    // Para rutas relativas, asegurar que no haya problemas con las barras
    const cleanBase = baseUrl?.endsWith('/') ? baseUrl.slice(0, -1) : (baseUrl || '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${cleanBase}${cleanPath}`;
};
