document.addEventListener("DOMContentLoaded", async function () {
  const itemsPerPage = 8; // Número de productos por página
  let currentPage = 1; // Página actual
  let allProducts = []; // Almacenar todos los productos
  let filteredProducts = []; // Almacenar productos filtrados

  const dialog = document.getElementById("product-dialog");
  const addProductBtn = document.getElementById("add-product-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const productForm = document.getElementById("product-form");
  const searchBar = document.getElementById("search-bar");
  const searchButton = document.getElementById("search-button");

  const userRole = sessionStorage.getItem("userRole");

  if (userRole === "CLIENT") {
    addProductBtn.style.display = "none";
  }

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
    // ... (código existente para agregar productos)
  });

  // Función para obtener los productos desde el servidor
  async function fetchProducts() {
    try {
      const response = await fetch("http://localhost:3000/getProducts");
      if (!response.ok) {
        throw new Error("Error al obtener los productos");
      }
      const products = await response.json();
      allProducts = products; // Almacenar todos los productos
      filteredProducts = products; // Inicialmente, los productos filtrados son todos los productos
      return products;
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }

  // Función para filtrar productos
  function filterProducts(searchText) {
    return allProducts.filter((product) =>
      product.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  // Función para mostrar los productos en la página
  async function displayProducts(page, products = filteredProducts) {
    const catalog = document.getElementById("catalog");
    catalog.innerHTML = "";

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedProducts = products.slice(start, end);

    paginatedProducts.forEach((product) => {
      const productElement = document.createElement("div");
      productElement.className = "product";

      const productLink = document.createElement("a");
      productLink.href = `producto_view.html?id=${product.id}`;
      productLink.style.textDecoration = "none";
      productLink.style.color = "inherit";

      const productImage = document.createElement("img");
      productImage.src = product.image
        ? `data:image/png;base64,${product.image}`
        : "assets/default-image.png";
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
  async function setupPagination(products = filteredProducts) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    const pageCount = Math.ceil(products.length / itemsPerPage);

    for (let i = 1; i <= pageCount; i++) {
      const button = document.createElement("button");
      button.textContent = i;
      button.addEventListener("click", () => {
        currentPage = i;
        displayProducts(currentPage, products);
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

  // Evento para la barra de búsqueda
  searchButton.addEventListener("click", () => {
    const searchText = searchBar.value.trim();
    filteredProducts = filterProducts(searchText);
    currentPage = 1;
    displayProducts(currentPage, filteredProducts);
    setupPagination(filteredProducts);
  });

  // Evento para la tecla "Enter" en la barra de búsqueda
  searchBar.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      const searchText = searchBar.value.trim();
      filteredProducts = filterProducts(searchText);
      currentPage = 1;
      displayProducts(currentPage, filteredProducts);
      setupPagination(filteredProducts);
    }
  });

  // Inicializar la carga de productos y la paginación
  await fetchProducts();
  await displayProducts(currentPage);
  await setupPagination();
});
