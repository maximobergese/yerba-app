// script.js — Lógica del frontend. Habla con el backend vía fetch().

// Cambiá esta URL por la de tu servidor cuando lo subas a producción.
// En desarrollo local, si corrés el backend con "npm start", queda en este puerto.
const API_URL = 'http://localhost:3000/api';

let modoAdmin = false;
let claveAdminGuardada = '';
let estrellaSeleccionada = 0;
let opinionesCache = [];

// ---------- Estrellas del formulario ----------
const botonesEstrella = document.querySelectorAll('.estrella-btn');
botonesEstrella.forEach(btn => {
  btn.addEventListener('click', () => {
    estrellaSeleccionada = parseInt(btn.dataset.valor);
    pintarEstrellas();
  });
});

function pintarEstrellas() {
  botonesEstrella.forEach(btn => {
    const v = parseInt(btn.dataset.valor);
    btn.classList.toggle('activa', v <= estrellaSeleccionada);
  });
  const ayuda = document.getElementById('ayudaEstrellas');
  ayuda.textContent = estrellaSeleccionada > 0
    ? estrellaSeleccionada + " de 5 estrellas"
    : "Tocá una estrella para puntuar";
}

// ---------- Envío del formulario ----------
const form = document.getElementById('formOpinion');
const mensajeEstado = document.getElementById('mensajeEstado');
const btnEnviar = document.getElementById('btnEnviar');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensajeEstado.textContent = '';
  mensajeEstado.className = 'mensaje-estado';

  if (estrellaSeleccionada === 0) {
    mensajeEstado.textContent = 'Elegí un puntaje de 1 a 5 estrellas.';
    mensajeEstado.className = 'mensaje-estado error';
    return;
  }

  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const ubicacion = document.getElementById('ubicacion').value.trim();
  const marca = document.getElementById('marca').value.trim();
  const texto = document.getElementById('opinionTexto').value.trim();

  if (!nombre || !apellido || !ubicacion || !marca || !texto) {
    mensajeEstado.textContent = 'Completá todos los campos.';
    mensajeEstado.className = 'mensaje-estado error';
    return;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = 'Publicando...';

  try {
    const resp = await fetch(`${API_URL}/opiniones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre, apellido, ubicacion, marca,
        estrellas: estrellaSeleccionada,
        texto
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error || 'Error desconocido');
    }

    mensajeEstado.textContent = '¡Gracias por tu opinión!';
    mensajeEstado.className = 'mensaje-estado exito';
    form.reset();
    estrellaSeleccionada = 0;
    pintarEstrellas();
    await cargarOpiniones();
  } catch (err) {
    console.error(err);
    mensajeEstado.textContent = 'Algo falló al publicar. Probá de nuevo.';
    mensajeEstado.className = 'mensaje-estado error';
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Publicar opinión';
  }
});

// ---------- Carga y render de opiniones ----------
async function cargarOpiniones() {
  const listaEl = document.getElementById('listaOpiniones');

  try {
    const url = modoAdmin ? `${API_URL}/opiniones/admin` : `${API_URL}/opiniones`;
    const headers = modoAdmin ? { 'x-admin-password': claveAdminGuardada } : {};

    const resp = await fetch(url, { headers });
    if (!resp.ok) throw new Error('No se pudieron cargar las opiniones');

    opinionesCache = await resp.json();
    renderLista();
  } catch (err) {
    console.error(err);
    listaEl.innerHTML = '<div class="vacio"><strong>No se pudieron cargar las opiniones</strong>Revisá que el servidor esté corriendo y recargá la página.</div>';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatearFecha(fechaStr) {
  const f = new Date(fechaStr);
  return f.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderLista() {
  const listaEl = document.getElementById('listaOpiniones');
  const contadorEl = document.getElementById('contador');

  const visibles = modoAdmin
    ? opinionesCache
    : opinionesCache.filter(o => !o.oculta);

  const totalVisible = modoAdmin
    ? opinionesCache.filter(o => !o.oculta).length
    : opinionesCache.length;

  contadorEl.textContent = totalVisible === 0
    ? ''
    : totalVisible + (totalVisible === 1 ? ' opinión publicada' : ' opiniones publicadas');

  if (visibles.length === 0) {
    listaEl.innerHTML = `<div class="vacio"><strong>Todavía no hay opiniones</strong>Sé la primera persona en contar qué yerba estás tomando.</div>`;
    return;
  }

  listaEl.innerHTML = '<div class="lista-opiniones">' + visibles.map(o => {
    const estrellasHtml = '★'.repeat(o.estrellas) + '☆'.repeat(5 - o.estrellas);
    const ocultaClass = (modoAdmin && o.oculta) ? ' oculta-admin' : '';
    const badge = (modoAdmin && o.oculta) ? '<span class="badge-oculta">Oculta</span><br>' : '';
    const btnAdmin = modoAdmin
      ? `<button class="btn-ocultar" onclick="alternarOculta(${o.id}, ${o.oculta ? 'false' : 'true'})">${o.oculta ? 'Mostrar' : 'Ocultar'}</button>`
      : '';

    return `
      <div class="opinion${ocultaClass}">
        <div class="opinion-header">
          <div>
            ${badge}
            <p class="opinion-marca">${escapeHtml(o.marca)}</p>
            <p class="opinion-meta">
              <span>${escapeHtml(o.nombre)} ${escapeHtml(o.apellido)}</span>
              <span>·</span>
              <span>${escapeHtml(o.ubicacion)}</span>
              <span>·</span>
              <span>${formatearFecha(o.fecha_creacion)}</span>
            </p>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="opinion-estrellas">${estrellasHtml}</span>
            ${btnAdmin}
          </div>
        </div>
        <p class="opinion-texto">${escapeHtml(o.texto)}</p>
      </div>
    `;
  }).join('') + '</div>';
}

async function alternarOculta(id, nuevoValor) {
  try {
    const resp = await fetch(`${API_URL}/opiniones/${id}/ocultar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': claveAdminGuardada
      },
      body: JSON.stringify({ oculta: nuevoValor })
    });

    if (!resp.ok) throw new Error('No se pudo actualizar');

    await cargarOpiniones();
  } catch (err) {
    console.error(err);
    alert('No se pudo actualizar la opinión. Probá de nuevo.');
  }
}

