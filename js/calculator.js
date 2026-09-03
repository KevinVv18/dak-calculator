// ══════════════════════════════════════════
//  DAK Calculator — v7 Redesign
//  Single-page layout with sticky sidebar
// ══════════════════════════════════════════

// ── Helpers ──
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function validarEmail(email) {
    if (!email || email.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// ── Client-side Anti-Spam ──
const COOLDOWNS = { email: 0, cita: 0 };
const COOLDOWN_DURATION = 30000; // 30 seconds between sends
function isCooldown(key) {
    if (Date.now() < COOLDOWNS[key]) return true;
    COOLDOWNS[key] = Date.now() + COOLDOWN_DURATION;
    return false;
}

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
const fmt = n => 'S/ ' + new Intl.NumberFormat('es-PE').format(Math.round(n));

// Category icons (Material Symbols)
const CAT_ICONS = {
    'video-foto': 'videocam',
    'diseno': 'palette',
    'web': 'language',
    'marketing': 'ads_click',
    'automatizacion': 'smart_toy',
    'personalizado': 'edit_note',
};

let itemsPersonalizados = [];
let isAdmin = sessionStorage.getItem('dak-admin') === 'true';

// ══════════════════════════════════════════
//  ADMIN LOGIN & STATE
// ══════════════════════════════════════════

function actualizarVistaAdmin() {
    isAdmin = sessionStorage.getItem('dak-admin') === 'true';
    const btnAdmin = document.getElementById('btn-admin-login');
    const btnAjustes = document.getElementById('btn-ajustes');
    const btnLogout = document.getElementById('btn-logout');
    const lockIcon = document.getElementById('icon-lock-aprox');
    const tooltip = document.getElementById('tooltip-aprox');
    const perfilSection = document.getElementById('perfil-section');
    const rowPerfil = document.getElementById('row-perfil');

    if (isAdmin) {
        if (btnAdmin) btnAdmin.style.display = 'none';
        if (btnAjustes) btnAjustes.style.display = 'flex';
        if (btnLogout) btnLogout.style.display = 'flex';
        if (lockIcon) lockIcon.style.display = 'none';
        if (tooltip) tooltip.classList.add('hidden');
        if (perfilSection) perfilSection.style.display = '';
        if (rowPerfil) rowPerfil.style.display = '';
        cerrarModalLoginAdmin();
    } else {
        if (btnAdmin) btnAdmin.style.display = 'flex';
        if (btnAjustes) btnAjustes.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'none';
        if (lockIcon) lockIcon.style.display = 'inline';
        if (tooltip) tooltip.classList.remove('hidden');
        if (perfilSection) perfilSection.style.display = 'none';
        if (rowPerfil) rowPerfil.style.display = 'none';
        document.getElementById('perfil-cliente').value = 'bajo';
    }
    actualizarSidebar();
}

function abrirModalLoginAdmin() {
    const modal = document.getElementById('modal-login-admin');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('modal-open');
    document.getElementById('admin-user').value = '';
    document.getElementById('admin-pass').value = '';
    document.getElementById('admin-login-error').style.display = 'none';
    document.getElementById('admin-user').focus();
}

function cerrarModalLoginAdmin() {
    const modal = document.getElementById('modal-login-admin');
    if (modal) {
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('modal-open');
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('dak-admin');
    actualizarVistaAdmin();
    cerrarModalAjustes();
}

function procesarLoginAdmin() {
    const user = document.getElementById('admin-user').value.trim();
    const pass = document.getElementById('admin-pass').value.trim();
    const errEl = document.getElementById('admin-login-error');
    if (typeof ADMIN_CREDENTIALS !== 'undefined' && user === ADMIN_CREDENTIALS.user && pass === ADMIN_CREDENTIALS.pass) {
        sessionStorage.setItem('dak-admin', 'true');
        errEl.style.display = 'none';
        actualizarVistaAdmin();
    } else {
        errEl.style.display = 'block';
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
//  PERFIL SELECTION
// ══════════════════════════════════════════

function seleccionarPerfil(perfil) {
    document.getElementById('perfil-cliente').value = perfil;
    document.querySelectorAll('.perfil-btn').forEach(b =>
        b.classList.toggle('perfil-btn--activo', b.dataset.perfil === perfil)
    );
    actualizarSidebar();
}

// ══════════════════════════════════════════
//  RENDER SERVICES (replaces wizard Step 2)
// ══════════════════════════════════════════

function renderServicios() {
    const container = document.getElementById('servicios-container');
    container.innerHTML = '';

    const isMobile = window.innerWidth < 1024;

    CATEGORIAS.forEach(cat => {
        const section = document.createElement('section');

        const icon = CAT_ICONS[cat.id] || 'category';
        const showToggle = cat.id !== 'personalizado' && cat.servicios;
        const startCollapsed = isMobile; // mobile = collapsed, desktop = expanded

        let headerHTML = `
            <div class="cat-header flex items-center gap-3 mb-5${showToggle ? ' cursor-pointer select-none' : ''}" ${showToggle ? `data-cat-toggle="${cat.id}"` : ''}>
                <span class="material-symbols-outlined text-secondary text-2xl">${icon}</span>
                <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-white flex-1">${sanitizeHTML(cat.label.replace(/^[\p{Emoji}\s]+/u, ''))}</h2>
                ${cat.badge ? `<span class="cat-section-badge">${sanitizeHTML(cat.badge)}</span>` : ''}
                ${showToggle ? `<span class="cat-toggle-icon material-symbols-outlined text-on-surface-variant text-xl transition-transform">${startCollapsed ? 'add' : 'remove'}</span>` : ''}
            </div>`;

        if (cat.id === 'personalizado') {
            section.innerHTML = headerHTML + renderPanelPersonalizado();
        } else if (cat.servicios) {
            const cards = cat.servicios.map(s =>
                s.tipo === 'nivel' ? renderCardNivel(s) : renderCardFijo(s)
            ).join('');
            section.innerHTML = headerHTML + `<div class="cat-body${startCollapsed ? ' cat-body--collapsed' : ''}" id="cat-body-${cat.id}"><div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">${cards}</div></div>`;
        }

        container.appendChild(section);
    });

    // Toggle: works on all viewports
    document.querySelectorAll('[data-cat-toggle]').forEach(header => {
        header.addEventListener('click', () => {
            const catId = header.dataset.catToggle;
            const body = document.getElementById(`cat-body-${catId}`);
            const toggleIcon = header.querySelector('.cat-toggle-icon');
            if (!body) return;
            const isNowCollapsed = body.classList.toggle('cat-body--collapsed');
            if (toggleIcon) toggleIcon.textContent = isNowCollapsed ? 'add' : 'remove';
        });
    });

    // On breakpoint change, reset all categories to default state for that viewport
    if (!window._catResizeListenerAdded) {
        window._catResizeListenerAdded = true;
        let lastMobile = window.innerWidth < 1024;
        window.addEventListener('resize', () => {
            const nowMobile = window.innerWidth < 1024;
            if (nowMobile === lastMobile) return; // no breakpoint crossing
            lastMobile = nowMobile;
            document.querySelectorAll('[data-cat-toggle]').forEach(header => {
                const catId = header.dataset.catToggle;
                const body = document.getElementById(`cat-body-${catId}`);
                const toggleIcon = header.querySelector('.cat-toggle-icon');
                if (!body) return;
                if (nowMobile) {
                    body.classList.add('cat-body--collapsed');
                    if (toggleIcon) toggleIcon.textContent = 'add';
                } else {
                    body.classList.remove('cat-body--collapsed');
                    if (toggleIcon) toggleIcon.textContent = 'remove';
                }
            });
        });
    }


    // Attach event listeners
    attachServiceListeners();
    attachCustomListeners();

    // Info tooltips
    setupInfoTooltips();
}

function renderCardNivel(s) {
    const precios = CONFIG.serviciosBase[s.key] ?? {};
    const desde = precios.basico ?? 0;
    const labels = s.tierLabels || {};
    const nivelBtns = NIVELES.map(n => `
        <button type="button" class="nivel-btn${n === 'basico' ? ' activo' : ''}" data-nivel="${n}">
            <span class="nivel-btn-name">${labels[n] || NIVELES_LABEL[n]}</span>
            <span class="nivel-btn-price">${fmt(precios[n] ?? 0)}</span>
        </button>`).join('');

    return `
    <div class="svc-card" id="card-${s.key}" data-key="${s.key}">
        <div class="svc-card-header">
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <input type="checkbox" id="chk-${s.key}" class="svc-checkbox" tabindex="-1">
                <div class="min-w-0">
                    <span class="text-sm font-semibold text-on-surface svc-card-name">${sanitizeHTML(s.label)} ${renderInfoIcon(s.key)}</span>
                    <span class="text-[11px] text-on-surface-variant block mt-0.5">desde ${fmt(desde)} / ${s.unidad || 'unidad'}</span>
                </div>
            </div>
            <span class="text-xs font-bold text-secondary whitespace-nowrap">${fmt(precios.basico ?? 0)} - ${fmt(precios.avanzado ?? 0)}</span>
        </div>
        <div class="svc-card-body" id="body-${s.key}">
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Cantidad</span>
                    <div class="stepper">
                        <button type="button" class="stepper-btn stepper-minus" data-target="qty-${s.key}">−</button>
                        <input type="number" class="stepper-input !bg-transparent !text-white !border-none !shadow-none !ring-0 focus:!ring-0" id="disp-${s.key}" value="1" min="1">
                        <button type="button" class="stepper-btn stepper-plus" data-target="qty-${s.key}">+</button>
                    </div>
                    <input type="hidden" id="qty-${s.key}" value="1">
                </div>
                <div>
                    <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-2">Tipo</span>
                    <div class="nivel-seg" id="seg-${s.key}" data-key="${s.key}">${nivelBtns}</div>
                    <input type="hidden" id="lvl-${s.key}" value="basico">
                </div>
            </div>
        </div>
    </div>`;
}

function renderCardFijo(s) {
    const precio = CONFIG.preciosFijos[s.key]?.precio ?? 0;
    return `
    <div class="svc-card" id="card-${s.key}" data-key="${s.key}">
        <div class="svc-card-header">
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <input type="checkbox" id="chk-${s.key}" class="svc-checkbox" tabindex="-1">
                <span class="text-sm font-semibold text-on-surface svc-card-name">${sanitizeHTML(s.label)} ${renderInfoIcon(s.key)}</span>
            </div>
            <span class="text-xs font-bold text-secondary whitespace-nowrap">${fmt(precio)}</span>
        </div>
    </div>`;
}

function renderInfoIcon(key) {
    if (!SERVICE_INFO[key]) return '';
    return `<span class="svc-info-wrap"><span class="svc-info-icon">ⓘ</span></span>`;
}

function renderPanelPersonalizado() {
    return `
    <div class="svc-card" style="cursor:default">
        <p class="text-xs text-on-surface-variant mb-4">Agregá cualquier servicio específico para este cliente.</p>
        <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1">
                <label class="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">Nombre del servicio</label>
                <input type="text" id="custom-nombre" class="w-full bg-surface-container-highest border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-white placeholder-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary-dim" placeholder="Ej. Retoque especial" maxlength="100">
            </div>
            <div class="w-full sm:w-28">
                <label class="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">Precio (S/)</label>
                <input type="number" id="custom-precio" class="w-full bg-surface-container-highest border border-outline-variant/15 rounded-lg px-3 py-2 text-sm text-white placeholder-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary-dim" placeholder="0" min="0">
            </div>
            <div class="flex items-end">
                <button type="button" id="btn-add-custom" class="w-full sm:w-auto px-5 py-2.5 bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-white hover:border-primary-dim/50 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">add</span> Agregar
                </button>
            </div>
        </div>
        <ul class="custom-items-list" id="custom-items-list">
            <li class="custom-empty">Ningún ítem agregado aún.</li>
        </ul>
    </div>`;
}

// ══════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════

function attachServiceListeners() {
    CATEGORIAS.forEach(cat => {
        if (cat.id === 'personalizado' || !cat.servicios) return;
        cat.servicios.forEach(s => {
            const chk = document.getElementById(`chk-${s.key}`);
            if (!chk) return;

            const toggleCard = () => {
                const card = document.getElementById(`card-${s.key}`);
                const body = document.getElementById(`body-${s.key}`);
                card?.classList.toggle('activo', chk.checked);
                body?.classList.toggle('visible', chk.checked);
                if (!chk.checked && s.tipo === 'nivel') {
                    const disp = document.getElementById(`disp-${s.key}`);
                    const qty = document.getElementById(`qty-${s.key}`);
                    if (disp) disp.value = '1';
                    if (qty) qty.value = '1';
                }
                actualizarSidebar();
            };

            chk.addEventListener('change', toggleCard);

            const card = document.getElementById(`card-${s.key}`);
            card?.addEventListener('click', e => {
                if (e.target.closest('.svc-card-body')) return;
                if (e.target.closest('.svc-info-wrap')) return;
                chk.checked = !chk.checked;
                toggleCard();
            });
        });
    });

    // Event delegation for steppers and nivel buttons
    const container = document.getElementById('servicios-container');
    container.addEventListener('click', e => {
        const stepperBtn = e.target.closest('.stepper-btn');
        if (stepperBtn) {
            const hidden = document.getElementById(stepperBtn.dataset.target);
            const key = stepperBtn.dataset.target.replace('qty-', '');
            const disp = document.getElementById(`disp-${key}`);
            if (!hidden) return;
            let val = parseInt(hidden.value) || 1;
            val = stepperBtn.classList.contains('stepper-plus') ? val + 1 : Math.max(1, val - 1);
            hidden.value = val;
            if (disp) disp.value = val;
            actualizarSidebar();
            return;
        }

        const nivelBtn = e.target.closest('.nivel-btn');
        if (nivelBtn) {
            const seg = nivelBtn.closest('.nivel-seg');
            if (!seg) return;
            seg.querySelectorAll('.nivel-btn').forEach(b => b.classList.remove('activo'));
            nivelBtn.classList.add('activo');
            const hidden = document.getElementById(`lvl-${seg.dataset.key}`);
            if (hidden) { hidden.value = nivelBtn.dataset.nivel; actualizarSidebar(); }
        }
    });

    // Manual stepper input
    container.addEventListener('input', e => {
        if (e.target.classList.contains('stepper-input')) {
            const val = parseInt(e.target.value);
            const key = e.target.id.replace('disp-', '');
            const hidden = document.getElementById(`qty-${key}`);
            if (hidden && !isNaN(val) && val > 0) {
                hidden.value = val;
            }
            actualizarSidebar();
        }
    });

    container.addEventListener('focusout', e => {
        if (e.target.classList.contains('stepper-input')) {
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 1) val = 1;
            e.target.value = val;
            const key = e.target.id.replace('disp-', '');
            const hidden = document.getElementById(`qty-${key}`);
            if (hidden) hidden.value = val;
            actualizarSidebar();
        }
    });
}

function attachCustomListeners() {
    document.getElementById('btn-add-custom')?.addEventListener('click', agregarItemPersonalizado);
    // Allow Enter key to add custom item
    document.getElementById('custom-precio')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') agregarItemPersonalizado();
    });
}

function setupInfoTooltips() {
    const globalTip = document.createElement('div');
    globalTip.className = 'svc-info-tip';
    globalTip.style.display = 'none';
    document.body.appendChild(globalTip);

    document.querySelectorAll('.svc-info-wrap').forEach(wrap => {
        wrap.addEventListener('mouseenter', () => {
            const key = wrap.closest('.svc-card')?.dataset.key;
            const desc = SERVICE_INFO[key];
            if (!desc) return;
            globalTip.innerHTML = sanitizeHTML(desc).replace(/\n/g, '<br>');
            const tipW = 240;
            globalTip.style.width = tipW + 'px';
            globalTip.style.display = 'block';
            globalTip.style.opacity = '0';
            const tipH = globalTip.offsetHeight;
            const rect = wrap.getBoundingClientRect();
            let left = rect.left + rect.width / 2 - tipW / 2;
            let top = rect.top - tipH - 8;
            if (left < 8) left = 8;
            if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
            if (top < 8) top = rect.bottom + 8;
            globalTip.style.left = left + 'px';
            globalTip.style.top = top + 'px';
            globalTip.style.opacity = '1';
            globalTip.style.visibility = 'visible';
        });
        wrap.addEventListener('mouseleave', () => {
            globalTip.style.opacity = '0';
            globalTip.style.visibility = 'hidden';
            globalTip.style.display = 'none';
        });
    });
}

// ══════════════════════════════════════════
//  EXTRAS (in sidebar)
// ══════════════════════════════════════════

function renderExtras() {
    const grid = document.getElementById('extras-grid');
    if (!grid) return;
    grid.innerHTML = Object.entries(CONFIG.factoresExtra).map(([key, obj]) => `
        <label class="extra-item" id="extra-label-${key}">
            <div class="flex items-center gap-2.5">
                <input type="checkbox" id="extra-${key}" data-key="${key}" class="w-4 h-4 rounded border-outline-variant bg-transparent text-primary-dim focus:ring-primary-dim accent-[#b023ff] cursor-pointer">
                <span class="text-xs text-on-surface">${sanitizeHTML(obj.nombre)}</span>
            </div>
            <span class="text-xs font-semibold text-on-surface-variant">+ ${fmt(obj.precio)}</span>
        </label>
    `).join('');

    grid.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', () => {
            document.getElementById(`extra-label-${chk.dataset.key}`)?.classList.toggle('activo', chk.checked);
            actualizarSidebar();
        });
    });
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

