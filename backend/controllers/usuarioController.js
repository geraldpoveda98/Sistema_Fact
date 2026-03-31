const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

// Login de Usuario
exports.login = async (req, res) => {
    const { login, clave } = req.body;

    try {
        // Buscar usuario por su nombre de usuario (login)
        const usuario = await Usuario.findOne({ login: login, condicion: true });

        // Si no existe o esta desactivado
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
        }

        // Validar contraseña usando bcryptjs
        const isMatch = await usuario.matchClave(clave);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar Token JWT válido por 8 horas
        const token = jwt.sign(
            { id: usuario._id, nombre: usuario.nombre, login: usuario.login },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Enviar respuesta exitosa con el token y datos basicos
        res.json({
            mensaje: 'Autenticación exitosa',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                login: usuario.login,
                email: usuario.email,
                cargo: usuario.cargo,
                permisos: usuario.permisos
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor al intentar iniciar sesión' });
    }
};

// Obtener todos los usuarios (excluyendo claves)
exports.getAll = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-clave').sort({ createdAt: -1 });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
};

// Crear usuario
exports.create = async (req, res) => {
    try {
        const { nombre, tipo_documento, num_documento, direccion, telefono, celular, email, cargo, login, clave } = req.body;

        let permisos = [];
        if (req.body.permisos) {
            try {
                // FrontEnd puede enviar el array stringificado o normal
                permisos = typeof req.body.permisos === 'string' ? JSON.parse(req.body.permisos) : req.body.permisos;
            } catch (e) {
                permisos = req.body.permisos.split(',');
            }
        }

        let fotoUrl = '';
        if (req.file) {
            const imageHelper = require('../utils/imageHelper');
            fotoUrl = await imageHelper.compressAndUpload(req.file.buffer, 'images', 'usuarios');
        }

        // Validar si el login ya existe
        const loginExist = await Usuario.findOne({ login });
        if (loginExist) {
            return res.status(400).json({ error: 'El nombre de usuario (login) ya está en uso' });
        }

        const nuevoUsuario = new Usuario({
            nombre, tipo_documento, num_documento, direccion, telefono, celular, email, cargo, login, clave, permisos, fotoUrl
        });

        await nuevoUsuario.save();
        const usuarioR = nuevoUsuario.toObject();
        delete usuarioR.clave; // No devolver la clave
        res.status(201).json(usuarioR);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el usuario. ' + error.message });
    }
};

// Actualizar usuario
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo_documento, num_documento, direccion, telefono, celular, email, cargo, login, condicion, clave } = req.body;

        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Parsear permisos
        let permisos = usuario.permisos;
        if (req.body.permisos) {
            try {
                permisos = typeof req.body.permisos === 'string' ? JSON.parse(req.body.permisos) : req.body.permisos;
            } catch (e) {
                permisos = req.body.permisos.split(',');
            }
        }

        // Verificar unicidad de login si cambia
        if (login && login !== usuario.login) {
            const loginExist = await Usuario.findOne({ login });
            if (loginExist) {
                return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
            }
            usuario.login = login;
        }

        // Actualizar datos permitiendo strings vacíos si el modelo lo deja, si no omitir
        if (nombre) usuario.nombre = nombre;
        if (tipo_documento) usuario.tipo_documento = tipo_documento;
        if (num_documento) usuario.num_documento = num_documento;

        usuario.direccion = direccion !== undefined ? direccion : usuario.direccion;
        usuario.telefono = telefono !== undefined ? telefono : usuario.telefono;
        usuario.celular = celular !== undefined ? celular : usuario.celular;
        usuario.email = email !== undefined ? email : usuario.email;
        usuario.cargo = cargo !== undefined ? cargo : usuario.cargo;

        if (condicion !== undefined) usuario.condicion = condicion === 'true' || condicion === true;
        usuario.permisos = permisos;

        if (req.file) {
            const imageHelper = require('../utils/imageHelper');
            usuario.fotoUrl = await imageHelper.compressAndUpload(req.file.buffer, 'images', 'usuarios');
        }

        if (req.body.clave && req.body.clave.trim() !== '') {
            usuario.clave = req.body.clave; // El hook de mongoose lo hasheará
        }

        await usuario.save();

        const usuarioR = usuario.toObject();
        delete usuarioR.clave;
        res.json(usuarioR);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el usuario: ' + error.message });
    }
};

// Eliminar usuario
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await Usuario.findByIdAndDelete(id);
        res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
};
