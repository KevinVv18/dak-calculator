// ══════════════════════════════════════════
//  Calendario de reuniones
//  Lo usan las dos superficies: el overlay dentro de la calculadora y la página
//  suelta agendar.html. Antes estaba implementado dos veces, con las mismas
//  clases de CSS pero sin compartir código, y las dos copias ya habían divergido.
//  Requiere js/comun.js.
// ══════════════════════════════════════════

const MONTH_NAMES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAY_NAMES_FULL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

let citaRawSlots = {};          // Original API response keyed by label
let citaAvailableDates = {};    // Map: "YYYY-MM-DD" -> { label, slots[] }
let citaMonths = [];            // ["2025-04", "2025-05"]
let citaCurrentMonthIdx = 0;
let citaSelectedDateStr = null; // "YYYY-MM-DD"
let citaSelectedSlot = null;    // { start, end, hour }

// Los tres pasos del formulario. Se muestran y se ocultan siempre juntos.
const CITA_PANELES = ['cita-left-col', 'cita-right-col', 'cita-datos-col'];
function mostrarPaneles(visible) {
    CITA_PANELES.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.hidden = !visible;
    });
}

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
    overlay.hidden = false;
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
    document.getElementById('cita-loading').hidden = false;
    mostrarPaneles(false);
    document.getElementById('cita-error').hidden = true;
    document.getElementById('cita-confirmacion').hidden = true;
    document.getElementById('cita-summary-card').hidden = true;

    const confirmBtn = document.getElementById('cita-btn-confirmar');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Confirmar reunión';

    const cancelBtn = document.getElementById('cita-btn-cancelar');
    cancelBtn.textContent = 'Cancelar';

    cargarDisponibilidad();
}

function cerrarModalCita() {
    const overlay = document.getElementById('cita-overlay');
    if (overlay) {
        overlay.setAttribute('aria-hidden', 'true');
        overlay.hidden = true;
        document.body.style.overflow = '';
    }
}

async function cargarDisponibilidad() {
    try {
        const res = await fetch(`${API_BASE}/api/disponibilidad`);
        if (!res.ok) throw new Error('Error del servidor');
        const data = await res.json();
        citaRawSlots = data.slots || {};

        document.getElementById('cita-loading').hidden = true;

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
            document.getElementById('cita-error').hidden = false;
            return;
        }

        citaCurrentMonthIdx = 0;
        buildCalendarGrid(citaMonths[0]);

        mostrarPaneles(true);
        document.getElementById('cita-slots-container').innerHTML = '<p class="nota">Elegí un día en el calendario.</p>';
    } catch (err) {
        document.getElementById('cita-loading').hidden = true;
        document.getElementById('cita-error-msg').textContent = 'No se pudo cargar la disponibilidad. Intenta más tarde.';
        document.getElementById('cita-error').hidden = false;
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
        html += '<div class="dia dia--vacio"></div>';
    }

    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(year, month - 1, d);
        const dow = dateObj.getDay();
        const isWeekend = dow === 0 || dow === 6;
        const isPast = dateObj < today;
        const isAvailable = citaAvailableDates.hasOwnProperty(dateStr);
        const isSelected = dateStr === citaSelectedDateStr;

        let cls = 'dia';
        if (isWeekend) cls += ' dia--vacio';
        if (isPast && !isAvailable) cls += ' dia--vacio';
        if (isAvailable && !isPast) cls += ' dia--libre';
        if (isSelected) cls += ' dia--activo';

        const disabled = (!isAvailable || isPast) ? 'disabled' : '';
        html += `<button type="button" class="${cls}" data-date="${dateStr}" ${disabled}>
            <span>${d}</span>
        </button>`;
    }

    // Celdas de relleno al final: sin ellas la ultima semana deja el rectangulo
    // de la tabla abierto por abajo a la derecha, y un calendario impreso no
    // termina a medias.
    const sobran = (startDow + totalDays) % 7;
    if (sobran) {
        for (let i = sobran; i < 7; i++) html += '<div class="dia dia--vacio"></div>';
    }

    grid.innerHTML = html;

    // Month title
    document.getElementById('cita-month-title').textContent = `${MONTH_NAMES_ES[month - 1]} ${year}`;

    // Nav buttons
    document.getElementById('cita-prev-month').disabled = citaCurrentMonthIdx <= 0;
    document.getElementById('cita-next-month').disabled = citaCurrentMonthIdx >= citaMonths.length - 1;

    // Click handlers for available days
    grid.querySelectorAll('.dia--libre:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => selectCalendarDay(btn.dataset.date));
    });
}

