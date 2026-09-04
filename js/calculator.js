// ══════════════════════════════════════════
//  DAK Calculator — v7 Redesign
//  Single-page layout with sticky sidebar
// ══════════════════════════════════════════

const CONFIG_KEY = 'dak-calculator-config';
const CONFIG_VERSION = 6; // subir al cambiar la estructura del config. 6 = split pago unico / mensual.

function getConfig() {
    const defaults = {
        _v: CONFIG_VERSION,
        serviciosBase: JSON.parse(JSON.stringify(SERVICIOS_BASE)),
        preciosFijos: JSON.parse(JSON.stringify(PRECIOS_FIJOS)),
        perfilesCliente: JSON.parse(JSON.stringify(PERFILES_CLIENTE)),
        factoresExtra: JSON.parse(JSON.stringify(FACTORES_EXTRA))
    };
    try {
        const saved = localStorage.getItem(CONFIG_KEY);
        if (saved) {
            const p = JSON.parse(saved);
            if (p._v !== CONFIG_VERSION) {
                console.info('[DAK] Config version mismatch — reseteando a defaults.');
                return defaults;
            }
            return {
                _v: CONFIG_VERSION,
                serviciosBase: { ...defaults.serviciosBase, ...(p.serviciosBase || {}) },
                preciosFijos: { ...defaults.preciosFijos, ...(p.preciosFijos || {}) },
                perfilesCliente: { ...defaults.perfilesCliente, ...(p.perfilesCliente || {}) },
                factoresExtra: { ...defaults.factoresExtra, ...(p.factoresExtra || {}) },
            };
        }
    } catch (e) { console.error('[DAK] localStorage error:', e); }
    return defaults;
}

const CONFIG = getConfig();

const NIVELES = ['basico', 'avanzado'];
const NIVELES_LABEL = { basico: 'Básico', avanzado: 'Avanzado' };
const PERFIL_LABEL = { bajo: 'Inicial', medio: 'Crecimiento', alto: 'Corporativo' };

// Category icons (Material Symbols)
const CAT_ICONS = {
    'video-foto': 'videocam',
    'diseno': 'palette',
    'web': 'language',
    'marketing': 'ads_click',
    'automatizacion': 'smart_toy',
    'personalizado': 'edit_note',
};

// Perfil de cliente. Es un dato de negocio, no de presentacion: vivia en un <select>
// oculto dentro de la seccion de admin, asi que dejaba de existir si ese bloque no se
// renderizaba. Ahora el DOM lo refleja, no lo posee.
const PERFILES_VALIDOS = Object.keys(PERFILES_CLIENTE);
let perfilActual = 'bajo';
function fijarPerfil(p) {
    perfilActual = PERFILES_VALIDOS.includes(p) ? p : 'bajo';
    return perfilActual;
}

// Qué está elegido y qué recargos están activos. Antes había que preguntárselo al
// DOM leyendo checkboxes ocultos dentro de cada tarjeta.
const seleccionados = new Set();
const extrasActivos = new Set();

let itemsPersonalizados = [];
let isAdmin = sessionStorage.getItem('dak-admin') === 'true';

// ══════════════════════════════════════════
//  ADMIN LOGIN & STATE
// ══════════════════════════════════════════

function actualizarVistaAdmin() {
    isAdmin = sessionStorage.getItem('dak-admin') === 'true';
    // El atributo hidden en vez de style.display: se lee en el HTML, lo respeta el
    // lector de pantalla, y no depende de acertar el display original del elemento.
    const mostrar = (id, visible) => {
        const el = document.getElementById(id);
        if (el) el.hidden = !visible;
    };
    mostrar('btn-admin-login', !isAdmin);
    mostrar('btn-ajustes', isAdmin);
    mostrar('btn-logout', isAdmin);
    mostrar('icon-lock-aprox', !isAdmin);
    // El candado de «cotización oficial» solo lo ve quien puede usarlo. Un control
    // con llave delante de un prospecto es ruido, no seguridad.
    mostrar('label-aprox', isAdmin);
    mostrar('tooltip-aprox', false);
    mostrar('perfil-section', isAdmin);
    mostrar('row-perfil', isAdmin);
    if (isAdmin) { renderPerfiles(); cerrarModalLoginAdmin(); }
    else fijarPerfil('bajo');
    actualizarHoja();
}

// config/credentials.js esta en .gitignore y no se despliega: en produccion da 404
// siempre. Cargarlo con un <script> fijo dejaba ese error en la consola de todos los
// prospectos para una funcion que solo usa el equipo. Se carga al abrir el modal, una
// sola vez, y si no esta el login simplemente no valida.
let cargaAdminCredenciales = null;
function cargarCredencialesAdmin() {
    if (cargaAdminCredenciales) return cargaAdminCredenciales;
    cargaAdminCredenciales = new Promise(resolve => {
        if (typeof ADMIN_CREDENTIALS !== 'undefined') return resolve(true);
        const s = document.createElement('script');
        s.src = 'config/credentials.js?v=6';
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);   // 404 esperado en produccion
        document.head.appendChild(s);
    });
    return cargaAdminCredenciales;
}

function abrirModalLoginAdmin() {
    const modal = document.getElementById('modal-login-admin');
    if (!modal) return;
    cargarCredencialesAdmin();
    modal.setAttribute('aria-hidden', 'false');
    modal.hidden = false;
    document.getElementById('admin-user').value = '';
    document.getElementById('admin-pass').value = '';
    document.getElementById('admin-login-error').hidden = true;
    document.getElementById('admin-user').focus();
}

