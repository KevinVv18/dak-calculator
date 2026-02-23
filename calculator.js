// ══════════════════════════════════════════
//  DAK Calculator — lógica principal
// ══════════════════════════════════════════

const CONFIG_KEY = 'dak-calculator-config';
const CONFIG_VERSION = 3; // bumpeá este número al cambiar la estructura del config

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
const NIVELES = ['facil', 'medio', 'dificil'];
const NIVELES_LABEL = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };
const fmt = n => '$' + new Intl.NumberFormat('es-ES').format(Math.round(n));

// Items personalizados (en memoria)
let itemsPersonalizados = [];
let stepActual = 1;

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
    btnAnt.classList.toggle('hidden', n === 1);
    btnSig.classList.toggle('hidden', n === 3);

    stepActual = n;
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
        tab.textContent = cat.label;
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
                    if (disp) disp.textContent = '1';
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
            if (disp) disp.textContent = val;
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

    // Personalizado
    document.getElementById('btn-add-custom')?.addEventListener('click', agregarItemPersonalizado);

    renderExtras();

    // Extras toggle (collapsible)
    document.getElementById('extras-toggle')?.addEventListener('click', () => {
        document.getElementById('extras-card')?.classList.toggle('expandido');
    });
}

function renderCardNivel(s) {
    const desde = CONFIG.serviciosBase[s.key]?.facil ?? 0;
    const precios = CONFIG.serviciosBase[s.key] ?? {};
    const nivelBtns = ['facil', 'medio', 'dificil'].map(n => `
        <button type="button" class="nivel-btn${n === 'medio' ? ' activo' : ''}" data-nivel="${n}">
            <span class="nivel-btn-name">${NIVELES_LABEL[n]}</span>
            <span class="nivel-btn-price">${fmt(precios[n] ?? 0)}</span>
        </button>`).join('');
    return `
    <div class="svc-card" id="card-${s.key}">
        <div class="svc-card-header">
            <input type="checkbox" id="chk-${s.key}" style="flex-shrink:0;width:17px;height:17px;accent-color:var(--color-secondary);pointer-events:none">
            <div class="svc-card-info">
                <span class="svc-card-label">${s.label}</span>
                <span class="svc-card-price">desde ${fmt(desde)} / ${s.unidad || 'unidad'}</span>
            </div>
        </div>
        <div class="svc-card-body" id="body-${s.key}">
            <div class="svc-field">
                <label>Cantidad</label>
                <div class="stepper">
                    <button type="button" class="stepper-btn stepper-minus" data-target="qty-${s.key}">&#8722;</button>
                    <span class="stepper-display" id="disp-${s.key}">1</span>
                    <button type="button" class="stepper-btn stepper-plus" data-target="qty-${s.key}">&#43;</button>
                </div>
                <input type="hidden" id="qty-${s.key}" value="1">
            </div>
            <div class="svc-field">
                <label>Nivel</label>
                <div class="nivel-seg" id="seg-${s.key}" data-key="${s.key}">${nivelBtns}</div>
                <input type="hidden" id="lvl-${s.key}" value="medio">
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
                <span class="svc-card-label">${s.label}</span>
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
                const lvl = document.getElementById(`lvl-${s.key}`)?.value || 'medio';
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
    const nombre = document.getElementById('nombre-cliente').value.trim();
    const perfilLabel = perfil.charAt(0).toUpperCase() + perfil.slice(1);

    let filas = [];
    CATEGORIAS.forEach(cat => {
        if (cat.id === 'personalizado' || !cat.servicios) return;
        cat.servicios.forEach(s => {
            const chk = document.getElementById(`chk-${s.key}`);
            if (!chk?.checked) return;
            if (s.tipo === 'nivel') {
                const qty = parseInt(document.getElementById(`qty-${s.key}`)?.value) || 0;
                const lvl = document.getElementById(`lvl-${s.key}`)?.value || 'medio';
                const precioUnit = CONFIG.serviciosBase[s.key]?.[lvl] ?? 0;
                const subtotal = qty * precioUnit;
                if (subtotal > 0) filas.push({ cat: cat.label, nombre: s.label, key: s.key, tipo: 'nivel', qty, lvl, precioUnit, subtotal });
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
                        <span class="resumen-stepper-qty" id="rqty-${f.key}">${f.qty}</span>
                        <button type="button" class="resumen-stepper-btn" data-action="plus" data-key="${f.key}">+</button>
                        <span class="resumen-stepper-level">× ${NIVELES_LABEL[f.lvl]}</span>
                    </div>`;
            } else if (f.tipo === 'fijo') {
                detalleHtml = `<span class="resumen-tag-fijo">Precio fijo</span>`;
            } else {
                detalleHtml = `<span class="resumen-tag-custom">Personalizado</span>`;
            }

            // Delete key
            const deleteAttr = f.tipo === 'custom'
                ? `data-delete-custom="${f.customId}"`
                : `data-delete-svc="${f.key}"`;

            return `
            <tr>
                <td><span class="tag-cat">${f.cat}</span><br><span style="margin-top:4px;display:block">${f.nombre}</span></td>
                <td>${detalleHtml}</td>
                <td class="text-right">${fmt(f.subtotal)}</td>
                <td class="td-action"><button type="button" class="btn-resumen-delete" ${deleteAttr} title="Eliminar">🗑</button></td>
            </tr>`;
        }).join('')
        : `<tr><td colspan="4" class="resumen-empty">Sin servicios seleccionados.</td></tr>`;

    const html = `
        <div class="resumen-meta">
            ${nombre ? `<span>Cliente: <strong>${nombre}</strong></span>` : ''}
            <span>Perfil: <strong>${perfilLabel}</strong> (×${multiplicador})</span>
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
            <div class="resumen-fila"><span>× Perfil ${perfilLabel} (${multiplicador}x)</span><span>${fmt(subtotalMult)}</span></div>
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
            if (dispStep2) dispStep2.textContent = val;
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
    const nombre = nombreEl.value.trim();
    const precio = parseFloat(precioEl.value) || 0;
    if (!nombre || precio <= 0) return;
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
                <span class="custom-item-nombre">${i.nombre}</span>
                <span class="custom-item-precio">${fmt(i.precio)}</span>
                <button type="button" class="btn-delete" onclick="eliminarItemPersonalizado(${i.id})" aria-label="Eliminar">✕</button>
            </li>`).join('')
        : '<li class="custom-empty">Ningún ítem agregado aún.</li>';
}

