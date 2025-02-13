document.addEventListener("DOMContentLoaded", function () {
  const products = [
    { id: 1, name: "Producto 1", image: "assets/about_us_1.png", link: "#" },
    { id: 2, name: "Producto 2", image: "assets/about_us_1.png", link: "#" },
    { id: 3, name: "Producto 3", image: "assets/about_us_1.png", link: "#" },
    // ... otros productos
  ];

  const itemsPerPage = 8;
  let currentPage = 1;

  const dialog = document.getElementById("product-dialog");
  const addProductBtn = document.getElementById("add-product-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const productForm = document.getElementById("product-form");

  // Abrir el diálogo
  addProductBtn.addEventListener("click", () => {
    dialog.showModal();
  });

  // Cerrar el diálogo
  cancelBtn.addEventListener("click", () => {
    dialog.close();
  });

  // Manejar el envío del formulario
  productForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("product-name").value;
    const description = document.getElementById("product-description").value;
    const price = parseFloat(document.getElementById("product-price").value);
    const imageFile = document.getElementById("product-image").files[0];

    if (!imageFile) {
      alert("Por favor, selecciona una imagen.");
      return;
    }

    // Crear una URL temporal para la imagen subida
    const imageUrl = URL.createObjectURL(imageFile);

    const newProduct = {
      id: products.length + 1,
      name,
      description,
      price,
      image: imageUrl, // Usar la URL temporal
      link: "#",
    };

    console.log(newProduct);

    products.push(newProduct);
    displayProducts(currentPage);
    dialog.close();
    productForm.reset();
  });

  function displayProducts(page) {
    const catalog = document.getElementById("catalog");
    catalog.innerHTML = "";

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedProducts = products.slice(start, end);

    paginatedProducts.forEach((product) => {
      const productElement = document.createElement("div");
      productElement.className = "product";

      const productLink = document.createElement("a");
      productLink.href = product.link;

      const productImage = document.createElement("img");
      productImage.src = product.image;
      productImage.alt = product.name;

      const productName = document.createElement("div");
      productName.className = "product-name";
      productName.textContent = product.name;

      productLink.appendChild(productImage);
      productElement.appendChild(productLink);
      productElement.appendChild(productName);
      catalog.appendChild(productElement);
    });
  }

  function setupPagination() {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

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

  displayProducts(currentPage);
  setupPagination();
});
