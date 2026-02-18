// =======================
// HOME (index) - app.js  ✅ para /cafeterias
// =======================

const API_BASE = "https://698a18b7c04d974bc6a1598e.mockapi.io/api/v1";
const API_CAFETERIAS = `${API_BASE}/cafeterias`;

// DOM
const $contenedor = document.getElementById("contenedorDispositivos");
const $estadoConexion = document.getElementById("estadoConexion");
const $apiBase = document.getElementById("apiBase");
const $btnRecargar = document.getElementById("btnRecargar");

// KPIs (opcionales)
const $kpiDispositivos = document.getElementById("kpiDispositivos");
const $kpiAlertas = document.getElementById("kpiAlertas");
const $kpiActualizacion = document.getElementById("kpiActualizacion");

if ($apiBase) $apiBase.textContent = API_BASE;

// =======================
// Helpers
// =======================
function setConexion(ok) {
  if (!$estadoConexion) return;
  if (ok) {
    $estadoConexion.textContent = "Conectado";
    $estadoConexion.className = "badge rounded-pill text-bg-success";
  } else {
    $estadoConexion.textContent = "Error API";
    $estadoConexion.className = "badge rounded-pill text-bg-danger";
  }
}

function horaCorta(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleTimeString(); } catch { return "—"; }
}

function fechaCorta(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return "—"; }
}

function norm(s) {
  return String(s ?? "").trim();
}

function tipoBonito(t) {
  t = norm(t).toLowerCase();
  if (t === "cafetera") return "Cafetera";
  if (t === "crepera") return "Crepera";
  if (t === "molino") return "Molino";
  return t || "—";
}

// =======================
// “Bonito” por dispositivo
// =======================
const CAF_ITEMS = [
  { key: "purga", label: "Purgación de lanceta" },
  { key: "lanceta", label: "Lanceta para cremar leche" },
  { key: "extraccion", label: "Extracción del café" },
  { key: "filtro", label: "Filtro de café" },
  { key: "agua", label: "Salida de agua caliente" }
];

function textoCafeteraBonito(d) {
  const v = d?.variables || {};
  const activos = CAF_ITEMS
    .filter(it => Boolean(v[`${it.key}_on`]))
    .map(it => it.label);

  if (!activos.length) return "apagada";
  return `encendida: ${activos.join(", ")}`;
}

function textoCreperaBonito(d) {
  const t = Number(d?.variables?.temperatura_c ?? 0);
  if (t === 0) return `apagada — 0°C`;
  return `${norm(d?.estado) || "—"} — ${t}°C`;
}

function textoMolinoBonito(d) {
  const estado = norm(d?.estado);
  const tipo = norm(d?.variables?.molienda_tipo);
  if (estado) return estado;                 // ej: molienda_medio
  if (tipo) return `molienda_${tipo}`;       // ej: molienda_fino
  return "molienda_medio";
}

function estadoBonito(d) {
  const tipo = norm(d?.tipo).toLowerCase();
  if (tipo === "cafetera") return textoCafeteraBonito(d);
  if (tipo === "crepera") return textoCreperaBonito(d);
  if (tipo === "molino") return textoMolinoBonito(d);
  return norm(d?.estado) || "—";
}

function hayAlerta(d) {
  return Boolean(d?.alerta_activa);
}

function msgAlerta(d) {
  return norm(d?.mensaje_alerta);
}

function badgePunto(alerta, estadoTxt) {
  if (alerta) return "alerta";
  if ((estadoTxt || "").toLowerCase().includes("apagada")) return "apagada";
  return "";
}

// =======================
// Render de cafeterías (cada una trae 3 dispositivos)
// =======================
function cardDispositivoHTML(d) {
  const estadoTxt = estadoBonito(d);
  const alerta = hayAlerta(d);
  const punto = badgePunto(alerta, estadoTxt);
  const msg = msgAlerta(d);

  return `
    <div class="mini-card">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="text-white-50 small">${tipoBonito(d?.tipo)}</div>
          <div class="text-white fw-semibold">${norm(d?.nombre) || "—"}</div>
        </div>
        <div class="text-white-50 small">
          <span class="punto ${punto}"></span>
        </div>
      </div>

      <div class="text-white mt-1">
        ${alerta ? `<span class="estado estado-alerta">ALERTA</span>` : `<span class="estado">${estadoTxt}</span>`}
      </div>

      ${msg ? `<div class="text-warning small mt-1">⚠ ${msg}</div>` : ``}
    </div>
  `;
}

