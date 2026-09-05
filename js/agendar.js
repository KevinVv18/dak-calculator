// ══════════════════════════════════════════
//  agendar.html — arranque
//
//  Antes este archivo traía su propia implementación completa del calendario:
//  buildCalendar, renderTimeSlots, selectTimeSlot, formatHour12, formatDateLong,
//  navigateMonth y confirmBooking, todas duplicadas de calculator.js. Compartían
//  las clases de CSS pero no una sola línea de código, y ya habían divergido.
//  Ahora las dos superficies usan js/calendario.js y aquí solo queda lo que de
//  verdad es distinto: de dónde salen los datos del prospecto.
//
//  Acepta ?nombre=&email=&servicios=&total_unico=&total_mensual=&embed=1
//  Se conserva ?total= por si queda algún enlace vivo apuntando aquí.
// ══════════════════════════════════════════

(function () {
    const params = new URLSearchParams(location.search);
    const incrustado = params.get('embed') === '1';
    if (incrustado) document.body.classList.add('incrustado');

    // Los servicios llegan como JSON (lo que manda la calculadora) o separados por
    // comas, que es lo que se puede escribir a mano en un enlace de campaña.
    let servicios = [];
    const crudo = params.get('servicios');
    if (crudo) {
        try {
            const j = JSON.parse(crudo);
            servicios = Array.isArray(j) ? j.map(s => typeof s === 'string' ? s : s.nombre).filter(Boolean) : [];
        } catch {
            servicios = crudo.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    fijarResumenServicios(() => servicios);

    const nombre = document.getElementById('cita-nombre');
    const email = document.getElementById('cita-email');
    if (nombre && params.get('nombre')) nombre.value = params.get('nombre').slice(0, 100);
    if (email && params.get('email')) email.value = params.get('email').slice(0, 254);

    // Aquí no hay a dónde cerrar: es una página, no una capa encima de nada.
    const cerrar = () => {
        if (incrustado) return window.parent.postMessage({ type: 'dak-agendar-closed' }, '*');
        if (history.length > 1) history.back();
        else location.href = 'https://plan.dakagency.net';
    };
    document.getElementById('cita-cerrar-btn')?.addEventListener('click', cerrar);
    document.getElementById('cita-btn-cancelar')?.addEventListener('click', cerrar);

    document.getElementById('cita-btn-confirmar')?.addEventListener('click', confirmarCita);
    document.getElementById('cita-prev-month')?.addEventListener('click', () => navigateMonth(-1));
    document.getElementById('cita-next-month')?.addEventListener('click', () => navigateMonth(1));
    document.getElementById('cita-retry-btn')?.addEventListener('click', () => {
        document.getElementById('cita-error').hidden = true;
        document.getElementById('cita-loading').hidden = false;
        cargarDisponibilidad();
    });

    if (incrustado) {
        document.addEventListener('dak:cita-agendada', e =>
            window.parent.postMessage({ type: 'dak-agendar-booked', data: e.detail }, '*'));
    }

    const raiz = document.getElementById('cita-overlay');
    if (raiz) raiz.hidden = false;
    cargarDisponibilidad();
})();
