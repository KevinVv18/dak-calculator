// ══════════════════════════════════════════
//  DAK Calculator — lógica principal
// ══════════════════════════════════════════

// ── Sanitización HTML para prevenir XSS ──
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ── Validación de email ──
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const CONFIG_KEY = 'dak-calculator-config';
const CONFIG_VERSION = 5; // bumpeá este número al cambiar la estructura del config

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
            // Si la versión guardada es diferente, descartamos el cache viejo
            if (p._v !== CONFIG_VERSION) {
                console.info('[DAK] Config version mismatch — reseteando a defaults.');
                return defaults;
            }
            return {
                _v: CONFIG_VERSION,
                // Merge: defaults como base, encima el valor guardado
                // Garantiza que nuevas claves siempre existan
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

// ── Helpers ──
const NIVELES = ['basico', 'avanzado'];
const NIVELES_LABEL = { basico: 'Básico', avanzado: 'Avanzado' };
const PERFIL_LABEL = { bajo: 'Inicial', medio: 'Crecimiento', alto: 'Corporativo' };
const TAG_FIJO = {
    'foto-tematica': 'Fotografía',
    'fotos-eventos': 'Fotografía',
    'tarjetas': 'Diseño',
    'banner': 'Diseño',
    'volantes': 'Diseño',
    'diptico': 'Diseño',
    'triptico': 'Diseño',
    'portada-fb': 'Diseño',
    'mockups': 'Diseño',
    'paneles': 'Diseño',
    'branding-rebranding': 'Branding',
    'landing-page': 'Web',
    'tienda-online': 'E-commerce',
    'mantenimiento-web': 'Soporte',
    'ads-meta': 'Publicidad',
    'ads-facebook': 'Publicidad',
    'ads-instagram': 'Publicidad',
    'seo-basico': 'Posicionar',
    'seo-avanzado': 'Posicionar',
    'sem-campana': 'Campaña',
    'email-marketing': 'Automación',
    'auto-redes': 'Automación',
    'dashboard-reportes': 'Analítica',
};
const fmt = n => 'S/ ' + new Intl.NumberFormat('es-PE').format(Math.round(n));

// Items personalizados (en memoria)
let itemsPersonalizados = [];
let stepActual = 1;
let isAdmin = sessionStorage.getItem('dak-admin') === 'true';

// ══════════════════════════════════════════
//  ADMIN LOGIN & STATE
// ══════════════════════════════════════════

function actualizarVistaAdmin() {
    isAdmin = sessionStorage.getItem('dak-admin') === 'true';
    const btnAdmin = document.getElementById('btn-admin-login');
    const btnAjustes = document.getElementById('btn-ajustes');
    const lockIcon = document.getElementById('icon-lock-aprox');
    const tooltip = document.getElementById('tooltip-aprox');
    const step1 = document.getElementById('step-1');
    const wizardStep1 = document.querySelector('.wizard-step[data-step="1"]');
    const line12 = document.getElementById('line-1-2');

    const btnLogout = document.getElementById('btn-logout');

    const perfilSection = document.querySelector('.perfil-cards');
    const perfilHint = document.getElementById('perfil-hint');
    const perfilLabel = perfilSection?.closest('.field-group')?.querySelector('label');

    if (isAdmin) {
        if (btnAdmin) btnAdmin.style.display = 'none';
        if (btnAjustes) btnAjustes.style.display = 'flex';
        if (btnLogout) btnLogout.style.display = 'flex';
        if (lockIcon) lockIcon.style.display = 'none';
        if (tooltip) tooltip.style.display = 'none';
        // Admin sees step 1 with perfil
        if (wizardStep1) wizardStep1.style.display = '';
        if (line12) line12.style.display = '';
        if (perfilSection) perfilSection.style.display = '';
        if (perfilHint) perfilHint.style.display = '';
        if (perfilLabel) perfilLabel.style.display = '';
        cerrarModalLoginAdmin();
    } else {
        if (btnAdmin) btnAdmin.style.display = 'flex';
        if (btnAjustes) btnAjustes.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'none';
        if (lockIcon) lockIcon.style.display = 'inline-block';
        if (tooltip) tooltip.style.display = '';
        // Non-admin: show step 1 but hide perfil section
        if (wizardStep1) wizardStep1.style.display = '';
        if (line12) line12.style.display = '';
        if (perfilSection) perfilSection.style.display = 'none';
        if (perfilHint) perfilHint.style.display = 'none';
        if (perfilLabel) perfilLabel.style.display = 'none';
        document.getElementById('perfil-cliente').value = 'bajo';
    }
}

function abrirModalLoginAdmin() {
    const modal = document.getElementById('modal-login-admin');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('modal-ajustes--abierto');
    document.getElementById('admin-user').value = '';
    document.getElementById('admin-pass').value = '';
    document.getElementById('admin-login-error').style.display = 'none';
    document.getElementById('admin-user').focus();
}

function cerrarModalLoginAdmin() {
    const modal = document.getElementById('modal-login-admin');
    if (modal) {
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('modal-ajustes--abierto');
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

    // Update text to error message
    tooltip.dataset.originalText = tooltip.dataset.originalText || tooltip.textContent;
    tooltip.textContent = mensaje;

    // Force visible + error state
    tooltip.classList.remove('tooltip-error');
    void tooltip.offsetWidth;
    tooltip.classList.add('tooltip-error');

    // Force show (in case not hovering)
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';
    tooltip.style.transform = 'translateY(0)';

    setTimeout(() => {
        tooltip.classList.remove('tooltip-error');
        tooltip.textContent = tooltip.dataset.originalText;
        // Let CSS hover handle visibility again
        tooltip.style.opacity = '';
        tooltip.style.visibility = '';
        tooltip.style.transform = '';
    }, 2500);
}

// ══════════════════════════════════════════
//  WIZARD — Navegación entre pasos
// ══════════════════════════════════════════

function irAStep(n) {
    document.getElementById(`step-${stepActual}`).classList.add('hidden');
    document.getElementById(`step-${n}`).classList.remove('hidden');

    document.querySelectorAll('.wizard-step').forEach(el => {
        const sn = parseInt(el.dataset.step);
        el.classList.toggle('activo', sn === n);
        el.classList.toggle('completado', sn < n);
    });
    document.getElementById('line-1-2').classList.toggle('completada', n > 1);
    document.getElementById('line-2-3').classList.toggle('completada', n > 2);

    const btnAnt = document.getElementById('btn-anterior');
    const btnSig = document.getElementById('btn-siguiente');
    btnAnt.classList.toggle('hidden', n <= 1);
    btnSig.classList.toggle('hidden', n === 3);

    stepActual = n;
    if (n > maxStepAlcanzado) maxStepAlcanzado = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function irAlSiguiente() {
    if (stepActual === 1) {
        if (!validarStep1()) return;
        irAStep(2);
    } else if (stepActual === 2) {
        renderResumen();
        irAStep(3);
    }
}

function irAlAnterior() {
    if (stepActual > 1) irAStep(stepActual - 1);
}

function validarStep1() {
    if (!isAdmin) return true; // Non-admin: perfil hidden, always pass
    const perfil = document.getElementById('perfil-cliente').value;
    if (!perfil) {
        document.getElementById('perfil-hint').classList.remove('oculto');
        document.getElementById('perfil-hint').style.color = '#fc8181';
        return false;
    }
    return true;
}

// ══════════════════════════════════════════
//  STEP 1 — Perfil
// ══════════════════════════════════════════

function seleccionarPerfil(perfil) {
    document.getElementById('perfil-cliente').value = perfil;
    document.querySelectorAll('.perfil-card').forEach(c =>
        c.classList.toggle('perfil-card--activo', c.dataset.perfil === perfil)
    );
    const hint = document.getElementById('perfil-hint');
    hint.classList.add('oculto');
    hint.style.color = '';
    actualizarFlotante();
}

// ══════════════════════════════════════════
//  STEP 2 — Renderizado dinámico
// ══════════════════════════════════════════

function renderStep2() {
    const tabsEl = document.getElementById('cat-tabs');
    const panelsEl = document.getElementById('cat-panels');
    tabsEl.innerHTML = '';
    panelsEl.innerHTML = '';

    CATEGORIAS.forEach((cat, idx) => {
        // Tab
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'cat-tab' + (idx === 0 ? ' activo' : '');
        tab.dataset.cat = cat.id;
        if (cat.badge) {
            tab.innerHTML = `${sanitizeHTML(cat.label)} <span class="badge-nuevo">${sanitizeHTML(cat.badge)}</span>`;
        } else {
            tab.textContent = cat.label;
        }
        tab.addEventListener('click', () => cambiarTab(cat.id));
        tabsEl.appendChild(tab);

        // Panel
        const panel = document.createElement('div');
        panel.id = `panel-${cat.id}`;
        panel.className = 'cat-panel' + (idx !== 0 ? ' hidden' : '');

        if (cat.id === 'personalizado') {
            panel.innerHTML = renderPanelPersonalizado();
        } else {
            panel.innerHTML = `<div class="services-grid">${cat.servicios.map(s =>
                s.tipo === 'nivel' ? renderCardNivel(s) : renderCardFijo(s)
            ).join('')
                }</div>`;
        }
        panelsEl.appendChild(panel);
    });

    // Listeners checkboxes de servicios
    CATEGORIAS.forEach(cat => {
        if (cat.id === 'personalizado' || !cat.servicios) return;
        cat.servicios.forEach(s => {
            const chk = document.getElementById(`chk-${s.key}`);
            if (!chk) return;

            // Helper: toggle card state
            const toggleCard = () => {
                const card = document.getElementById(`card-${s.key}`);
                const body = document.getElementById(`body-${s.key}`);
                card?.classList.toggle('activo', chk.checked);
                body?.classList.toggle('visible', chk.checked);
                if (!chk.checked && s.tipo === 'nivel') {
                    // Reset stepper
                    const disp = document.getElementById(`disp-${s.key}`);
                    const qty = document.getElementById(`qty-${s.key}`);
                    if (disp) disp.value = '1';
                    if (qty) qty.value = '1';
                }
                actualizarFlotante();
            };

            chk.addEventListener('change', toggleCard);

            // Click anywhere on the card toggles it
            const card = document.getElementById(`card-${s.key}`);
            card?.addEventListener('click', e => {
                // Don't toggle when clicking inside the body (steppers, nivel buttons, etc.)
                if (e.target.closest('.svc-card-body')) return;
                chk.checked = !chk.checked;
                toggleCard();
            });
        });
    });

    // Event delegation: stepper y nivel-seg
    document.getElementById('cat-panels').addEventListener('click', e => {
        // Stepper
        const stepperBtn = e.target.closest('.stepper-btn');
        if (stepperBtn) {
            const hidden = document.getElementById(stepperBtn.dataset.target);
            const disp = document.getElementById(stepperBtn.dataset.target.replace('qty-', 'disp-'));
            if (!hidden) return;
            let val = parseInt(hidden.value) || 1;
            val = stepperBtn.classList.contains('stepper-plus') ? val + 1 : Math.max(1, val - 1);
            hidden.value = val;
            if (disp) disp.value = val;
            actualizarFlotante();
            return;
        }
        // Nivel segmentado
        const nivelBtn = e.target.closest('.nivel-btn');
        if (nivelBtn) {
            const seg = nivelBtn.closest('.nivel-seg');
            if (!seg) return;
            seg.querySelectorAll('.nivel-btn').forEach(b => b.classList.remove('activo'));
            nivelBtn.classList.add('activo');
            const hidden = document.getElementById(`lvl-${seg.dataset.key}`);
            if (hidden) { hidden.value = nivelBtn.dataset.nivel; actualizarFlotante(); }
        }
    });

    // Escuchar input manual en los steppers de Step 2
    document.getElementById('cat-panels').addEventListener('input', e => {
        if (e.target.classList.contains('stepper-input')) {
            const val = parseInt(e.target.value);
            const key = e.target.id.replace('disp-', '');
            const hidden = document.getElementById(`qty-${key}`);
            if (hidden) {
                if (!isNaN(val) && val > 0) {
                    hidden.value = val;
                }
                actualizarFlotante(); // Actualizamos totales aunque esté vacío temporalmente
            }
        }
    });
    
    // Corregir valores vacíos o inválidos al perder el foco en Step 2
    document.getElementById('cat-panels').addEventListener('focusout', e => {
        if (e.target.classList.contains('stepper-input')) {
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 1) val = 1;
            e.target.value = val;
            const key = e.target.id.replace('disp-', '');
            const hidden = document.getElementById(`qty-${key}`);
            if (hidden) hidden.value = val;
            actualizarFlotante();
        }
    });

    // Info tooltips: move all tips to body to escape overflow:hidden / backdrop-filter stacking
    const globalTip = document.createElement('div');
    globalTip.className = 'svc-info-tip';
    globalTip.style.display = 'none';
    document.body.appendChild(globalTip);

    document.querySelectorAll('.svc-info-wrap').forEach(wrap => {
        wrap.addEventListener('mouseenter', () => {
            const key = wrap.closest('.svc-card')?.id?.replace('card-', '');
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

    // Personalizado
    document.getElementById('btn-add-custom')?.addEventListener('click', agregarItemPersonalizado);

    renderExtras();

    // Extras toggle (collapsible)
    document.getElementById('extras-toggle')?.addEventListener('click', () => {
        document.getElementById('extras-card')?.classList.toggle('expandido');
    });
}

function renderInfoIcon(key) {
    const desc = SERVICE_INFO[key];
    if (!desc) return '';
    return `<span class="svc-info-wrap">
        <span class="svc-info-icon">ⓘ</span>
    </span>`;
}

function renderCardNivel(s) {
    const desde = CONFIG.serviciosBase[s.key]?.basico ?? 0;
    const precios = CONFIG.serviciosBase[s.key] ?? {};
    const labels = s.tierLabels || {};
    const nivelBtns = NIVELES.map(n => `
        <button type="button" class="nivel-btn${n === 'basico' ? ' activo' : ''}" data-nivel="${n}">
            <span class="nivel-btn-name">${labels[n] || NIVELES_LABEL[n]}</span>
            <span class="nivel-btn-price">${fmt(precios[n] ?? 0)}</span>
        </button>`).join('');
    return `
    <div class="svc-card" id="card-${s.key}">
        <div class="svc-card-header">
            <input type="checkbox" id="chk-${s.key}" style="flex-shrink:0;width:17px;height:17px;accent-color:var(--color-secondary);pointer-events:none">
            <div class="svc-card-info">
                <span class="svc-card-label">${s.label}${renderInfoIcon(s.key)}</span>
                <span class="svc-card-price">desde ${fmt(desde)} / ${s.unidad || 'unidad'}</span>
            </div>
        </div>
        <div class="svc-card-body" id="body-${s.key}">
            <div class="svc-field">
                <label>Cantidad</label>
                <div class="stepper">
                    <button type="button" class="stepper-btn stepper-minus" data-target="qty-${s.key}">&#8722;</button>
                    <input type="number" class="stepper-input stepper-display" id="disp-${s.key}" value="1" min="1">
                    <button type="button" class="stepper-btn stepper-plus" data-target="qty-${s.key}">&#43;</button>
                </div>
                <input type="hidden" id="qty-${s.key}" value="1">
            </div>
            <div class="svc-field">
                <label>Tipo</label>
                <div class="nivel-seg" id="seg-${s.key}" data-key="${s.key}">${nivelBtns}</div>
                <input type="hidden" id="lvl-${s.key}" value="basico">
            </div>
        </div>
    </div>`;
}

function renderCardFijo(s) {
    const precio = CONFIG.preciosFijos[s.key]?.precio ?? '?';
    return `
    <div class="svc-card" id="card-${s.key}">
        <div class="svc-card-header">
            <input type="checkbox" id="chk-${s.key}" aria-label="${s.label}">
            <div class="svc-card-info">
                <span class="svc-card-label">${s.label}${renderInfoIcon(s.key)}</span>
                <span class="svc-card-price">${fmt(precio)}</span>
            </div>
        </div>
    </div>`;
}

function renderPanelPersonalizado() {
    return `
    <div class="personalizado-panel">
        <p style="font-size:13px;color:#8a99b0;margin-bottom:16px">
            Agregá cualquier servicio específico para este cliente.
        </p>
        <div class="personalizado-form">
            <input type="text" id="custom-nombre" class="text-input" placeholder="Nombre del servicio">
            <input type="number" id="custom-precio" class="number-input" placeholder="Precio" min="0">
            <button type="button" id="btn-add-custom" class="btn-add">+ Agregar</button>
        </div>
        <ul class="custom-items-list" id="custom-items-list">
            <li class="custom-empty">Ningún ítem agregado aún.</li>
        </ul>
    </div>`;
}

function cambiarTab(catId) {
    document.querySelectorAll('.cat-tab').forEach(t =>
        t.classList.toggle('activo', t.dataset.cat === catId)
    );
    document.querySelectorAll('.cat-panel').forEach(p =>
        p.classList.toggle('hidden', p.id !== `panel-${catId}`)
    );
}

function renderExtras() {
    const grid = document.getElementById('extras-grid');
    if (!grid) return;
    grid.innerHTML = Object.entries(CONFIG.factoresExtra).map(([key, obj]) => `
        <label class="extra-item" id="extra-label-${key}">
            <input type="checkbox" id="extra-${key}" data-key="${key}">
            <div class="extra-item-info">
                <span class="extra-item-label">${obj.nombre}</span>
                <span class="extra-item-precio">${fmt(obj.precio)}</span>
            </div>
        </label>
    `).join('');

    grid.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', () => {
            document.getElementById(`extra-label-${chk.dataset.key}`)
                ?.classList.toggle('activo', chk.checked);
            actualizarFlotante();
        });
    });
}

// ══════════════════════════════════════════
//  CÁLCULO
// ══════════════════════════════════════════

function calcularTotal() {
    const perfil = document.getElementById('perfil-cliente').value || 'bajo';
    let subtotalBase = 0;

    // Servicios con nivel / fijo desde categorías
    CATEGORIAS.forEach(cat => {
        if (cat.id === 'personalizado' || !cat.servicios) return;
        cat.servicios.forEach(s => {
            const chk = document.getElementById(`chk-${s.key}`);
            if (!chk?.checked) return;
            if (s.tipo === 'nivel') {
                const qty = parseInt(document.getElementById(`qty-${s.key}`)?.value) || 0;
                const lvl = document.getElementById(`lvl-${s.key}`)?.value || 'basico';
                subtotalBase += qty * (CONFIG.serviciosBase[s.key]?.[lvl] ?? 0);
            } else if (s.tipo === 'fijo') {
                subtotalBase += CONFIG.preciosFijos[s.key]?.precio ?? 0;
            }
        });
    });

    // Items personalizados
    itemsPersonalizados.forEach(i => (subtotalBase += i.precio));

    const multiplicador = CONFIG.perfilesCliente[perfil] ?? 1;
    const subtotalMult = subtotalBase * multiplicador;

    let extrasTotal = 0;
    const extrasActivos = [];
    Object.entries(CONFIG.factoresExtra).forEach(([key, obj]) => {
        if (document.getElementById(`extra-${key}`)?.checked) {
            extrasTotal += obj.precio;
            extrasActivos.push(obj);
        }
    });

    return { perfil, subtotalBase, multiplicador, subtotalMult, extrasTotal, extrasActivos, totalFinal: subtotalMult + extrasTotal };
}

function actualizarFlotante() {
    const { totalFinal } = calcularTotal();
    const el = document.getElementById('flotante-valor');
    if (el) el.textContent = fmt(totalFinal);
}

// ══════════════════════════════════════════
//  STEP 3 — Resumen
// ══════════════════════════════════════════

function renderResumen() {
    const { perfil, subtotalBase, multiplicador, subtotalMult, extrasTotal, extrasActivos, totalFinal } = calcularTotal();
    const nombre = sanitizeHTML(document.getElementById('nombre-cliente').value.trim());
    const perfilLabel = PERFIL_LABEL[perfil] || perfil;

    let filas = [];
    CATEGORIAS.forEach(cat => {
        if (cat.id === 'personalizado' || !cat.servicios) return;
        cat.servicios.forEach(s => {
            const chk = document.getElementById(`chk-${s.key}`);
            if (!chk?.checked) return;
            if (s.tipo === 'nivel') {
                const qty = parseInt(document.getElementById(`qty-${s.key}`)?.value) || 0;
                const lvl = document.getElementById(`lvl-${s.key}`)?.value || 'basico';
                const precioUnit = CONFIG.serviciosBase[s.key]?.[lvl] ?? 0;
                const subtotal = qty * precioUnit;
                const tierLabel = s.tierLabels?.[lvl] || NIVELES_LABEL[lvl];
                if (subtotal > 0) filas.push({ cat: cat.label, nombre: s.label, key: s.key, tipo: 'nivel', qty, lvl, tierLabel, precioUnit, subtotal });
            } else if (s.tipo === 'fijo') {
                const p = CONFIG.preciosFijos[s.key]?.precio ?? 0;
                filas.push({ cat: cat.label, nombre: s.label, key: s.key, tipo: 'fijo', subtotal: p });
            }
        });
    });
    itemsPersonalizados.forEach(i =>
        filas.push({ cat: '⚙️ Personalizado', nombre: i.nombre, key: `custom-${i.id}`, tipo: 'custom', customId: i.id, subtotal: i.precio })
    );

    const tablaFilas = filas.length
        ? filas.map(f => {
            // Detalle column: mini-stepper for nivel, text for others
            let detalleHtml;
            if (f.tipo === 'nivel') {
                detalleHtml = `
                    <div class="resumen-stepper">
                        <button type="button" class="resumen-stepper-btn" data-action="minus" data-key="${f.key}">−</button>
                        <input type="number" class="resumen-stepper-input" id="rqty-${f.key}" data-key="${f.key}" value="${f.qty}" min="1">
                        <button type="button" class="resumen-stepper-btn" data-action="plus" data-key="${f.key}">+</button>
                        <span class="resumen-stepper-level">× ${f.tierLabel}</span>
                    </div>`;
            } else if (f.tipo === 'fijo') {
                const tagLabel = TAG_FIJO[f.key] || 'Fijo';
                detalleHtml = `<span class="resumen-tag-fijo">${tagLabel}</span>`;
            } else {
                detalleHtml = `<span class="resumen-tag-custom">Personalizado</span>`;
            }

            // Delete key
            const deleteAttr = f.tipo === 'custom'
                ? `data-delete-custom="${f.customId}"`
                : `data-delete-svc="${f.key}"`;

            return `
            <tr>
                <td><span class="tag-cat">${sanitizeHTML(f.cat)}</span><br><span style="margin-top:4px;display:block">${sanitizeHTML(f.nombre)}</span></td>
                <td>${detalleHtml}</td>
                <td class="text-right">${fmt(f.subtotal)}</td>
                <td class="td-action"><button type="button" class="btn-resumen-delete" ${deleteAttr} title="Eliminar">🗑</button></td>
            </tr>`;
        }).join('')
        : `<tr><td colspan="4" class="resumen-empty">Sin servicios seleccionados.</td></tr>`;

    const perfilRow = isAdmin
        ? `<div class="resumen-fila"><span>× Perfil ${perfilLabel} (${multiplicador}x)</span><span>${fmt(subtotalMult)}</span></div>`
        : '';
    const perfilMeta = isAdmin
        ? `<span>Perfil: <strong>${perfilLabel}</strong> (×${multiplicador})</span>`
        : '';

    const html = `
        <div class="resumen-meta">
            ${nombre ? `<span>Cliente: <strong>${nombre}</strong></span>` : ''}
            ${perfilMeta}
        </div>
        <table class="resumen-tabla">
            <thead><tr>
                <th>Servicio</th>
                <th class="muted">Detalle</th>
                <th class="text-right">Subtotal</th>
                <th style="width:40px"></th>
            </tr></thead>
            <tbody>${tablaFilas}</tbody>
        </table>
        <div class="resumen-calculo">
            <div class="resumen-fila"><span>Subtotal base</span><span>${fmt(subtotalBase)}</span></div>
            ${perfilRow}
            ${extrasActivos.length ? `<div class="resumen-fila"><span>+ Extras (${extrasActivos.map(e => e.nombre).join(', ')})</span><span>${fmt(extrasTotal)}</span></div>` : ''}
            <div class="resumen-fila total"><span>TOTAL FINAL</span><span>${fmt(totalFinal)}</span></div>
        </div>`;

    const esAprox = document.getElementById('chk-aprox')?.checked ?? true;
    const badgeAprox = esAprox
        ? `<div class="resumen-aprox">⚠️ <strong>Presupuesto aproximado</strong> — Los precios son orientativos y pueden ajustarse antes de oficializarse.</div>`
        : `<div class="resumen-aprox resumen-aprox--oficial">✅ <strong>Cotización oficial</strong> — Los precios reflejan valores finales.</div>`;

    document.getElementById('resumen-contenido').innerHTML = badgeAprox + html;

    // ── Attach interactive listeners ──

    // Delete service buttons
    document.querySelectorAll('.btn-resumen-delete[data-delete-svc]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.deleteSvc;
            const chk = document.getElementById(`chk-${key}`);
            if (chk) {
                chk.checked = false;
                document.getElementById(`card-${key}`)?.classList.remove('activo');
                document.getElementById(`body-${key}`)?.classList.remove('visible');
            }
            actualizarFlotante();
            renderResumen();
        });
    });

    // Delete custom item buttons
    document.querySelectorAll('.btn-resumen-delete[data-delete-custom]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.deleteCustom);
            itemsPersonalizados = itemsPersonalizados.filter(i => i.id !== id);
            renderListaCustom();
            actualizarFlotante();
            renderResumen();
        });
    });

    // Quantity steppers
    document.querySelectorAll('.resumen-stepper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key;
            const action = btn.dataset.action;
            const qtyInput = document.getElementById(`qty-${key}`);
            const dispStep2 = document.getElementById(`disp-${key}`);
            if (!qtyInput) return;
            let val = parseInt(qtyInput.value) || 1;
            val = action === 'plus' ? val + 1 : Math.max(1, val - 1);
            qtyInput.value = val;
            if (dispStep2) dispStep2.value = val;
            actualizarFlotante();
            renderResumen();
        });
    });

    // Manual input for quantity steppers
    document.querySelectorAll('.resumen-stepper-input').forEach(inp => {
        inp.addEventListener('input', e => {
            const key = e.target.dataset.key;
            const val = parseInt(e.target.value);
            const qtyInput = document.getElementById(`qty-${key}`);
            const dispStep2 = document.getElementById(`disp-${key}`);
            if (qtyInput) {
                if (!isNaN(val) && val > 0) {
                    qtyInput.value = val;
                    if (dispStep2) dispStep2.value = val;
                }
                actualizarFlotante();
            }
        });
        
        inp.addEventListener('focusout', e => {
            const key = e.target.dataset.key;
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 1) val = 1;
            e.target.value = val;
            
            const qtyInput = document.getElementById(`qty-${key}`);
            const dispStep2 = document.getElementById(`disp-${key}`);
            if (qtyInput) {
                qtyInput.value = val;
                if (dispStep2) dispStep2.value = val;
            }
            actualizarFlotante();
            renderResumen();
        });
    });


    // Pre-fill email
    const emailCliente = document.getElementById('email-cliente').value.trim();
    if (emailCliente) document.getElementById('email-destino').value = emailCliente;
}

