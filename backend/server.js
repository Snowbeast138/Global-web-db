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
  const doc = new PDFDocument();

  // Crea el nombre del archivo PDF y su ruta
  const filePath = path.join(__dirname, "compras", `${Date.now()}_compra.pdf`);

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text("Factura de Compra", { align: "center" });

  doc.moveDown(2);
  doc.fontSize(14).text("Productos Comprados:", { align: "left" });

  cartItems.forEach((item) => {
    doc.text(
      `${item.name} - $${item.price} x ${item.cantidad} = $${(
        item.price * item.cantidad
      ).toFixed(2)}`
    );
  });

  doc.moveDown(2);
  doc.text(`Subtotal: $${totalPrice.toFixed(2)}`, { align: "right" });
  doc.moveDown(1);
  doc.text(`Total: $${totalPrice.toFixed(2)}`, { align: "right" });

  doc.moveDown(2);
  doc.text(`Gracias por su compra!`, { align: "center" });

  doc.end();

  return filePath;
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
    connection.query(emailQuery, [userId], (err, results) => {
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

      const getCartQuery = `SELECT c.id, p.name, p.price, c.cantidad FROM carrito c INNER JOIN productos p ON c.id_producto = p.id WHERE c.id_cliente = ?`;

      connection.query(getCartQuery, [userId], (err, results) => {
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

        const filePath = generatePDF(cartItems, totalPrice, userEmail);

        const mailOptions = {
          from: "snowbeast138.com",
          to: userEmail,
          subject: "Factura de Compra",
          text: `Gracias por su compra.Aqui esta su factura`,
          attachments: [
            {
              filename: "factura.pdf",
              path: filePath,
            },
          ],
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error enviando el correo:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Error enviando el correo de la factura",
              })
            );
            return;
          }
          console.log("Email sent:", info.response);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: "Factura enviada exitosamente",
            })
          );
        });
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
  // Ruta no encontrada
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Ruta no encontrada");
});

// Iniciar servidor en el puerto 3000
server.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
