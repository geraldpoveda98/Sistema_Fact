const axios = require('axios');

async function testApi() {
    try {
        const res = await axios.get('http://localhost:5000/api/articulos');
        const art = res.data.find(a => a.codigo === '000205321564');
        if (art) {
            console.log('Article found:', {
                nombre: art.nombre,
                costo: art.costo_inventario,
                precio: art.precio_venta,
                tipo: art.tipo_calculo_precio
            });
        } else {
            console.log('Article not found in API response');
        }
    } catch (err) {
        console.error('Error fetching API:', err.message);
    }
}

testApi();
