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

// Crear producto
app.post('/productos', (req, res) => {
    const { Nombre, Precio, StockDisponible, ImagenPrincipal } = req.body;
    const query = 'INSERT INTO producto (Nombre, Precio, StockDisponible, ImagenPrincipal) VALUES (?, ?, ?, ?)';
    db.query(query, [Nombre, Precio, StockDisponible, ImagenPrincipal], (err, result) => {
        if (err) return res.status(500).send('Error al agregar producto');
        res.send('Producto agregado');
    });
});

// Modificar producto
app.delete('/productos/:id', (req, res) => {
    const id = Number(req.params.id); // <-- fuerza a número
    const query = 'DELETE FROM producto WHERE Id=?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).send('Error al eliminar producto');
        if (result.affectedRows === 0) return res.status(404).send('Producto no encontrado');
        res.send('Producto eliminado');
    });
});

app.put('/productos/:id', (req, res) => {
    const id = Number(req.params.id); // <-- fuerza a número
    const { Nombre, Precio, StockDisponible, ImagenPrincipal } = req.body;
    const query = 'UPDATE producto SET Nombre=?, Precio=?, StockDisponible=?, ImagenPrincipal=? WHERE Id=?';
    db.query(query, [Nombre, Precio, StockDisponible, ImagenPrincipal, id], (err, result) => {
        if (err) return res.status(500).send('Error al modificar producto');
        if (result.affectedRows === 0) return res.status(404).send('Producto no encontrado');
        res.send('Producto modificado');
    });
});

const bcrypt = require('bcrypt');

// Registrar usuario (siempre rol 'cliente')
app.post('/usuarios', async (req, res) => {
    const { NombreUsuario, Contrasena, Nombre, Apellido, Email } = req.body;
    if (!NombreUsuario || !Contrasena || !Nombre || !Apellido || !Email) {
        return res.status(400).send('Faltan datos');
    }
    try {
        const hash = await bcrypt.hash(Contrasena, 10);
        const query = `INSERT INTO usuarios (NombreUsuario, Contrasena, Nombre, Apellido, Email, Rol)
                       VALUES (?, ?, ?, ?, ?, 'cliente')`;
        db.query(query, [NombreUsuario, hash, Nombre, Apellido, Email], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).send('El usuario ya existe');
                }
                return res.status(500).send('Error al registrar usuario');
            }
            res.send('Usuario registrado');
        });
    } catch (e) {
        res.status(500).send('Error en el servidor');
    }
});

app.post('/login', (req, res) => {
    const { NombreUsuario, Contrasena } = req.body;
    if (!NombreUsuario || !Contrasena) {
        return res.status(400).send('Faltan datos');
    }
    const query = 'SELECT * FROM usuarios WHERE NombreUsuario = ?';
    db.query(query, [NombreUsuario], async (err, results) => {
        if (err) return res.status(500).send('Error en el servidor');
        if (results.length === 0) return res.status(401).send('Usuario o contraseña incorrectos');
        const usuario = results[0];
        const match = await bcrypt.compare(Contrasena, usuario.Contrasena);
        if (!match) return res.status(401).send('Usuario o contraseña incorrectos');
        // Puedes devolver más datos si quieres
        res.json({ mensaje: 'Login exitoso', usuario: { id: usuario.id, nombre: usuario.Nombre, rol: usuario.Rol } });
    });
});

const nodemailer = require('nodemailer');

nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error('Error creando cuenta de prueba', err);
    return;
  }

  // Configurar transporter con la cuenta de prueba
  const transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure, // true para 465, false para otros puertos
    auth: {
      user: account.user,
      pass: account.pass
    }
  });

  // Exporta o usa este transporter para enviar correos
  // Ejemplo: guardar en variable global
  global.transporter = transporter;
});


