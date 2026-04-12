const { getCalendar, CALENDAR_ID, TIMEZONE } = require('./_google');

// ── Rate Limiter (in-memory, per-IP) ──
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // max 5 bookings per IP per hour
const rateLimitMap = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { windowStart: now, count: 1 });
        return false;
    }
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) return true;
    return false;
}

// Cleanup stale entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap) {
        if (now - val.windowStart > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(key);
    }
}, 10 * 60 * 1000);

// ── Input Sanitization ──
function sanitize(str, maxLen = 200) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/[<>"'`]/g, '')   // strip HTML/injection chars
        .replace(/[\r\n]+/g, ' ')  // collapse newlines
        .trim()
        .substring(0, maxLen);
}

const ALLOWED_ORIGINS = [
    'https://dak-calculator.vercel.app',
    'https://calculadora.dakagency.net',
    'https://plan.dakagency.net',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
];

module.exports = async function handler(req, res) {
    // ── CORS ──
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // ── Rate Limit ──
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                   || req.headers['x-real-ip']
                   || req.socket?.remoteAddress
                   || 'unknown';
    if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' });
    }

    // ── Body size guard ──
    const body = req.body || {};
    if (JSON.stringify(body).length > 5000) {
        return res.status(413).json({ error: 'Payload demasiado grande' });
    }

    const nombre = sanitize(body.nombre, 100);
    const email = sanitize(body.email, 254);
    const fecha_inicio = sanitize(body.fecha_inicio, 30);
    const fecha_fin = sanitize(body.fecha_fin, 30);
    const servicios = sanitize(body.servicios, 500);

    // ── Validation ──
    if (!email || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Faltan campos: email, fecha_inicio, fecha_fin' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email) || email.length > 254) {
        return res.status(400).json({ error: 'Email inválido' });
    }

    // Block disposable email domains (common spam vectors)
    const BLOCKED_DOMAINS = ['mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email', '10minutemail.com', 'yopmail.com'];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (BLOCKED_DOMAINS.includes(emailDomain)) {
        return res.status(400).json({ error: 'No se permiten emails temporales' });
    }

    // Validate dates are in the future
    const start = new Date(fecha_inicio);
    const end = new Date(fecha_fin);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Fechas inválidas' });
    }
    if (start <= new Date()) {
        return res.status(400).json({ error: 'La fecha debe ser futura' });
    }

    // Validate slot duration (must be exactly 60 minutes)
    const durationMs = end.getTime() - start.getTime();
    if (durationMs !== 60 * 60 * 1000) {
        return res.status(400).json({ error: 'Duración del slot inválida' });
    }

    // Validate slot is within business hours (9-18 Lima time)
    const startHour = parseInt(start.toLocaleString('en-US', { timeZone: 'America/Lima', hour: 'numeric', hour12: false }));
    if (startHour < 9 || startHour >= 18) {
        return res.status(400).json({ error: 'Horario fuera del rango laboral' });
    }

    // Validate not too far in the future (max 30 days)
    const maxFuture = new Date();
    maxFuture.setDate(maxFuture.getDate() + 30);
    if (start > maxFuture) {
        return res.status(400).json({ error: 'No se puede agendar con más de 30 días de anticipación' });
    }

    try {
        const calendar = getCalendar();

        // Check the slot is still free
        const busyRes = await calendar.freebusy.query({
            requestBody: {
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                timeZone: TIMEZONE,
                items: [{ id: CALENDAR_ID }],
            },
        });

        const busySlots = busyRes.data.calendars[CALENDAR_ID]?.busy || [];
        if (busySlots.length > 0) {
            return res.status(409).json({ error: 'Este horario ya no está disponible' });
        }

        const clientName = nombre || 'Cliente';
        const serviciosList = servicios ? `\n\nServicios de interés:\n${servicios}` : '';

        const event = {
            summary: `Reunión DAK – ${clientName}`,
            description: `Reunión con ${clientName} (${email})${serviciosList}\n\nAgendado desde la calculadora DAK.`,
            start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
            end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
            attendees: [
                { email: 'marketing@dakagency.net' },
                { email },
            ],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 60 },
                    { method: 'popup', minutes: 15 },
                ],
            },
            conferenceData: {
                createRequest: {
                    requestId: `dak-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

        const created = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: event,
            sendUpdates: 'all',
            conferenceDataVersion: 1,
        });

        return res.status(200).json({
            ok: true,
            eventId: created.data.id,
            meetLink: created.data.hangoutLink || null,
            htmlLink: created.data.htmlLink,
        });
    } catch (error) {
        console.error('Error creating event:', error.message);
        return res.status(500).json({ error: 'No se pudo agendar la cita' });
    }
};
