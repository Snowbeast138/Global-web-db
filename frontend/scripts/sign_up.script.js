document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("signup-form");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
      alert("❌ Las contraseñas no coinciden.");
      return;
    }

    const userData = { name, email, password };

    try {
      const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok) {
        alert("✅ Registro exitoso");
        window.location.href = "login.html"; // Redirige al login
      } else {
        alert("❌ Error: " + result.error);
      }
    } catch (error) {
      alert("❌ Error de conexión con el servidor.");
    }
  });
});
