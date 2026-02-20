// =======================
// HOME (index) - app.js ✅ Dashboard Resumen (SIN BOTONES)
// - Lee /cafeterias
// - Pinta resumen en #contenedorResumen
// - KPIs: #kpi_total, #kpi_activas, #kpi_alertas
// - Refresco: 2s
// =======================

const API_BASE = "https://698a18b7c04d974bc6a1598e.mockapi.io/api/v1";
const API_CAFETERIAS = `${API_BASE}/cafeterias`;

// DOM (index)
const $contenedorResumen = document.getElementById("contenedorResumen");
const $estadoConexion = document.getElementById("estadoConexion");
const $btnRecargar = document.getElementById("btnRecargar");

// KPIs (index)
const $kpiTotal = document.getElementById("kpi_total");
const $kpiActivas = document.getElementById("kpi_activas");
const $kpiAlertas = document.getElementById("kpi_alertas");

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

function norm(s) {
  return String(s ?? "").trim();
}

function fechaCorta(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return "—"; }
}

function hayAlerta(d) {
  return Boolean(d?.alerta_activa);
}

function contarAlertasCafeteria(caf) {
  const d = caf?.dispositivos || {};
  const arr = [d.cafetera, d.crepera, d.molino].filter(Boolean);
  return arr.filter(hayAlerta).length;
}

function badgeActiva(activa) {
  if (activa) return `<span class="badge rounded-pill text-bg-success">Activa</span>`;
  return `<span class="badge rounded-pill text-bg-secondary">Inactiva</span>`;
}

function badgeAlertas(n) {
  const cls = n > 0 ? "text-bg-warning" : "text-bg-info";
  return `<span class="badge rounded-pill ${cls}">Alertas: ${n}</span>`;
}

// =======================
// Render resumen cafeterías (SIN botones)
// =======================
function cardCafeteriaResumenHTML(caf) {
  const nombre = norm(caf?.nombre) || "CAFETERÍA";
  const activa = Boolean(caf?.activa);
  const alertas = contarAlertasCafeteria(caf);

  const actualizado = caf?.actualizado_en || caf?.updatedAt || caf?.createdAt || null;
  const id = caf?.id ?? "—";

  return `
    <div class="col-12">
      <div class="tarjeta-vidrio p-3">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">

          <div>
            <div class="text-white fw-semibold fs-5">${nombre}</div>
            <div class="text-white-50 small">
              ID: ${id} · Actualizado: ${actualizado ? fechaCorta(actualizado) : "—"}
            </div>
          </div>

          <div class="d-flex gap-2 flex-wrap align-items-center">
            ${badgeActiva(activa)}
            ${badgeAlertas(alertas)}
          </div>

        </div>

        <div class="text-white-50 small mt-2">
          ${activa
            ? `Operación disponible en <b>Control</b>. Historial/alertas en <b>Monitoreo</b>.`
            : `Esta cafetería está en baja. Puedes activarla desde <b>Admin</b>.`
          }
        </div>
      </div>
    </div>
  `;
}

function renderResumen(lista) {
  if (!$contenedorResumen) return;

  const arr = Array.isArray(lista) ? lista : [];

  // KPIs
  const total = arr.length;
  const activas = arr.filter(x => Boolean(x?.activa)).length;
  const alertas = arr.reduce((acc, c) => acc + contarAlertasCafeteria(c), 0);

  if ($kpiTotal) $kpiTotal.textContent = String(total);
  if ($kpiActivas) $kpiActivas.textContent = String(activas);
  if ($kpiAlertas) $kpiAlertas.textContent = String(alertas);

  if (!arr.length) {
    $contenedorResumen.innerHTML = `<div class="text-white-50">No hay cafeterías registradas. Ve a <b>Admin</b> y agrega una.</div>`;
    return;
  }

  $contenedorResumen.innerHTML = arr.map(cardCafeteriaResumenHTML).join("");
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

    const resp = await fetch(API_CAFETERIAS, { cache: "no-store" });
    if (!resp.ok) throw new Error("No se pudo leer /cafeterias");

    const data = await resp.json();
    renderResumen(data);
    setConexion(true);
  } catch (e) {
    console.error(e);
    setConexion(false);

    if ($contenedorResumen) {
      $contenedorResumen.innerHTML = `<div class="text-white-50">No se pudo cargar. Revisa MockAPI y la URL.</div>`;
    }

    if ($kpiTotal) $kpiTotal.textContent = "—";
    if ($kpiActivas) $kpiActivas.textContent = "—";
    if ($kpiAlertas) $kpiAlertas.textContent = "—";
  }
}

// Botón + auto refresh (2s)
if ($btnRecargar) $btnRecargar.addEventListener("click", cargarCafeterias);

cargarCafeterias();
setInterval(cargarCafeterias, 2000);