// La única lectura del DOM. calcularTotal, actualizarSidebar, construirCuerpoEmail y
// confirmarCita consumen esto. Antes cada una recorría CATEGORIAS por su cuenta: eran
// cuatro implementaciones de la misma recolección que había que cambiar a la vez para
// que el email y el sidebar no dijeran números distintos.
function recolectarSeleccion() {
    const unico = [], mensual = [];

    CATEGORIAS.forEach(cat => {
        if (cat.id === 'personalizado' || !cat.servicios) return;
        cat.servicios.forEach(s => {
            const chk = document.getElementById(`chk-${s.key}`);
            if (!chk?.checked) return;

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
        if (document.getElementById(`extra-${key}`)?.checked) {
            extras.push({ key, nombre: obj.nombre, precio: obj.precio });
        }
    });

    return { unico, mensual, extras };
}

// Devuelve dos totales, nunca uno. No existe `totalFinal` a propósito: sumar una web
// de pago único con una gestión de ads mensual da un número que no significa nada, y
// era justamente la ambigüedad que este cambio elimina. Si algún consumidor se quedó
// sin migrar, falla ruidosamente en vez de enseñar una cifra mal.
function calcularTotal() {
    const perfil = document.getElementById('perfil-cliente')?.value || 'bajo';
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
//  SIDEBAR UPDATE (replaces wizard Step 3)
// ══════════════════════════════════════════

function actualizarSidebar() {
    const t = calcularTotal();
    const { perfil, multiplicador } = t;
    const perfilLabel = PERFIL_LABEL[perfil] || perfil;

    // La fase 1 solo parte el motor. La vista sigue enseñando un total combinado; los
    // dos bloques separados llegan en la fase 5, cuando se rehace el sidebar.
    const subtotalBase = t.unico.base + t.mensual.base;
    const subtotalMult = subtotalBase * multiplicador;
    const extrasTotal = t.unico.extras;
    const totalCombinado = t.unico.total + t.mensual.total;

    const items = t.items.unico.concat(t.items.mensual);

    // Render items
    const itemsEl = document.getElementById('sidebar-items');
    const emptyEl = document.getElementById('sidebar-empty');

    if (items.length === 0) {
        if (emptyEl) emptyEl.style.display = '';
        // Remove any existing item rows
        itemsEl.querySelectorAll('.sidebar-item').forEach(el => el.remove());
    } else {
        if (emptyEl) emptyEl.style.display = 'none';
        let html = items.map(item => {
            let detail = '';
            if (item.tipo === 'nivel') detail = `${item.tierLabel} ×${item.qty}`;
            else if (item.tipo === 'fijo') detail = 'Precio fijo';
            else detail = 'Personalizado';

            const deleteAttr = item.tipo === 'custom'
                ? `data-delete-custom="${item.customId}"`
                : `data-delete-svc="${item.key}"`;

            return `
            <div class="sidebar-item">
                <div class="flex-1 min-w-0">
                    <h4 class="text-xs font-semibold text-on-surface truncate">${sanitizeHTML(item.nombre)}</h4>
                    <p class="text-[10px] text-on-surface-variant uppercase">${sanitizeHTML(detail)}</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-white whitespace-nowrap">${fmt(item.subtotal)}</span>
                    <button type="button" class="sidebar-item-delete" ${deleteAttr} title="Eliminar">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            </div>`;
        }).join('');
        // Keep the empty placeholder (hidden) + add items
        itemsEl.innerHTML = `<div class="sidebar-empty flex flex-col items-center justify-center py-6 opacity-30" id="sidebar-empty" style="display:none">
            <span class="material-symbols-outlined text-4xl mb-2">shopping_cart</span>
            <p class="text-xs text-center">Seleccioná servicios<br>para comenzar</p>
        </div>` + html;

        // Attach delete handlers
        itemsEl.querySelectorAll('.sidebar-item-delete[data-delete-svc]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.deleteSvc;
                const chk = document.getElementById(`chk-${key}`);
                if (chk) {
                    chk.checked = false;
                    document.getElementById(`card-${key}`)?.classList.remove('activo');
                    document.getElementById(`body-${key}`)?.classList.remove('visible');
                }
                actualizarSidebar();
            });
        });

        itemsEl.querySelectorAll('.sidebar-item-delete[data-delete-custom]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.deleteCustom);
                itemsPersonalizados = itemsPersonalizados.filter(i => i.id !== id);
                renderListaCustom();
                actualizarSidebar();
            });
        });
    }

    // Update totals
    document.getElementById('sidebar-subtotal').textContent = fmt(subtotalBase);
    document.getElementById('sidebar-extras-total').textContent = fmt(extrasTotal);
    document.getElementById('sidebar-total').textContent = fmt(totalCombinado);

    // Profile row (admin)
    const rowPerfil = document.getElementById('row-perfil');
    if (isAdmin && rowPerfil) {
        rowPerfil.style.display = '';
        document.getElementById('label-perfil').textContent = `× ${perfilLabel} (${multiplicador}x)`;
        document.getElementById('sidebar-perfil-total').textContent = fmt(subtotalMult);
    }

    // Mobile total
    const mobileTotal = document.getElementById('mobile-total-value');
    if (mobileTotal) mobileTotal.textContent = fmt(totalCombinado);
}

