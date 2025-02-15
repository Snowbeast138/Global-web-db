document.addEventListener("DOMContentLoaded", async function () {
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

  let product;

  try {
    const response = await fetch(
      `http://localhost:3000/getProduct?id=${productId}`
    );
    if (!response.ok) throw new Error("Error al obtener el producto");
    product = await response.json();

    const productoImagen = document.querySelector(".producto-imagen img");
    const productoNombre = document.querySelector(".producto-nombre");
    const productoDescripcion = document.querySelector(".producto-descripcion");
    const productoPrecio = document.querySelector(".producto-precio");

    productoImagen.src = product.image
      ? `data:image/png;base64,${product.image}`
      : "assets/default-image.png";
    productoNombre.textContent = product.name;
    productoDescripcion.textContent = product.description;
    productoPrecio.textContent = `$${product.price.toFixed(2)}`;

    const btEditar = document.querySelector(".btn-editar");
    btEditar.addEventListener("click", () => openDialog(product));

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
            { method: "DELETE" }
          );
          if (!response.ok) throw new Error("Error al eliminar el producto");

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

function openDialog(product) {
  const dialog = document.getElementById("dialog-editar");
  const nombreInput = document.getElementById("nombre");
  const descripcionInput = document.getElementById("descripcion");
  const precioInput = document.getElementById("precio");
  const imagenInput = document.getElementById("imagen");
  const previewImagen = document.getElementById("preview-imagen");

  nombreInput.value = product.name;
  descripcionInput.value = product.description;
  precioInput.value = product.price;
  previewImagen.src = product.image
    ? `data:image/png;base64,${product.image}`
    : "assets/default-image.png";
  previewImagen.style.display = "block";

  dialog.style.display = "flex";

  imagenInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewImagen.src = e.target.result;
        previewImagen.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  const formEditar = document.getElementById("form-editar");
  formEditar.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", nombreInput.value);
    formData.append("description", descripcionInput.value);
    formData.append("price", precioInput.value);
    if (imagenInput.files[0]) {
      formData.append("image", imagenInput.files[0]);
    }

    try {
      const response = await fetch(
        `http://localhost:3000/updateProduct?id=${product.id}`,
        { method: "PUT", body: formData }
      );

      if (!response.ok) throw new Error("Error al actualizar el producto");

      Swal.fire({
        icon: "success",
        title: "Producto actualizado",
        showConfirmButton: false,
        timer: 1500,
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el producto.",
      });
    }
  });
}

function closeDialog() {
  const dialog = document.getElementById("dialog-editar");
  dialog.style.display = "none";
}
