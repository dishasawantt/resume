const CALENDLY = {
    quick_chat: { 
        url: "https://calendly.com/dishasawantt/15-minute-meeting", 
        name: "15-Minute Call", 
        duration: 15 
    },
    consultation: { 
        url: "https://calendly.com/dishasawantt/30min", 
        name: "30-Minute Consultation", 
        duration: 30 
    },
    interview: { 
        url: "https://calendly.com/dishasawantt/45-minute-meeting", 
        name: "45-Minute Interview", 
        duration: 45 
    }
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}

export async function onRequest(context) {
    const { request } = context;
    
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        });
    }

    if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }

    try {
        const { meetingType = "consultation" } = await request.json();
        const meeting = CALENDLY[meetingType] || CALENDLY.consultation;

        return jsonResponse({
            success: true,
            schedulingUrl: meeting.url,
            eventName: meeting.name,
            duration: meeting.duration
        });

    } catch (error) {
        console.error("Schedule meeting error:", error.message);
        return jsonResponse({ error: "Failed to generate link" }, 500);
    }
}