function cerrarModalLoginAdmin() {
    const modal = document.getElementById('modal-login-admin');
    if (modal) {
        modal.setAttribute('aria-hidden', 'true');
        modal.hidden = true;
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('dak-admin');
    actualizarVistaAdmin();
    cerrarModalAjustes();
}

async function procesarLoginAdmin() {
    await cargarCredencialesAdmin();
    const user = document.getElementById('admin-user').value.trim();
    const pass = document.getElementById('admin-pass').value.trim();
    const errEl = document.getElementById('admin-login-error');
    if (typeof ADMIN_CREDENTIALS !== 'undefined' && user === ADMIN_CREDENTIALS.user && pass === ADMIN_CREDENTIALS.pass) {
        sessionStorage.setItem('dak-admin', 'true');
        errEl.hidden = true;
        actualizarVistaAdmin();
    } else {
        errEl.hidden = false;
    }
}

function mostrarErrorToast(mensaje) {
    const tooltip = document.getElementById('tooltip-aprox');
    if (!tooltip) return;
    tooltip.dataset.originalText = tooltip.dataset.originalText || tooltip.textContent;
    tooltip.textContent = mensaje;
    tooltip.classList.remove('hidden', 'tooltip-error');
    void tooltip.offsetWidth;
    tooltip.classList.add('tooltip-error');
    setTimeout(() => {
        tooltip.classList.remove('tooltip-error');
        tooltip.textContent = tooltip.dataset.originalText;
    }, 2500);
}

// ══════════════════════════════════════════
//  CATÁLOGO — el índice de partidas
// ══════════════════════════════════════════

const esMensual = s => (s && s.recurrencia === 'mensual');

// El sufijo es la unidad del importe, no un pie de página: va pegado a la cifra.
const conUnidad = (importe, mensual) =>
    mensual ? `${fmt(importe)}<span class="mes"> /mes</span>` : fmt(importe);

function renderPartida(s) {
    const mensual = esMensual(s);
    const desc = SERVICE_INFO[s.key] || '';
    let importe;

    if (s.tipo === 'nivel') {
        const desde = CONFIG.serviciosBase[s.key]?.basico ?? 0;
        importe = `<span class="partida__importe"><span class="partida__desde">desde</span>${conUnidad(desde, mensual)}</span>`;
    } else {
        importe = `<span class="partida__importe">${conUnidad(CONFIG.preciosFijos[s.key]?.precio ?? 0, mensual)}</span>`;
    }

    // La primera línea de la descripción sirve de pie: se lee siempre, también en
    // táctil. El tooltip anterior era solo hover y en un móvil no existía.
    const pie = desc ? sanitizeHTML(desc.split('\n')[0]) : '';

    return `
    <div class="partida" id="p-${s.key}" data-key="${s.key}" role="button" tabindex="0" aria-pressed="false">
        <span class="partida__marca">${icono('i-check')}</span>
        <span class="partida__nombre">${sanitizeHTML(s.label)}${mensual ? ' <span class="etiqueta-mes">al mes</span>' : ''}</span>
        ${importe}
        ${pie ? `<span class="partida__pie">${pie}</span>` : ''}
    </div>
    <div class="detalle" id="d-${s.key}" hidden>${renderDetalle(s)}</div>`;
}

function renderDetalle(s) {
    const partes = [];

    if (s.tipo === 'nivel') {
        const precios = CONFIG.serviciosBase[s.key] ?? {};
        const etiquetas = s.tierLabels || {};
        const mensual = esMensual(s);

        partes.push(`
        <div class="campo">
            <span class="campo__rotulo">Cantidad</span>
            <div class="contador">
                <button type="button" class="contador__boton" data-paso="-1" data-key="${s.key}" aria-label="Quitar uno">${icono('i-menos', 'icono--sm')}</button>
                <input type="number" class="contador__valor" id="q-${s.key}" data-key="${s.key}" value="1" min="1" aria-label="Cantidad de ${sanitizeHTML(s.label)}">
                <button type="button" class="contador__boton" data-paso="1" data-key="${s.key}" aria-label="Añadir uno">${icono('i-mas', 'icono--sm')}</button>
            </div>
            <input type="hidden" id="qty-${s.key}" value="1">
        </div>`);

        partes.push(`
        <div class="campo">
            <span class="campo__rotulo">Nivel</span>
            <div class="niveles" role="group" aria-label="Nivel de ${sanitizeHTML(s.label)}">
                ${NIVELES.map(n => `
                <button type="button" class="nivel${n === 'basico' ? ' nivel--activo' : ''}" data-nivel="${n}" data-key="${s.key}" aria-pressed="${n === 'basico'}">
                    <span class="nivel__nombre">${sanitizeHTML(etiquetas[n] || NIVELES_LABEL[n])}</span>
                    <span class="nivel__precio">${conUnidad(precios[n] ?? 0, mensual)}</span>
                </button>`).join('')}
            </div>
            <input type="hidden" id="lvl-${s.key}" value="basico">
        </div>`);
    }

    // Segunda línea de la descripción, cuando la hay (el nivel avanzado)
    const desc = SERVICE_INFO[s.key] || '';
    const resto = desc.split('\n').slice(1).join(' ');
    if (resto) partes.push(`<p class="nota" style="text-align:left">${sanitizeHTML(resto)}</p>`);

    // El coste que aparece más tarde se dice ahora
    const aviso = typeof AVISO_RECURRENTE !== 'undefined' ? AVISO_RECURRENTE[s.key] : null;
    if (aviso) partes.push(`<p class="aviso">${icono('i-aviso', 'icono--sm')}<span>${sanitizeHTML(aviso)}</span></p>`);

    return partes.join('');
}

function renderLibre() {
    return `
    <div class="libre">
        <div class="libre__forma">
            <input type="text" id="custom-nombre" class="campo-texto campo-texto--ancho" placeholder="¿Qué necesitás que no esté en la lista?" maxlength="100">
            <input class="campo-texto ajuste__campo" type="number" id="custom-precio" class="campo-texto campo-texto--cifra" placeholder="S/" min="0">
            <button type="button" id="btn-add-custom" class="accion accion--segunda">${icono('i-mas', 'icono--sm')} Añadir</button>
        </div>
        <div class="libre__forma" style="margin-top:var(--e2)">
            <div class="niveles" role="group" aria-label="Cómo se paga">
                <button type="button" class="nivel nivel--activo" data-libre-rec="unico" aria-pressed="true"><span class="nivel__nombre">Una vez</span></button>
                <button type="button" class="nivel" data-libre-rec="mensual" aria-pressed="false"><span class="nivel__nombre">Cada mes</span></button>
            </div>
        </div>
        <ul id="custom-items-list" style="margin-top:var(--e3)"></ul>
    </div>`;
}

function renderCatalogo() {
    const cont = document.getElementById('catalogo');


    cont.innerHTML = CATEGORIAS.map((cat, i) => {
        const cuerpo = cat.tipo === 'personalizado'
            ? renderLibre()
            : (cat.servicios || []).map(renderPartida).join('');
        // Solo la primera abierta, en cualquier tamaño. Las seis cabeceras dan el
        // mapa del catálogo de un vistazo; treinta y cuatro filas seguidas, no.
        const abierta = i === 0;
        const n = (cat.servicios || []).length;
        return `
        <section class="seccion" data-cat="${cat.id}">
            <button type="button" class="seccion__cabecera" data-cat="${cat.id}" aria-expanded="${abierta}" aria-controls="cuerpo-${cat.id}">
                ${icono(cat.icono || 'i-documento', 'seccion__icono')}
                <span class="seccion__nombre">${sanitizeHTML(cat.label)}</span>
                <span class="seccion__filete"></span>
                <span class="seccion__cuenta" id="cuenta-${cat.id}">${n ? n + ' servicios' : 'a medida'}</span>
                ${icono(abierta ? 'i-arriba' : 'i-abajo', 'seccion__desplegar')}
            </button>
            <div class="seccion__cuerpo" id="cuerpo-${cat.id}" ${abierta ? '' : 'hidden'}>${cuerpo}</div>
        </section>`;
    }).join('');

    renderListaCustom();
    actualizarCuentas();
}

// Una fila plegada tiene que llevar información, no solo un título
function actualizarCuentas() {
    CATEGORIAS.forEach(cat => {
        const el = document.getElementById('cuenta-' + cat.id);
        if (!el) return;
        const servicios = cat.servicios || [];
        if (!servicios.length) {
            el.textContent = itemsPersonalizados.length
                ? itemsPersonalizados.length + ' añadidos'
                : 'a medida';
            return;
        }
        const elegidos = servicios.filter(s => seleccionados.has(s.key)).length;
        el.textContent = elegidos
            ? `${servicios.length} servicios · ${elegidos} elegido${elegidos > 1 ? 's' : ''}`
            : `${servicios.length} servicios`;
    });
}

// ══════════════════════════════════════════
//  INTERACCIÓN
// ══════════════════════════════════════════

// La selección es estado, no una consulta al DOM. Antes vivía en un checkbox
// oculto dentro de cada tarjeta y cuatro funciones distintas recorrían el árbol
// para averiguar lo mismo.
function fijarSeleccion(key, activo) {
    if (activo) seleccionados.add(key); else seleccionados.delete(key);
    const fila = document.getElementById('p-' + key);
    const det = document.getElementById('d-' + key);
    if (fila) {
        fila.classList.toggle('partida--activa', activo);
        fila.setAttribute('aria-pressed', String(activo));
    }
    if (det) det.hidden = !(activo && det.children.length > 0);
    if (!activo) {
        const q = document.getElementById('qty-' + key), v = document.getElementById('q-' + key);
        if (q) q.value = '1';
        if (v) v.value = '1';
    }
}

function alternarPartida(key) {
    fijarSeleccion(key, !seleccionados.has(key));
    actualizarHoja();
    actualizarCuentas();
}

function alternarSeccion(id) {
    const cuerpo = document.getElementById('cuerpo-' + id);
    const boton = document.querySelector('.seccion__cabecera[data-cat="' + id + '"]');
    if (!cuerpo || !boton) return;
    const abrir = cuerpo.hidden;
    cuerpo.hidden = !abrir;
    boton.setAttribute('aria-expanded', String(abrir));
    // Apertura instantánea con fundido del contenido. Animar max-height está
    // prohibido, y grid-template-rows cuesta lo mismo: los dos recalculan layout.
    const uso = boton.querySelector('.seccion__desplegar use');
    if (uso) uso.setAttribute('href', abrir ? '#i-arriba' : '#i-abajo');
}

// Los listeners se montan UNA vez sobre el contenedor. Pintar y escuchar son
// cosas distintas: mezclarlas es como se acaban duplicando y el contador empieza
// a subir de dos en dos.
function montarListeners() {
    const cont = document.getElementById('catalogo');

    cont.addEventListener('click', e => {
        const cabecera = e.target.closest('.seccion__cabecera');
        if (cabecera) return alternarSeccion(cabecera.dataset.cat);

        const paso = e.target.closest('.contador__boton');
        if (paso) {
            const key = paso.dataset.key;
            const oculto = document.getElementById('qty-' + key);
            const visible = document.getElementById('q-' + key);
            const val = Math.max(1, (parseInt(oculto.value) || 1) + parseInt(paso.dataset.paso));
            oculto.value = val; visible.value = val;
            return actualizarHoja();
        }

        const nivel = e.target.closest('.nivel[data-key]');
        if (nivel) {
            const key = nivel.dataset.key;
            nivel.parentElement.querySelectorAll('.nivel').forEach(b => {
                b.classList.remove('nivel--activo');
                b.setAttribute('aria-pressed', 'false');
            });
            nivel.classList.add('nivel--activo');
            nivel.setAttribute('aria-pressed', 'true');
            document.getElementById('lvl-' + key).value = nivel.dataset.nivel;
            return actualizarHoja();
        }

        const rec = e.target.closest('[data-libre-rec]');
        if (rec) {
            rec.parentElement.querySelectorAll('.nivel').forEach(b => {
                b.classList.remove('nivel--activo');
                b.setAttribute('aria-pressed', 'false');
            });
            rec.classList.add('nivel--activo');
            rec.setAttribute('aria-pressed', 'true');
            return;
        }

        if (e.target.closest('#btn-add-custom')) return agregarItemPersonalizado();

        const quitar = e.target.closest('[data-quitar-custom]');
        if (quitar) return eliminarItemPersonalizado(parseInt(quitar.dataset.quitarCustom));

        // Usar los controles del detalle no debe alternar la partida
        if (e.target.closest('.detalle')) return;
        const fila = e.target.closest('.partida');
        if (fila) alternarPartida(fila.dataset.key);
    });

    cont.addEventListener('keydown', e => {
        const fila = e.target.closest('.partida');
        if (fila && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            alternarPartida(fila.dataset.key);
        }
    });

    cont.addEventListener('input', e => {
        if (!e.target.classList.contains('contador__valor')) return;
        const val = parseInt(e.target.value);
        const oculto = document.getElementById('qty-' + e.target.dataset.key);
        if (oculto && !isNaN(val) && val > 0) oculto.value = val;
        actualizarHoja();
    });

    cont.addEventListener('focusout', e => {
        if (!e.target.classList.contains('contador__valor')) return;
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        e.target.value = val;
        const oculto = document.getElementById('qty-' + e.target.dataset.key);
        if (oculto) oculto.value = val;
        actualizarHoja();
    });
}

// ══════════════════════════════════════════
//  RECARGOS Y PERFIL
// ══════════════════════════════════════════

function renderExtras() {
    const cont = document.getElementById('extras-grid');
    if (!cont) return;
    cont.innerHTML = Object.entries(CONFIG.factoresExtra).map(([key, obj]) => `
        <div class="extra" id="ex-${key}" data-extra="${key}" role="button" tabindex="0" aria-pressed="false">
            <span class="extra__texto">
                <span class="extra__marca">${icono('i-check')}</span>
                ${sanitizeHTML(obj.nombre)}
            </span>
            <span class="extra__importe">+ ${fmt(obj.precio)}</span>
        </div>`).join('');
}

function alternarExtra(el) {
    const key = el.dataset.extra;
    if (extrasActivos.has(key)) extrasActivos.delete(key); else extrasActivos.add(key);
    el.classList.toggle('extra--activo', extrasActivos.has(key));
    el.setAttribute('aria-pressed', String(extrasActivos.has(key)));
    actualizarHoja();
}

function renderPerfiles() {
    const cont = document.getElementById('perfil-buttons');
    if (!cont) return;
    cont.className = 'perfil';
    cont.innerHTML = Object.entries(CONFIG.perfilesCliente).map(([key, mult]) => `
        <button type="button" class="perfil__boton${key === perfilActual ? ' perfil__boton--activo' : ''}" data-perfil="${key}">
            <span class="perfil__nombre">${sanitizeHTML(PERFIL_LABEL[key] || key)}</span>
            <span class="perfil__factor">×${mult}</span>
        </button>`).join('');
}

function seleccionarPerfil(perfil) {
    fijarPerfil(perfil);
    document.querySelectorAll('.perfil__boton').forEach(b =>
        b.classList.toggle('perfil__boton--activo', b.dataset.perfil === perfilActual));
    actualizarHoja();
}

// ══════════════════════════════════════════
//  LA HOJA
// ══════════════════════════════════════════

// Una referencia corta y una fecha. NO un correlativo tipo COT-2026-0431: eso
// insinuaria que DAK ha emitido cuatrocientas treinta cotizaciones, y seria un
// dato inventado. Tampoco se promete una validez que la agencia no ofrece.
const REFERENCIA = Math.random().toString(16).slice(2, 6).toUpperCase();

function pintarFolio() {
    const el = document.getElementById('folio');
    if (!el) return;
    const fecha = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
    el.textContent = `Referencia ${REFERENCIA} · ${fecha} · importes referenciales`;
}

function lineaAnotacion(item) {
    const mensual = item.recurrencia === 'mensual';
    let detalle = '';
    if (item.tipo === 'nivel') detalle = `${item.tierLabel} ×${item.qty}`;
    else if (item.tipo === 'custom') detalle = 'a medida';
    const quitar = item.tipo === 'custom'
        ? `data-quitar-custom="${item.customId}"`
        : `data-quitar="${item.key}"`;
    return `
    <div class="anotacion">
        <span class="anotacion__nombre">${sanitizeHTML(item.nombre)}
            ${detalle ? `<span class="anotacion__detalle">· ${sanitizeHTML(detalle)}</span>` : ''}</span>
        <span class="anotacion__importe">${conUnidad(item.subtotal, mensual)}</span>
        <button type="button" class="anotacion__quitar" ${quitar} aria-label="Quitar ${sanitizeHTML(item.nombre)}">
            ${icono('i-cerrar', 'icono--sm')}
        </button>
    </div>`;
}

function actualizarHoja() {
    const t = calcularTotal();

    const bloqueUnico = document.getElementById('bloque-unico');
    const bloqueMensual = document.getElementById('bloque-mensual');
    const vacia = document.getElementById('hoja-vacia');

    // Los recargos de producción pertenecen al pago único, no al mensual
    const filasUnico = t.items.unico.map(lineaAnotacion).join('')
        + t.extrasActivos.map(e => `
        <div class="anotacion">
            <span class="anotacion__nombre">${sanitizeHTML(e.nombre)}
                <span class="anotacion__detalle">· recargo</span></span>
            <span class="anotacion__importe">${fmt(e.precio)}</span>
            <button type="button" class="anotacion__quitar" data-quitar-extra="${e.key}" aria-label="Quitar ${sanitizeHTML(e.nombre)}">
                ${icono('i-cerrar', 'icono--sm')}
            </button>
        </div>`).join('');

    const hayUnico = t.items.unico.length > 0 || t.extrasActivos.length > 0;
    const hayMensual = t.items.mensual.length > 0;

    // Un bloque vacío no se dibuja. Un «S/ 0 /mes» es peor que un hueco.
    bloqueUnico.hidden = !hayUnico;
    bloqueMensual.hidden = !hayMensual;
    if (vacia) vacia.hidden = hayUnico || hayMensual;

    if (hayUnico) document.getElementById('lista-unico').innerHTML = filasUnico;
    document.getElementById('total-unico').textContent = hayUnico ? fmt(t.unico.total) : '—';
    if (hayMensual) document.getElementById('lista-mensual').innerHTML = t.items.mensual.map(lineaAnotacion).join('');
    document.getElementById('total-mensual').innerHTML = hayMensual ? conUnidad(t.mensual.total, true) : '—';

    // Barra flotante de móvil: dos cifras, nunca una combinada
    const dUnico = document.getElementById('barra-dato-unico');
    const dMensual = document.getElementById('barra-dato-mensual');
    if (dUnico) document.getElementById('barra-unico').textContent = hayUnico ? fmt(t.unico.total) : '—';
    if (dMensual) document.getElementById('barra-mensual').innerHTML = hayMensual ? conUnidad(t.mensual.total, true) : '—';

    // Fila de perfil, solo para el equipo
    const filaPerfil = document.getElementById('row-perfil');
    if (filaPerfil) {
        filaPerfil.hidden = !isAdmin;
        if (isAdmin) {
            document.getElementById('label-perfil').textContent =
                `${PERFIL_LABEL[t.perfil] || t.perfil} ×${t.multiplicador}`;
            document.getElementById('sidebar-perfil-total').textContent =
                fmt(t.unico.conPerfil + t.mensual.conPerfil);
        }
    }

    const sello = document.getElementById('sello');
    if (sello) {
        const aprox = document.getElementById('chk-aprox')?.checked ?? true;
        sello.textContent = aprox ? 'Referencial' : 'Cotización oficial';
        sello.classList.toggle('sello--oficial', !aprox);
    }
}

// ══════════════════════════════════════════
//  PARTIDA LIBRE
// ══════════════════════════════════════════

function agregarItemPersonalizado() {
    const nombreEl = document.getElementById('custom-nombre');
    const precioEl = document.getElementById('custom-precio');
    const nombre = nombreEl.value.trim().slice(0, 100);
    const precio = parseFloat(precioEl.value) || 0;
    if (!nombre || precio <= 0 || precio > 999999) return;
    const rec = document.querySelector('[data-libre-rec].nivel--activo')?.dataset.libreRec || 'unico';
    itemsPersonalizados.push({ id: Date.now(), nombre, precio, recurrencia: rec });
    nombreEl.value = ''; precioEl.value = '';
    renderListaCustom(); actualizarHoja(); actualizarCuentas();
}

function eliminarItemPersonalizado(id) {
    itemsPersonalizados = itemsPersonalizados.filter(i => i.id !== id);
    renderListaCustom(); actualizarHoja(); actualizarCuentas();
}

function renderListaCustom() {
    const lista = document.getElementById('custom-items-list');
    if (!lista) return;
    lista.innerHTML = itemsPersonalizados.map(i => `
        <li class="anotacion">
            <span class="anotacion__nombre">${sanitizeHTML(i.nombre)}
                <span class="anotacion__detalle">· ${i.recurrencia === 'mensual' ? 'cada mes' : 'una vez'}</span></span>
            <span class="anotacion__importe">${conUnidad(i.precio, i.recurrencia === 'mensual')}</span>
            <button type="button" class="anotacion__quitar" data-quitar-custom="${i.id}" aria-label="Quitar ${sanitizeHTML(i.nombre)}">
                ${icono('i-cerrar', 'icono--sm')}
            </button>
        </li>`).join('');
}

// ══════════════════════════════════════════
//  CALCULATION
// ══════════════════════════════════════════

// Un servicio se cobra una vez o cada mes. La recurrencia vive en el descriptor de
// CATEGORIAS (js/data.js) y NO en CONFIG: getConfig() hace un merge superficial por
// clave y aplicarAjustes() persiste el CONFIG entero, así que un campo nuevo dentro
// de preciosFijos se perdería en cualquier navegador con precios guardados y el
// servicio pasaría a «único» en silencio. CATEGORIAS no se persiste nunca.
const recurrenciaDe = s => (s && s.recurrencia === 'mensual') ? 'mensual' : 'unico';

// La única lectura del DOM. calcularTotal, actualizarHoja, construirCuerpoEmail y
// confirmarCita consumen esto. Antes cada una recorría CATEGORIAS por su cuenta: eran
// cuatro implementaciones de la misma recolección que había que cambiar a la vez para
// que el email y el sidebar no dijeran números distintos.
function recolectarSeleccion() {
    const unico = [], mensual = [];

    CATEGORIAS.forEach(cat => {
        if (cat.id === 'personalizado' || !cat.servicios) return;
        cat.servicios.forEach(s => {
            if (!seleccionados.has(s.key)) return;

            let item;
            if (s.tipo === 'nivel') {
                const qty = parseInt(document.getElementById(`qty-${s.key}`)?.value) || 1;
                const lvl = document.getElementById(`lvl-${s.key}`)?.value || 'basico';
                const precioUnit = CONFIG.serviciosBase[s.key]?.[lvl] ?? 0;
                item = {
                    key: s.key, nombre: s.label, tipo: 'nivel', qty, lvl,
                    tierLabel: s.tierLabels?.[lvl] || NIVELES_LABEL[lvl],
                    precioUnit, subtotal: qty * precioUnit,
                };
            } else {
                item = {
                    key: s.key, nombre: s.label, tipo: 'fijo',
                    subtotal: CONFIG.preciosFijos[s.key]?.precio ?? 0,
                };
            }
            item.recurrencia = recurrenciaDe(s);
            (item.recurrencia === 'mensual' ? mensual : unico).push(item);
        });
    });

    itemsPersonalizados.forEach(i => {
        const item = {
            key: `custom-${i.id}`, nombre: i.nombre, tipo: 'custom', customId: i.id,
            subtotal: i.precio,
            recurrencia: i.recurrencia === 'mensual' ? 'mensual' : 'unico',
        };
        (item.recurrencia === 'mensual' ? mensual : unico).push(item);
    });

    // Los factores extra son recargos sobre la producción: urgencia, desplazamiento,
    // revisión, drone. Ninguno es un servicio recurrente, así que van siempre al
    // bloque de pago único.
    const extras = [];
    Object.entries(CONFIG.factoresExtra).forEach(([key, obj]) => {
        if (extrasActivos.has(key)) extras.push({ key, nombre: obj.nombre, precio: obj.precio });
    });

    return { unico, mensual, extras };
}

// Devuelve dos totales, nunca uno. No existe `totalFinal` a propósito: sumar una web
// de pago único con una gestión de ads mensual da un número que no significa nada, y
// era justamente la ambigüedad que este cambio elimina. Si algún consumidor se quedó
// sin migrar, falla ruidosamente en vez de enseñar una cifra mal.
function calcularTotal() {
    const perfil = perfilActual;
    const multiplicador = CONFIG.perfilesCliente[perfil] ?? 1;
    const { unico, mensual, extras } = recolectarSeleccion();

    const suma = arr => arr.reduce((t, i) => t + i.subtotal, 0);
    const baseUnico = suma(unico);
    const baseMensual = suma(mensual);
    const extrasTotal = extras.reduce((t, e) => t + e.precio, 0);

    return {
        perfil, multiplicador,
        items: { unico, mensual },
        extrasActivos: extras,
        unico: {
            base: baseUnico,
            conPerfil: baseUnico * multiplicador,
            extras: extrasTotal,
            total: baseUnico * multiplicador + extrasTotal,
        },
        mensual: {
            base: baseMensual,
            conPerfil: baseMensual * multiplicador,
            extras: 0,
            total: baseMensual * multiplicador,
        },
    };
}

// ══════════════════════════════════════════
//  EMAIL
// ══════════════════════════════════════════

function construirCuerpoEmail() {
    const t = calcularTotal();
    const nombre = document.getElementById('nombre-cliente').value.trim() || 'el cliente';
    const esAprox = document.getElementById('chk-aprox')?.checked ?? true;
    const fecha = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

    const linea = i => {
        const detalle = i.tipo === 'nivel' ? ` x${i.qty} (${i.tierLabel})`
                      : i.tipo === 'custom' ? ' (a medida)' : '';
        return `  - ${i.nombre}${detalle}: ${fmt(i.subtotal)}`;
    };

    const filas = [];
    filas.push(esAprox ? 'PRESUPUESTO REFERENCIAL DAK' : 'COTIZACION OFICIAL DAK');
    filas.push('==============================');
    filas.push(`Cliente:    ${nombre}`);
    filas.push(`Fecha:      ${fecha}`);
    filas.push(`Referencia: ${REFERENCIA}`);
    if (isAdmin) filas.push(`Perfil:     ${PERFIL_LABEL[t.perfil] || t.perfil} (x${t.multiplicador})`);

    // Dos secciones y dos totales. Nunca una suma de las dos cosas: un numero que
    // mezcla una web de pago unico con una gestion mensual no significa nada.
    if (t.items.unico.length || t.extrasActivos.length) {
        filas.push('', 'SE PAGA UNA VEZ', '------------------------------');
        t.items.unico.forEach(i => filas.push(linea(i)));
        t.extrasActivos.forEach(e => filas.push(`  - ${e.nombre} (recargo): ${fmt(e.precio)}`));
        filas.push('------------------------------');
        filas.push(`TOTAL DE UNA VEZ:  ${fmt(t.unico.total)}`);
    }

    if (t.items.mensual.length) {
        filas.push('', 'SE PAGA CADA MES', '------------------------------');
        t.items.mensual.forEach(i => filas.push(linea(i)));
        filas.push('------------------------------');
        filas.push(`TOTAL AL MES:      ${fmt(t.mensual.total)} /mes`);
    }

    if (!t.items.unico.length && !t.items.mensual.length && !t.extrasActivos.length) {
        filas.push('', '  (sin servicios elegidos)');
    }

    filas.push('==============================');
    if (esAprox) filas.push('Los importes son una referencia y se ajustan al alcance real del proyecto.');
    filas.push('DAK Agency - Chiclayo, Peru - marketing@dakagency.net');
    return filas.join('\n');
}

function enviarCotizacion() {
    const emailDestino = document.getElementById('email-cliente').value.trim();
    const mensaje = document.getElementById('email-mensaje')?.value.trim() || '';
    const feedback = document.getElementById('email-feedback');
    const nombre = document.getElementById('nombre-cliente').value.trim() || 'cliente';

    if (!emailDestino || !validarEmail(emailDestino)) {
        feedback.textContent = !emailDestino
            ? '⚠️ Ingresá el email del cliente.'
            : '⚠️ El formato del email no es válido.';
        feedback.className = 'nota nota--error';
        return;
    }

    if (isCooldown('email')) {
        feedback.textContent = '⏳ Esperá unos segundos antes de enviar otra vez.';
        feedback.className = 'nota nota--error';
        return;
    }

    const cuerpo = construirCuerpoEmail();
    const total = calcularTotal();

    if (typeof EMAILJS_CONFIG !== 'undefined' && EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.publicKey) {
        feedback.textContent = 'Enviando…';
        feedback.className = 'nota';

        const enviar = (destino, aNombre) => emailjs.send(
            EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
                to_email: destino,
                to_name: aNombre,
                cotizacion: cuerpo,
                // La plantilla vive en el dashboard de EmailJS, no en el repo: si se
                // quita la variable `total`, renderiza vacío y nadie se entera. Se
                // mantiene apuntando al pago único y se añaden las dos nuevas.
                total: fmt(total.unico.total),
                total_unico: fmt(total.unico.total),
                total_mensual: fmt(total.mensual.total),
                mensaje: mensaje || ''
            }, EMAILJS_CONFIG.publicKey);

        // Dos envíos: la copia para el prospecto y el aviso a DAK. Hasta ahora la
        // cotización se mandaba SOLO al prospecto, así que alguien que llegaba hasta
        // el final del embudo no dejaba ni rastro en la agencia.
        Promise.allSettled([
            enviar(emailDestino, nombre),
            enviar(DAK_EMAIL, 'Equipo DAK — presupuesto de ' + nombre),
        ]).then(([alCliente, aDak]) => {
            if (aDak.status === 'rejected') console.error('[DAK] no se pudo avisar a la agencia:', aDak.reason);
            if (alCliente.status === 'fulfilled') {
                feedback.textContent = 'Listo, te lo enviamos por email.';
                feedback.className = 'nota nota--ok';
            } else {
                feedback.textContent = 'No se pudo enviar. Probá de nuevo en un momento.';
                feedback.className = 'nota nota--error';
            }
        });
    } else {
        enviarMailto(emailDestino, nombre, cuerpo, mensaje, feedback);
    }
}

