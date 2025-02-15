document.addEventListener("DOMContentLoaded", async function () {
  const itemsPerPage = 8; // Número de productos por página
  let currentPage = 1; // Página actual

  const dialog = document.getElementById("product-dialog");
  const addProductBtn = document.getElementById("add-product-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const productForm = document.getElementById("product-form");

  // Abrir el diálogo para agregar un nuevo producto
  addProductBtn.addEventListener("click", () => {
    dialog.showModal();
  });

  // Cerrar el diálogo
  cancelBtn.addEventListener("click", () => {
    dialog.close();
  });

  // Manejar el envío del formulario para agregar un nuevo producto
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("product-name").value;
    const description = document.getElementById("product-description").value;
    const price = parseFloat(document.getElementById("product-price").value);
    const imageFile = document.getElementById("product-image").files[0];

    if (!imageFile) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Por favor, selecciona una imagen.",
      });
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2 MB

    if (imageFile.size > maxSize) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "La imagen es demasiado grande. El tamaño máximo permitido es de 2 MB.",
      });
      return;
    }

    // Convertir la imagen a base64
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = async () => {
      const imageBase64 = reader.result.split(",")[1]; // Eliminar el prefijo "data:image/..."

      // Enviar el nuevo producto al servidor
      try {
        const response = await fetch("http://localhost:3000/addProduct", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            price,
            image: imageBase64, // Enviar la imagen en base64
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // Cerrar el diálogo y resetear el formulario
          dialog.close();
          productForm.reset();
          Swal.fire({
            icon: "success",
            title: "Producto agregado",
            text: `El producto "${name}" ha sido agregado correctamente.`,
          });

          // Recargar la lista de productos
          await displayProducts(currentPage);
        } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } catch (error) {
        console.error("Error al agregar el producto:", error);
        alert("Error al agregar el producto. Por favor, inténtalo de nuevo.");
      }
    };
  });

  // Función para obtener los productos desde el servidor
  async function fetchProducts() {
    try {
      const response = await fetch("http://localhost:3000/getProducts");
      if (!response.ok) {
        throw new Error("Error al obtener los productos");
      }
      const products = await response.json();
      return products;
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }

  // Función para mostrar los productos en la página
  // Función para mostrar los productos en la página
  async function displayProducts(page) {
    const catalog = document.getElementById("catalog");
    catalog.innerHTML = "";

    const products = await fetchProducts();

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedProducts = products.slice(start, end);

    paginatedProducts.forEach((product) => {
      const productElement = document.createElement("div");
      productElement.className = "product";

      // Enlace al producto con su ID
      const productLink = document.createElement("a");
      productLink.href = `producto_view.html?id=${product.id}`; // Redirige a la vista del producto con el ID
      productLink.style.textDecoration = "none"; // Quitar subrayado del enlace
      productLink.style.color = "inherit"; // Mantener el color del texto

      const productImage = document.createElement("img");
      productImage.src = product.image
        ? `data:image/png;base64,${product.image}`
        : "assets/default-image.png"; // Mostrar la imagen en base64 o una imagen por defecto
      productImage.alt = product.name;

      const productName = document.createElement("div");
      productName.className = "product-name";
      productName.textContent = product.name;

      const productDescription = document.createElement("div");
      productDescription.className = "product-description";
      productDescription.textContent = product.description;

      const productPrice = document.createElement("div");
      productPrice.className = "product-price";
      productPrice.textContent = `$${product.price.toFixed(2)}`;

      productLink.appendChild(productImage);
      productLink.appendChild(productName);
      productLink.appendChild(productDescription);
      productLink.appendChild(productPrice);
      productElement.appendChild(productLink);
      catalog.appendChild(productElement);
    });
  }

  // Función para configurar la paginación
  async function setupPagination() {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    const products = await fetchProducts();
    const pageCount = Math.ceil(products.length / itemsPerPage);

    for (let i = 1; i <= pageCount; i++) {
      const button = document.createElement("button");
      button.textContent = i;
      button.addEventListener("click", () => {
        currentPage = i;
        displayProducts(currentPage);
        updatePaginationButtons();
      });

      pagination.appendChild(button);
    }

    updatePaginationButtons();
  }

  // Función para actualizar los botones de paginación
  function updatePaginationButtons() {
    const buttons = document.querySelectorAll("#pagination button");
    buttons.forEach((button, index) => {
      if (index + 1 === currentPage) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  // Inicializar la carga de productos y la paginación
  await displayProducts(currentPage);
  await setupPagination();
});