app.post('/recuperar-contrasena', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send('Falta el email');

    const queryUsuario = 'SELECT * FROM usuarios WHERE Email = ?';
    db.query(queryUsuario, [email], (err, results) => {
      if (err) {
        console.error('Error DB:', err);
        return res.status(500).send('Error en servidor');
      }
      if (results.length === 0) return res.status(404).send('Usuario no encontrado');

      const usuario = results[0];

      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiracion = new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

      const queryInsert = `INSERT INTO recuperacion_contrasena (usuario_id, codigo, expiracion) VALUES (?, ?, ?)`;
      db.query(queryInsert, [usuario.id, codigo, expiracion], (err2) => {
        if (err2) {
          console.error('Error al guardar código:', err2);
          return res.status(500).send('Error al guardar código');
        }

        const mailOptions = {
    from: 'adminDiscocks@gmail.com',
    to: email,
    subject: 'Código para recuperación de contraseña',
    text: `Tu código es: ${codigo}. Expira en 15 minutos.`
  };

  global.transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar correo:', error);
      return res.status(500).send('Error al enviar correo');
    }

    console.log('URL para ver email (Ethereal): %s', nodemailer.getTestMessageUrl(info));

    res.send('Código enviado (prueba con Ethereal)');
  });
});
    });
  } catch (error) {
    console.error('Error inesperado:', error);
    res.status(500).send('Error interno del servidor');
  }
});


app.post('/verificar-codigo', (req, res) => {
  const { email, codigo, nuevaContrasena } = req.body;
  if (!email || !codigo) return res.status(400).send('Faltan datos');

  const queryUsuario = 'SELECT * FROM usuarios WHERE Email = ?';
  db.query(queryUsuario, [email], (err, results) => {
    if (err) return res.status(500).send('Error en servidor');
    if (results.length === 0) return res.status(404).send('Usuario no encontrado');

    const usuario = results[0];

    const queryCodigo = `
      SELECT * FROM recuperacion_contrasena 
      WHERE usuario_id = ? AND codigo = ? AND usado = FALSE AND expiracion > NOW()
      ORDER BY id DESC LIMIT 1
    `;

    db.query(queryCodigo, [usuario.id, codigo], async (err, resultsCodigo) => {
      if (err) return res.status(500).send('Error en servidor');
      if (resultsCodigo.length === 0) return res.status(400).send('Código inválido o expirado');

      // Código válido, marcarlo como usado
      const idCodigo = resultsCodigo[0].id;
      db.query('UPDATE recuperacion_contrasena SET usado = TRUE WHERE id = ?', [idCodigo], (err) => {
        if (err) console.error('Error al marcar código como usado:', err);
      });

      if (nuevaContrasena) {
        // Cambiar la contraseña
        const hash = await bcrypt.hash(nuevaContrasena, 10);
        db.query('UPDATE usuarios SET Contrasena = ? WHERE id = ?', [hash, usuario.id], (err) => {
          if (err) return res.status(500).send('Error al cambiar contraseña');
          res.send('Contraseña cambiada con éxito');
        });
      } else {
        // Acceso sin contraseña (login temporal)
        res.json({ mensaje: 'Código válido', usuario: { id: usuario.id, nombre: usuario.Nombre, rol: usuario.Rol } });
      }
    });
  });
});

app.post('/productos/actualizar-stock', (req, res) => {
  const ventas = req.body; // Espera un arreglo con { id: number, cantidadVendida: number }

  if (!Array.isArray(ventas)) {
    return res.status(400).send('Formato incorrecto');
  }

  // Por cada producto vendido, disminuir stock
  const queries = ventas.map(({ id, cantidadVendida }) => {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE producto
        SET StockDisponible = StockDisponible - ?
        WHERE Id = ? AND StockDisponible >= ?`;
      db.query(sql, [cantidadVendida, id, cantidadVendida], (err, result) => {
        if (err) return reject(err);
        if (result.affectedRows === 0) {
          return reject(new Error(`No hay suficiente stock para el producto ID ${id}`));
        }
        resolve();
      });
    });
  });

  Promise.all(queries)
    .then(() => res.send('Stock actualizado correctamente'))
    .catch(err => {
      console.error('Error al actualizar stock:', err);
      res.status(500).send(err.message);
    });
});



// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});