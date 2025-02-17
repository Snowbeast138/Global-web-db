window.addEventListener("DOMContentLoaded", function () {
  const userRole = sessionStorage.getItem("userRole");

  // Si el rol es CLIENT, ocultamos los elementos
  if (userRole === "CLIENT" || userRole === "EMPLOYEE") {
    const restrictedItems = document.querySelectorAll(".restricted");
    restrictedItems.forEach((item) => {
      item.style.display = "none"; // Ocultamos los elementos
    });
  }
});

document
  .getElementById("logout-button")
  .addEventListener("click", function (event) {
    // Prevenir el comportamiento por defecto del enlace (que podría redirigir antes de limpiar la sesión)
    event.preventDefault();

    // Limpiar todos los elementos de sessionStorage
    sessionStorage.clear(); // O si deseas eliminar solo elementos específicos: sessionStorage.removeItem('userRole');

    // Redirigir al usuario a la página de login después de limpiar la sesión
    window.location.href = "login.html"; // O redirigir a cualquier página deseada
  });

let currentIndex = 0;
const images = document.querySelectorAll(".slider-image");
const total = images.length;

// Función para mover el carrusel (manual o automático)
function moverCarrusel(direccion) {
  // Eliminar la clase "active" de la imagen actual
  images[currentIndex].classList.remove("active");

  // Calcular el siguiente índice y asegurarse de que no salga del rango
  currentIndex = (currentIndex + direccion + total) % total;

  // Agregar la clase "active" a la nueva imagen
  images[currentIndex].classList.add("active");
}

// Función para mover el carrusel automáticamente cada 3 segundos
function moverCarruselAutomatico() {
  moverCarrusel(1); // Mover a la siguiente imagen
}

// Iniciar el carrusel automático
let intervalo = setInterval(moverCarruselAutomatico, 3000);

// Reiniciar el carrusel automático al presionar un botón
function reiniciarCarrusel() {
  clearInterval(intervalo); // Detener el intervalo actual
  intervalo = setInterval(moverCarruselAutomatico, 3000); // Iniciar uno nuevo
}

// Manejar los botones de anterior y siguiente
document.querySelector(".prev").addEventListener("click", () => {
  moverCarrusel(-1);
  reiniciarCarrusel();
});

document.querySelector(".next").addEventListener("click", () => {
  moverCarrusel(1);
  reiniciarCarrusel();
});

// Función para mostrar/ocultar el menú en móviles
function toggleMenu() {
  const navLinks = document.querySelector(".nav-links");
  const menuIcon = document.querySelector(".menu-toggle i");

  navLinks.classList.toggle("active");

  // Cambiar ícono de hamburguesa a "X" y viceversa
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

// Función para cargar el Navbar y el Footer de manera asincrónica
async function loadNavbarAndFooter() {
  try {
    // Esperar la carga del navbar
    const navbarResponse = await fetch("navbar.html");
    const navbarHtml = await navbarResponse.text();
    document.getElementById("navbar-placeholder").innerHTML = navbarHtml;

    // Esperar la carga del footer
    const footerResponse = await fetch("footer.html");
    const footerHtml = await footerResponse.text();
    document.getElementById("footer-placeholder").innerHTML = footerHtml;
  } catch (error) {
    console.error("Error al cargar los archivos del navbar o footer:", error);
  }
}

// Llamar a la función para cargar el Navbar y Footer
loadNavbarAndFooter();
