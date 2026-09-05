// ══════════════════════════════════════════
//  Utilidades compartidas
//  Las cargan tanto index.html como agendar.html. Antes cada superficie tenía su
//  propia copia de sanitizeHTML, validarEmail y el formato de importes, y las dos
//  versiones ya habían empezado a divergir.
// ══════════════════════════════════════════

const API_BASE = 'https://dak-calculator.vercel.app';
const DAK_EMAIL = 'marketing@dakagency.net';

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function validarEmail(email) {
    if (!email || email.length > 254) return false;
    // Los tres [^\s@] llevan barra invertida a proposito. Sin ella la clase pasa a
    // excluir la LETRA "s", y entonces jose@, luis@ o ventas@ dejan de ser emails
    // validos: el prospecto ve "formato no valido" sobre una direccion correcta.
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Anti-spam del lado del cliente: no es seguridad, es cortesía con el buzón.
const COOLDOWNS = { email: 0, cita: 0 };
const COOLDOWN_DURATION = 30000;
function isCooldown(key) {
    if (Date.now() < COOLDOWNS[key]) return true;
    COOLDOWNS[key] = Date.now() + COOLDOWN_DURATION;
    return false;
}

const fmt = n => 'S/ ' + new Intl.NumberFormat('es-PE').format(Math.round(n));

const icono = (id, clase) =>
    `<svg class="icono${clase ? ' ' + clase : ''}" aria-hidden="true"><use href="#${id}"></use></svg>`;

// Qué servicios viajan a la reunión. La calculadora lo sustituye por el resumen
// real; agendar.html lo rellena desde los parámetros de la URL.
let resumenServicios = () => [];
function fijarResumenServicios(fn) { resumenServicios = fn; }
