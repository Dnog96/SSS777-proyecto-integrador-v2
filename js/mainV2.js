// ── URL base de la API ──
const API_URL = "https://6a637495b30b52361e1a51bf.mockapi.io/sss777";

// ── Estado del carrito ──
let carrito = [];

// ══════════════════════════════════════════
// NAVEGACIÓN SPA
// ══════════════════════════════════════════

function mostrarVista(nombreVista) {
  document.querySelectorAll(".view").forEach(function(view) {
    view.style.display = "none";
  });

  const vista = document.getElementById("view-" + nombreVista);
  if (vista) vista.style.display = "block";

  document.querySelectorAll(".nav-link").forEach(function(link) {
    link.classList.remove("active");
    if (link.dataset.view === nombreVista) {
      link.classList.add("active");
    }
  });

  history.pushState({ vista: nombreVista }, "", "#" + nombreVista);

  if (nombreVista === "inicio") cargarProductos();
  if (nombreVista === "alta") cargarTablaProductos();
}

document.querySelectorAll(".nav-link").forEach(function(link) {
  link.addEventListener("click", function(e) {
    e.preventDefault();
    mostrarVista(this.dataset.view);
  });
});

window.addEventListener("popstate", function(e) {
  if (e.state && e.state.vista) {
    mostrarVista(e.state.vista);
  }
});

window.addEventListener("load", function() {
  const hash = window.location.hash.replace("#", "") || "inicio";
  mostrarVista(hash);
});

document.querySelector(".nav__toggle").addEventListener("click", function() {
  document.querySelector(".nav__links").classList.toggle("open");
});


// ══════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════

function mostrarToast(mensaje, tipo = "ok") {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.className = "toast toast--" + tipo + " toast--visible";

  setTimeout(function() {
    toast.className = "toast";
  }, 3000);
}


// ══════════════════════════════════════════
// HOME — PRODUCTOS
// ══════════════════════════════════════════

async function cargarProductos() {
  const grid = document.getElementById("productos-grid");
  grid.innerHTML = "<p class='loading'>Cargando productos...</p>";

  try {
    const response = await fetch(API_URL + "/Productos");
    const productos = await response.json();

    if (productos.length === 0) {
      grid.innerHTML = "<p class='loading'>No hay productos cargados todavía.</p>";
      return;
    }

    grid.innerHTML = "";
    productos.forEach(function(producto) {
      grid.innerHTML += crearCardHTML(producto);
    });

    document.querySelectorAll(".btn-agregar-carrito").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const id     = this.dataset.id;
        const nombre = this.dataset.nombre;
        const precio = Number(this.dataset.precio);
        const foto   = this.dataset.foto;
        agregarAlCarrito({ id, nombre, precio, foto });
      });
    });

  } catch (error) {
    grid.innerHTML = "<p class='loading'>Error al cargar los productos.</p>";
  }
}

function crearCardHTML(producto) {
  return `
    <article class="card">
      <div class="card__img-wrap">
        <img src="${producto.foto || 'img/placeholder.jpg'}" alt="${producto.nombre}" loading="lazy">
        <span class="card__badge">Nuevo</span>
      </div>
      <div class="card__body">
        <span class="card__category">${producto.categoria}</span>
        <h3 class="card__title">${producto.nombre}</h3>
        <p class="card__desc">${producto.descCorta}</p>
        <div class="card__footer">
          <span class="card__price">$${Number(producto.precio).toLocaleString("es-AR")}</span>
          <button class="btn btn--small btn-agregar-carrito"
            data-id="${producto.id}"
            data-nombre="${producto.nombre}"
            data-precio="${producto.precio}"
            data-foto="${producto.foto || ''}">
            Agregar <i class="fas fa-shopping-bag"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}


// ══════════════════════════════════════════
// CARRITO
// ══════════════════════════════════════════

function agregarAlCarrito(producto) {
  const existente = carrito.find(function(item) {
    return item.id === producto.id;
  });

  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  actualizarContadorCarrito();
  renderizarCarrito();
  mostrarToast("✓ " + producto.nombre + " agregado al carrito");
}

function actualizarContadorCarrito() {
  const total = carrito.reduce(function(acc, item) {
    return acc + item.cantidad;
  }, 0);
  document.getElementById("cart-count").textContent = total;
}

function renderizarCarrito() {
  const body = document.getElementById("carrito-body");

  if (carrito.length === 0) {
    body.innerHTML = "<p class='carrito-vacio'>Tu carrito está vacío.</p>";
    document.getElementById("carrito-total").textContent = "$0";
    return;
  }

  body.innerHTML = "";
  let total = 0;

  carrito.forEach(function(item) {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    body.innerHTML += `
      <div class="carrito-item" id="carrito-item-${item.id}">
        <img src="${item.foto || 'img/placeholder.jpg'}" alt="${item.nombre}">
        <div class="carrito-item__info">
          <p class="carrito-item__nombre">${item.nombre}</p>
          <p class="carrito-item__precio">$${Number(item.precio).toLocaleString("es-AR")}</p>
        </div>
        <div class="carrito-item__controles">
          <button class="btn-cantidad" data-id="${item.id}" data-accion="restar">−</button>
          <span>${item.cantidad}</span>
          <button class="btn-cantidad" data-id="${item.id}" data-accion="sumar">+</button>
        </div>
        <div class="carrito-item__subtotal">
          $${subtotal.toLocaleString("es-AR")}
        </div>
        <button class="btn-eliminar-item" data-id="${item.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  });

  document.getElementById("carrito-total").textContent = "$" + total.toLocaleString("es-AR");

  document.querySelectorAll(".btn-cantidad").forEach(function(btn) {
    btn.addEventListener("click", function() {
      cambiarCantidad(this.dataset.id, this.dataset.accion);
    });
  });

  document.querySelectorAll(".btn-eliminar-item").forEach(function(btn) {
    btn.addEventListener("click", function() {
      eliminarDelCarrito(this.dataset.id);
    });
  });
}