function enviarMailto(email, nombre, cuerpo, mensaje, feedbackEl) {
    const subject = `Cotización DAK para ${nombre}`;
    const fullBody = cuerpo + (mensaje ? `\n\n---\nMensaje: ${mensaje}` : '') + '\n\nEquipo DAK';
    const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
    window.location.href = url;
    if (feedbackEl) {
        feedbackEl.textContent = '📬 Se abrió tu cliente de correo.';
        feedbackEl.className = 'text-xs text-center ok';
    }
}

// ══════════════════════════════════════════
//  MODAL AJUSTES
// ══════════════════════════════════════════

// Derivado de CATEGORIAS, no copiado a mano: la lista escrita a pelo se
// desincronizaba en silencio y el modal de ajustes dejaba de mostrar el servicio.
const SERVICIOS_BASE_KEYS = CATEGORIAS
    .flatMap(c => c.servicios || [])
    .filter(s => s.tipo === 'nivel')
    .map(s => ({ key: s.key, label: s.label }));

function abrirModalAjustes() {
    const modal = document.getElementById('modal-ajustes');
    modal.setAttribute('aria-hidden', 'false');
    modal.hidden = false;
    rellenarModalAjustes();
}

function cerrarModalAjustes() {
    const modal = document.getElementById('modal-ajustes');
    modal.setAttribute('aria-hidden', 'true');
    modal.hidden = true;
}

