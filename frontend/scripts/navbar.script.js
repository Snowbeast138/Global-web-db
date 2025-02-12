// Función para alternar la visibilidad del menú en dispositivos móviles
function toggleMenu() {
  const navLinks = document.querySelector(".nav-links");
  const menuIcon = document.querySelector(".menu-toggle i");

  // Alternar la clase "active" en el menú
  navLinks.classList.toggle("active");

  // Cambiar el ícono del menú entre barras (hamburguesa) y "X"
  if (navLinks.classList.contains("active")) {
    menuIcon.classList.replace("pi-bars", "pi-times");
  } else {
    menuIcon.classList.replace("pi-times", "pi-bars");
  }
}

// Cerrar el menú al hacer clic en un enlace
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    const navLinks = document.querySelector(".nav-links");
    navLinks.classList.remove("active");

    // Restaurar ícono de hamburguesa
    const menuIcon = document.querySelector(".menu-toggle i");
    menuIcon.classList.replace("pi-times", "pi-bars");
  });
});

// Añadir el evento al botón de menú
document.querySelector(".menu-toggle").addEventListener("click", toggleMenu);