function selectCalendarDay(dateStr) {
    citaSelectedDateStr = dateStr;
    citaSelectedSlot = null;
    document.getElementById('cita-btn-confirmar').disabled = true;
    document.getElementById('cita-summary-card').hidden = true;

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
            <h4 class="campo__rotulo">Mañana</h4>
            <div class="agenda__horas">
                ${morning.map(s => `<button type="button" class="hora" data-start="${s.start}" data-end="${s.end}" data-hour="${s.hour}">${formatHour12(s.hour)}</button>`).join('')}
            </div>
        </div>`;
    }

    if (afternoon.length > 0) {
        html += `<div>
            <h4 class="campo__rotulo">Tarde</h4>
            <div class="agenda__horas">
                ${afternoon.map(s => `<button type="button" class="hora" data-start="${s.start}" data-end="${s.end}" data-hour="${s.hour}">${formatHour12(s.hour)}</button>`).join('')}
            </div>
        </div>`;
    }

    if (!html) {
        html = '<p class="nota">No quedan horarios libres ese día.</p>';
    }

    const container = document.getElementById('cita-slots-container');
    container.innerHTML = html;

    container.querySelectorAll('.hora').forEach(btn => {
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
    document.querySelectorAll('.hora').forEach(b => b.classList.remove('hora--activa'));
    btn.classList.add('hora--activa');

    // Enable confirm
    document.getElementById('cita-btn-confirmar').disabled = false;

    // Show summary card
    const summaryCard = document.getElementById('cita-summary-card');
    const summaryText = document.getElementById('cita-summary-text');
    summaryCard.hidden = false;
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
        btn.textContent = 'Esperá un momento…';
        setTimeout(() => { btn.textContent = 'Confirmar reunión'; }, 3000);
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Agendando…';

    const nombre = (document.getElementById('cita-nombre')?.value?.trim() || '').replace(/[<>"'`]/g, '').substring(0, 100);
    const email = (document.getElementById('cita-email')?.value?.trim() || '').substring(0, 254);

    if (!email || !validarEmail(email)) {
        btn.textContent = 'Confirmar reunión';
        btn.disabled = false;
        // Highlight email field
        const emailField = document.getElementById('cita-email');
        if (emailField) {
            emailField.style.borderColor = 'var(--alarma)';
            emailField.focus();
            setTimeout(() => { emailField.style.borderColor = ''; }, 3000);
        }
        return;
    }

    // Build services summary
    // Anotando cuáles son mensuales: quien atienda la reunión necesita saber si lo
    // que el prospecto marcó es una construcción o un compromiso que se repite.
    // Las partidas libres solo existen dentro de la calculadora: agendar.html no
    // carga calculator.js, y sin esta guarda confirmar lanzaba un ReferenceError
    // fuera del try, dejando el boton clavado en «Agendando…».
    const servicios = resumenServicios();
    if (typeof itemsPersonalizados !== 'undefined') {
        itemsPersonalizados.forEach(i => servicios.push(i.nombre));
    }

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

        avisarPanelDAK({ nombre, email, servicios, inicio: citaSelectedSlot.start });

        // Hide calendar columns, show confirmation
        mostrarPaneles(false);
        document.getElementById('cita-error').hidden = true;

        const meetHtml = data.meetLink
            ? `<a href="${sanitizeHTML(data.meetLink)}" target="_blank" rel="noopener" class="accion accion--principal agenda__meet">${icono('i-video')}Unirse a Google Meet</a>`
            : '';

        // La hoja deja de ser un formulario y pasa a ser el comprobante: mismo
        // membrete que la cotizacion, los mismos renglones, y el sello encima.
        document.getElementById('cita-resumen').innerHTML = `
            <p class="membrete__emisor">DAK Agency · Constancia</p>
            <h2 class="hoja__titulo">Reunión agendada</h2>
            <p class="nota constancia__nota">Te enviamos la invitación con el enlace a tu correo.</p>
            <div class="anotacion"><span class="anotacion__nombre">Día</span>
                <span class="anotacion__importe">${sanitizeHTML(formatDateLong(citaSelectedDateStr))}</span></div>
            <div class="anotacion"><span class="anotacion__nombre">Hora</span>
                <span class="anotacion__importe">${formatHour12(citaSelectedSlot.hour)}</span></div>
            <div class="anotacion"><span class="anotacion__nombre">Email</span>
                <span class="anotacion__importe">${sanitizeHTML(email)}</span></div>
            <div class="constancia__sello"><span class="sello sello--oficial">Confirmada</span></div>
            ${meetHtml}
        `;
        document.getElementById('cita-confirmacion').hidden = false;

        // Quien incruste esta pantalla en un iframe necesita enterarse de que la
        // reunion quedo agendada. Se avisa por evento y cada superficie decide.
        document.dispatchEvent(new CustomEvent('dak:cita-agendada', {
            detail: { nombre, email, fecha: citaSelectedDateStr, hora: citaSelectedSlot.hour }
        }));

        btn.textContent = 'Listo';
        btn.disabled = true;
        document.getElementById('cita-btn-cancelar').textContent = 'Cerrar';
    } catch (err) {
        const errorDiv = document.getElementById('cita-error');
        document.getElementById('cita-error-msg').textContent = err.message;
        errorDiv.hidden = false;
        btn.textContent = 'Confirmar reunión';
        btn.disabled = false;
    }
}


// ══════════════════════════════════════════
//  Aviso al panel comercial de DAK
//  Fire-and-forget a proposito: el lead es importante, pero jamas puede impedir
//  que el prospecto vea su reunion confirmada. Si admin.dakagency.net esta caido
//  o el CORS falla, aqui no se entera nadie salvo la consola.
// ══════════════════════════════════════════
function avisarPanelDAK({ nombre, email, servicios, inicio }) {
    try {
        fetch('https://admin.dakagency.net/api/lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: nombre,
                email,
                service: servicios.join(', ') || 'Consulta general',
                message: 'Agendo reunion: ' + (inicio || ''),
                source: 'agendar-calculadora',
            }),
        }).catch(() => {});
    } catch (_) { /* nunca rompe la confirmacion */ }
}
