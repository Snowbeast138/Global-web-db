let indice = 0;
const carrusel = document.querySelector(".carousel");
const total = document.querySelectorAll(".carousel img").length;

// Función para mover el carrusel manualmente
function moverCarrusel(direccion) {
  indice = (indice + direccion + total) % total;
  carrusel.style.transform = `translateX(${-indice * 100}vw)`;
}

// Función para mover el carrusel automáticamente cada 3 segundos
function moverCarruselAutomatico() {
  moverCarrusel(1);
}

// Iniciar el carrusel automático
let intervalo = setInterval(moverCarruselAutomatico, 3000);

// Reiniciar el carrusel automático al presionar un botón
function reiniciarCarrusel() {
  clearInterval(intervalo);
  intervalo = setInterval(moverCarruselAutomatico, 3000);
}

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
  navLinks.classList.toggle("active");
}

// Cerrar el menú al hacer clic en un enlace
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    const navLinks = document.querySelector(".nav-links");
    navLinks.classList.remove("active");
  });
});

// Añade el evento al botón de menú
document.querySelector(".menu-toggle").addEventListener("click", toggleMenu);
