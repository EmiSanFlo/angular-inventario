// filepath: server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));


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
        SELECT Id, Nombre, Precio, StockDisponible, ImagenPrincipal
        FROM producto;
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

app.use(express.json()); // Asegúrate de tener esto para parsear JSON

app.post('/productos/importar', (req, res) => {
    const productos = req.body; // Espera un arreglo de productos
    if (!Array.isArray(productos)) {
        return res.status(400).send('Formato incorrecto');
    }

    const query = `
        INSERT INTO producto (Id, Nombre, Precio, StockDisponible, ImagenPrincipal)
        VALUES ?
        ON DUPLICATE KEY UPDATE
            Nombre=VALUES(Nombre),
            Precio=VALUES(Precio),
            StockDisponible=VALUES(StockDisponible),
            ImagenPrincipal=VALUES(ImagenPrincipal)
    `;

    // Prepara los valores (ajusta los nombres según tu modelo)
    const values = productos.map(p => [
        p.id,
        p.nombre,
        p.precio,
        p.cantidad,
        p.imagen // la imagen en base64
    ]);

    db.query(query, [values], (err, result) => {
        if (err) {
            console.error('Error al importar productos:', err);
            return res.status(500).send('Error al importar productos');
        }
        res.send('Productos importados correctamente');
    });
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});