function rellenarModalAjustes() {
    // Servicios con nivel
    const sb = document.getElementById('ajustes-servicios-base');
    sb.innerHTML = '';
    SERVICIOS_BASE_KEYS.forEach(({ key, label }) => {
        const bloque = document.createElement('div');
        bloque.className = 'ajuste-grupo';
        bloque.innerHTML = `<p class="ajuste-grupo__titulo">${sanitizeHTML(label)}</p>`;
        const filas = NIVELES.map(n => {
            const id = `adj-sb-${key}-${n}`;
            const val = CONFIG.serviciosBase[key]?.[n] ?? 0;
            return `<div class="ajuste">
                <label class="ajuste__rotulo" for="${id}">${NIVELES_LABEL[n]}</label>
                <input class="campo-texto ajuste__campo" type="number" id="${id}" data-sb="${key}" data-nivel="${n}" value="${val}" min="0">
            </div>`;
        }).join('');
        bloque.innerHTML += `<div>${filas}</div>`;
        sb.appendChild(bloque);
    });

    // Precios fijos
    const pf = document.getElementById('ajustes-precios-fijos');
    pf.innerHTML = '';
    Object.entries(CONFIG.preciosFijos).forEach(([key, obj]) => {
        pf.innerHTML += `<div class="ajuste">
            <label class="ajuste__rotulo" for="adj-pf-${key}">${sanitizeHTML(obj.nombre)}</label>
            <input class="campo-texto ajuste__campo" type="number" id="adj-pf-${key}" data-pf="${key}" value="${obj.precio}" min="0">
        </div>`;
    });

    // Perfiles
    const pe = document.getElementById('ajustes-perfiles');
    pe.innerHTML = '';
    Object.entries(CONFIG.perfilesCliente).forEach(([key, val]) => {
        const label = PERFIL_LABEL[key] || (key.charAt(0).toUpperCase() + key.slice(1));
        pe.innerHTML += `<div class="ajuste">
            <label class="ajuste__rotulo" for="adj-pe-${key}">${sanitizeHTML(label)}</label>
            <input class="campo-texto ajuste__campo" type="number" step="0.1" id="adj-pe-${key}" data-pe="${key}" value="${val}" min="0">
        </div>`;
    });

    // Extras
    const fe = document.getElementById('ajustes-factores-extra');
    fe.innerHTML = '';
    Object.entries(CONFIG.factoresExtra).forEach(([key, obj]) => {
        fe.innerHTML += `<div class="ajuste">
            <label class="ajuste__rotulo" for="adj-fe-${key}">${sanitizeHTML(obj.nombre)}</label>
            <input class="campo-texto ajuste__campo" type="number" id="adj-fe-${key}" data-fe="${key}" value="${obj.precio}" min="0">
        </div>`;
    });
}