// ══════════════════════════════════════════
//  PERSONALIZADO
// ══════════════════════════════════════════

function agregarItemPersonalizado() {
    const nombreEl = document.getElementById('custom-nombre');
    const precioEl = document.getElementById('custom-precio');
    const nombre = nombreEl.value.trim().slice(0, 100); // Límite 100 chars
    const precio = parseFloat(precioEl.value) || 0;
    if (!nombre || precio <= 0 || precio > 999999) return;
    itemsPersonalizados.push({ id: Date.now(), nombre, precio });
    nombreEl.value = '';
    precioEl.value = '';
    renderListaCustom();
    actualizarFlotante();
}

function eliminarItemPersonalizado(id) {
    itemsPersonalizados = itemsPersonalizados.filter(i => i.id !== id);
    renderListaCustom();
    actualizarFlotante();
}

function renderListaCustom() {
    const list = document.getElementById('custom-items-list');
    if (!list) return;
    list.innerHTML = itemsPersonalizados.length
        ? itemsPersonalizados.map(i => `
            <li class="custom-item">
                <span class="custom-item-nombre">${sanitizeHTML(i.nombre)}</span>
                <span class="custom-item-precio">${fmt(i.precio)}</span>
                <button type="button" class="btn-delete" data-custom-id="${i.id}" aria-label="Eliminar">✕</button>
            </li>`).join('')
        : '<li class="custom-empty">Ningún ítem agregado aún.</li>';

    // Attach delete handlers (avoids inline onclick)
    list.querySelectorAll('.btn-delete[data-custom-id]').forEach(btn => {
        btn.addEventListener('click', () => eliminarItemPersonalizado(parseInt(btn.dataset.customId)));
    });
}

