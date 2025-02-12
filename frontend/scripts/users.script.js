// Función para obtener usuarios y llenar la tabla
fetch("http://localhost:3000/getUsers")
  .then((response) => response.json())
  .then((users) => {
    const tableBody = document.querySelector("#userTable tbody");
    tableBody.innerHTML = ""; // Limpiar tabla antes de insertar nuevos datos

    users.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td><input type="checkbox" class="user-checkbox" data-id="${
            user.id
          }"></td>
          <td>${user.id}</td>
          <td contenteditable="true">${user.name}</td>
          <td contenteditable="true">${user.email}</td>
          <td>
            <select class="role-select">
              <option value="ADMIN" ${
                user.role === "ADMIN" ? "selected" : ""
              }>Admin</option>
              <option value="CLIENT" ${
                user.role === "CLIENT" ? "selected" : ""
              }>Cliente</option>
              <option value="EMPLOYEE" ${
                user.role === "EMPLOYEE" ? "selected" : ""
              }>Empleado</option>
            </select>
          </td>
          <td>${user.is_verified ? "Sí" : "No"}</td>
        `;
      tableBody.appendChild(row);
    });

    // Agregar evento a los checkboxes
    document.querySelectorAll(".user-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", handleCheckboxChange);
    });

    // Agregar evento para la edición en línea
    document
      .querySelectorAll('#userTable tbody td[contenteditable="true"]')
      .forEach((cell) => {
        cell.addEventListener("blur", handleCellEdit);
      });

    // Agregar evento para los selects de roles
    document.querySelectorAll(".role-select").forEach((select) => {
      select.addEventListener("change", handleRoleChange);
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
    const name = cells[2].textContent.toLowerCase();
    const email = cells[3].textContent.toLowerCase();
    const role = cells[4].textContent.toLowerCase();

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

function fetchUsers() {
  fetch("http://localhost:3000/getUsers")
    .then((response) => response.json())
    .then((users) => {
      const tableBody = document.querySelector("#userTable tbody");
      tableBody.innerHTML = ""; // Limpiar tabla antes de insertar nuevos datos

      users.forEach((user) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><input type="checkbox" class="user-checkbox" data-id="${
            user.id
          }"></td>
          <td>${user.id}</td>
          <td contenteditable="true">${user.name}</td>
          <td contenteditable="true">${user.email}</td>
          <td>
            <select class="role-select">
              <option value="ADMIN" ${
                user.role === "ADMIN" ? "selected" : ""
              }>Admin</option>
              <option value="CLIENT" ${
                user.role === "CLIENT" ? "selected" : ""
              }>Cliente</option>
              <option value="EMPLOYEE" ${
                user.role === "EMPLOYEE" ? "selected" : ""
              }>Empleado</option>
            </select>
          </td>
          <td>${user.is_verified ? "Sí" : "No"}</td>
        `;
        tableBody.appendChild(row);
      });

      // Agregar evento a los checkboxes
      document.querySelectorAll(".user-checkbox").forEach((checkbox) => {
        checkbox.addEventListener("change", handleCheckboxChange);
      });

      // Agregar evento para la edición en línea
      document
        .querySelectorAll('#userTable tbody td[contenteditable="true"]')
        .forEach((cell) => {
          cell.addEventListener("blur", handleCellEdit);
        });

      // Agregar evento para los selects de roles
      document.querySelectorAll(".role-select").forEach((select) => {
        select.addEventListener("change", handleRoleChange);
      });
    })
    .catch((error) => {
      console.error("Error al obtener los usuarios:", error);
    });
}

let selectedUsers = [];

function handleCheckboxChange(event) {
  const checkbox = event.target;
  const row = checkbox.closest("tr"); // Obtener la fila del checkbox
  const userId = checkbox.getAttribute("data-id");

  // Obtener toda la información del usuario desde la fila
  const user = {
    id: userId,
    name: row.cells[2].textContent, // Nombre
    email: row.cells[3].textContent, // Correo
    role: row.querySelector(".role-select").value, // Rol (del select)
    is_verified: row.cells[5].textContent === "Sí", // Verificado
  };

  if (checkbox.checked) {
    // Agregar el usuario a la lista de seleccionados
    selectedUsers.push(user);
  } else {
    // Eliminar el usuario de la lista de seleccionados
    selectedUsers = selectedUsers.filter((user) => user.id !== userId);
  }

  console.log("Usuarios seleccionados:", selectedUsers);
}

function handleCellEdit(event) {
  const cell = event.target;
  const row = cell.parentElement;
  const checkbox = row.querySelector(".user-checkbox"); // Obtener el checkbox de la fila

  // Seleccionar el checkbox automáticamente
  checkbox.checked = true;

  const userId = checkbox.getAttribute("data-id");
  const field = cell.cellIndex; // 2: Nombre, 3: Correo

  const newValue = cell.textContent;

  // Actualizar la lista de usuarios seleccionados
  const userIndex = selectedUsers.findIndex((user) => user.id === userId);
  if (userIndex !== -1) {
    switch (field) {
      case 2:
        selectedUsers[userIndex].name = newValue;
        break;
      case 3:
        selectedUsers[userIndex].email = newValue;
        break;
    }
  } else {
    // Si el usuario no está en la lista, agregarlo
    const role = row.querySelector(".role-select").value; // Obtener el valor del select
    selectedUsers.push({
      id: userId,
      name: row.cells[2].textContent,
      email: row.cells[3].textContent,
      role: role,
    });
  }

  console.log("Usuarios seleccionados actualizados:", selectedUsers);
}