// ══════════════════════════════════════════
//  PERSONALIZADO (Custom Items)
// ══════════════════════════════════════════

function agregarItemPersonalizado() {
    const nombreEl = document.getElementById('custom-nombre');
    const precioEl = document.getElementById('custom-precio');
    const nombre = nombreEl.value.trim().replace(/[<>"'`]/g, '').slice(0, 100);
    const precio = parseFloat(precioEl.value) || 0;
    if (!nombre || precio <= 0 || precio > 999999) return;
    if (itemsPersonalizados.length >= 20) return; // max 20 custom items
    itemsPersonalizados.push({ id: Date.now(), nombre, precio });
    nombreEl.value = '';
    precioEl.value = '';
    renderListaCustom();
    actualizarSidebar();
}

function eliminarItemPersonalizado(id) {
    itemsPersonalizados = itemsPersonalizados.filter(i => i.id !== id);
    renderListaCustom();
    actualizarSidebar();
}

function renderListaCustom() {
    const list = document.getElementById('custom-items-list');
    if (!list) return;
    list.innerHTML = itemsPersonalizados.length
        ? itemsPersonalizados.map(i => `
            <li class="custom-item">
                <span class="custom-item-nombre">${sanitizeHTML(i.nombre)}</span>
                <span class="custom-item-precio">${fmt(i.precio)}</span>
                <button type="button" class="btn-delete-custom" data-custom-id="${i.id}" aria-label="Eliminar">
                    <span class="material-symbols-outlined text-sm">close</span>
                </button>
            </li>`).join('')
        : '<li class="custom-empty">Ningún ítem agregado aún.</li>';

    list.querySelectorAll('.btn-delete-custom[data-custom-id]').forEach(btn => {
        btn.addEventListener('click', () => eliminarItemPersonalizado(parseInt(btn.dataset.customId)));
    });
}

// ══════════════════════════════════════════
//  EMAIL
// ══════════════════════════════════════════

function construirCuerpoEmail() {
    const t = calcularTotal();
    const { perfil, multiplicador, extrasActivos } = t;
    // Igual que el sidebar: la fase 1 mantiene el email como estaba. Se parte en dos
    // secciones en la fase 5.
    const subtotalBase = t.unico.base + t.mensual.base;
    const subtotalMult = subtotalBase * multiplicador;
    const extrasTotal = t.unico.extras;
    const totalCombinado = t.unico.total + t.mensual.total;
    const nombre = document.getElementById('nombre-cliente').value.trim() || 'el cliente';
    const esAprox = document.getElementById('chk-aprox')?.checked ?? true;
    const perfilLabel = PERFIL_LABEL[perfil] || perfil;
    const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    let lineas = [];
    CATEGORIAS.forEach(cat => {
        if (cat.id === 'personalizado' || !cat.servicios) return;
        cat.servicios.forEach(s => {
            const chk = document.getElementById(`chk-${s.key}`);
            if (!chk?.checked) return;
            if (s.tipo === 'nivel') {
                const qty = parseInt(document.getElementById(`qty-${s.key}`)?.value) || 0;
                const lvl = document.getElementById(`lvl-${s.key}`)?.value || 'basico';
                const sub = qty * (CONFIG.serviciosBase[s.key]?.[lvl] ?? 0);
                const tLabel = s.tierLabels?.[lvl] || NIVELES_LABEL[lvl];
                if (sub > 0) lineas.push(`  • ${s.label} ×${qty} (${tLabel}): ${fmt(sub)}`);
            } else if (s.tipo === 'fijo') {
                const p = CONFIG.preciosFijos[s.key]?.precio ?? 0;
                lineas.push(`  • ${s.label}: ${fmt(p)}`);
            }
        });
    });
    itemsPersonalizados.forEach(i => lineas.push(`  • ${i.nombre} (personalizado): ${fmt(i.precio)}`));

    const extras = extrasActivos.map(e => `  • ${e.nombre}: ${fmt(e.precio)}`).join('\n');

    const lines = [
        esAprox ? `PRESUPUESTO APROXIMADO DAK` : `COTIZACIÓN OFICIAL DAK`,
        `══════════════════════════════`,
        `Cliente: ${nombre}`,
    ];
    if (isAdmin) lines.push(`Perfil:  ${perfilLabel} (×${multiplicador})`);
    lines.push(
        `Fecha:   ${fecha}`,
        esAprox ? `Nota:    Los precios son ORIENTATIVOS y pueden ajustarse.` : '',
        `══════════════════════════════`,
        `SERVICIOS`,
        `──────────────────────────────`,
        lineas.join('\n') || '  (sin servicios)',
        `──────────────────────────────`,
        `Subtotal base:          ${fmt(subtotalBase)}`,
    );
    if (isAdmin) lines.push(`× Perfil ${perfilLabel} (${multiplicador}x): ${fmt(subtotalMult)}`);
    lines.push(
        extrasActivos.length ? `+ Extras:\n${extras}\n  Total extras: ${fmt(extrasTotal)}` : '',
        `──────────────────────────────`,
        `TOTAL FINAL:            ${fmt(totalCombinado)}`,
        `══════════════════════════════`,
    );
    return lines.filter(Boolean).join('\n');
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
        feedback.className = 'text-xs text-center error';
        return;
    }

    if (isCooldown('email')) {
        feedback.textContent = '⏳ Esperá unos segundos antes de enviar otra vez.';
        feedback.className = 'text-xs text-center error';
        return;
    }

    const cuerpo = construirCuerpoEmail();
    const total = calcularTotal();

    if (typeof EMAILJS_CONFIG !== 'undefined' && EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.publicKey) {
        feedback.textContent = 'Enviando...';
        feedback.className = 'text-xs text-center text-on-surface-variant';
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
            to_email: emailDestino,
            to_name: nombre,
            cotizacion: cuerpo,
            total: fmt(total.unico.total + total.mensual.total),
            mensaje: mensaje || ''
        }, EMAILJS_CONFIG.publicKey)
            .then(() => {
                feedback.textContent = '✅ Cotización enviada con éxito.';
                feedback.className = 'text-xs text-center ok';
            })
            .catch(() => {
                feedback.textContent = '❌ Error al enviar. Verificá la configuración.';
                feedback.className = 'text-xs text-center error';
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

const SERVICIOS_BASE_KEYS = [
    { key: 'video-corto', label: 'Video reel / corto' },
    { key: 'video-largo', label: 'Video largo' },
    { key: 'fotos-estudio', label: 'Sesión en estudio' },
    { key: 'flyer', label: 'Flyer' },
    { key: 'branding-manual', label: 'Manual de marca' },
    { key: 'pagina-web', label: 'Página web' },
    { key: 'chatbot-whatsapp', label: 'Chatbot WhatsApp' },
    { key: 'crm-setup', label: 'CRM Setup' },
];

function abrirModalAjustes() {
    const modal = document.getElementById('modal-ajustes');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('modal-open');
    rellenarModalAjustes();
}

function cerrarModalAjustes() {
    const modal = document.getElementById('modal-ajustes');
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('modal-open');
}

function rellenarModalAjustes() {
    // Servicios con nivel
    const sb = document.getElementById('ajustes-servicios-base');
    sb.innerHTML = '';
    SERVICIOS_BASE_KEYS.forEach(({ key, label }) => {
        const bloque = document.createElement('div');
        bloque.className = 'ajustes-bloque';
        bloque.innerHTML = `<strong>${sanitizeHTML(label)}</strong>`;
        const filas = NIVELES.map(n => {
            const id = `adj-sb-${key}-${n}`;
            const val = CONFIG.serviciosBase[key]?.[n] ?? 0;
            return `<div class="ajustes-fila">
                <label for="${id}">${NIVELES_LABEL[n]}</label>
                <input type="number" id="${id}" data-sb="${key}" data-nivel="${n}" value="${val}" min="0">
            </div>`;
        }).join('');
        bloque.innerHTML += `<div class="ajustes-filas">${filas}</div>`;
        sb.appendChild(bloque);
    });

    // Precios fijos
    const pf = document.getElementById('ajustes-precios-fijos');
    pf.innerHTML = '';
    Object.entries(CONFIG.preciosFijos).forEach(([key, obj]) => {
        pf.innerHTML += `<div class="ajustes-fila">
            <label for="adj-pf-${key}">${sanitizeHTML(obj.nombre)}</label>
            <input type="number" id="adj-pf-${key}" data-pf="${key}" value="${obj.precio}" min="0">
        </div>`;
    });

    // Perfiles
    const pe = document.getElementById('ajustes-perfiles');
    pe.innerHTML = '';
    Object.entries(CONFIG.perfilesCliente).forEach(([key, val]) => {
        const label = PERFIL_LABEL[key] || (key.charAt(0).toUpperCase() + key.slice(1));
        pe.innerHTML += `<div class="ajustes-fila">
            <label for="adj-pe-${key}">${sanitizeHTML(label)}</label>
            <input type="number" step="0.1" id="adj-pe-${key}" data-pe="${key}" value="${val}" min="0">
        </div>`;
    });

    // Extras
    const fe = document.getElementById('ajustes-factores-extra');
    fe.innerHTML = '';
    Object.entries(CONFIG.factoresExtra).forEach(([key, obj]) => {
        fe.innerHTML += `<div class="ajustes-fila">
            <label for="adj-fe-${key}">${sanitizeHTML(obj.nombre)}</label>
            <input type="number" id="adj-fe-${key}" data-fe="${key}" value="${obj.precio}" min="0">
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
//  INTERACTIVE BACKGROUND
// ══════════════════════════════════════════

const MATH_SYMBOLS = ['π', 'Σ', '∫', '∞', '×', '+', '=', '%', '√', 'Δ', 'θ', 'λ', 'Ω', '÷', '±', '≈', 'φ', 'μ', 'ε', '∂', '∇'];

function initMouseGlow() {
    const glow = document.getElementById('mouse-glow');
    if (!glow) return;
    let raf = null;
    document.addEventListener('mousemove', e => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
            if (!glow.classList.contains('active')) glow.classList.add('active');
        });
    });
    document.addEventListener('mouseleave', () => glow.classList.remove('active'));
}

function initMathMeteors() {
    const container = document.getElementById('meteor-container');
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const MAX_METEORS = 8;
    let activeMeteors = 0;

    const COLOR_VARIANTS = [
        {
            cls: 'math-meteor--purple',
            trail: 'radial-gradient(ellipse at 100% 50%, rgba(255,255,255,0.25) 0%, rgba(214,146,255,0.18) 15%, rgba(176,36,255,0.1) 35%, rgba(176,36,255,0.04) 60%, transparent 100%)',
            coreBright: 'rgba(255, 255, 255, 0.35)',
            coreMid: 'rgba(176, 36, 255, 0.2)',
        },
        {
            cls: 'math-meteor--cyan',
            trail: 'radial-gradient(ellipse at 100% 50%, rgba(255,255,255,0.2) 0%, rgba(150,255,255,0.15) 15%, rgba(95,248,248,0.08) 35%, rgba(95,248,248,0.03) 60%, transparent 100%)',
            coreBright: 'rgba(255, 255, 255, 0.3)',
            coreMid: 'rgba(95, 248, 248, 0.18)',
        },
        {
            cls: 'math-meteor--white',
            trail: 'radial-gradient(ellipse at 100% 50%, rgba(255,255,255,0.3) 0%, rgba(214,146,255,0.12) 20%, rgba(176,36,255,0.05) 50%, transparent 100%)',
            coreBright: 'rgba(255, 255, 255, 0.4)',
            coreMid: 'rgba(214, 146, 255, 0.15)',
        },
    ];

    function pickColor() {
        const r = Math.random();
        if (r < 0.55) return COLOR_VARIANTS[0]; // purple (dominant)
        if (r < 0.85) return COLOR_VARIANTS[1]; // cyan
        return COLOR_VARIANTS[2];                // white (rare)
    }

    function spawnMeteor() {
        if (activeMeteors >= MAX_METEORS) {
            setTimeout(spawnMeteor, 1500);
            return;
        }

        const symbol = MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)];
        const color = pickColor();
        const el = document.createElement('span');
        el.className = `math-meteor ${color.cls}`;
        el.textContent = symbol;

        // Depth layer: 0 = close/big, 1 = far/small
        const depth = Math.random();
        const size = depth < 0.3 ? 24 + Math.random() * 14          // close: 24-38px
                   : depth < 0.7 ? 16 + Math.random() * 10          // mid:   16-26px
                   :                10 + Math.random() * 8;          // far:   10-18px
        el.style.fontSize = size + 'px';

        // Far meteors get blur for depth-of-field
        const blur = depth > 0.7 ? (0.5 + (depth - 0.7) * 4) : 0;
        el.style.setProperty('--blur', blur + 'px');

        // Trail: wide cone of fire behind the rock — proportional to symbol size
        const trailW = size * 5 + 40 + Math.random() * 60;   // wide: 90-290px
        const trailH = size * 1.2 + 8 + Math.random() * 10;  // tall: 20-65px (cone shape)
        const trailBlur = 4 + size * 0.15 + Math.random() * 4; // heavy blur: 4-12px
        el.style.setProperty('--trail-w', trailW + 'px');
        el.style.setProperty('--trail-h', trailH + 'px');
        el.style.setProperty('--trail-blur', trailBlur + 'px');
        el.style.setProperty('--trail-gradient', color.trail);
        el.style.setProperty('--core-bright', color.coreBright);
        el.style.setProperty('--core-mid', color.coreMid);

        // Opacity scales with depth (far = dimmer)
        const peakOpacity = depth > 0.7 ? 0.5 : depth > 0.4 ? 0.75 : 1;
        el.style.setProperty('--peak-opacity', peakOpacity);
        el.style.setProperty('--start-scale', (0.4 + Math.random() * 0.3).toFixed(2));
        el.style.setProperty('--end-scale', (0.2 + Math.random() * 0.3).toFixed(2));

        // Random start position along top or right edge
        const fromTop = Math.random() > 0.4;
        const startX = fromTop ? (Math.random() * window.innerWidth) : window.innerWidth + 20;
        const startY = fromTop ? -40 : (Math.random() * window.innerHeight * 0.6);
        el.style.left = startX + 'px';
        el.style.top = startY + 'px';

        // Move diagonally down-left with varied angles
        const dx = -(350 + Math.random() * 700);
        const dy = 250 + Math.random() * 550;
        const angle = -10 - Math.random() * 35;
        const duration = 2.5 + Math.random() * 3;

        el.style.setProperty('--dx', dx + 'px');
        el.style.setProperty('--dy', dy + 'px');
        el.style.setProperty('--angle', angle + 'deg');
        el.style.setProperty('--duration', duration + 's');

        container.appendChild(el);
        activeMeteors++;

        el.addEventListener('animationend', () => {
            el.remove();
            activeMeteors--;
        });

        // Schedule next meteor (faster with fewer active)
        const delay = 2000 + Math.random() * 5000;
        setTimeout(spawnMeteor, delay);
    }

    // Ambient constellation particles
    function initConstellation() {
        const DOTS = 20;
        const colors = [
            'rgba(176, 36, 255, 0.35)',
            'rgba(95, 248, 248, 0.25)',
            'rgba(214, 146, 255, 0.3)',
            'rgba(255, 255, 255, 0.15)',
        ];

        for (let i = 0; i < DOTS; i++) {
            const dot = document.createElement('div');
            dot.className = 'constellation-dot';
            dot.style.left = Math.random() * 100 + '%';
            dot.style.top = Math.random() * 100 + '%';
            dot.style.setProperty('--dot-size', (1.5 + Math.random() * 3) + 'px');
            dot.style.setProperty('--dot-color', colors[Math.floor(Math.random() * colors.length)]);
            dot.style.setProperty('--float-duration', (6 + Math.random() * 10) + 's');
            dot.style.setProperty('--pulse-duration', (2 + Math.random() * 4) + 's');
            dot.style.setProperty('--float-x', (-20 + Math.random() * 40) + 'px');
            dot.style.setProperty('--float-y', (-20 + Math.random() * 40) + 'px');
            dot.style.setProperty('--min-opacity', (0.1 + Math.random() * 0.15).toFixed(2));
            dot.style.setProperty('--max-opacity', (0.35 + Math.random() * 0.35).toFixed(2));
            dot.style.animationDelay = (Math.random() * 8) + 's';
            container.appendChild(dot);
        }
    }

    initConstellation();

    // Stagger the first few meteors
    setTimeout(spawnMeteor, 1000);
    setTimeout(spawnMeteor, 2500 + Math.random() * 1500);
    setTimeout(spawnMeteor, 5000 + Math.random() * 2000);
}

// ══════════════════════════════════════════
//  AGENDAR CITA — Full-Screen Calendar
// ══════════════════════════════════════════

const API_BASE = 'https://dak-calculator.vercel.app';
const MONTH_NAMES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAY_NAMES_FULL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

let citaRawSlots = {};          // Original API response keyed by label
let citaAvailableDates = {};    // Map: "YYYY-MM-DD" -> { label, slots[] }
let citaMonths = [];            // ["2025-04", "2025-05"]
let citaCurrentMonthIdx = 0;
let citaSelectedDateStr = null; // "YYYY-MM-DD"
let citaSelectedSlot = null;    // { start, end, hour }

function formatHour12(h24) {
    const hour = parseInt(h24);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:00 ${suffix}`;
}

function formatDateLong(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayName = DAY_NAMES_FULL[date.getDay()];
    const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    return `${capDay} ${d} de ${MONTH_NAMES_ES[m - 1].toLowerCase()}`;
}

function abrirModalCita() {
    const overlay = document.getElementById('cita-overlay');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('cita-open');
    document.body.style.overflow = 'hidden';

    // Reset state
    citaSelectedDateStr = null;
    citaSelectedSlot = null;

    // Auto-fill from sidebar
    const sideNombre = document.getElementById('nombre-cliente')?.value || '';
    const sideEmail = document.getElementById('email-cliente')?.value || '';
    const citaNombre = document.getElementById('cita-nombre');
    const citaEmail = document.getElementById('cita-email');
    if (citaNombre) citaNombre.value = sideNombre;
    if (citaEmail) citaEmail.value = sideEmail;

    // Show loading, hide everything else
    document.getElementById('cita-loading').style.display = 'flex';
    document.getElementById('cita-left-col').style.display = 'none';
    document.getElementById('cita-right-col').style.display = 'none';
    document.getElementById('cita-error').style.display = 'none';
    document.getElementById('cita-confirmacion').style.display = 'none';
    document.getElementById('cita-summary-card').style.display = 'none';

    const confirmBtn = document.getElementById('cita-btn-confirmar');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'CONFIRMAR REUNIÓN';

    const cancelBtn = document.getElementById('cita-btn-cancelar');
    cancelBtn.textContent = 'Cancelar';

    cargarDisponibilidad();
}

function cerrarModalCita() {
    const overlay = document.getElementById('cita-overlay');
    if (overlay) {
        overlay.setAttribute('aria-hidden', 'true');
        overlay.classList.remove('cita-open');
        document.body.style.overflow = '';
    }
}

async function cargarDisponibilidad() {
    try {
        const res = await fetch(`${API_BASE}/api/disponibilidad`);
        if (!res.ok) throw new Error('Error del servidor');
        const data = await res.json();
        citaRawSlots = data.slots || {};

        document.getElementById('cita-loading').style.display = 'none';

        // Parse slots into date-keyed map
        citaAvailableDates = {};
        const monthSet = new Set();

        for (const [label, slots] of Object.entries(citaRawSlots)) {
            if (!slots.length) continue;
            // Extract date from ISO string using Lima timezone
            const firstDate = new Date(slots[0].start);
            const dateKey = firstDate.toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); // "YYYY-MM-DD"
            citaAvailableDates[dateKey] = { label, slots };
            monthSet.add(dateKey.substring(0, 7)); // "YYYY-MM"
        }

        citaMonths = Array.from(monthSet).sort();

        if (citaMonths.length === 0) {
            document.getElementById('cita-error-msg').textContent = 'No hay horarios disponibles en las próximas 2 semanas.';
            document.getElementById('cita-error').style.display = 'block';
            return;
        }

        citaCurrentMonthIdx = 0;
        buildCalendarGrid(citaMonths[0]);

        document.getElementById('cita-left-col').style.display = '';
        document.getElementById('cita-right-col').style.display = '';
        document.getElementById('cita-slots-container').innerHTML = '<p class="text-sm text-on-surface-variant text-center py-8 opacity-50">← Selecciona un día en el calendario</p>';
    } catch (err) {
        document.getElementById('cita-loading').style.display = 'none';
        document.getElementById('cita-error-msg').textContent = 'No se pudo cargar la disponibilidad. Intenta más tarde.';
        document.getElementById('cita-error').style.display = 'block';
    }
}

function buildCalendarGrid(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const totalDays = new Date(year, month, 0).getDate();

    // Monday-start: Mon=0, Tue=1, ..., Sun=6
    let startDow = firstDay.getDay(); // Sun=0, Mon=1, ..., Sat=6
    startDow = (startDow + 6) % 7;   // Convert to Mon=0

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const grid = document.getElementById('cita-cal-grid');
    let html = '';

    // Empty cells before first day
    for (let i = 0; i < startDow; i++) {
        html += '<div class="cal-cell"></div>';
    }

    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(year, month - 1, d);
        const dow = dateObj.getDay();
        const isWeekend = dow === 0 || dow === 6;
        const isPast = dateObj < today;
        const isAvailable = citaAvailableDates.hasOwnProperty(dateStr);
        const isSelected = dateStr === citaSelectedDateStr;

        let cls = 'cal-cell';
        if (isWeekend) cls += ' cal-cell--weekend';
        if (isPast && !isAvailable) cls += ' cal-cell--past';
        if (isAvailable && !isPast) cls += ' cal-cell--available';
        if (isSelected) cls += ' cal-cell--selected';

        const disabled = (!isAvailable || isPast) ? 'disabled' : '';
        const dot = (isAvailable && !isPast && !isSelected) ? '<div class="cal-dot"></div>' : '';

        html += `<button type="button" class="${cls}" data-date="${dateStr}" ${disabled}>
            <span class="text-sm font-medium">${d}</span>${dot}
        </button>`;
    }

    grid.innerHTML = html;

    // Month title
    document.getElementById('cita-month-title').textContent = `${MONTH_NAMES_ES[month - 1]} ${year}`;

    // Nav buttons
    document.getElementById('cita-prev-month').disabled = citaCurrentMonthIdx <= 0;
    document.getElementById('cita-next-month').disabled = citaCurrentMonthIdx >= citaMonths.length - 1;

    // Click handlers for available days
    grid.querySelectorAll('.cal-cell--available:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => selectCalendarDay(btn.dataset.date));
    });
}

function selectCalendarDay(dateStr) {
    citaSelectedDateStr = dateStr;
    citaSelectedSlot = null;
    document.getElementById('cita-btn-confirmar').disabled = true;
    document.getElementById('cita-summary-card').style.display = 'none';

    // Rebuild calendar to update selection
    buildCalendarGrid(citaMonths[citaCurrentMonthIdx]);

    // Render time slots for this day
    const dayData = citaAvailableDates[dateStr];
    if (dayData) {
        renderTimeSlots(dayData.slots);
    }
}

function renderTimeSlots(slots) {
    const morning = slots.filter(s => parseInt(s.hour) < 12);
    const afternoon = slots.filter(s => parseInt(s.hour) >= 12);
    let html = '';

    if (morning.length > 0) {
        html += `<div>
            <span class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block mb-3">Mañana</span>
            <div class="grid grid-cols-3 gap-2 sm:gap-3">
                ${morning.map(s => `<button type="button" class="slot-btn" data-start="${s.start}" data-end="${s.end}" data-hour="${s.hour}">${formatHour12(s.hour)}</button>`).join('')}
            </div>
        </div>`;
    }

    if (afternoon.length > 0) {
        html += `<div>
            <span class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block mb-3">Tarde</span>
            <div class="grid grid-cols-3 gap-2 sm:gap-3">
                ${afternoon.map(s => `<button type="button" class="slot-btn" data-start="${s.start}" data-end="${s.end}" data-hour="${s.hour}">${formatHour12(s.hour)}</button>`).join('')}
            </div>
        </div>`;
    }

    if (!html) {
        html = '<p class="text-sm text-on-surface-variant text-center py-8">No hay horarios disponibles este día.</p>';
    }

    const container = document.getElementById('cita-slots-container');
    container.innerHTML = html;

    container.querySelectorAll('.slot-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTimeSlot(btn));
    });
}

function selectTimeSlot(btn) {
    citaSelectedSlot = {
        start: btn.dataset.start,
        end: btn.dataset.end,
        hour: btn.dataset.hour
    };

    // Update button states
    document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');

    // Enable confirm
    document.getElementById('cita-btn-confirmar').disabled = false;

    // Show summary card
    const summaryCard = document.getElementById('cita-summary-card');
    const summaryText = document.getElementById('cita-summary-text');
    summaryCard.style.display = '';
    summaryText.textContent = `${formatDateLong(citaSelectedDateStr)} · ${formatHour12(citaSelectedSlot.hour)}`;
}

function navigateMonth(dir) {
    const newIdx = citaCurrentMonthIdx + dir;
    if (newIdx < 0 || newIdx >= citaMonths.length) return;
    citaCurrentMonthIdx = newIdx;
    buildCalendarGrid(citaMonths[citaCurrentMonthIdx]);
}

async function confirmarCita() {
    if (!citaSelectedSlot || !citaSelectedDateStr) return;

    const btn = document.getElementById('cita-btn-confirmar');

    if (isCooldown('cita')) {
        btn.textContent = 'ESPERÁ...';
        setTimeout(() => { btn.textContent = 'CONFIRMAR REUNIÓN'; }, 3000);
        return;
    }

    btn.disabled = true;
    btn.textContent = 'AGENDANDO...';

    const nombre = (document.getElementById('cita-nombre')?.value?.trim() || '').replace(/[<>"'`]/g, '').substring(0, 100);
    const email = (document.getElementById('cita-email')?.value?.trim() || '').substring(0, 254);

    if (!email || !validarEmail(email)) {
        btn.textContent = 'CONFIRMAR REUNIÓN';
        btn.disabled = false;
        // Highlight email field
        const emailField = document.getElementById('cita-email');
        if (emailField) {
            emailField.classList.add('ring-2', 'ring-error');
            emailField.focus();
            setTimeout(() => emailField.classList.remove('ring-2', 'ring-error'), 3000);
        }
        return;
    }

    // Build services summary
    const servicios = [];
    CATEGORIAS.forEach(cat => {
        if (cat.id === 'personalizado' || !cat.servicios) return;
        cat.servicios.forEach(s => {
            if (document.getElementById(`chk-${s.key}`)?.checked) {
                servicios.push(s.label);
            }
        });
    });
    itemsPersonalizados.forEach(i => servicios.push(i.nombre));

    try {
        const res = await fetch(`${API_BASE}/api/agendar-cita`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre,
                email,
                fecha_inicio: citaSelectedSlot.start,
                fecha_fin: citaSelectedSlot.end,
                servicios: servicios.join(', '),
            }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al agendar');

        // Hide calendar columns, show confirmation
        document.getElementById('cita-left-col').style.display = 'none';
        document.getElementById('cita-right-col').style.display = 'none';
        document.getElementById('cita-error').style.display = 'none';

        const meetHtml = data.meetLink
            ? `<a href="${sanitizeHTML(data.meetLink)}" target="_blank" rel="noopener" class="cita-meet-link">🎥 Unirse a Google Meet</a>`
            : '';

        document.getElementById('cita-resumen').innerHTML = `
            <span class="cita-success-icon">✅</span>
            <h2 class="text-xl font-bold text-white mb-4">¡Reunión agendada!</h2>
            <p class="text-on-surface-variant text-sm mb-6">Te enviamos una invitación con los detalles.</p>
            <div class="bg-surface-container-high/50 rounded-xl p-5 text-left space-y-2 mb-4 inline-block">
                <p class="text-sm"><span class="text-on-surface-variant">📅 Fecha:</span> <strong class="text-white">${sanitizeHTML(formatDateLong(citaSelectedDateStr))}</strong></p>
                <p class="text-sm"><span class="text-on-surface-variant">🕐 Hora:</span> <strong class="text-white">${formatHour12(citaSelectedSlot.hour)}</strong></p>
                <p class="text-sm"><span class="text-on-surface-variant">📧 Email:</span> <strong class="text-white">${sanitizeHTML(email)}</strong></p>
            </div>
            <br>${meetHtml}
        `;
        document.getElementById('cita-confirmacion').style.display = 'block';

        btn.textContent = 'LISTO';
        btn.disabled = true;
        document.getElementById('cita-btn-cancelar').textContent = 'Cerrar';
    } catch (err) {
        const errorDiv = document.getElementById('cita-error');
        document.getElementById('cita-error-msg').textContent = err.message;
        errorDiv.style.display = 'block';
        btn.textContent = 'CONFIRMAR REUNIÓN';
        btn.disabled = false;
    }
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // Render all services
    renderServicios();
    renderExtras();

    // Perfil buttons
    document.querySelectorAll('.perfil-btn').forEach(btn => {
        btn.addEventListener('click', () => seleccionarPerfil(btn.dataset.perfil));
    });

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
        document.getElementById('cita-error').style.display = 'none';
        document.getElementById('cita-loading').style.display = 'flex';
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
    actualizarSidebar();
    actualizarVistaAdmin();

    // Interactive background
    initMouseGlow();
    initMathMeteors();

    // Reveal page
    document.body.classList.add('ready');
});
