const http = require("http");
const mysql = require("mysql");
const url = require("url");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Configuración de conexión a MySQL
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // Si tienes contraseña, agrégala aquí
  database: "global-web-db",
});

// Conectar a MySQL
connection.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err.stack);
    return;
  }
  console.log("✅ Conectado a la base de datos MySQL");
});

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // Puedes usar otro servicio como 'yahoo', 'outlook', etc.
  auth: {
    user: "snowbeast138@gmail.com", // Tu correo electrónico
    pass: "tlmk pvpv mjdr pqot", // Tu contraseña o una contraseña de aplicación si usas Gmail
  },
});

function generatePDF(cartItems, totalPrice, userEmail) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const dirPath = path.join(__dirname, "compras");

    // Crear la carpeta si no existe
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, `${Date.now()}_compra.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Agregar el logo y datos de la empresa en el encabezado
    const logoPath = path.join(__dirname, "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 40, { width: 100 });
    }

    doc
      .fontSize(20)
      .text("Factura de Compra", 200, 50, { align: "right" })
      .moveDown(1);

    doc
      .fontSize(12)
      .text("Empresa: Prietos y Asociados Ternu", { align: "right" })
      .text("Correo: prietosyasociadosternu@gmail.com", { align: "right" })
      .text("Teléfono: +52 33 2313 1211", { align: "right" })
      .moveDown(2);

    doc.fontSize(14).text(`Cliente: ${userEmail}`, { align: "left" });
    doc.moveDown(1);

    // Dibujar la tabla de productos
    const startX = 50;
    let startY = doc.y + 10;

    doc.fontSize(12).text("Productos Comprados:", startX, startY).moveDown(1);

    startY = doc.y;
    const colWidths = [150, 150, 80, 80, 100]; // Ancho de cada columna
    const rowHeight = 25;

    // Dibujar encabezados de la tabla
    doc
      .font("Helvetica-Bold")
      .text("Producto", startX, startY, { width: colWidths[0], align: "left" })
      .text("Descripción", startX + colWidths[0], startY, {
        width: colWidths[1],
        align: "left",
      })
      .text("Precio", startX + colWidths[0] + colWidths[1], startY, {
        width: colWidths[2],
        align: "right",
      })
      .text(
        "Cantidad",
        startX + colWidths[0] + colWidths[1] + colWidths[2],
        startY,
        {
          width: colWidths[3],
          align: "right",
        }
      )
      .text(
        "Subtotal",
        startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        startY,
        {
          width: colWidths[4],
          align: "right",
        }
      );

    // Dibujar línea separadora
    doc
      .moveTo(startX, startY + rowHeight)
      .lineTo(startX + colWidths.reduce((a, b) => a + b), startY + rowHeight)
      .stroke();

    startY += rowHeight;

    // Dibujar cada fila de producto
    doc.font("Helvetica");
    cartItems.forEach((item) => {
      doc
        .text(item.name, startX, startY, { width: colWidths[0], align: "left" })
        .text(item.description, startX + colWidths[0], startY, {
          width: colWidths[1],
          align: "left",
        })
        .text(
          `$${item.price.toFixed(2)}`,
          startX + colWidths[0] + colWidths[1],
          startY,
          {
            width: colWidths[2],
            align: "right",
          }
        )
        .text(
          `${item.cantidad}`,
          startX + colWidths[0] + colWidths[1] + colWidths[2],
          startY,
          {
            width: colWidths[3],
            align: "right",
          }
        )
        .text(
          `$${(item.price * item.cantidad).toFixed(2)}`,
          startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
          startY,
          { width: colWidths[4], align: "right" }
        );

      startY += rowHeight;
    });

    // Dibujar línea separadora antes del total
    doc
      .moveTo(startX, startY + 10)
      .lineTo(startX + colWidths.reduce((a, b) => a + b), startY + 10)
      .stroke();

    // Agregar total
    startY += 20;
    doc
      .font("Helvetica-Bold")
      .text(
        "Total:",
        startX + colWidths[0] + colWidths[1] + colWidths[2],
        startY,
        {
          width: colWidths[3],
          align: "right",
        }
      )
      .text(
        `$${totalPrice.toFixed(2)}`,
        startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        startY,
        {
          width: colWidths[4],
          align: "right",
        }
      );

    doc.end();

    stream.on("finish", () => {
      console.log("PDF generado correctamente en:", filePath);
      resolve(filePath);
    });

    stream.on("error", (error) => {
      console.error("Error generando el PDF:", error);
      reject(error);
    });
  });
}
// Crear servidor
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Configurar CORS
  // Configuración de CORS
  res.setHeader("Access-Control-Allow-Origin", "*"); // Permitir solicitudes desde cualquier origen
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  ); // Métodos permitidos
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Headers permitidos

  // Manejo de solicitud OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (path === "/finalizarCompra" && req.method === "POST") {
    const userId = parsedUrl.query.userId;
    if (!userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "ID de usuario no proporcionado" }));
      return;
    }

    const emailQuery = "SELECT email FROM users WHERE id = ?";
    connection.query(emailQuery, [userId], async (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error al obtener el correo" }));
        return;
      }

      if (results.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Usuario no encontrado" }));
        return;
      }

      const userEmail = results[0].email;

      const getCartQuery = `
        SELECT c.id, p.name, p.price, c.cantidad, c.id_producto 
        FROM carrito c 
        INNER JOIN productos p ON c.id_producto = p.id 
        WHERE c.id_cliente = ?
      `;

      connection.query(getCartQuery, [userId], async (err, results) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Error al obtener el carrito" }));
          return;
        }

        const cartItems = results.map((item) => {
          return {
            ...item,
            price: parseFloat(item.price),
          };
        });

        const totalPrice = cartItems.reduce(
          (total, item) => total + item.price * item.cantidad,
          0
        );

        // Insertar en la tabla `pedidos`
        const insertPedidoQuery = `
          INSERT INTO pedidos (id_cliente, date) 
          VALUES (?, NOW())
        `;

        connection.query(
          insertPedidoQuery,
          [userId],
          async (err, pedidoResults) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Error al crear el pedido" }));
              return;
            }

            const pedidoId = pedidoResults.insertId;

            // Insertar en la tabla `inventario_pedido`
            const insertInventarioQuery = `
            INSERT INTO inventario_pedido (id_pedido, id_producto, piezas) 
            VALUES (?, ?, ?)
          `;

            let inventarioErrors = [];

            cartItems.forEach((item) => {
              connection.query(
                insertInventarioQuery,
                [pedidoId, item.id_producto, item.cantidad],
                (err) => {
                  if (err) {
                    inventarioErrors.push(
                      `Error al insertar el producto ${item.id_producto} en el inventario`
                    );
                  }
                }
              );
            });

            if (inventarioErrors.length > 0) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: inventarioErrors.join(", ") }));
              return;
            }

            // Insertar en la tabla `notas`
            const insertNotaQuery = `
            INSERT INTO notas (id_pedido, total) 
            VALUES (?, ?)
          `;

            connection.query(
              insertNotaQuery,
              [pedidoId, totalPrice],
              async (err, notaResults) => {
                if (err) {
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ error: "Error al crear la nota" }));
                  return;
                }

                const notaId = notaResults.insertId;

                try {
                  // Generar el PDF
                  console.log("Generando PDF...");
                  const filePath = await generatePDF(
                    cartItems,
                    totalPrice,
                    userEmail
                  );
                  console.log("PDF generado en:", filePath);

                  // Verificar que el archivo existe antes de intentar leerlo
                  if (!fs.existsSync(filePath)) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                      JSON.stringify({
                        error: "El archivo PDF no se generó correctamente",
                      })
                    );
                    return;
                  }

                  // Leer el archivo PDF como un Buffer
                  const pdfBuffer = fs.readFileSync(filePath);

                  // Insertar el PDF en la tabla `files_notas`
                  const insertFileQuery = `
                INSERT INTO files_notas (id_nota, file) 
                VALUES (?, ?)
              `;

                  connection.query(
                    insertFileQuery,
                    [notaId, pdfBuffer],
                    async (err, fileResults) => {
                      if (err) {
                        res.writeHead(500, {
                          "Content-Type": "application/json",
                        });
                        res.end(
                          JSON.stringify({ error: "Error al guardar el PDF" })
                        );
                        return;
                      }

                      // Enviar el correo con el PDF adjunto
                      const mailOptions = {
                        from: "snowbeast138.com",
                        to: userEmail,
                        subject: "Factura de Compra",
                        text: `Gracias por su compra. Aquí está su factura.`,
                        attachments: [
                          {
                            filename: "factura.pdf",
                            path: filePath,
                          },
                        ],
                      };

                      try {
                        const info = await transporter.sendMail(mailOptions);
                        console.log("Email sent:", info.response);

                        // Eliminar el archivo PDF después de enviar el correo
                        fs.unlink(filePath, (err) => {
                          if (err) {
                            console.error(
                              "Error eliminando el archivo PDF:",
                              err
                            );
                          }
                        });

                        res.writeHead(200, {
                          "Content-Type": "application/json",
                        });
                        res.end(
                          JSON.stringify({
                            message: "Factura enviada y guardada exitosamente",
                          })
                        );
                      } catch (error) {
                        console.error("Error enviando el correo:", error);
                        res.writeHead(500, {
                          "Content-Type": "application/json",
                        });
                        res.end(
                          JSON.stringify({
                            error: "Error enviando el correo de la factura",
                          })
                        );
                      }
                    }
                  );
                } catch (error) {
                  console.error("Error generando o leyendo el PDF:", error);
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ error: "Error generando el PDF" }));
                }
              }
            );
          }
        );
      });
    });

    return;
  }
  // Ruta para registro de usuarios
  if (path === "/signup" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { name, email, password } = JSON.parse(body);

        // Verificar si el correo ya está registrado
        const checkEmailQuery = "SELECT * FROM users WHERE email = ?";

        connection.query(checkEmailQuery, [email], (err, results) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Error al verificar el correo" }));
            return;
          }

          if (results.length > 0) {
            // Si el correo ya existe
            res.writeHead(409, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Este correo electrónico ya está registrado",
              })
            );
            return;
          }

          // Generar un token de verificación
          const verificationToken = crypto.randomBytes(20).toString("hex");

          // Insertar el nuevo usuario con el token de verificación
          const insertQuery = `INSERT INTO users (name, email, password, role, verification_token, is_verified) VALUES (?, ?, ?, 'CLIENT', ?, false)`;

          connection.query(
            insertQuery,
            [name, email, password, verificationToken],
            (err, results) => {
              if (err) {
                console.error("Error inserting user:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({ error: "Error al registrar el usuario" })
                );
                return;
              }

              // Enviar correo de verificación
              const mailOptions = {
                from: "snowbeast138.com",
                to: email,
                subject: "Verificación de correo electrónico",
                text: `Por favor, verifica tu correo electrónico haciendo clic en el siguiente enlace: http://localhost:3000/verify?token=${verificationToken}`,
              };

              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  console.error("Error enviando el correo:", error);
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      error: "Error enviando el correo de verificación",
                    })
                  );
                  return;
                }
                console.log("Email sent:", info.response);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    message:
                      "Usuario creado exitosamente. Por favor, verifica tu correo electrónico.",
                  })
                );
              });
            }
          );
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Formato JSON inválido" }));
      }
    });

    return;
  }

  if (path === "/registUser" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { name, email, password, role } = JSON.parse(body);

        // Verificar si el correo ya está registrado
        const checkEmailQuery = "SELECT * FROM users WHERE email = ?";

        connection.query(checkEmailQuery, [email], (err, results) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Error al verificar el correo" }));
            return;
          }

          if (results.length > 0) {
            // Si el correo ya existe
            res.writeHead(409, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Este correo electrónico ya está registrado",
              })
            );
            return;
          }

          // Generar un token de verificación
          const verificationToken = crypto.randomBytes(20).toString("hex");

          // Insertar el nuevo usuario con el token de verificación
          const insertQuery = `INSERT INTO users (name, email, password, role, verification_token, is_verified) VALUES (?, ?, ?, ?, ?, false)`;

          connection.query(
            insertQuery,
            [name, email, password, role, verificationToken],
            (err, results) => {
              if (err) {
                console.error("Error inserting user:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({ error: "Error al registrar el usuario" })
                );
                return;
              }

              // Enviar correo de verificación
              const mailOptions = {
                from: "snowbeast138.com",
                to: email,
                subject: "Verificación de correo electrónico",
                text: `Por favor, verifica tu correo electrónico haciendo clic en el siguiente enlace: http://localhost:3000/verify?token=${verificationToken}`,
              };

              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  console.error("Error enviando el correo:", error);
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      error: "Error enviando el correo de verificación",
                    })
                  );
                  return;
                }
                console.log("Email sent:", info.response);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    message:
                      "Usuario creado exitosamente. Por favor, verifica tu correo electrónico.",
                  })
                );
              });
            }
          );
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Formato JSON inválido" }));
      }
    });

    return;
  }

  // Ruta para eliminar usuarios seleccionados
  if (path === "/deleteUsers" && req.method === "DELETE") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { userIds } = JSON.parse(body);

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: "IDs de usuarios no proporcionados" })
          );
          return;
        }

        let deleteCount = 0;
        let errors = [];

        userIds.forEach((userId) => {
          const deleteQuery = "DELETE FROM users WHERE id = ?";
          connection.query(deleteQuery, [userId], (err, results) => {
            if (err) {
              console.error("Error deleting user:", err);
              errors.push(`Error al eliminar el usuario con ID ${userId}`);
            } else {
              deleteCount++;
            }

            // Verificar si todas las consultas han terminado
            if (deleteCount + errors.length === userIds.length) {
              if (errors.length > 0) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: errors.join(", ") }));
              } else {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    message:
                      "Todos los usuarios fueron eliminados exitosamente",
                  })
                );
              }
            }
          });
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Formato JSON inválido" }));
      }
    });

    return;
  }

  if (path === "/updateUsers" && req.method === "PUT") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { selectedUsers } = JSON.parse(body);

        if (
          !selectedUsers ||
          !Array.isArray(selectedUsers) ||
          selectedUsers.length === 0
        ) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: "Datos de usuarios no proporcionados" })
          );
          return;
        }

        let updateCount = 0;
        let errors = [];

        selectedUsers.forEach((user) => {
          const updateQuery =
            "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?";
          connection.query(
            updateQuery,
            [user.name, user.email, user.role, user.id],
            (err, results) => {
              if (err) {
                console.error("Error updating user:", err);
                errors.push(`Error al actualizar el usuario con ID ${user.id}`);
              } else {
                updateCount++;
              }

              // Verificar si todas las consultas han terminado
              if (updateCount + errors.length === selectedUsers.length) {
                if (errors.length > 0) {
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ error: errors.join(", ") }));
                } else {
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      message:
                        "Todos los usuarios fueron actualizados exitosamente",
                    })
                  );
                }
              }
            }
          );
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Formato JSON inválido" }));
      }
    });

    return;
  }

  if (path === "/addProductToCart" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { userId, productId, quantity } = JSON.parse(body);
        const insertQuery = `INSERT INTO carrito (id_cliente, id_producto, cantidad) VALUES (?, ?, ?)`;
        connection.query(
          insertQuery,
          [userId, productId, quantity],
          (err, results) => {
            if (err) {
              console.error("Error inserting product to cart:", err);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error: "Error al agregar el producto al carrito",
                })
              );
              return;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "Producto agregado al carrito exitosamente",
              })
            );
          }
        );
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Formato JSON inválido" }));
      }
    });
    return;
  }

  if (path === "/clearCart" && req.method === "DELETE") {
    const userId = parsedUrl.query.userId;
    if (!userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "ID de usuario no proporcionado" }));
      return;
    }
    const deleteQuery = "DELETE FROM carrito WHERE id_cliente = ?";
    connection.query(deleteQuery, [userId], (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error al eliminar el carrito" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Carrito eliminado exitosamente" }));
    });
    return;
  }

  // Ruta para verificar el correo electrónico
  if (path === "/verify" && req.method === "GET") {
    const token = parsedUrl.query.token;

    if (!token) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Token no proporcionado" }));
      return;
    }

    // Buscar al usuario con el token de verificación
    const verifyQuery = "SELECT * FROM users WHERE verification_token = ?";

    connection.query(verifyQuery, [token], (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error en la verificación" }));
        return;
      }

      if (results.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Token inválido o usuario no encontrado" })
        );
        return;
      }

      const user = results[0];

      // Marcar al usuario como verificado
      const updateQuery =
        "UPDATE users SET is_verified = true, verification_token = NULL WHERE id = ?";

      connection.query(updateQuery, [user.id], (err, results) => {
        if (err) {
          console.error("Error updating user verification status:", err);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Error al verificar el usuario" }));
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Correo electrónico verificado exitosamente",
          })
        );
      });
    });

    return;
  }

  // Ruta para iniciar sesión
  if (path === "/login" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { email, password } = JSON.parse(body);

        // Buscar al usuario por correo y contraseña
        const loginQuery =
          "SELECT * FROM users WHERE email = ? AND password = ?";

        connection.query(loginQuery, [email, password], (err, results) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Error al iniciar sesión" }));
            return;
          }

          if (results.length === 0) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Credenciales incorrectas" }));
            return;
          }

          const user = results[0];

          if (!user.is_verified) {
            res.writeHead(403, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Correo no verificado" }));
            return;
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Inicio de sesión exitoso" }));
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Formato JSON inválido" }));
      }
    });

    return;
  }

  if (path === "/addProduct" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { name, description, price, image } = JSON.parse(body);

        // Validar los valores esperados
        if (
          !name ||
          !description ||
          typeof price !== "number" ||
          price <= 0 ||
          !image
        ) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error:
                "Valores inválidos. Asegúrate de proporcionar todos los campos correctamente.",
            })
          );
          return;
        }

        // Convertir la imagen de base64 a Buffer
        const imageBuffer = Buffer.from(image, "base64");

        const insertProductQuery =
          "INSERT INTO productos (name, description, price) VALUES (?, ?, ?)";

        connection.query(
          insertProductQuery,
          [name, description, price],
          (err, productResults) => {
            if (err) {
              console.error("Error al insertar en la tabla productos:", err);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({ error: "Error al agregar el producto" })
              );
              return;
            }

            // Obtener el ID del producto recién insertado
            const productId = productResults.insertId;

            const insertImageQuery =
              "INSERT INTO images_productos (producto_id, image) VALUES (?, ?)";

            connection.query(
              insertImageQuery,
              [productId, imageBuffer], // Insertar el ID del producto y el Buffer de la imagen
              (err, imageResults) => {
                if (err) {
                  console.error(
                    "Error al insertar en la tabla images_productos:",
                    err
                  );
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      error: "Error al agregar la imagen del producto",
                    })
                  );
                  return;
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({ message: "Producto agregado exitosamente" })
                );
              }
            );
          }
        );
      } catch (error) {
        console.error("Error en el servidor:", error);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Formato JSON inválido" }));
      }
    });

    return;
  }

  if (path === "/updateProduct" && req.method === "PUT") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { name, description, price } = JSON.parse(body);
        const productId = new URLSearchParams(req.url.split("?")[1]).get("id");

        console.log(name, description, price, productId);

        if (!productId || isNaN(productId)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "ID de producto no válido" }));
          return;
        }

        if (!name || !description || isNaN(price) || price <= 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error:
                "Valores inválidos. Asegúrate de proporcionar todos los campos correctamente.",
            })
          );
          return;
        }

        const updateProductQuery =
          "UPDATE productos SET name = ?, description = ?, price = ? WHERE id = ?";

        connection.query(
          updateProductQuery,
          [name, description, price, productId],
          (err) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({ error: "Error al actualizar el producto" })
              );
              return;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ message: "Producto actualizado exitosamente" })
            );
          }
        );
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Formato JSON inválido" }));
      }
    });

    return;
  }

  if (path === "/deleteProduct" && req.method === "DELETE") {
    // Obtener el ID del producto desde los parámetros de la URL
    const urlParams = new URLSearchParams(req.url.split("?")[1]); // Extrae los parámetros de la URL
    const productId = urlParams.get("id"); // Obtiene el valor del parámetro "id"

    // Verificar que productId esté presente y sea válido
    if (!productId || isNaN(productId)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "ID de producto no válido" }));
      return;
    }

    // Eliminar las imágenes asociadas al producto
    const deleteImgProductQuery =
      "DELETE FROM images_productos WHERE producto_id = ?";

    connection.query(deleteImgProductQuery, [productId], (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Error al eliminar la imagen del producto",
          })
        );
        return;
      }

      // Si la eliminación de la imagen fue exitosa, procedemos a eliminar el producto
      const deleteProductQuery = "DELETE FROM productos WHERE id = ?";

      connection.query(deleteProductQuery, [productId], (err, results) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Error al eliminar el producto" }));
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Producto eliminado exitosamente" }));
      });
    });

    return;
  }

  if (path === "/removeFromCart" && req.method === "DELETE") {
    const cartId = parsedUrl.query.cartId;
    if (!cartId || isNaN(cartId)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "ID de producto no válido" }));
      return;
    }
    const deleteQuery = "DELETE FROM carrito WHERE id = ?";

    connection.query(deleteQuery, [cartId], (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error al eliminar el producto" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Producto eliminado exitosamente" }));
    });

    return;
  }

  if (path === "/getCart" && req.method === "GET") {
    const userId = parsedUrl.query.userId;

    if (!userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "ID de usuario no proporcionado" }));
      return;
    }

    const getCartQuery = `
      SELECT c.id, p.name, p.description, p.price, ip.image, c.cantidad
      FROM carrito c
      INNER JOIN productos p ON c.id_producto = p.id
      LEFT JOIN images_productos ip ON p.id = ip.producto_id
      WHERE c.id_cliente = ?
    `;

    connection.query(getCartQuery, [userId], (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error al obtener el carrito" }));
        return;
      }

      const cartItems = results.map((item) => {
        return {
          ...item,
          image: item.image ? item.image.toString("base64") : null,
        };
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(cartItems));
    });

    return;
  }

  // Ruta para obtener usuarios
  if (path === "/getUsers" && req.method === "GET") {
    // Consulta para obtener todos los usuarios
    const getUsersQuery =
      "SELECT id, name, email, role, is_verified FROM users";

    connection.query(getUsersQuery, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error al obtener los usuarios" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });

    return;
  }

  if (path === "/user" && req.method === "GET") {
    const userEmail = parsedUrl.query.email;

    if (!userEmail) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Email de usuario no proporcionado" }));
      return;
    }

    const getUserQuery = "SELECT * FROM users WHERE email = ?";
    connection.query(getUserQuery, [userEmail], (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error al obtener el usuario" }));
        return;
      }

      if (results.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Usuario no encontrado" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results[0]));
    });

    return;
  }

  if (path === "/getProducts" && req.method === "GET") {
    const getProductsQuery = `
      SELECT p.id, p.name, p.description, p.price, ip.image 
      FROM productos p
      LEFT JOIN images_productos ip ON p.id = ip.producto_id
    `;

    connection.query(getProductsQuery, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error al obtener los productos" }));
        return;
      }

      // Convertir la imagen de Buffer a base64
      const productsWithImages = results.map((product) => {
        return {
          ...product,
          image: product.image ? product.image.toString("base64") : null,
        };
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(productsWithImages));
    });

    return;
  }

  if (path === "/getProduct" && req.method === "GET") {
    const productId = parsedUrl.query.id;

    if (!productId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "ID de producto no proporcionado" }));
      return;
    }

    const getProductQuery = `
      SELECT p.id, p.name, p.description, p.price, ip.image 
      FROM productos p
      LEFT JOIN images_productos ip ON p.id = ip.producto_id
      WHERE p.id = ?
    `;

    connection.query(getProductQuery, [productId], (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error al obtener el producto" }));
        return;
      }

      if (results.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Producto no encontrado" }));
        return;
      }

      const product = results[0];

      // Convertir la imagen de Buffer a base64
      const productWithImage = {
        ...product,
        image: product.image ? product.image.toString("base64") : null,
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(productWithImage));
    });

    return;
  }

  if (path === "/getBitacora" && req.method === "GET") {
    const getBitacoraQuery = `SELECT * FROM bitacora`;
    connection.query(getBitacoraQuery, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error al obtener la bitácora" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
    return;
  }

  if (path === "/getPedidos" && req.method === "GET") {
    const getPedidosQuery = `
      SELECT 
    p.id AS pedido_id,
    u.name AS cliente_nombre,
    p.date AS fecha_pedido,
    n.total AS total_pedido,
    f.file AS archivo_adjunto,
    CONCAT('[', GROUP_CONCAT(
        CONCAT(
            '{"id_producto": ', i.id_producto, 
            ', "nombre": "', pr.name, '"',
            ', "descripcion": "', pr.description, '"',
            ', "precio": ', pr.price,
            ', "piezas": ', i.piezas, '}'
        )
        SEPARATOR ','
    ), ']') AS productos
FROM pedidos p
JOIN users u ON p.id_cliente = u.id
JOIN inventario_pedido i ON p.id = i.id_pedido
JOIN productos pr ON i.id_producto = pr.id
LEFT JOIN notas n ON p.id = n.id_pedido
LEFT JOIN files_notas f ON n.id = f.id_nota
GROUP BY p.id, u.name, p.date, n.total, f.file
ORDER BY p.id;

    `;
    connection.query(getPedidosQuery, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error al obtener los pedidos" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
    return;
  }

  if (path === "/getArchivo" && req.method === "GET") {
    const pedidoId = parsedUrl.query.id;
    if (!pedidoId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "ID de pedido no proporcionado" }));
      return;
    }

    const query = `
      SELECT f.file 
      FROM pedidos p
      LEFT JOIN notas n ON p.id = n.id_pedido
      LEFT JOIN files_notas f ON n.id = f.id_nota
      WHERE p.id = ?;
    `;

    connection.query(query, [pedidoId], (err, results) => {
      if (err || results.length === 0) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error al obtener el archivo" }));
        return;
      }

      // Verificar si el archivo existe en los resultados
      const archivo = results[0].file;
      if (archivo) {
        res.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=pedido_${pedidoId}.pdf`,
        });
        // Enviar el archivo binario como respuesta
        res.end(archivo);
      } else {
        // Si no hay archivo disponible
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Archivo no encontrado" }));
      }
    });
    return;
  }

  // Ruta no encontrada
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Ruta no encontrada");
});

// Iniciar servidor en el puerto 3000
server.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
