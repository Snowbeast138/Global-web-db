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
      // Después de un login exitoso, consulta el usuario por su email
      const userResponse = await fetch(
        `http://localhost:3000/user?email=${email}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (userResponse.status === 200) {
        const userData = await userResponse.json(); // Obtener los datos del usuario
        const { id, role } = userData; // Extraer id y role

        // Guarda los valores en sessionStorage
        sessionStorage.setItem("userId", id);
        sessionStorage.setItem("userRole", role);

        // Muestra el mensaje de éxito
        Swal.fire({
          icon: "success",
          title: "Login exitoso",
          text: "✅ Bienvenido",
          confirmButtonText: "Continuar",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = "index.html"; // Redirige a la página principal
          }
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "❌ No se pudo obtener la información del usuario.",
        });
      }
    } else if (response.status === 401) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "❌ Credenciales incorrectas. Inténtalo de nuevo.",
      });
    } else if (response.status === 403) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "❌ Correo no verificado. Por favor, verifica tu correo electrónico.",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "❌ Ocurrió un error inesperado. Inténtalo de nuevo.",
      });
    }
  } catch (error) {
    console.error("❌ Error en la conexión:", error.message);
    alert(
      "⚠️ Error en la conexión con el servidor. Verifica que el backend esté activo."
    );
  }
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