// ══════════════════════════════════════════
//  EMAIL
// ══════════════════════════════════════════

function construirCuerpoEmail() {
    const { perfil, subtotalBase, multiplicador, subtotalMult, extrasTotal, extrasActivos, totalFinal } = calcularTotal();
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
        `TOTAL FINAL:            ${fmt(totalFinal)}`,
        `══════════════════════════════`,
    );
    return lines.filter(Boolean).join('\n');
}

function enviarCotizacion() {
    const emailDestino = document.getElementById('email-destino').value.trim();
    const mensaje = document.getElementById('email-mensaje').value.trim();
    const feedback = document.getElementById('email-feedback');
    const nombre = document.getElementById('nombre-cliente').value.trim() || 'cliente';

    if (!emailDestino || !validarEmail(emailDestino)) {
        feedback.textContent = !emailDestino
            ? '⚠️ Ingresá el email del destinatario.'
            : '⚠️ El formato del email no es válido.';
        feedback.className = 'email-feedback error';
        return;
    }

    const cuerpo = construirCuerpoEmail();
    const total = calcularTotal();

    // Intentar EmailJS si está configurado
    if (EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.publicKey) {
        feedback.textContent = 'Enviando...';
        feedback.className = 'email-feedback';
        // eslint-disable-next-line no-undef
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
            to_email: emailDestino,
            to_name: nombre,
            cotizacion: cuerpo,
            total: fmt(total.totalFinal),
            mensaje: mensaje || ''
        }, EMAILJS_CONFIG.publicKey)
            .then(() => {
                feedback.textContent = '✅ Cotización enviada con éxito.';
                feedback.className = 'email-feedback ok';
            })
            .catch(() => {
                feedback.textContent = '❌ Error al enviar. Verificá la configuración de email.';
                feedback.className = 'email-feedback error';
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
        feedbackEl.className = 'email-feedback ok';
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
    modal.classList.add('modal-ajustes--abierto');
    rellenarModalAjustes();
}

function cerrarModalAjustes() {
    const modal = document.getElementById('modal-ajustes');
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('modal-ajustes--abierto');
}

function rellenarModalAjustes() {
    // Servicios con nivel
    const sb = document.getElementById('ajustes-servicios-base');
    sb.innerHTML = '';
    SERVICIOS_BASE_KEYS.forEach(({ key, label }) => {
        const bloque = document.createElement('div');
        bloque.className = 'ajustes-bloque';
        bloque.innerHTML = `<strong>${label}</strong>`;
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
            <label for="adj-pf-${key}">${obj.nombre}</label>
            <input type="number" id="adj-pf-${key}" data-pf="${key}" value="${obj.precio}" min="0">
        </div>`;
    });

    // Perfiles
    const pe = document.getElementById('ajustes-perfiles');
    pe.innerHTML = '';
    Object.entries(CONFIG.perfilesCliente).forEach(([key, val]) => {
        const label = PERFIL_LABEL[key] || (key.charAt(0).toUpperCase() + key.slice(1));
        pe.innerHTML += `<div class="ajustes-fila">
            <label for="adj-pe-${key}">${label}</label>
            <input type="number" step="0.1" id="adj-pe-${key}" data-pe="${key}" value="${val}" min="0">
        </div>`;
    });

    // Extras
    const fe = document.getElementById('ajustes-factores-extra');
    fe.innerHTML = '';
    Object.entries(CONFIG.factoresExtra).forEach(([key, obj]) => {
        fe.innerHTML += `<div class="ajustes-fila">
            <label for="adj-fe-${key}">${obj.nombre}</label>
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

    // Re-render UI with new prices
    actualizarFlotante();
    renderExtras();
    cerrarModalAjustes();
}

function resetearDefaults() {
    if (!confirm('¿Restaurar todos los precios a los valores por defecto?')) return;
    localStorage.removeItem(CONFIG_KEY);
    location.reload();
}

// ══════════════════════════════════════════
//  WIZARD STEP CLICK NAVIGATION
// ══════════════════════════════════════════

let wizardToastTimer = null;

function mostrarWizardToast(mensaje) {
    const toast = document.getElementById('wizard-toast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.remove('visible');
    void toast.offsetWidth;
    toast.classList.add('visible');
    clearTimeout(wizardToastTimer);
    wizardToastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
}

// Track the highest step the user has reached
let maxStepAlcanzado = 1;

function manejarClickWizardStep(targetStep) {
    if (targetStep === stepActual) return;

    const minStep = isAdmin ? 1 : 2;
    if (targetStep < minStep) return;

    // Can navigate to any step already completed (< current) or already visited
    if (targetStep <= maxStepAlcanzado) {
        if (targetStep === 3) renderResumen();
        irAStep(targetStep);
        return;
    }

    // Trying to skip ahead — show notification
    mostrarWizardToast('⚠️ Completá la sección actual antes de continuar');
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // Step 2: render tabs y cards
    renderStep2();

    // Wizard nav
    document.getElementById('btn-siguiente').addEventListener('click', irAlSiguiente);
    document.getElementById('btn-anterior').addEventListener('click', irAlAnterior);

    // Perfil cards
    document.querySelectorAll('.perfil-card').forEach(c =>
        c.addEventListener('click', () => seleccionarPerfil(c.dataset.perfil))
    );

    // Wizard step click navigation
    document.querySelectorAll('.wizard-step').forEach(el => {
        el.addEventListener('click', () => {
            const targetStep = parseInt(el.dataset.step);
            manejarClickWizardStep(targetStep);
        });
    });

    // Modal
    document.getElementById('btn-ajustes').addEventListener('click', abrirModalAjustes);
    document.getElementById('modal-ajustes-cerrar').addEventListener('click', cerrarModalAjustes);
    document.getElementById('modal-ajustes-aplicar').addEventListener('click', aplicarAjustes);
    document.getElementById('modal-ajustes-reset').addEventListener('click', resetearDefaults);
    document.getElementById('modal-ajustes').addEventListener('click', ev => {
        if (ev.target === ev.currentTarget) cerrarModalAjustes();
    });

    // Enviar cotización
    document.getElementById('btn-enviar').addEventListener('click', enviarCotizacion);

    // Toggle presupuesto aproximado — actualiza el badge en tiempo real
    const chkAprox = document.getElementById('chk-aprox');
    const labelAprox = document.getElementById('label-aprox');
    
    if (labelAprox && chkAprox) {
        // Prevent clicking the label container if not admin
        labelAprox.addEventListener('click', e => {
            if (!isAdmin) {
                e.preventDefault();
                mostrarErrorToast('No tienes permisos de admin');
            }
        });
        
        chkAprox.addEventListener('change', (e) => {
            if (!isAdmin) {
                // If somehow they bypassed the click, revert the change
                e.preventDefault();
                chkAprox.checked = true;
                return;
            }
            if (stepActual === 3) renderResumen();
        });
    }

    // Modal Admin events
    document.getElementById('btn-admin-login')?.addEventListener('click', abrirModalLoginAdmin);
    document.getElementById('modal-login-cerrar')?.addEventListener('click', cerrarModalLoginAdmin);
    document.getElementById('btn-admin-submit')?.addEventListener('click', procesarLoginAdmin);
    document.getElementById('admin-pass')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') procesarLoginAdmin();
    });

    // Logout buttons (header + settings modal)
    document.getElementById('btn-logout')?.addEventListener('click', logoutAdmin);
    document.getElementById('btn-logout-modal')?.addEventListener('click', logoutAdmin);

    // Escape closes modal
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            cerrarModalAjustes();
            cerrarModalLoginAdmin();
        }
    });

    // Agendar cita
    document.getElementById('btn-agendar')?.addEventListener('click', abrirModalCita);
    document.getElementById('modal-cita-cerrar')?.addEventListener('click', cerrarModalCita);
    document.getElementById('btn-cita-cancelar')?.addEventListener('click', cerrarModalCita);
    document.getElementById('btn-cita-confirmar')?.addEventListener('click', confirmarCita);
    document.getElementById('modal-cita')?.addEventListener('click', ev => {
        if (ev.target === ev.currentTarget) cerrarModalCita();
    });

    // Escape closes cita modal too
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') cerrarModalCita();
    });

    actualizarFlotante();
    actualizarVistaAdmin();

    // Reveal page after state is set (prevents admin→user flicker)
    document.body.classList.add('ready');
});

