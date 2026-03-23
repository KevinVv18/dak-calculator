const { google } = require('googleapis');

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'marketing@dakagency.net';
const DELEGATED_USER = 'marketing@dakagency.net';

function getCalendar() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/calendar'],
        clientOptions: { subject: DELEGATED_USER },
    });

    return google.calendar({ version: 'v3', auth });
}

// Business hours config (Peru time, GMT-5)
const TIMEZONE = 'America/Lima';
const WORK_START = 9;  // 9 AM
const WORK_END = 18;   // 6 PM
const SLOT_DURATION = 60; // minutes
const DAYS_AHEAD = 14; // show 2 weeks of availability
const BLOCKED_DAYS = [0, 6]; // Sunday=0, Saturday=6

module.exports = {
    getCalendar,
    CALENDAR_ID,
    TIMEZONE,
    WORK_START,
    WORK_END,
    SLOT_DURATION,
    DAYS_AHEAD,
    BLOCKED_DAYS,
};
