document.addEventListener("DOMContentLoaded", function () {
  const userId = sessionStorage.getItem("userId");

  if (!userId) {
    Swal.fire({
      icon: "error",
      title: "Error de sesión",
      text: "No se encontró el usuario. Inicia sesión nuevamente.",
      confirmButtonText: "OK",
    }).then(() => {
      window.location.href = "login.html"; // Redirige al login si no hay usuario
    });
    return;
  }

  fetch(`http://localhost:3000/getCart?userId=${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const tbody = document.querySelector("#cart-table tbody");
      tbody.innerHTML = ""; // Limpiar la tabla antes de agregar nuevos datos

      if (data.length === 0) {
        Swal.fire({
          icon: "info",
          title: "Carrito vacío",
          text: "Aún no has agregado productos al carrito.",
        });
        return;
      }

      data.forEach((item) => {
        const row = document.createElement("tr");

        row.innerHTML = `
        <td>${item.id}</td>      
        <td><img src="data:image/jpeg;base64,${item.image || "#"}" alt="${
          item.name
        }"></td>
              <td>${item.name}</td>
              <td>${item.description}</td>
              <td>$${item.price.toFixed(2)}</td>
              <td>${item.cantidad}</td>
              <td>
                <button class="delete-btn" data-id="${item.id}">
                  <i class="pi pi-trash"></i>
                </button>
              </td>
            `;

        tbody.appendChild(row);
      });

      // Agregar evento a los botones de eliminar
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", function () {
          const productId = this.getAttribute("data-id");

          Swal.fire({
            title: "¿Eliminar producto?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
          }).then((result) => {
            if (result.isConfirmed) {
              fetch(
                `http://localhost:3000/removeFromCart?cartId=${productId}`,
                {
                  method: "DELETE",
                }
              )
                .then((response) => {
                  if (!response.ok)
                    throw new Error("Error al eliminar producto");
                  return response.json();
                })
                .then(() => {
                  Swal.fire({
                    icon: "success",
                    title: "Producto eliminado",
                    text: "Se ha eliminado correctamente del carrito.",
                    timer: 1500,
                  }).then(() => location.reload()); // Recargar la página
                })
                .catch((error) => {
                  Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Hubo un problema al eliminar el producto.",
                  });
                  console.error(error);
                });
            }
          });
        });
      });
    })
    .catch((error) => {
      Swal.fire({
        icon: "error",
        title: "Error al cargar carrito",
        text: "Hubo un problema al obtener los datos del carrito.",
      });
      console.error("Error al cargar el carrito:", error);
    });
});

// document
//   .querySelector("#finish-purchase")
//   .addEventListener("click", function () {
//     const userId = sessionStorage.getItem("userId");

//     if (!userId) {
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: "No se ha encontrado la información del usuario.",
//       });
//       return;
//     }

//     fetch(`http://localhost:3000/finalizarCompra?userId=${userId}`, {
//       method: "POST", // Como es una acción de tipo POST
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({}), // El cuerpo está vacío porque no estamos pasando más datos
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.message) {
//           Swal.fire({
//             icon: "success",
//             title: "Compra finalizada",
//             text: data.message,
//           });
//         } else if (data.error) {
//           Swal.fire({
//             icon: "error",
//             title: "Error",
//             text: data.error,
//           });
//         }
//       })
//       .catch((error) => {
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Hubo un problema al finalizar la compra.",
//         });
//         console.error("Error al finalizar la compra:", error);
//       });
//   });
