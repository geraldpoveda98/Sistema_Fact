const mongoose = require('mongoose');
const User = require('./models/Usuario');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {})
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    try {
        const users = await User.find({}, 'login nombre rol estado');
        console.log('Usuarios encontrados en la BD:');
        console.table(users.map(u => u.toObject()));
    } catch (error) {
        console.error('Error buscando usuarios:', error);
    } finally {
        mongoose.connection.close();
    }
  })
  .catch((err) => console.log('❌ Error conectando a MongoDB:', err.message));
