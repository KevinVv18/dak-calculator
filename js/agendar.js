/**
 * AGENDAR REUNION — DAK Agency (Standalone Page)
 *
 * Independent scheduling page that uses the same Vercel API
 * as the calculator's built-in overlay.
 *
 * Works as:
 *   1. Standalone page (direct navigation)
 *   2. Embedded iframe (?embed=1)
 *   3. FB pixel landing page
 *
 * URL params:
 *   ?nombre=...&email=...&servicios=JSON&total=...&embed=1
 *
 * PostMessage API (iframe):
 *   → parent: { type: 'dak-agendar-booked', data: {...} }
 *   → parent: { type: 'dak-agendar-closed' }
 *   ← child:  { type: 'dak-prefill', nombre, email }
 */

(function () {
    'use strict';

    const API_BASE = 'https://dak-calculator.vercel.app';
    const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

    // ── State ────────────────────────────────────────────
    let rawSlots = {};
    let availableDates = {};
    let months = [];
    let currentMonthIdx = 0;
    let selectedDateStr = null;
    let selectedSlot = null;
    let isEmbedded = false;
    let cooldownUntil = 0;

    // ── DOM ──────────────────────────────────────────────
    const $ = sel => document.getElementById(sel);

    // ── Init ─────────────────────────────────────────────
    function init() {
        parseURLParams();
        loadAvailability();
        bindEvents();
    }

    // ── URL Params ───────────────────────────────────────
    function parseURLParams() {
        const params = new URLSearchParams(window.location.search);

        if (params.get('embed') === '1') {
            isEmbedded = true;
            document.body.classList.add('embedded');
        }

        const nombre = params.get('nombre');
        const email = params.get('email');
        if (nombre) $('agendar-nombre').value = decodeURIComponent(nombre);
        if (email) $('agendar-email').value = decodeURIComponent(email);

        // Services passed from calculator
        const serviciosParam = params.get('servicios');
        const totalParam = params.get('total');
        if (serviciosParam || totalParam) {
            const container = $('agendar-services');
            container.style.display = '';

            if (serviciosParam) {
                try {
                    const servicios = JSON.parse(decodeURIComponent(serviciosParam));
                    if (Array.isArray(servicios) && servicios.length) {
                        $('agendar-services-list').innerHTML = servicios.map(s =>
                            `<div class="flex justify-between items-center py-1.5 px-3 bg-white/[0.03] rounded-lg text-xs">
                                <span class="text-on-surface">${sanitize(s.nombre || s)}</span>
                                ${s.precio ? `<span class="font-semibold text-secondary">${sanitize(s.precio)}</span>` : ''}
                            </div>`
                        ).join('');
                    }
                } catch (e) { /* ignore */ }
            }

            if (totalParam) {
                $('agendar-services-total').textContent = 'S/ ' + decodeURIComponent(totalParam);
            }
        }
    }

    // ── API: Load Availability ───────────────────────────
    async function loadAvailability() {
        $('agendar-loading').style.display = 'flex';
        $('agendar-left-col').style.display = 'none';
        $('agendar-right-col').style.display = 'none';
        $('agendar-error').style.display = 'none';
        $('agendar-confirmacion').style.display = 'none';

        try {
            const res = await fetch(`${API_BASE}/api/disponibilidad`);
            if (!res.ok) throw new Error('Error del servidor');
            const data = await res.json();
            rawSlots = data.slots || {};

            $('agendar-loading').style.display = 'none';

            // Parse into date-keyed map
            availableDates = {};
            const monthSet = new Set();

            for (const [label, slots] of Object.entries(rawSlots)) {
                if (!slots.length) continue;
                const firstDate = new Date(slots[0].start);
                const dateKey = firstDate.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
                availableDates[dateKey] = { label, slots };
                monthSet.add(dateKey.substring(0, 7));
            }

            months = Array.from(monthSet).sort();

            if (months.length === 0) {
                $('agendar-error-msg').textContent = 'No hay horarios disponibles en las próximas 2 semanas.';
                $('agendar-error').style.display = 'block';
                return;
            }

            currentMonthIdx = 0;
            buildCalendar(months[0]);

            $('agendar-left-col').style.display = '';
            $('agendar-right-col').style.display = '';
            $('agendar-slots-container').innerHTML = '<p class="text-sm text-on-surface-variant text-center py-8 opacity-50">← Selecciona un día en el calendario</p>';

        } catch (err) {
            $('agendar-loading').style.display = 'none';
            $('agendar-error-msg').textContent = 'No se pudo cargar la disponibilidad. Intenta más tarde.';
            $('agendar-error').style.display = 'block';
        }
    }

    // ── Calendar ─────────────────────────────────────────
    function buildCalendar(yearMonth) {
        const [year, month] = yearMonth.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1);
        const totalDays = new Date(year, month, 0).getDate();
        let startDow = (firstDay.getDay() + 6) % 7; // Monday = 0

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const grid = $('agendar-cal-grid');
        let html = '';

        for (let i = 0; i < startDow; i++) {
            html += '<div class="cal-cell"></div>';
        }

        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dateObj = new Date(year, month - 1, d);
            const dow = dateObj.getDay();
            const isWeekend = dow === 0 || dow === 6;
            const isPast = dateObj < today;
            const isAvailable = availableDates.hasOwnProperty(dateStr);
            const isSelected = dateStr === selectedDateStr;

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
        $('agendar-month-title').textContent = `${MONTH_NAMES[month - 1]} ${year}`;
        $('agendar-prev-month').disabled = currentMonthIdx <= 0;
        $('agendar-next-month').disabled = currentMonthIdx >= months.length - 1;

        grid.querySelectorAll('.cal-cell--available:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => selectDay(btn.dataset.date));
        });
    }

    function selectDay(dateStr) {
        selectedDateStr = dateStr;
        selectedSlot = null;
        $('agendar-btn-confirmar').disabled = true;
        $('agendar-summary-card').style.display = 'none';

        buildCalendar(months[currentMonthIdx]);

        const dayData = availableDates[dateStr];
        if (dayData) renderTimeSlots(dayData.slots);
    }

    // ── Time Slots ───────────────────────────────────────
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

        const container = $('agendar-slots-container');
        container.innerHTML = html;

        container.querySelectorAll('.slot-btn').forEach(btn => {
            btn.addEventListener('click', () => selectTimeSlot(btn));
        });
    }

    function selectTimeSlot(btn) {
        selectedSlot = {
            start: btn.dataset.start,
            end: btn.dataset.end,
            hour: btn.dataset.hour
        };

        document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');

        $('agendar-btn-confirmar').disabled = false;

        $('agendar-summary-card').style.display = '';
        $('agendar-summary-text').textContent = `${formatDateLong(selectedDateStr)} · ${formatHour12(selectedSlot.hour)}`;
    }

    // ── Confirm Booking ──────────────────────────────────
    async function confirmBooking() {
        if (!selectedSlot || !selectedDateStr) return;

        const btn = $('agendar-btn-confirmar');
        const now = Date.now();
        if (now < cooldownUntil) {
            btn.textContent = 'ESPERÁ...';
            setTimeout(() => { btn.textContent = 'CONFIRMAR REUNIÓN'; }, 2000);
            return;
        }

        btn.disabled = true;
        btn.textContent = 'AGENDANDO...';

        const nombre = ($('agendar-nombre')?.value?.trim() || '').replace(/[<>"'`]/g, '').substring(0, 100);
        const email = ($('agendar-email')?.value?.trim() || '').substring(0, 254);

        if (!email || !isValidEmail(email)) {
            btn.textContent = 'CONFIRMAR REUNIÓN';
            btn.disabled = false;
            const field = $('agendar-email');
            field.classList.add('ring-2', 'ring-error');
            field.focus();
            setTimeout(() => field.classList.remove('ring-2', 'ring-error'), 3000);
            return;
        }

        // Collect services from URL params display
        const serviceItems = document.querySelectorAll('#agendar-services-list > div');
        const servicios = Array.from(serviceItems).map(el => el.querySelector('span')?.textContent || '').filter(Boolean).join(', ');

        try {
            const res = await fetch(`${API_BASE}/api/agendar-cita`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre,
                    email,
                    fecha_inicio: selectedSlot.start,
                    fecha_fin: selectedSlot.end,
                    servicios: servicios || 'Consulta general',
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al agendar');

            cooldownUntil = now + 30000;

            // Show confirmation
            $('agendar-left-col').style.display = 'none';
            $('agendar-right-col').style.display = 'none';
            $('agendar-error').style.display = 'none';

            const meetHtml = data.meetLink
                ? `<a href="${sanitize(data.meetLink)}" target="_blank" rel="noopener" class="cita-meet-link">🎥 Unirse a Google Meet</a>`
                : '';

            $('agendar-resumen').innerHTML = `
                <span class="cita-success-icon">✅</span>
                <h2 class="text-xl font-bold text-white mb-4">¡Reunión agendada!</h2>
                <p class="text-on-surface-variant text-sm mb-6">Te enviamos una invitación con los detalles.</p>
                <div class="bg-surface-container-high/50 rounded-xl p-5 text-left space-y-2 mb-4 inline-block">
                    <p class="text-sm"><span class="text-on-surface-variant">📅 Fecha:</span> <strong class="text-white">${sanitize(formatDateLong(selectedDateStr))}</strong></p>
                    <p class="text-sm"><span class="text-on-surface-variant">🕐 Hora:</span> <strong class="text-white">${formatHour12(selectedSlot.hour)}</strong></p>
                    <p class="text-sm"><span class="text-on-surface-variant">📧 Email:</span> <strong class="text-white">${sanitize(email)}</strong></p>
                </div>
                <br>${meetHtml}
                <div class="mt-6">
                    <a href="https://dakagency.net" class="inline-block px-6 py-3 bg-primary-dim text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all">
                        Visitar DAK Agency
                    </a>
                </div>
            `;
            $('agendar-confirmacion').style.display = 'block';
            btn.textContent = 'LISTO';
            btn.disabled = true;

            // Notify parent (iframe)
            if (isEmbedded && window.parent !== window) {
                window.parent.postMessage({
                    type: 'dak-agendar-booked',
                    data: { nombre, email, fecha: selectedDateStr, hora: selectedSlot.hour }
                }, '*');
            }

        } catch (err) {
            $('agendar-error-msg').textContent = err.message;
            $('agendar-error').style.display = 'block';
            btn.textContent = 'CONFIRMAR REUNIÓN';
            btn.disabled = false;
        }
    }

    // ── Helpers ───────────────────────────────────────────
    function formatHour12(h24) {
        const hour = parseInt(h24);
        const suffix = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:00 ${suffix}`;
    }

    function formatDateLong(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const dayName = DAY_NAMES[date.getDay()];
        const cap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        return `${cap} ${d} de ${MONTH_NAMES[m - 1].toLowerCase()}`;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function navigateMonth(dir) {
        const newIdx = currentMonthIdx + dir;
        if (newIdx < 0 || newIdx >= months.length) return;
        currentMonthIdx = newIdx;
        buildCalendar(months[currentMonthIdx]);
    }

    // ── Events ───────────────────────────────────────────
    function bindEvents() {
        $('agendar-prev-month').addEventListener('click', () => navigateMonth(-1));
        $('agendar-next-month').addEventListener('click', () => navigateMonth(1));
        $('agendar-btn-confirmar').addEventListener('click', confirmBooking);

        $('agendar-retry-btn')?.addEventListener('click', loadAvailability);

        // ESC to go back
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (isEmbedded && window.parent !== window) {
                    window.parent.postMessage({ type: 'dak-agendar-closed' }, '*');
                } else {
                    window.location.href = 'index.html';
                }
            }
        });

        // Listen for parent prefill messages (iframe)
        window.addEventListener('message', e => {
            if (e.data?.type === 'dak-prefill') {
                if (e.data.nombre) $('agendar-nombre').value = e.data.nombre;
                if (e.data.email) $('agendar-email').value = e.data.email;
            }
        });
    }

    // ── Boot ─────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', init);
})();
