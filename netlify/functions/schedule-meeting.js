const fetch = require('node-fetch');
const { log, logError, errorResponse, successResponse, checkMethod } = require('./utils');

const URLS = {
    general: "https://calendly.com/dishasawantt",
    quick_chat: "https://calendly.com/dishasawantt/15-minute-meeting",
    consultation: "https://calendly.com/dishasawantt/30min",
    interview: "https://calendly.com/dishasawantt/45-minute-meeting"
};

const TYPES = {
    quick_chat: { name: '15-Minute Call', duration: 15 },
    consultation: { name: '30-Minute Consultation', duration: 30 },
    interview: { name: '45-Minute Interview', duration: 45 }
};

exports.handler = async (event) => {
    const methodCheck = checkMethod(event.httpMethod);
    if (methodCheck) return methodCheck;

    try {
        const { meetingType = 'consultation' } = JSON.parse(event.body);
        const type = TYPES[meetingType] || TYPES.consultation;

        if (!process.env.CALENDLY_API_TOKEN) {
            return successResponse({
                success: true,
                schedulingUrl: URLS[meetingType] || URLS.general,
                eventName: type.name,
                duration: type.duration,
                fallback: true
            });
        }

        try {
            const headers = { 'Authorization': `Bearer ${process.env.CALENDLY_API_TOKEN}`, 'Content-Type': 'application/json' };
            const user = await (await fetch('https://api.calendly.com/users/me', { headers })).json();
            const events = await (await fetch(`https://api.calendly.com/event_types?user=${user.resource.uri}`, { headers })).json();
            
            const terms = { interview: ['interview', '45'], quick_chat: ['15', 'quick'], consultation: ['30', 'consultation'] }[meetingType] || ['30'];
            const event = events.collection.find(e => terms.some(t => e.name.toLowerCase().includes(t)) || e.duration === type.duration) || events.collection[0];

            if (event) {
                log('Found:', event.name);
                return successResponse({ success: true, schedulingUrl: event.scheduling_url, eventName: event.name, duration: event.duration });
            }
        } catch (e) { logError("Calendly API:", e.message); }

        return successResponse({ success: true, schedulingUrl: URLS[meetingType] || URLS.general, eventName: type.name, duration: type.duration, fallback: true });
    } catch (e) {
        logError("Schedule error:", e.message);
        return errorResponse(500, "Failed to generate link", e.message);
    }
};
