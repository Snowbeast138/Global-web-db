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

// Almacenamiento de sesiones en memoria
const sessions = {};

// Función para generar un ID de sesión único
function generateSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

// Función para verificar si una sesión ha expirado
function isSessionExpired(session) {
  const now = Date.now();
  const lastActivity = session.lastActivity || 0;
  const sessionDuration = 10 * 60 * 1000; // 10 minutos en milisegundos
  return now - lastActivity > sessionDuration;
}

// Función para eliminar sesiones expiradas
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const sessionId in sessions) {
    if (isSessionExpired(sessions[sessionId])) {
      delete sessions[sessionId];
      console.log(`Sesión ${sessionId} eliminada por expiración.`);
    }
  }
}

// Ejecutar la limpieza de sesiones expiradas cada minuto
setInterval(cleanupExpiredSessions, 60 * 1000); // 60 segundos

// Función para parsear cookies
function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      cookies[parts[0].trim()] = (parts[1] || "").trim();
    });
  }
  return cookies;
}

// Crear servidor
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Configurar CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Manejo de solicitud OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parsear cookies de la solicitud
  const cookies = parseCookies(req.headers.cookie);

  // Verificar si hay una sesión activa
  const sessionId = cookies.sessionId;
  const session = sessions[sessionId];

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

      console.log("User ID:", user.id); // Depuración adicional

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

          // Crear una nueva sesión
          const sessionId = generateSessionId();
          sessions[sessionId] = {
            userId: user.id,
            email: user.email,
            lastActivity: Date.now(), // Guardar la hora de la última actividad
          };

          // Enviar la cookie de sesión al cliente
          res.setHeader(
            "Set-Cookie",
            `sessionId=${sessionId}; HttpOnly; Max-Age=${10 * 60}` // Cookie válida por 10 minutos
          );

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

  // Ruta no encontrada
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Ruta no encontrada");
});

// Iniciar servidor en el puerto 3000
server.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
