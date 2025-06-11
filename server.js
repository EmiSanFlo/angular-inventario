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
  // Trae todos los productos
  const queryProductos = `
    SELECT Id, Nombre, Precio, StockDisponible, ImagenPrincipal, Artista
    FROM producto
  `;
  db.query(queryProductos, (err, productos) => {
    if (err) return res.status(500).send('Error al obtener productos');
    if (productos.length === 0) return res.json([]);

    // Trae todos los géneros relacionados
    const productoIds = productos.map(p => p.Id);
    const queryGeneros = `
      SELECT pg.ProductoId, g.id, g.nombre
      FROM producto_genero pg
      JOIN genero g ON pg.GeneroId = g.id
      WHERE pg.ProductoId IN (?)
    `;
    db.query(queryGeneros, [productoIds], (err2, generos) => {
      if (err2) return res.status(500).send('Error al obtener géneros');

      // Asocia los géneros a cada producto
      productos.forEach(producto => {
        producto.Generos = generos
          .filter(g => g.ProductoId === producto.Id)
          .map(g => ({ id: g.id, nombre: g.nombre }));
      });

      res.json(productos);
    });
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
    const { Nombre, Precio, StockDisponible, ImagenPrincipal, Artista, generos } = req.body;
    const query = 'INSERT INTO producto (Nombre, Precio, StockDisponible, ImagenPrincipal, Artista) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [Nombre, Precio, StockDisponible, ImagenPrincipal, Artista], (err, result) => {
        if (err) return res.status(500).send('Error al agregar producto');
        const productoId = result.insertId;

        // Si se envían géneros, inserta en la tabla intermedia
        if (Array.isArray(generos) && generos.length > 0) {
            const values = generos.map(generoId => [productoId, generoId]);
            db.query('INSERT INTO producto_genero (ProductoId, GeneroId) VALUES ?', [values], (err2) => {
                if (err2) return res.status(500).send('Error al asignar géneros');
                res.send('Producto agregado con géneros');
            });
        } else {
            res.send('Producto agregado');
        }
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

// ...existing code...

// Endpoint para obtener detalle de producto y sus reseñas
app.get('/productos/:id', (req, res) => {
    const id = Number(req.params.id);

    // Consulta para el producto
    const queryProducto = 'SELECT * FROM producto WHERE Id = ?';
    // Consulta para la descripción
    const queryDescripcion = 'SELECT Descripcion FROM detalleproducto WHERE ProductoId = ?';
    // Consulta para las reseñas
    const queryResenas = `
      SELECT r.Id, r.ProductoId, r.Puntuacion, r.Comentario, r.Fecha, r.UsuarioId, u.NombreUsuario
      FROM resenas r
      JOIN usuarios u ON r.UsuarioId = u.id
      WHERE r.ProductoId = ?
      ORDER BY r.Fecha DESC
    `;
    // Consulta para los géneros
    const queryGeneros = `
      SELECT g.id, g.nombre
      FROM producto_genero pg
      JOIN genero g ON pg.GeneroId = g.id
      WHERE pg.ProductoId = ?
    `;

    db.query(queryProducto, [id], (err, productoResult) => {
        if (err) return res.status(500).send('Error al obtener producto');
        if (productoResult.length === 0) return res.status(404).send('Producto no encontrado');

        db.query(queryDescripcion, [id], (err2, descripcionResult) => {
            if (err2) return res.status(500).send('Error al obtener descripción');

            db.query(queryResenas, [id], (err3, resenasResult) => {
                if (err3) return res.status(500).send('Error al obtener reseñas');

                db.query(queryGeneros, [id], (err4, generosResult) => {
                    if (err4) return res.status(500).send('Error al obtener géneros');

                    // Adjunta los géneros al producto
                    const producto = productoResult[0];
                    producto.Generos = generosResult;

                    res.json({
                        producto: producto,
                        descripcion: descripcionResult[0]?.Descripcion || '',
                        resenas: resenasResult
                    });
                });
            });
        });
    });
});

app.post('/productos/:id/resenas', (req, res) => {
  const productoId = Number(req.params.id);
  const { usuarioId, puntuacion, comentario } = req.body;
  console.log('Datos recibidos:', { productoId, usuarioId, puntuacion, comentario });

  const query = 'INSERT INTO resenas (ProductoId, UsuarioId, Puntuacion, Comentario, Fecha) VALUES (?, ?, ?, ?, NOW())';
  db.query(query, [productoId, usuarioId, puntuacion, comentario], (err, result) => {
    if (err) {
      console.error('Error al guardar reseña:', err);
      return res.status(500).send('Error al guardar reseña');
    }
    res.json({ success: true });
  });
});

app.put('/productos/:id', (req, res) => {
    const id = Number(req.params.id);
    const { Nombre, Precio, StockDisponible, ImagenPrincipal, Artista, generos } = req.body;

    // Obtener stock anterior
    db.query('SELECT StockDisponible FROM producto WHERE Id=?', [id], (err, resultStock) => {
        if (err) return res.status(500).send('Error al obtener stock anterior');
        if (resultStock.length === 0) return res.status(404).send('Producto no encontrado');
        const stockAnterior = resultStock[0].StockDisponible;

        // Actualiza producto
        const query = 'UPDATE producto SET Nombre=?, Precio=?, StockDisponible=?, ImagenPrincipal=?, Artista=? WHERE Id=?';
        db.query(query, [Nombre, Precio, StockDisponible, ImagenPrincipal, Artista, id], (err, result) => {
            if (err) return res.status(500).send('Error al modificar producto');
            if (result.affectedRows === 0) return res.status(404).send('Producto no encontrado');

            // Registrar historial si cambió el stock
            const diferencia = StockDisponible - stockAnterior;
            if (diferencia !== 0) {
                const tipo = diferencia > 0 ? 'entrada' : 'salida';
                db.query(
                  'INSERT INTO historial_inventario (producto_id, tipo_movimiento, cantidad, descripcion) VALUES (?, ?, ?, ?)',
                  [id, tipo, Math.abs(diferencia), 'Modificación de stock'],
                  (errHist) => {
                    if (errHist) console.error('Error al registrar historial:', errHist);
                  }
                );
            }

            // Actualiza géneros si se envían
            if (Array.isArray(generos)) {
                db.query('DELETE FROM producto_genero WHERE ProductoId=?', [id], (err2) => {
                    if (err2) return res.status(500).send('Error al actualizar géneros');
                    if (generos.length === 0) return res.send('Producto modificado y géneros actualizados');
                    const values = generos.map(generoId => [id, generoId]);
                    db.query('INSERT INTO producto_genero (ProductoId, GeneroId) VALUES ?', [values], (err3) => {
                        if (err3) return res.status(500).send('Error al insertar géneros');
                        res.send('Producto modificado y géneros actualizados');
                    });
                });
            } else {
                res.send('Producto modificado');
            }
        });
    });
});

app.get('/productos/:id/generos', (req, res) => {
    const id = Number(req.params.id);
    const query = `
        SELECT g.id, g.nombre
        FROM genero g
        JOIN producto_genero pg ON g.id = pg.GeneroId
        WHERE pg.ProductoId = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).send('Error al obtener géneros');
        res.json(results);
    });
});

app.get('/generos', (req, res) => {
    const query = 'SELECT id, nombre FROM genero';
    db.query(query, (err, results) => {
        if (err) return res.status(500).send('Error al obtener géneros');
        res.json(results);
    });
});

app.post('/productos', (req, res) => {
    const { Nombre, Precio, StockDisponible, ImagenPrincipal, Artista, generos } = req.body;
    const query = 'INSERT INTO producto (Nombre, Precio, StockDisponible, ImagenPrincipal, Artista) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [Nombre, Precio, StockDisponible, ImagenPrincipal, Artista], (err, result) => {
        if (err) return res.status(500).send('Error al agregar producto');
        const productoId = result.insertId;

        // Registrar entrada en historial
        db.query(
          'INSERT INTO historial_inventario (producto_id, tipo_movimiento, cantidad, descripcion) VALUES (?, "entrada", ?, ?)',
          [productoId, StockDisponible, 'Alta de producto'],
          (errHist) => {
            if (errHist) console.error('Error al registrar historial:', errHist);
          }
        );

        // Si se envían géneros, inserta en la tabla intermedia
        if (Array.isArray(generos) && generos.length > 0) {
            const values = generos.map(generoId => [productoId, generoId]);
            db.query('INSERT INTO producto_genero (ProductoId, GeneroId) VALUES ?', [values], (err2) => {
                if (err2) return res.status(500).send('Error al asignar géneros');
                res.send('Producto agregado con géneros');
            });
        } else {
            res.send('Producto agregado');
        }
    });
});

app.get('/historial', (req, res) => {
    db.query(
      `SELECT h.*, p.Nombre AS producto_nombre 
       FROM historial_inventario h 
       JOIN producto p ON h.producto_id = p.id 
       ORDER BY h.fecha DESC`,
      (err, results) => {
        if (err) return res.status(500).send('Error al obtener historial');
        res.json(results);
      }
    );
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});