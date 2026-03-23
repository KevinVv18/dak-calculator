const { getCalendar, CALENDAR_ID, TIMEZONE } = require('./_google');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { nombre, email, fecha_inicio, fecha_fin, servicios } = req.body || {};

    // Validation
    if (!email || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Faltan campos: email, fecha_inicio, fecha_fin' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email inválido' });
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

        const clientName = (nombre || 'Cliente').substring(0, 100);
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