function aplicarAjustes() {
    document.querySelectorAll('#ajustes-servicios-base input[data-sb]').forEach(inp => {
        const v = parseFloat(inp.value);
        if (!isNaN(v) && v >= 0) CONFIG.serviciosBase[inp.dataset.sb][inp.dataset.nivel] = v;
    });
    document.querySelectorAll('#ajustes-precios-fijos input[data-pf]').forEach(inp => {
        const v = parseFloat(inp.value);
        if (!isNaN(v) && v >= 0) CONFIG.preciosFijos[inp.dataset.pf].precio = v;
    });
    document.querySelectorAll('#ajustes-perfiles input[data-pe]').forEach(inp => {
        const v = parseFloat(inp.value);
        if (!isNaN(v) && v >= 0) CONFIG.perfilesCliente[inp.dataset.pe] = v;
    });
    document.querySelectorAll('#ajustes-factores-extra input[data-fe]').forEach(inp => {
        const v = parseFloat(inp.value);
        if (!isNaN(v) && v >= 0) CONFIG.factoresExtra[inp.dataset.fe].precio = v;
    });
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(CONFIG)); }
    catch (e) { console.error('[DAK] Error guardando config:', e); }

    cerrarModalAjustes();
    // Reload to refresh all prices in UI
    location.reload();
}