// ══════════════════════════════════════════
//  AGENDAR CITA — Google Calendar
// ══════════════════════════════════════════

const API_BASE = 'https://dak-calculator.vercel.app';

let citaSlots = {};
let citaSelectedDay = null;
let citaSelectedSlot = null;

function abrirModalCita() {
    const modal = document.getElementById('modal-cita');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('modal-ajustes--abierto');

    // Reset state
    citaSelectedDay = null;
    citaSelectedSlot = null;
    document.getElementById('btn-cita-confirmar').disabled = true;
    document.getElementById('cita-loading').style.display = 'flex';
    document.getElementById('cita-calendario').style.display = 'none';
    document.getElementById('cita-confirmacion').style.display = 'none';
    document.getElementById('cita-error').style.display = 'none';

    cargarDisponibilidad();
}

function cerrarModalCita() {
    const modal = document.getElementById('modal-cita');
    if (modal) {
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('modal-ajustes--abierto');
    }
}

async function cargarDisponibilidad() {
    try {
        const res = await fetch(`${API_BASE}/api/disponibilidad`);
        if (!res.ok) throw new Error('Error del servidor');
        const data = await res.json();
        citaSlots = data.slots || {};

        document.getElementById('cita-loading').style.display = 'none';

        const dias = Object.keys(citaSlots);
        if (dias.length === 0) {
            document.getElementById('cita-error').textContent = 'No hay horarios disponibles en las próximas 2 semanas.';
            document.getElementById('cita-error').style.display = 'block';
            return;
        }

        renderDias(dias);
        document.getElementById('cita-calendario').style.display = 'flex';
    } catch (err) {
        document.getElementById('cita-loading').style.display = 'none';
        document.getElementById('cita-error').textContent = 'No se pudo cargar la disponibilidad. Intenta más tarde.';
        document.getElementById('cita-error').style.display = 'block';
    }
}

