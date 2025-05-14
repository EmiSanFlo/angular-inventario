// filepath: server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'miproyecto'
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos');
});

// Endpoint para obtener productos
app.get('/productos', (req, res) => {
    const query = `
        SELECT p.Id, p.Nombre, p.Precio, p.IVA, p.EnStock, p.StockDisponible, p.ImagenPrincipal, 
               c.Nombre AS Categoria
        FROM producto p
        JOIN categoria c ON p.CategoriaId = c.Id;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            res.status(500).send('Error al obtener productos');
            return;
        }
        res.json(results);
    });
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});