function handleRoleChange(event) {
  const select = event.target;
  const row = select.closest("tr");
  const checkbox = row.querySelector(".user-checkbox");
  const userId = checkbox.getAttribute("data-id");
  const newRole = select.value;

  // Seleccionar el checkbox automáticamente
  checkbox.checked = true;

  // Actualizar la lista de usuarios seleccionados
  const userIndex = selectedUsers.findIndex((user) => user.id === userId);
  if (userIndex !== -1) {
    selectedUsers[userIndex].role = newRole;
  } else {
    // Si el usuario no está en la lista, agregarlo
    selectedUsers.push({
      id: userId,
      name: row.cells[2].textContent,
      email: row.cells[3].textContent,
      role: newRole,
    });
  }

  console.log("Usuarios seleccionados actualizados:", selectedUsers);
}

// Mostrar diálogos
document.getElementById("addButton").addEventListener("click", () => {
  document.getElementById("addDialog").style.display = "block";
});

document.getElementById("deleteButton").addEventListener("click", async () => {
  if (selectedUsers.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Error",
      text: "❌ Por favor, seleccione al menos 1 usuario a eliminar.",
    });
    return;
  }

  const userIds = selectedUsers.map((user) => user.id);

  // Preguntar confirmación antes de eliminar
  Swal.fire({
    title: "¿Estás seguro de querer eliminar estos Usuario/s?",
    text: "¡No podrás revertir esta acción!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch("http://localhost:3000/deleteUsers", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds }),
        });

        const result = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Usuarios eliminados",
            text: "✅ Los usuarios fueron eliminados correctamente.",
            confirmButtonText: "Ok",
          }).then(() => {
            fetchUsers(); // Recargar la lista de usuarios
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "❌ " + result.error,
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error de conexión",
          text: "❌ No se pudo conectar con el servidor.",
        });
      }
    }
  });
});

document.getElementById("editButton").addEventListener("click", async () => {
  if (selectedUsers.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Error",
      text: "❌ Por favor, seleccione al menos 1 usuario a actualizar.",
    });
    return;
  }

  // Preguntar confirmación antes de modificar
  Swal.fire({
    title: "¿Estás seguro de querer modificar estos Usuario/s?",
    text: "¡Los cambios se guardarán permanentemente!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, modificar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch("http://localhost:3000/updateUsers", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ selectedUsers }),
        });

        const result = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Modificaciones exitosas",
            text: "✅ Los usuarios fueron actualizados correctamente.",
            confirmButtonText: "Ok",
          }).then(() => {
            fetchUsers(); // Recargar la lista de usuarios
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "❌ " + result.error,
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error de conexión",
          text: "❌ No se pudo conectar con el servidor.",
        });
      }
    }
  });
});

// Cerrar diálogos
document.querySelectorAll(".close").forEach((closeBtn) => {
  closeBtn.addEventListener("click", () => {
    closeBtn.closest(".modal").style.display = "none";
  });
});

// Cerrar diálogos al hacer clic fuera del contenido
window.addEventListener("click", (event) => {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
});

// Lógica para agregar usuario
// document.getElementById("addUserForm").addEventListener("submit", (e) => {
//   e.preventDefault();
//   alert("Usuario agregado");
//   document.getElementById("addDialog").style.display = "none";
// });

// Lógica para eliminar usuario
document.getElementById("confirmDelete").addEventListener("click", () => {
  alert("Usuario eliminado");
  document.getElementById("deleteDialog").style.display = "none";
});

// Lógica para modificar usuario
document.getElementById("editUserForm").addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Usuario modificado");
  document.getElementById("editDialog").style.display = "none";
});

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("addUserForm");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (password.length < 8) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "❌ La contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (!hasNumber || !hasLetter || !hasSpecial) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "❌ La contraseña debe contener al menos un número y una letra y un caracter especial.",
      });
      return;
    }

    const userData = { name, email, password, role };

    try {
      const response = await fetch("http://localhost:3000/registUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Registro exitoso",
          text: "✅ Usuario registrado correctamente. Pendiente a verificacion.",
          confirmButtonText: "Ok",
        }).then(() => {
          document.getElementById("addDialog").style.display = "none";
          fetchUsers();
        });
      } else if (response.status === 409) {
        // Si el correo ya existe
        Swal.fire({
          icon: "error",
          title: "Correo duplicado",
          text: "❌ Este correo electrónico ya está registrado.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "❌ " + result.error,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "❌ No se pudo conectar con el servidor.",
      });
    }
  });
});

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("pi-eye");
    icon.classList.add("pi-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("pi-eye-slash");
    icon.classList.add("pi-eye");
  }
}