function cardCafeteriaHTML(caf) {
  const nombre = norm(caf?.nombre) || "CAFETERÍA";
  const activa = Boolean(caf?.activa);

  const disp = caf?.dispositivos || {};
  const lista = [disp.cafetera, disp.crepera, disp.molino].filter(Boolean);

  const alertasActivas = lista.filter(hayAlerta).length;

  return `
    <div class="col-12">
      <div class="tarjeta-dispositivo borde-dorado">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="etiqueta-tipo">Cafetería</div>
            <div class="h5 text-white mb-0">${nombre}</div>
            <div class="text-white-50 small mt-1">
              ${activa ? "Activa" : "Inactiva"} · Alertas: ${alertasActivas}
            </div>
          </div>
          <div class="text-white-50 small">
            ID: ${caf?.id ?? "—"}<br>
            ${caf?.actualizado_en ? `Act.: ${horaCorta(caf.actualizado_en)}` : ""}
          </div>
        </div>

        <div class="grid-3 mt-3">
          ${lista.map(cardDispositivoHTML).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderCafeterias(data) {
  if (!$contenedor) return;

  const lista = Array.isArray(data) ? data : [];
  $contenedor.innerHTML = "";

  // KPIs
  const totalCaf = lista.length;

  // total “dispositivos” = cafeterías * 3 (si existen)
  const totalDisp = lista.reduce((acc, c) => {
    const d = c?.dispositivos || {};
    return acc + (d.cafetera ? 1 : 0) + (d.crepera ? 1 : 0) + (d.molino ? 1 : 0);
  }, 0);

  const totalAlertas = lista.reduce((acc, c) => {
    const d = c?.dispositivos || {};
    const arr = [d.cafetera, d.crepera, d.molino].filter(Boolean);
    return acc + arr.filter(hayAlerta).length;
  }, 0);

  const ultima = lista
    .map(x => x?.actualizado_en)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  if ($kpiDispositivos) $kpiDispositivos.textContent = String(totalDisp);
  if ($kpiAlertas) $kpiAlertas.textContent = String(totalAlertas);
  if ($kpiActualizacion) $kpiActualizacion.textContent = ultima ? horaCorta(ultima) : "—";

  if (!lista.length) {
    $contenedor.innerHTML = `<div class="text-white-50">No hay cafeterías registradas.</div>`;
    return;
  }

  $contenedor.innerHTML = lista.map(cardCafeteriaHTML).join("");
}

// =======================
// Cargar cafeterías
// =======================
async function cargarCafeterias() {
  try {
    if ($estadoConexion) {
      $estadoConexion.textContent = "Conectando...";
      $estadoConexion.className = "badge rounded-pill text-bg-warning";
    }

    const resp = await fetch(API_CAFETERIAS);
    if (!resp.ok) throw new Error("No se pudo leer /cafeterias");

    const data = await resp.json();
    renderCafeterias(data);

    setConexion(true);
  } catch (e) {
    console.error(e);
    setConexion(false);

    if ($contenedor) {
      $contenedor.innerHTML = `<div class="text-white-50">No se pudo cargar. Revisa MockAPI y la URL.</div>`;
    }
    if ($kpiDispositivos) $kpiDispositivos.textContent = "—";
    if ($kpiAlertas) $kpiAlertas.textContent = "—";
    if ($kpiActualizacion) $kpiActualizacion.textContent = "—";
  }
}

// Botón + auto refresh
if ($btnRecargar) $btnRecargar.addEventListener("click", cargarCafeterias);
cargarCafeterias();
setInterval(cargarCafeterias, 2000);
