const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
app.use(cors({
  origin: 'http://localhost:8100', // Cambia según el dominio de tu frontend
  credentials: true, // Permitir envío de cookies
}));
app.use(express.json());
app.use(bodyParser.json());

app.use(session({
  secret: 'my_secret_key', // Cambia a una clave segura para producción
  resave: false, // No guardar sesiones si no hay cambios
  saveUninitialized: false, // No guardar sesiones vacías
  cookie: {
      secure: false, // Cambia a true si usas HTTPS en producción
      httpOnly: true, // Solo accesible desde el servidor
      maxAge: 60 * 60 * 1000, // 1 hora de duración
  },
}));

// Configuración de conexión a la base de datos
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "supermarket",
});

// Verificar conexión
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the MySQL database");
});

// Endpoint para obtener categorías
app.get("/categories", (req, res) => {
  const query = "SELECT * FROM categoria";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.json(results);
  });
});

app.get("/proveedores", (req, res) => {
  const query = "SELECT * FROM persona WHERE tipo_persona = 'Proveedor'";
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post("/proveedores", (req, res) => {
  const { nombre, tipo_documento, num_documento, direccion, telefono, email } = req.body;

  const query = `
    INSERT INTO persona (tipo_persona, nombre, tipo_documento, num_documento, direccion, telefono, email)
    VALUES ('Proveedor', ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [nombre, tipo_documento, num_documento, direccion, telefono, email], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ id: result.insertId, message: "Proveedor registrado con éxito" });
  });
});

app.post('/addarticulos', (req, res) => {
  const { nombre, idcategoria, codigo, precio_venta, stock, descripcion } = req.body;

  const query = `
    INSERT INTO articulo (idcategoria, codigo, nombre, precio_venta, stock, descripcion, estado)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `;

  db.query(query, [idcategoria, codigo, nombre, precio_venta, stock, descripcion], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ id: result.insertId, message: 'Producto agregado correctamente' });
  });
});


// Endpoint para obtener productos de una categoría
app.get("/products/:categoryId", (req, res) => {
  const { categoryId } = req.params;
  const query = "SELECT * FROM articulo WHERE idcategoria = ?";
  db.query(query, [categoryId], (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.json(results);
  });
});


app.get("/articulos", (req, res) => {
  db.query("SELECT * FROM articulo WHERE estado = 1", (err, results) => {
    if (err) res.status(500).send(err);
    else res.json(results);
  });
});

app.post("/ingresos", (req, res) => {
  const {
    idproveedor,
    idusuario,
    tipo_comprobante,
    serie_comprobante,
    num_comprobante,
    fecha,
    impuesto,
    total,
    detalles, // Lista de productos con idarticulo, cantidad, precio_unitario
  } = req.body;

  // Validaciones iniciales
  if (!idproveedor || !idusuario || !tipo_comprobante || !num_comprobante || !fecha || !detalles || detalles.length === 0) {
    console.error("Error: Datos incompletos en la solicitud");
    return res.status(400).json({ message: "Faltan datos requeridos para registrar el ingreso." });
  }

  console.log("Datos recibidos para ingreso:", {
    idproveedor,
    idusuario,
    tipo_comprobante,
    serie_comprobante,
    num_comprobante,
    fecha,
    impuesto,
    total,
    detalles,
  });

  const ingresoQuery = `
    INSERT INTO ingreso (idproveedor, idusuario, tipo_comprobante, serie_comprobante, num_comprobante, fecha, impuesto, total, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Activo')
  `;

  db.query(
    ingresoQuery,
    [idproveedor, idusuario, tipo_comprobante, serie_comprobante, num_comprobante, fecha, impuesto, total],
    (err, result) => {
      if (err) {
        console.error("Error al insertar en ingreso:", err);
        return res.status(500).send(err);
      }

      const ingresoId = result.insertId; // Obtener el ID del ingreso recién creado
      console.log("Ingreso registrado con ID:", ingresoId);

      const detalleQuery = `
        INSERT INTO detalle_ingreso (idingreso, idarticulo, cantidad, precio)
        VALUES ?
      `;

      // Preparar los valores para insertar en detalle_ingreso
      const detalleValues = detalles.map((detalle) => {
        const precioTotal = parseFloat(detalle.precio_unitario) * parseInt(detalle.cantidad);
        console.log(`Procesando detalle: Artículo ${detalle.idarticulo}, Cantidad ${detalle.cantidad}, Precio total ${precioTotal}`);
        return [
          ingresoId,
          detalle.idarticulo,
          detalle.cantidad,
          precioTotal, // Calcular el precio total
        ];
      });

      db.query(detalleQuery, [detalleValues], (err) => {
        if (err) {
          console.error("Error al insertar en detalle_ingreso:", err);
          return res.status(500).send(err);
        }

        console.log("Detalles registrados exitosamente:", detalleValues);

        // Actualizar el stock de los artículos
        const updateStockPromises = detalles.map((detalle) => {
          const updateStockQuery = `
            UPDATE articulo
            SET stock = stock + ?
            WHERE idarticulo = ?
          `;
          return new Promise((resolve, reject) => {
            db.query(updateStockQuery, [detalle.cantidad, detalle.idarticulo], (err) => {
              if (err) {
                console.error(`Error al actualizar el stock del artículo ${detalle.idarticulo}:`, err);
                return reject(err);
              }
              console.log(`Stock actualizado para artículo ${detalle.idarticulo}: +${detalle.cantidad}`);
              resolve();
            });
          });
        });

        // Ejecutar todas las actualizaciones de stock
        Promise.all(updateStockPromises)
          .then(() => {
            res.json({ message: "Ingreso registrado y stock actualizado correctamente" });
          })
          .catch((err) => {
            console.error("Error al actualizar el stock:", err);
            res.status(500).send(err);
          });
      });
    }
  );
});

// Registro de usuario
app.post('/register', async (req, res) => {
  const { nombre, tipo_documento, num_documento, direccion, telefono, email, password } = req.body;

  // Verificar si el correo ya está registrado
  const queryCheckEmail = 'SELECT COUNT(*) AS count FROM usuario WHERE email = ?';
  db.query(queryCheckEmail, [email], async (err, results) => {
      if (err) return res.status(500).send('Error al verificar el correo');
      
      if (results[0].count > 0) {
          return res.status(400).send('El correo ya está registrado');
      }

      // Continuar con el registro si el correo no está registrado
      const hashedPassword = await bcrypt.hash(password, 10);

      // Obtener idrol para 'Cliente'
      const queryRol = 'SELECT idrol FROM rol WHERE nombre = "Cliente"';
      db.query(queryRol, (err, resultRol) => {
          if (err) return res.status(500).send('Error al obtener rol');

          const idrol = resultRol[0].idrol;
          const queryInsert = `
              INSERT INTO usuario (idrol, nombre, tipo_documento, num_documento, direccion, telefono, email, password) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          db.query(queryInsert, [idrol, nombre, tipo_documento, num_documento, direccion, telefono, email, hashedPassword], (err) => {
              if (err) return res.status(500).send('Error al registrar usuario');
              res.send('Usuario registrado correctamente');
          });
      });
  });
});



