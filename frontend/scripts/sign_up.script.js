document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("signup-form");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "❌ Las contraseñas no coinciden.",
      });
      return;
    }

    if (password.length < 8) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "❌ La contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (!hasNumber || !hasLetter || !hasSpecial) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "❌ La contraseña debe contener al menos un número y una letra y un caracter especial.",
      });
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
        Swal.fire({
          icon: "success",
          title: "Registro exitoso",
          text: "✅ Usuario registrado correctamente. Por favor, verifica tu correo electrónico.",
          confirmButtonText: "Ir al Login",
        }).then(() => {
          window.location.href = "login.html"; // Redirige después de aceptar
        });
      } else if (response.status === 409) {
        // Si el correo ya existe
        Swal.fire({
          icon: "error",
          title: "Correo duplicado",
          text: "❌ Este correo electrónico ya está registrado.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "❌ " + result.error,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "❌ No se pudo conectar con el servidor.",
      });
    }
  });
});

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("pi-eye");
    icon.classList.add("pi-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("pi-eye-slash");
    icon.classList.add("pi-eye");
  }
}
