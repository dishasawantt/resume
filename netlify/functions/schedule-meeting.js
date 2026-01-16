const fetch = require('node-fetch');
const { log, logError, errorResponse, successResponse, checkMethod } = require('./utils');

const CALENDLY_URLS = {
    general: "https://calendly.com/dishasawantt",
    quick_chat: "https://calendly.com/dishasawantt/15-minute-meeting",
    consultation: "https://calendly.com/dishasawantt/30min",
    interview: "https://calendly.com/dishasawantt/45-minute-meeting"
};

const MEETING_TYPES = {
    quick_chat: { name: '15-Minute Call', duration: 15 },
    consultation: { name: '30-Minute Consultation', duration: 30 },
    interview: { name: '45-Minute Interview', duration: 45 }
};

exports.handler = async (event) => {
    const methodCheck = checkMethod(event.httpMethod);
    if (methodCheck) return methodCheck;

    try {
        const { meetingType = 'consultation' } = JSON.parse(event.body);
        const typeInfo = MEETING_TYPES[meetingType] || MEETING_TYPES.consultation;

        if (!process.env.CALENDLY_API_TOKEN || !process.env.CALENDLY_USER) {
            log('Using Calendly fallback URLs');
            return successResponse({
                success: true,
                schedulingUrl: CALENDLY_URLS[meetingType] || CALENDLY_URLS.general,
                eventName: typeInfo.name,
                duration: typeInfo.duration,
                message: "Here's the link to schedule a meeting with Disha",
                fallback: true
            });
        }

        try {
            const headers = { 'Authorization': `Bearer ${process.env.CALENDLY_API_TOKEN}`, 'Content-Type': 'application/json' };
            
            const userResponse = await fetch('https://api.calendly.com/users/me', { headers });
            if (!userResponse.ok) throw new Error('Failed to fetch Calendly user');
            const userData = await userResponse.json();

            const eventTypesResponse = await fetch(`https://api.calendly.com/event_types?user=${userData.resource.uri}`, { headers });
            if (!eventTypesResponse.ok) throw new Error('Failed to fetch event types');
            const { collection: eventTypes } = await eventTypesResponse.json();

            const searchTerms = { interview: ['interview', '45'], quick_chat: ['15', 'quick'], consultation: ['30', 'consultation'] };
            const terms = searchTerms[meetingType] || searchTerms.consultation;
            const targetDuration = typeInfo.duration;

            const selectedEventType = eventTypes.find(et => 
                terms.some(term => et.name.toLowerCase().includes(term)) || et.duration === targetDuration
            ) || eventTypes[0];

            if (!selectedEventType) {
                return successResponse({
                    success: true,
                    schedulingUrl: CALENDLY_URLS[meetingType] || CALENDLY_URLS.general,
                    eventName: typeInfo.name,
                    fallback: true
                });
            }

            log('Found Calendly event:', selectedEventType.name);

            return successResponse({
                success: true,
                schedulingUrl: selectedEventType.scheduling_url,
                eventName: selectedEventType.name,
                duration: selectedEventType.duration,
                message: `Here's the link to schedule a ${selectedEventType.name} with Disha`
            });

        } catch (apiError) {
            logError("Calendly API error:", apiError.message);
            return successResponse({
                success: true,
                schedulingUrl: CALENDLY_URLS[meetingType] || CALENDLY_URLS.general,
                eventName: typeInfo.name,
                duration: typeInfo.duration,
                fallback: true
            });
        }

    } catch (error) {
        logError("Meeting scheduling error:", error.message);
        return errorResponse(500, "Failed to generate scheduling link", error.message);
    }
};
