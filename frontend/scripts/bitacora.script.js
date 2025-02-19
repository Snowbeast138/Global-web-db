// bitacora.script.js
document.addEventListener("DOMContentLoaded", function () {
  fetch("http://localhost:3000/getBitacora")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.querySelector("#bitacoraTable tbody");
      // Guardar los datos de la bitácora en una variable global para facilitar la búsqueda
      window.bitacoraData = data;

      data.forEach((bitacora) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                <td>${bitacora.id}</td>
                <td>${bitacora.fecha_modificacion}</td>
                <td>${bitacora.sentencia}</td>
                <td>${bitacora.contrasentencia}</td>
                <td>${bitacora.usuario}</td>
              `;
        tableBody.appendChild(row);
      });
    })
    .catch((error) => console.error("Error al obtener la bitácora:", error));
});

// Función para filtrar la bitácora
function filterBitacora() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase(); // Obtener el texto de búsqueda y convertir a minúsculas
  const tableBody = document.querySelector("#bitacoraTable tbody");

  // Limpiar la tabla antes de añadir las filas filtradas
  tableBody.innerHTML = "";

  // Filtrar los registros de la bitácora que coinciden con el término de búsqueda
  const filteredBitacora = window.bitacoraData.filter((bitacora) => {
    return (
      bitacora.id.toString().includes(searchTerm) ||
      bitacora.fecha_modificacion.toLowerCase().includes(searchTerm) ||
      bitacora.sentencia.toLowerCase().includes(searchTerm) ||
      bitacora.contrasentencia.toLowerCase().includes(searchTerm) ||
      bitacora.usuario.toLowerCase().includes(searchTerm)
    );
  });

  // Mostrar los registros filtrados
  filteredBitacora.forEach((bitacora) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td data-label="ID">${bitacora.id}</td>
            <td data-label="Fecha">${bitacora.fecha_modificacion}</td>
            <td data-label="Sentencia">${bitacora.sentencia}</td>
            <td data-label="Contrasentencia">${bitacora.contrasentencia}</td>
            <td data-label="Usuario">${bitacora.usuario}</td>
              `;
    tableBody.appendChild(row);
  });
}