function cambiarCantidad(id, accion) {
  const item = carrito.find(function(i) { return i.id === id; });
  if (!item) return;

  if (accion === "sumar") {
    item.cantidad++;
  } else {
    item.cantidad--;
    if (item.cantidad === 0) {
      eliminarDelCarrito(id);
      return;
    }
  }

  actualizarContadorCarrito();
  renderizarCarrito();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(function(item) { return item.id !== id; });
  actualizarContadorCarrito();
  renderizarCarrito();
  mostrarToast("Producto eliminado del carrito", "error");
}

document.getElementById("btn-carrito").addEventListener("click", function(e) {
  e.preventDefault();
  abrirCarrito();
});

document.getElementById("btn-cerrar-carrito").addEventListener("click", cerrarCarrito);

document.getElementById("modal-overlay").addEventListener("click", function(e) {
  if (e.target === this) cerrarCarrito();
});

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") cerrarCarrito();
});

function abrirCarrito() {
  document.getElementById("modal-overlay").style.display = "flex";
}

function cerrarCarrito() {
  document.getElementById("modal-overlay").style.display = "none";
}

document.getElementById("btn-confirmar-pedido").addEventListener("click", confirmarPedido);

async function confirmarPedido() {
  if (carrito.length === 0) {
    mostrarToast("El carrito está vacío", "error");
    return;
  }

  const total = carrito.reduce(function(acc, item) {
    return acc + item.precio * item.cantidad;
  }, 0);

  const pedido = {
    productos: carrito,
    total: total,
    fecha: new Date().toLocaleString("es-AR")
  };

  try {
    await fetch(API_URL + "/Carrito", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido)
    });

    carrito = [];
    actualizarContadorCarrito();
    renderizarCarrito();
    cerrarCarrito();
    mostrarToast("✓ Pedido confirmado con éxito");

  } catch (error) {
    mostrarToast("Error al confirmar el pedido", "error");
  }
}


// ══════════════════════════════════════════
// FORMULARIO ALTA — VALIDACIÓN
// ══════════════════════════════════════════

function mostrarError(id, mensaje) {
  document.getElementById(id).textContent = mensaje;
}

function limpiarError(id) {
  document.getElementById(id).textContent = "";
}

function validarCampoAlta(campo) {
  const valor = campo.value.trim();

  switch (campo.id) {
    case "nombre":
      if (!valor) return "El nombre es requerido";
      if (valor.length < 3) return "Mínimo 3 caracteres";
      if (valor.length > 80) return "Máximo 80 caracteres";
      return null;

    case "precio":
      if (!valor) return "El precio es requerido";
      if (Number(valor) < 1) return "El precio debe ser mayor a 0";
      if (Number(valor) > 9999999) return "El precio es demasiado alto";
      return null;

    case "stock":
      if (valor === "") return "El stock es requerido";
      if (Number(valor) < 0) return "El stock no puede ser negativo";
      if (Number(valor) > 9999) return "El stock máximo es 9999";
      return null;

    case "marca":
      if (!valor) return "La marca es requerida";
      if (valor.length < 2) return "Mínimo 2 caracteres";
      if (valor.length > 50) return "Máximo 50 caracteres";
      return null;

    case "categoria":
      if (!valor) return "Seleccioná una categoría";
      return null;

    case "desc-corta":
      if (!valor) return "La descripción corta es requerida";
      if (valor.length < 10) return "Mínimo 10 caracteres";
      if (valor.length > 120) return "Máximo 120 caracteres";
      return null;

    case "desc-larga":
      if (!valor) return "La descripción larga es requerida";
      if (valor.length < 30) return "Mínimo 30 caracteres";
      if (valor.length > 1000) return "Máximo 1000 caracteres";
      return null;

    case "foto":
      if (!campo.files || campo.files.length === 0) return "La foto es requerida";
      return null;
  }
  return null;
}

["nombre", "precio", "stock", "marca", "categoria", "desc-corta", "desc-larga", "foto"].forEach(function(id) {
  const campo = document.getElementById(id);
  if (!campo) return;
  campo.addEventListener("blur", function() {
    const error = validarCampoAlta(this);
    if (error) {
      mostrarError("error-" + id, error);
    } else {
      limpiarError("error-" + id);
    }
  });
});

