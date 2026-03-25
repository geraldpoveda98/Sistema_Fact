const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Exponer la carpeta de uploads para consumo público de imágenes (logo, etc)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Probar Base de datos
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('✅ Base de datos MongoDB conectada (RPM)'))
  .catch((err) => console.log('❌ Error conectando a MongoDB:', err.message));

// Rutas Base de la API
app.use('/api/usuarios', require('./routes/usuarioRoutes'));
app.use('/api/categorias', require('./routes/categoriaRoutes'));
app.use('/api/modelos', require('./routes/modeloRoutes'));
app.use('/api/articulos', require('./routes/articuloRoutes'));
app.use('/api/empresa', require('./routes/empresaRoutes'));
app.use('/api/impuestos', require('./routes/impuestoRoutes'));
app.use('/api/cajas', require('./routes/cajaRoutes'));
app.use('/api/series', require('./routes/serieRoutes'));
app.use('/api/compras', require('./routes/compraRoutes'));
app.use('/api/proveedores', require('./routes/proveedorRoutes'));
app.use('/api/conteos', require('./routes/conteoRoutes'));
app.use('/api/clientes', require('./routes/clienteRoutes'));
app.use('/api/creditos', require('./routes/creditoRoutes'));
app.use('/api/ventas', require('./routes/ventaRoutes'));
app.use('/api/proformas', require('./routes/proformaRoutes'));
app.use('/api/devoluciones', require('./routes/devolucionRoutes'));
app.use('/api/formatos-impresion', require('./routes/formatoImpresionRoutes'));
app.use('/api/limpiar-datos', require('./routes/limpiarDatosRoutes'));

// Endpoint temporal para alimentar la BD en la nube
app.get('/api/seed', async (req, res) => {
    try {
        const Usuario = require('./models/Usuario');
        // No borramos todo por seguridad, solo verificamos si ya existe el admin
        const adminExists = await Usuario.findOne({ login: 'gpoveda' });
        if (adminExists) {
            return res.send('El usuario administrador ya existe.');
        }

        const nuevoUsuario = new Usuario({
            nombre: 'Gerald Poveda',
            tipo_documento: 'CEDULA',
            num_documento: '001-XXXXXX-XXXXX',
            direccion: 'Masaya',
            telefono: '87865819',
            cargo: 'Administrador',
            login: 'gpoveda',
            clave: 'admin',
            condicion: true,
            permisos: ['Escritorio', 'Almacen', 'Compras', 'Ventas', 'Administración']
        });

        await nuevoUsuario.save();
        res.send('✅ Base de datos alimentada con éxito: Creado usuario "gpoveda" con clave "admin".');
    } catch (error) {
        res.status(500).send('❌ Error al sembrar: ' + error.message);
    }
});

// Ruta Inicial de Verificación
app.get('/', (req, res) => {
  res.send('API de RPM V2 Funcionando correctamente');
});

// Listener con HTTPS
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Exponer a toda la red local

// Forzar el uso de HTTP en desarrollo local (petición de usuario)
app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor backend HTTP corriendo en puerto ${PORT} en la IP ${HOST}`);
});
