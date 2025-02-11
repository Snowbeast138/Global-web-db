const http = require("http");
const mysql = require("mysql");
const url = require("url");

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

  // Ruta para ejecutar consultas SQL (usada solo con precaución)
  if (path === "/query" && req.method === "GET") {
    const query = parsedUrl.query.q;

    connection.query(query, (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error en la consulta SQL" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });

    return;
  }

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

          // Si el correo no existe, proceder a insertar el nuevo usuario
          const insertQuery = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'CLIENT')`;

          connection.query(
            insertQuery,
            [name, email, password],
            (err, results) => {
              if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({ error: "Error al registrar el usuario" })
                );
                return;
              }

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({ message: "Usuario creado exitosamente" })
              );
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

  if (path === "/login" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString(); // Recibe los datos del frontend
    });

    req.on("end", () => {
      try {
        const { email, password } = JSON.parse(body);

        // Consulta la base de datos para verificar las credenciales
        const query = `SELECT * FROM users WHERE email = ? AND password = ?`;
        connection.query(query, [email, password], (err, results) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Error en la consulta de login" }));
            return;
          }

          if (results.length > 0) {
            // Credenciales válidas
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Login exitoso" }));
          } else {
            // Credenciales inválidas
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Credenciales incorrectas" }));
          }
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
