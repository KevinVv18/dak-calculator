const {
    getCalendar, CALENDAR_ID, TIMEZONE,
    WORK_START, WORK_END, SLOT_DURATION, DAYS_AHEAD, BLOCKED_DAYS,
} = require('./_google');

// ── Rate Limiter (in-memory, per-IP) ──
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // max 30 GET requests per minute per IP
const rateLimitMap = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { windowStart: now, count: 1 });
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT_MAX;
}

setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap) {
        if (now - val.windowStart > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(key);
    }
}, 60 * 1000);

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
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // ── Rate Limit ──
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                   || req.headers['x-real-ip']
                   || req.socket?.remoteAddress
                   || 'unknown';
    if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' });
    }

    // Cache for 5 minutes to reduce API abuse
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');

    try {
        const calendar = getCalendar();

        const now = new Date();
        const timeMin = new Date(now);
        timeMin.setDate(timeMin.getDate() + 1); // start from tomorrow
        timeMin.setHours(0, 0, 0, 0);

        const timeMax = new Date(timeMin);
        timeMax.setDate(timeMax.getDate() + DAYS_AHEAD);

        // Get busy times from calendar
        const busyRes = await calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                timeZone: TIMEZONE,
                items: [{ id: CALENDAR_ID }],
            },
        });

        const busySlots = busyRes.data.calendars[CALENDAR_ID]?.busy || [];

        // Generate available slots
        const slots = [];
        const current = new Date(timeMin);

        while (current < timeMax) {
            const dayOfWeek = current.getDay();

            if (!BLOCKED_DAYS.includes(dayOfWeek)) {
                for (let hour = WORK_START; hour < WORK_END; hour++) {
                    const slotStart = new Date(current);
                    slotStart.setHours(hour, 0, 0, 0);

                    const slotEnd = new Date(slotStart);
                    slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_DURATION);

                    // Check if slot conflicts with busy times
                    const isBusy = busySlots.some(busy => {
                        const busyStart = new Date(busy.start);
                        const busyEnd = new Date(busy.end);
                        return slotStart < busyEnd && slotEnd > busyStart;
                    });

                    if (!isBusy && slotStart > now) {
                        slots.push({
                            start: slotStart.toISOString(),
                            end: slotEnd.toISOString(),
                            label: slotStart.toLocaleDateString('es-PE', {
                                weekday: 'short', day: 'numeric', month: 'short',
                                timeZone: TIMEZONE,
                            }),
                            hour: `${hour}:00`,
                        });
                    }
                }
            }

            current.setDate(current.getDate() + 1);
        }

        // Group by date
        const grouped = {};
        for (const slot of slots) {
            const dateKey = slot.label;
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push({ start: slot.start, end: slot.end, hour: slot.hour });
        }

        return res.status(200).json({ slots: grouped });
    } catch (error) {
        console.error('Error fetching availability:', error.message);
        return res.status(500).json({ error: 'No se pudo obtener disponibilidad' });
    }
};
