const fetch = require('node-fetch');

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
};

const CALENDLY_FALLBACK = {
    general: "https://calendly.com/dishasawantt",
    quick_chat: "https://calendly.com/dishasawantt/15-minute-meeting",
    consultation: "https://calendly.com/dishasawantt/30min",
    interview: "https://calendly.com/dishasawantt/45-minute-meeting"
};

exports.handler = async (event) => {
    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
    if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

    try {
        const { meetingType = 'consultation' } = JSON.parse(event.body);

        if (!process.env.CALENDLY_API_TOKEN || !process.env.CALENDLY_USER) {
            const fallbackUrl = CALENDLY_FALLBACK[meetingType] || CALENDLY_FALLBACK.general;
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true,
                    schedulingUrl: fallbackUrl,
                    eventName: meetingType === 'quick_chat' ? '15-Minute Call' : 
                              meetingType === 'interview' ? '45-Minute Interview' : 
                              '30-Minute Consultation',
                    duration: meetingType === 'quick_chat' ? 15 : meetingType === 'interview' ? 45 : 30,
                    message: "Here's the link to schedule a meeting with Disha",
                    fallback: true
                })
            };
        }

        try {
            const userResponse = await fetch('https://api.calendly.com/users/me', {
                headers: {
                    'Authorization': `Bearer ${process.env.CALENDLY_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!userResponse.ok) {
                throw new Error('Failed to fetch Calendly user info');
            }

            const userData = await userResponse.json();
            const userUri = userData.resource.uri;

            const eventTypesResponse = await fetch(
                `https://api.calendly.com/event_types?user=${userUri}`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.CALENDLY_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!eventTypesResponse.ok) {
                throw new Error('Failed to fetch event types');
            }

            const eventTypesData = await eventTypesResponse.json();
            const eventTypes = eventTypesData.collection;

            let selectedEventType;
            if (meetingType === 'interview') {
                selectedEventType = eventTypes.find(et => 
                    et.name.toLowerCase().includes('interview') || 
                    et.name.toLowerCase().includes('45') ||
                    et.duration === 45
                );
            } else if (meetingType === 'quick_chat') {
                selectedEventType = eventTypes.find(et => 
                    et.name.toLowerCase().includes('15') || 
                    et.name.toLowerCase().includes('quick') ||
                    et.duration === 15
                );
            } else {
                selectedEventType = eventTypes.find(et => 
                    et.name.toLowerCase().includes('30') || 
                    et.name.toLowerCase().includes('consultation') ||
                    et.duration === 30
                );
            }

            if (!selectedEventType && eventTypes.length > 0) {
                selectedEventType = eventTypes[0];
            }

            if (!selectedEventType) {
                const fallbackUrl = CALENDLY_FALLBACK[meetingType] || CALENDLY_FALLBACK.general;
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true,
                        schedulingUrl: fallbackUrl,
                        message: "Here's the scheduling link",
                        eventName: "Meeting with Disha",
                        fallback: true
                    })
                };
            }

            const schedulingUrl = selectedEventType.scheduling_url;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true,
                    schedulingUrl: schedulingUrl,
                    eventName: selectedEventType.name,
                    duration: selectedEventType.duration,
                    message: `Here's the link to schedule a ${selectedEventType.name} with Disha`
                })
            };

        } catch (apiError) {
            console.error("Calendly API error:", apiError);
            
            const fallbackUrl = CALENDLY_FALLBACK[meetingType] || CALENDLY_FALLBACK.general;
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true,
                    schedulingUrl: fallbackUrl,
                    message: "Here's the scheduling link",
                    fallback: true
                })
            };
        }

    } catch (error) {
        console.error("Meeting scheduling error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: "Failed to generate scheduling link", 
                details: error.message 
            })
        };
    }
};

