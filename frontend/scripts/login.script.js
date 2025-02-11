document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // Evita que el formulario se envíe de forma tradicional

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.status === 200) {
      window.location.href = "index.html";
    } else if (response.status === 401) {
      alert("Usuario o contraseña incorrectos");
    } else {
      alert("Error desconocido. Inténtalo de nuevo.");
    }
  } catch (error) {
    console.error("❌ Error en la conexión:", error.message);
    alert(
      "⚠️ Error en la conexión con el servidor. Verifica que el backend esté activo."
    );
  }
});