document.getElementById("form-alta").addEventListener("submit", async function(e) {
  e.preventDefault();

  const campos = ["nombre", "precio", "stock", "marca", "categoria", "desc-corta", "desc-larga", "foto"];
  let formularioValido = true;

  campos.forEach(function(id) {
    const campo = document.getElementById(id);
    const error = validarCampoAlta(campo);
    if (error) {
      mostrarError("error-" + id, error);
      formularioValido = false;
    } else {
      limpiarError("error-" + id);
    }
  });

  if (!formularioValido) {
    mostrarToast("Corregí los errores antes de enviar", "error");
    return;
  }

  const producto = {
    nombre:      document.getElementById("nombre").value.trim(),
    precio:      Number(document.getElementById("precio").value),
    stock:       Number(document.getElementById("stock").value),
    marca:       document.getElementById("marca").value.trim(),
    categoria:   document.getElementById("categoria").value,
    descCorta:   document.getElementById("desc-corta").value.trim(),
    descLarga:   document.getElementById("desc-larga").value.trim(),
    envioGratis: document.getElementById("envio-gratis").checked,
    foto:        ""
  };

  try {
    await fetch(API_URL + "/Productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(producto)
    });

    document.getElementById("form-alta").reset();
    mostrarToast("✓ Producto agregado con éxito");
    cargarTablaProductos();

  } catch (error) {
    mostrarToast("Error al agregar el producto", "error");
  }
});


// ══════════════════════════════════════════
// TABLA DE PRODUCTOS
// ══════════════════════════════════════════

async function cargarTablaProductos() {
  const tbody = document.getElementById("tabla-body");
  tbody.innerHTML = "<tr><td colspan='6'>Cargando...</td></tr>";

  try {
    const response  = await fetch(API_URL + "/Productos");
    const productos = await response.json();

    if (productos.length === 0) {
      tbody.innerHTML = "<tr><td colspan='6'>No hay productos cargados.</td></tr>";
      return;
    }

    tbody.innerHTML = "";
    productos.forEach(function(p) {
      tbody.innerHTML += `
        <tr>
          <td>${p.nombre}</td>
          <td>$${Number(p.precio).toLocaleString("es-AR")}</td>
          <td>${p.stock}</td>
          <td>${p.marca}</td>
          <td>${p.categoria}</td>
          <td>
            <button class="btn btn--small btn-eliminar-producto" data-id="${p.id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });

    document.querySelectorAll(".btn-eliminar-producto").forEach(function(btn) {
      btn.addEventListener("click", async function() {
        await eliminarProducto(this.dataset.id);
      });
    });

  } catch (error) {
    tbody.innerHTML = "<tr><td colspan='6'>Error al cargar.</td></tr>";
  }
}

async function eliminarProducto(id) {
  try {
    await fetch(API_URL + "/Productos/" + id, { method: "DELETE" });
    mostrarToast("✓ Producto eliminado");
    cargarTablaProductos();
  } catch (error) {
    mostrarToast("Error al eliminar el producto", "error");
  }
}


// ══════════════════════════════════════════
// FORMULARIO CONTACTO — VALIDACIÓN
// ══════════════════════════════════════════

function validarCampoContacto(campo) {
  const valor = campo.value.trim();

  switch (campo.id) {
    case "contacto-nombre":
      if (!valor) return "El nombre es requerido";
      if (valor.length < 2) return "Mínimo 2 caracteres";
      return null;

    case "contacto-email":
      if (!valor) return "El email es requerido";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) return "Formato inválido — ej: usuario@dominio.com";
      return null;

    case "comentarios":
      if (!valor) return "Los comentarios son requeridos";
      if (valor.length < 10) return "Mínimo 10 caracteres";
      if (valor.length > 500) return "Máximo 500 caracteres";
      return null;
  }
  return null;
}

["contacto-nombre", "contacto-email", "comentarios"].forEach(function(id) {
  const campo = document.getElementById(id);
  if (!campo) return;
  campo.addEventListener("blur", function() {
    const error = validarCampoContacto(this);
    if (error) {
      mostrarError("error-" + id, error);
    } else {
      limpiarError("error-" + id);
    }
  });
});

document.getElementById("form-contacto").addEventListener("submit", function(e) {
  e.preventDefault();

  const campos = ["contacto-nombre", "contacto-email", "comentarios"];
  let formularioValido = true;

  campos.forEach(function(id) {
    const campo = document.getElementById(id);
    const error = validarCampoContacto(campo);
    if (error) {
      mostrarError("error-" + id, error);
      formularioValido = false;
    } else {
      limpiarError("error-" + id);
    }
  });

  if (!formularioValido) {
    mostrarToast("Corregí los errores antes de enviar", "error");
    return;
  }

  document.getElementById("form-contacto").reset();
  mostrarToast("✓ Mensaje enviado con éxito");
});