// Login de usuario
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Consulta para buscar al usuario junto con el nombre del rol
  const query = `
      SELECT u.idusuario, u.nombre, u.email, u.password, u.estado, r.nombre AS rol 
      FROM usuario u
      JOIN rol r ON u.idrol = r.idrol
      WHERE u.email = ?
  `;

  db.query(query, [email], async (err, results) => {
      if (err) return res.status(500).send('Error en el servidor');
      if (results.length === 0) return res.status(401).send('Usuario no encontrado');

      const user = results[0];

      // Verificar si el usuario está activo
      if (user.estado !== 1) return res.status(403).send('Usuario inactivo');

      // Convertir la contraseña de VARBINARY a string
      const hashedPassword = Buffer.from(user.password).toString();

      // Validar la contraseña
      const isMatch = await bcrypt.compare(password, hashedPassword);
      if (!isMatch) return res.status(401).send('Credenciales inválidas');

      // Crear sesión e incluir rol
      req.session.user = {
          idusuario: user.idusuario,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol, // Incluyendo el rol del usuario
      };

      res.send({
          message: 'Login exitoso',
          user: req.session.user,
      });
  });
});



// Verificar sesión
app.get('/session', (req, res) => {
  if (req.session.user) {
      res.send({ user: req.session.user });
  } else {
      res.status(401).send({ message: 'No hay un usuario en sesión' });
  }
});


// Logout
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.send('Sesión cerrada');
});


// ------------------------------------- CARRITO --------------------------
// Asegúrate de que esta ruta está definida
app.put("/products/:productId", (req, res) => {
  const { productId } = req.params;
  const { quantitySold } = req.body;
  const updateQuery = `
    UPDATE articulo
    SET stock = stock - ?
    WHERE idarticulo = ?
  `;
  db.query(updateQuery, [quantitySold, productId], (err, result) => {
    if (err) {
      console.error('Error actualizando stock:', err);
      return res.status(500).send('Error al actualizar stock');
    }
    res.json({ message: 'Stock actualizado correctamente' });
  });
});










// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