function renderDias(dias) {
    const container = document.getElementById('cita-dias');
    container.innerHTML = dias.map(dia =>
        `<button type="button" class="cita-dia-btn" data-dia="${sanitizeHTML(dia)}">${sanitizeHTML(dia)}</button>`
    ).join('');

    container.querySelectorAll('.cita-dia-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            citaSelectedDay = btn.dataset.dia;
            citaSelectedSlot = null;
            document.getElementById('btn-cita-confirmar').disabled = true;
            container.querySelectorAll('.cita-dia-btn').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
            renderHoras(citaSlots[citaSelectedDay]);
        });
    });
}

function renderHoras(horas) {
    const container = document.getElementById('cita-horas');
    container.innerHTML = horas.map(h =>
        `<button type="button" class="cita-hora-btn" data-start="${h.start}" data-end="${h.end}">${sanitizeHTML(h.hour)}</button>`
    ).join('');

    container.querySelectorAll('.cita-hora-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            citaSelectedSlot = { start: btn.dataset.start, end: btn.dataset.end, hour: btn.textContent };
            container.querySelectorAll('.cita-hora-btn').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
            document.getElementById('btn-cita-confirmar').disabled = false;
        });
    });
}

async function confirmarCita() {
    if (!citaSelectedSlot || !citaSelectedDay) return;

    const btn = document.getElementById('btn-cita-confirmar');
    btn.disabled = true;
    btn.textContent = 'Agendando...';

    const nombre = document.getElementById('nombre-cliente')?.value || '';
    const email = document.getElementById('email-destino')?.value
        || document.getElementById('email-cliente')?.value || '';

    if (!email || !validarEmail(email)) {
        btn.textContent = 'Confirmar cita';
        btn.disabled = false;
        document.getElementById('cita-error').textContent = 'Ingresa un email válido en la cotización primero.';
        document.getElementById('cita-error').style.display = 'block';
        return;
    }

    // Build services summary
    const servicios = Array.from(document.querySelectorAll('.svc-card.activo'))
        .map(c => c.querySelector('.svc-card-name')?.textContent || '')
        .filter(Boolean)
        .join(', ');

    try {
        const res = await fetch(`${API_BASE}/api/agendar-cita`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre,
                email,
                fecha_inicio: citaSelectedSlot.start,
                fecha_fin: citaSelectedSlot.end,
                servicios,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Error al agendar');
        }

        // Show confirmation
        document.getElementById('cita-calendario').style.display = 'none';
        document.getElementById('cita-error').style.display = 'none';

        const meetHtml = data.meetLink
            ? `<a href="${sanitizeHTML(data.meetLink)}" target="_blank" rel="noopener" class="cita-meet-link">🎥 Unirse a Google Meet</a>`
            : '';

        document.getElementById('cita-resumen').innerHTML = `
            <span class="cita-success-icon">✅</span>
            <strong>¡Cita agendada!</strong><br><br>
            📅 <strong>${sanitizeHTML(citaSelectedDay)}</strong> a las <strong>${sanitizeHTML(citaSelectedSlot.hour)}</strong><br>
            📧 Se envió invitación a <strong>${sanitizeHTML(email)}</strong><br>
            ${meetHtml}
        `;
        document.getElementById('cita-confirmacion').style.display = 'block';

        // Change footer buttons
        btn.textContent = 'Listo';
        btn.disabled = true;
        document.getElementById('btn-cita-cancelar').textContent = 'Cerrar';
    } catch (err) {
        document.getElementById('cita-error').textContent = err.message;
        document.getElementById('cita-error').style.display = 'block';
        btn.textContent = 'Confirmar cita';
        btn.disabled = false;
    }
}