// ══════════════════════════════════════════
//  EMAIL
// ══════════════════════════════════════════

function construirCuerpoEmail() {
    const { perfil, subtotalBase, multiplicador, subtotalMult, extrasTotal, extrasActivos, totalFinal } = calcularTotal();
    const nombre = document.getElementById('nombre-cliente').value.trim() || 'el cliente';
    const esAprox = document.getElementById('chk-aprox')?.checked ?? true;
    const perfilLabel = perfil.charAt(0).toUpperCase() + perfil.slice(1);
    const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    let lineas = [];
    CATEGORIAS.forEach(cat => {
        if (cat.id === 'personalizado' || !cat.servicios) return;
        cat.servicios.forEach(s => {
            const chk = document.getElementById(`chk-${s.key}`);
            if (!chk?.checked) return;
            if (s.tipo === 'nivel') {
                const qty = parseInt(document.getElementById(`qty-${s.key}`)?.value) || 0;
                const lvl = document.getElementById(`lvl-${s.key}`)?.value || 'medio';
                const sub = qty * (CONFIG.serviciosBase[s.key]?.[lvl] ?? 0);
                if (sub > 0) lineas.push(`  • ${s.label} ×${qty} (${NIVELES_LABEL[lvl]}): ${fmt(sub)}`);
            } else if (s.tipo === 'fijo') {
                const p = CONFIG.preciosFijos[s.key]?.precio ?? 0;
                lineas.push(`  • ${s.label}: ${fmt(p)}`);
            }
        });
    });
    itemsPersonalizados.forEach(i => lineas.push(`  • ${i.nombre} (personalizado): ${fmt(i.precio)}`));

    const extras = extrasActivos.map(e => `  • ${e.nombre}: ${fmt(e.precio)}`).join('\n');

    return [
        esAprox ? `PRESUPUESTO APROXIMADO DAK` : `COTIZACIÓN OFICIAL DAK`,
        `══════════════════════════════`,
        `Cliente: ${nombre}`,
        `Perfil:  ${perfilLabel} (×${multiplicador})`,
        `Fecha:   ${fecha}`,
        esAprox ? `Nota:    Los precios son ORIENTATIVOS y pueden ajustarse.` : '',
        `══════════════════════════════`,
        `SERVICIOS`,
        `──────────────────────────────`,
        lineas.join('\n') || '  (sin servicios)',
        `──────────────────────────────`,
        `Subtotal base:          ${fmt(subtotalBase)}`,
        `× Perfil ${perfilLabel} (${multiplicador}x): ${fmt(subtotalMult)}`,
        extrasActivos.length ? `+ Extras:\n${extras}\n  Total extras: ${fmt(extrasTotal)}` : '',
        `──────────────────────────────`,
        `TOTAL FINAL:            ${fmt(totalFinal)}`,
        `══════════════════════════════`,
    ].filter(Boolean).join('\n');
}

function enviarCotizacion() {
    const emailDestino = document.getElementById('email-destino').value.trim();
    const mensaje = document.getElementById('email-mensaje').value.trim();
    const feedback = document.getElementById('email-feedback');
    const nombre = document.getElementById('nombre-cliente').value.trim() || 'cliente';

    if (!emailDestino) {
        feedback.textContent = '⚠️ Ingresá el email del destinatario.';
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
            .then((response) => {
                feedback.textContent = '✅ Cotización enviada con éxito.';
                feedback.className = 'email-feedback ok';
                console.log('SUCCESS!', response.status, response.text);
            })
            .catch((error) => {
                console.error('FAILED...', error);
                feedback.textContent = `❌ Error EmailJS: ${error?.text || 'Mala configuración'}`;
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
    { key: 'video-corto', label: 'Video corto' },
    { key: 'video-largo', label: 'Video largo' },
    { key: 'fotos-estudio', label: 'Sesión en estudio' },
    { key: 'fotos-eventos', label: 'Cobertura de eventos' },
    { key: 'banco-fotos', label: 'Banco de fotos' },
    { key: 'flyer', label: 'Flyer' },
    { key: 'portada-fb', label: 'Portada FB' },
    { key: 'branding-logo', label: 'Branding – Logo' },
    { key: 'branding-identidad', label: 'Branding – Identidad visual' },
    { key: 'branding-manual', label: 'Branding – Manual de marca' },
    { key: 'branding-rebranding', label: 'Branding – Rebranding completo' },
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
        const label = key.charAt(0).toUpperCase() + key.slice(1);
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
    document.getElementById('chk-aprox')?.addEventListener('change', () => {
        if (stepActual === 3) renderResumen();
    });

    // Escape closes modal
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') cerrarModalAjustes();
    });

    actualizarFlotante();
});