// ---------- Modo admin ----------
const btnAbrirAdmin = document.getElementById('btnAbrirAdmin');
const modalContainer = document.getElementById('modalAdminContainer');
const barraAdminEl = document.getElementById('barraAdmin');

btnAbrirAdmin.addEventListener('click', () => {
  if (modoAdmin) return;
  mostrarModalClave();
});

function mostrarModalClave() {
  modalContainer.innerHTML = `
    <div class="modal-overlay" id="overlayModal">
      <div class="modal">
        <h3>Acceso administrador</h3>
        <input type="password" id="inputClave" placeholder="Contraseña" style="width:100%; padding:11px 13px; border:1.5px solid var(--linea); border-radius:8px; font-size:15px;">
        <p class="modal-error" id="errorClave"></p>
        <div class="modal-botones">
          <button class="modal-cancelar" id="btnCancelarModal">Cancelar</button>
          <button class="modal-confirmar" id="btnConfirmarModal">Entrar</button>
        </div>
      </div>
    </div>
  `;

  const overlay = document.getElementById('overlayModal');
  const inputClave = document.getElementById('inputClave');
  const errorClave = document.getElementById('errorClave');

  inputClave.focus();

  document.getElementById('btnCancelarModal').addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) modalContainer.innerHTML = '';
  });

  async function intentarEntrar() {
    const claveIngresada = inputClave.value;
    try {
      const resp = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: claveIngresada })
      });
      const data = await resp.json();

      if (resp.ok && data.ok) {
        modoAdmin = true;
        claveAdminGuardada = claveIngresada;
        modalContainer.innerHTML = '';
        mostrarBarraAdmin();
        await cargarOpiniones();
      } else {
        errorClave.textContent = 'Contraseña incorrecta.';
        inputClave.value = '';
        inputClave.focus();
      }
    } catch (err) {
      console.error(err);
      errorClave.textContent = 'No se pudo verificar. Revisá la conexión al servidor.';
    }
  }

  document.getElementById('btnConfirmarModal').addEventListener('click', intentarEntrar);
  inputClave.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') intentarEntrar();
  });
}

function mostrarBarraAdmin() {
  barraAdminEl.innerHTML = `
    <div class="barra-admin">
      Modo administrador activo — podés ocultar o mostrar opiniones
      <button id="btnSalirAdmin">Salir</button>
    </div>
  `;
  document.getElementById('btnSalirAdmin').addEventListener('click', async () => {
    modoAdmin = false;
    claveAdminGuardada = '';
    barraAdminEl.innerHTML = '';
    await cargarOpiniones();
  });
}

// ---------- Inicio ----------
pintarEstrellas();
cargarOpiniones();