function resetearDefaults() {
    if (!confirm('¿Restaurar todos los precios a los valores por defecto?')) return;
    localStorage.removeItem(CONFIG_KEY);
    location.reload();
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // Render all services
    // El calendario no sabe nada de la calculadora: le pasamos que servicios viajan
    // a la reunion, anotando cuales son mensuales. Quien atienda necesita saber si
    // lo que el prospecto marco es una construccion o un compromiso que se repite.
    fijarResumenServicios(() => {
        const sel = recolectarSeleccion();
        return sel.unico.map(i => i.nombre)
            .concat(sel.mensual.map(i => i.nombre + ' (al mes)'));
    });

    renderCatalogo();
    montarListeners();
    renderExtras();
    renderPerfiles();
    pintarFolio();

    // Los recargos y la hoja escuchan una vez, sobre su contenedor
    document.getElementById('extras-grid')?.addEventListener('click', e => {
        const el = e.target.closest('[data-extra]');
        if (el) alternarExtra(el);
    });
    document.getElementById('extras-grid')?.addEventListener('keydown', e => {
        const el = e.target.closest('[data-extra]');
        if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); alternarExtra(el); }
    });
    document.getElementById('perfil-buttons')?.addEventListener('click', e => {
        const b = e.target.closest('[data-perfil]');
        if (b) seleccionarPerfil(b.dataset.perfil);
    });
    document.getElementById('hoja-cuerpo')?.addEventListener('click', e => {
        const q = e.target.closest('[data-quitar]');
        if (q) { fijarSeleccion(q.dataset.quitar, false); actualizarHoja(); actualizarCuentas(); return; }
        const qc = e.target.closest('[data-quitar-custom]');
        if (qc) return eliminarItemPersonalizado(parseInt(qc.dataset.quitarCustom));
        const qe = e.target.closest('[data-quitar-extra]');
        if (qe) { const el = document.getElementById('ex-' + qe.dataset.quitarExtra); if (el) alternarExtra(el); }
    });
    // Agendar es la acción principal; en móvil vive en la barra flotante
    document.getElementById('btn-agendar-movil')?.addEventListener('click', abrirModalCita);

    // Perfil buttons

    // Modal: Ajustes
    document.getElementById('btn-ajustes').addEventListener('click', abrirModalAjustes);
    document.getElementById('modal-ajustes-cerrar').addEventListener('click', cerrarModalAjustes);
    document.getElementById('modal-ajustes-aplicar').addEventListener('click', aplicarAjustes);
    document.getElementById('modal-ajustes-reset').addEventListener('click', resetearDefaults);
    document.getElementById('modal-ajustes').addEventListener('click', ev => {
        if (ev.target === ev.currentTarget) cerrarModalAjustes();
    });

    // Enviar cotización
    document.getElementById('btn-enviar').addEventListener('click', enviarCotizacion);

    // Toggle presupuesto aproximado
    const chkAprox = document.getElementById('chk-aprox');
    const labelAprox = document.getElementById('label-aprox');
    if (labelAprox && chkAprox) {
        labelAprox.addEventListener('click', e => {
            if (!isAdmin) {
                e.preventDefault();
                mostrarErrorToast('🔒 No tienes permisos de admin');
            }
        });
        chkAprox.addEventListener('change', e => {
            if (!isAdmin) {
                e.preventDefault();
                chkAprox.checked = true;
                return;
            }
        });
    }

    // Modal: Admin Login
    document.getElementById('btn-admin-login')?.addEventListener('click', abrirModalLoginAdmin);
    document.getElementById('modal-login-cerrar')?.addEventListener('click', cerrarModalLoginAdmin);
    document.getElementById('btn-admin-submit')?.addEventListener('click', procesarLoginAdmin);
    document.getElementById('admin-pass')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') procesarLoginAdmin();
    });
    document.getElementById('modal-login-admin')?.addEventListener('click', ev => {
        if (ev.target === ev.currentTarget) cerrarModalLoginAdmin();
    });

    // Logout buttons
    document.getElementById('btn-logout')?.addEventListener('click', logoutAdmin);
    document.getElementById('btn-logout-modal')?.addEventListener('click', logoutAdmin);

    // Full-Screen: Agendar Cita
    document.getElementById('btn-agendar')?.addEventListener('click', abrirModalCita);
    document.getElementById('cita-cerrar-btn')?.addEventListener('click', cerrarModalCita);
    document.getElementById('cita-btn-cancelar')?.addEventListener('click', cerrarModalCita);
    document.getElementById('cita-btn-confirmar')?.addEventListener('click', confirmarCita);
    document.getElementById('cita-prev-month')?.addEventListener('click', () => navigateMonth(-1));
    document.getElementById('cita-next-month')?.addEventListener('click', () => navigateMonth(1));
    document.getElementById('cita-retry-btn')?.addEventListener('click', () => {
        document.getElementById('cita-error').hidden = true;
        document.getElementById('cita-loading').hidden = false;
        cargarDisponibilidad();
    });

    // Escape closes all modals & overlays
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            cerrarModalAjustes();
            cerrarModalLoginAdmin();
            cerrarModalCita();
        }
    });

    // Initial state
    actualizarHoja();
    actualizarVistaAdmin();

    // Reveal page
    document.body.classList.add('ready');
});
