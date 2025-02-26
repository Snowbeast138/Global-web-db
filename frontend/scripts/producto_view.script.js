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

    const userRole = sessionStorage.getItem("userRole");
    const btEliminar = document.querySelector(".btn-eliminar");
    const btEditar = document.querySelector(".btn-editar");
    const btComprar = document.querySelector(".btn-agregar-carrito");

    btComprar.addEventListener("click", async () => {
      try {
        const userId = sessionStorage.getItem("userId");
        const productId = urlParams.get("id");
        const quantity = 1;

        const response = await fetch("http://localhost:3000/addProductToCart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, productId, quantity }),
        });

        // Verificar si la respuesta es un error 409 (Conflict)
        if (response.status === 409) {
          const data = await response.json(); // Leer el mensaje de error del servidor
          throw new Error(data.error || "Este producto ya está en el carrito");
        }

        // Verificar si la respuesta no es exitosa (otros errores)
        if (!response.ok) {
          throw new Error("Error al agregar el producto al carrito");
        }

        // Mostrar mensaje de éxito
        Swal.fire({
          icon: "success",
          title: "Producto agregado al carrito",
          showConfirmButton: false,
          timer: 1500,
        });
      } catch (error) {
        console.error("Este es el Error:", error);

        // Mostrar mensaje de error
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo agregar el producto al carrito.",
        });
      }
    });

    if (userRole === "CLIENT") {
      btEditar.style.display = "none";
      btEliminar.style.display = "none";
    } else {
      btEditar.addEventListener("click", () => openDialog(product));
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
              { method: "PUT" }
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
    }
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

  nombreInput.value = product.name;
  descripcionInput.value = product.description;
  precioInput.value = product.price;

  dialog.style.display = "flex";

  const formEditar = document.getElementById("form-editar");
  formEditar.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Validar campos antes de enviar
    if (
      !nombreInput.value ||
      !descripcionInput.value ||
      isNaN(precioInput.value) ||
      precioInput.value <= 0
    ) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor, completa todos los campos correctamente.",
      });
      return;
    }

    const formData = {
      name: nombreInput.value,
      description: descripcionInput.value,
      price: parseFloat(precioInput.value),
    };

    try {
      const response = await fetch(
        `http://localhost:3000/updateProduct?id=${product.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
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
