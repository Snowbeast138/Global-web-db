document.addEventListener("DOMContentLoaded", function () {
  fetch("http://localhost:3000/getPedidos")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.querySelector("#pedidoTable tbody");
      // Guardar los pedidos en una variable global para facilitar la búsqueda
      window.pedidosData = data;

      data.forEach((pedido) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${pedido.pedido_id}</td>
            <td>${pedido.cliente_nombre}</td>
            <td>${pedido.fecha_pedido}</td>
            <td>$${pedido.total_pedido}</td>
            <td>
              ${
                pedido.archivo_adjunto
                  ? `<a href="#" onclick="descargarArchivo(${pedido.pedido_id}, '${pedido.cliente_nombre}', '${pedido.fecha_pedido}')">📄 Descargar</a>`
                  : "No disponible"
              }
            </td>
            <td>
              <button onclick="mostrarProductos(${
                pedido.pedido_id
              })">Mostrar Productos</button>
            </td>
          `;
        tableBody.appendChild(row);
      });
    })
    .catch((error) => console.error("Error al obtener pedidos:", error));
});

// Función para filtrar los pedidos
function filterPedidos() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase(); // Obtener el texto de búsqueda y convertir a minúsculas
  const tableBody = document.querySelector("#pedidoTable tbody");

  // Limpiar la tabla antes de añadir las filas filtradas
  tableBody.innerHTML = "";

  // Filtrar los pedidos que coinciden con el término de búsqueda
  const filteredPedidos = window.pedidosData.filter((pedido) => {
    return (
      pedido.pedido_id.toString().includes(searchTerm) ||
      pedido.cliente_nombre.toLowerCase().includes(searchTerm) ||
      pedido.fecha_pedido.toLowerCase().includes(searchTerm) ||
      pedido.total_pedido.toString().includes(searchTerm)
    );
  });

  // Mostrar los pedidos filtrados
  filteredPedidos.forEach((pedido) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${pedido.pedido_id}</td>
            <td>${pedido.cliente_nombre}</td>
            <td>${pedido.fecha_pedido}</td>
            <td>$${pedido.total_pedido}</td>
            <td>
              ${
                pedido.archivo_adjunto
                  ? `<a href="#" onclick="descargarArchivo(${pedido.pedido_id}, '${pedido.cliente_nombre}', '${pedido.fecha_pedido}')">📄 Descargar</a>`
                  : "No disponible"
              }
            </td>
            <td>
              <button onclick="mostrarProductos(${
                pedido.pedido_id
              })">Mostrar Productos</button>
            </td>
          `;
    tableBody.appendChild(row);
  });
}

function descargarArchivo(pedidoId, clienteNombre, fechaPedido) {
  fetch(`http://localhost:3000/getArchivo?id=${pedidoId}`)
    .then((response) => response.blob()) // Obtener el archivo como blob
    .then((blob) => {
      const url = window.URL.createObjectURL(blob); // Crear un objeto URL a partir del blob
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `pedido_${clienteNombre}_${fechaPedido}.pdf`; // Nombre del archivo
      document.body.appendChild(a);
      a.click(); // Iniciar la descarga
      window.URL.revokeObjectURL(url); // Liberar el objeto URL
    })
    .catch((error) => console.error("Error al descargar el archivo:", error));
}
