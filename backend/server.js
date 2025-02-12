const http = require("http");
const mysql = require("mysql");
const url = require("url");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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

  // Ruta no encontrada
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Ruta no encontrada");
});

// Iniciar servidor en el puerto 3000
server.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
