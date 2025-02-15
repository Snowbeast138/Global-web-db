document.addEventListener("DOMContentLoaded", async function () {
  // Obtener el ID del producto desde la URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!productId) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "ID de producto no proporcionado.",
    });
    return;
  }

  // Obtener la información del producto desde el servidor
  try {
    const response = await fetch(
      `http://localhost:3000/getProduct?id=${productId}`
    );
    if (!response.ok) {
      throw new Error("Error al obtener el producto");
    }

    const product = await response.json();

    // Mostrar la información del producto en la página
    const productoImagen = document.querySelector(".producto-imagen img");
    const productoNombre = document.querySelector(".producto-nombre");
    const productoDescripcion = document.querySelector(".producto-descripcion");
    const productoPrecio = document.querySelector(".producto-precio");

    productoImagen.src = product.image
      ? `data:image/png;base64,${product.image}`
      : "assets/default-image.png"; // Mostrar la imagen en base64 o una imagen por defecto
    productoNombre.textContent = product.name;
    productoDescripcion.textContent = product.description;
    productoPrecio.textContent = `$${product.price.toFixed(2)}`;

    const btEliminar = document.querySelector(".btn-eliminar");
    btEliminar.addEventListener("click", async () => {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás revertir esto.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        try {
          const response = await fetch(
            `http://localhost:3000/deleteProduct?id=${productId}`,
            {
              method: "DELETE",
            }
          );
          if (!response.ok) {
            throw new Error("Error al eliminar el producto");
          }

          Swal.fire({
            icon: "success",
            title: "Producto eliminado",
            showConfirmButton: false,
            timer: 1500,
          });

          setTimeout(() => {
            window.location.href = "producto.html";
          }, 1500);
        } catch (error) {
          console.error("Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo eliminar el producto.",
          });
        }
      }
    });
  } catch (error) {
    console.error("Error:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo cargar la información del producto.",
    });
  }
});
