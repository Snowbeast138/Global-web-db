// Función para obtener usuarios y llenar la tabla
fetch("http://localhost:3000/getUsers")
  .then((response) => response.json())
  .then((users) => {
    const tableBody = document.querySelector("#userTable tbody");
    users.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.is_verified ? "Sí" : "No"}</td>
      `;
      tableBody.appendChild(row);
    });
  })
  .catch((error) => {
    console.error("Error al obtener los usuarios:", error);
  });

// Función para filtrar usuarios
function filterUsers() {
  const searchInput = document
    .getElementById("searchInput")
    .value.toLowerCase();
  const rows = document.querySelectorAll("#userTable tbody tr");

  rows.forEach((row) => {
    const cells = row.getElementsByTagName("td");
    const name = cells[1].textContent.toLowerCase();
    const email = cells[2].textContent.toLowerCase();
    const role = cells[3].textContent.toLowerCase();

    if (
      name.includes(searchInput) ||
      email.includes(searchInput) ||
      role.includes(searchInput)
    ) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

// Función para cargar el Navbar y Footer de manera asincrónica
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
