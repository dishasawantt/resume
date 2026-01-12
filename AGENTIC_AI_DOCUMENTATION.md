# Agentic AI Design - Technical Documentation

## Overview

This document details the AI architecture, prompt engineering techniques, and intelligent behaviors that power the conversational avatar experience. The chatbot implements a **Persona-Based Conversational Agent** pattern using LLaMA 3.3 70B via Groq's inference API.

---

## AI Architecture

### System Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AGENTIC AI PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   User       │    │  Context     │    │   System     │               │
│  │   Message    │───▶│  Window      │───▶│   Prompt     │               │
│  └──────────────┘    │  (8 msgs)    │    │  + Knowledge │               │
│                      └──────────────┘    └──────┬───────┘               │
│                                                  │                       │
│                                                  ▼                       │
│                                    ┌─────────────────────────┐          │
│                                    │      LLaMA 3.3 70B      │          │
│                                    │   (via Groq Inference)  │          │
│                                    └───────────┬─────────────┘          │
│                                                │                         │
│                      ┌─────────────────────────┼─────────────────────┐  │
│                      │                         │                     │  │
│                      ▼                         ▼                     ▼  │
│              ┌──────────────┐         ┌──────────────┐     ┌──────────┐│
│              │   Response   │         │  Contextual  │     │  Easter  ││
│              │   Text       │         │  Actions     │     │  Eggs    ││
│              └──────────────┘         └──────────────┘     └──────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Location | Purpose |
|-----------|----------|---------|
| Context Manager | `avatar.js` | Maintains conversation history |
| System Prompt | `chat.js` | Defines persona and knowledge |
| LLM Interface | `chat.js` | Groq API integration |
| Action Generator | `avatar.js` | Contextual quick actions |
| Easter Egg Handler | `avatar.js` | Special response triggers |

---

## Persona Engineering

The AI is not a generic assistant—it **is** Disha. This is achieved through careful prompt engineering.

### Identity Anchoring

```
"You ARE Disha. You speak as yourself, not about yourself."
```

This forces the model into first-person perspective, creating an authentic conversational experience rather than a third-person informational one.

### Voice Definition

```
"Warm, genuine, conversational. Like a real person having a friendly chat—not a formal assistant."
```

Defines the emotional tone and communication style.

### Pronoun Enforcement

```
"Use 'I' and 'my' — you are Disha."
```

Reinforces identity consistency throughout responses.

### Example Transformation

| Generic AI Response | Persona Response |
|---------------------|------------------|
| "Disha has experience with Python and TensorFlow." | "I've been working with Python for years, and TensorFlow is one of my go-to frameworks for ML projects." |
| "Her education includes a Master's from SDSU." | "I'm currently pursuing my Master's in Computer Engineering at SDSU." |

---

## Embedded Knowledge Base

### RAG-Lite Pattern

Instead of dynamic retrieval from a vector database, the system uses **static knowledge injection**—a complete knowledge base embedded directly in the system prompt.

```javascript
const SYSTEM_PROMPT = `
=== KNOWLEDGE BASE ===

CONTACT:
- Email: dishasawantt@gmail.com | Phone: +1 (619) 918-7729
- Location: San Diego, CA
- LinkedIn: linkedin.com/in/disha-sawant-7877b21b6 | GitHub: github.com/dishasawantt

EDUCATION:
- M.S. Computer Engineering, SDSU (Aug 2024 - May 2026), GPA: 3.2
- B.S. Computer Engineering, University of Mumbai (Jul 2018 - Jul 2022), GPA: 3.7

SKILLS:
- Languages: Python (strong), JavaScript/TypeScript, Java, SQL, C++
- AI/ML: TensorFlow, Keras, Scikit-learn, Pandas, NumPy
- Web: React, Angular, FastAPI
- Tools: Docker, AWS, MongoDB, MySQL, ROS/Gazebo, Tableau

EXPERIENCE:
- AI Application Engineering Intern, Ema Unlimited (Jun-Aug 2025)
- Data Engineer, Image Computers (Dec 2022 - Aug 2024)
- Data Analyst Intern, Saint Louis University (Jan-Feb 2022)
- Data Science Intern, PlotMyData (Jun-Jul 2021)
- AI Intern, Beat The Virus (Jun-Jul 2021)
- Data Science Intern, GreatAlbum LLC (Apr-Jul 2021)

PROJECTS:
- Quadrotor Flight Control: PX4 SITL, ROS Noetic, Gazebo
- WordEcho Blog: FastAPI + React/TypeScript, MongoDB/MySQL
- MathUI: Handwritten digit recognition with TensorFlow
- VoiceUI: Voice recognition with Web Speech API
- ClimateUI: 3D climate data visualization with Three.js

CERTIFICATIONS:
Big Data (UC San Diego), Deep Learning (DeepLearning.AI), 
Data Science (IBM), AWS ML, Data Scientist's Toolbox (Johns Hopkins)
`;
```

### Trade-off Analysis

| Approach | Pros | Cons |
|----------|------|------|
| **Static Embedding** (Current) | Zero latency, deterministic, no dependencies | Limited to ~2000 tokens, manual updates |
| **Dynamic RAG** | Unlimited knowledge, auto-updates | Latency, complexity, vector DB costs |

---

## Behavioral Guardrails

### Response Constraints

The prompt implements strict behavioral rules to prevent AI-typical patterns:

```
=== CRITICAL RULES ===
1. BE BRIEF. Most responses 3-5 sentences. Never give long lists.
2. Be warm and personable. Start with "Hi!" when appropriate.
3. Don't recite your resume. Share highlights naturally.
4. Use "I" and "my" — you are Disha.
5. End with invitation to ask more, when natural.
6. No emojis. No bullet points unless asked for a list.
7. Don't over-explain. Trust follow-ups.
```

### Rule Breakdown

| Rule | Purpose | Without It |
|------|---------|------------|
| "BE BRIEF" | Maintains conversational flow | Wall-of-text responses |
| "Don't recite your resume" | Natural information sharing | Robotic data dumps |
| "No emojis" | Professional tone | Casual/unprofessional |
| "Trust follow-ups" | Respects user agency | Over-explanation |

### Boundary Enforcement

```
=== BOUNDARIES ===
Only use facts from knowledge base. If unsure, suggest checking resume 
or reaching out directly. Never invent experience or metrics.
```

This **anti-hallucination guardrail** explicitly forbids fabrication, ensuring all responses are grounded in the provided knowledge base.

---

## Conversational Memory

### Sliding Window Context

The system maintains conversation context across multiple turns:

```javascript
// Client-side: Store full conversation
conversationHistory.push({ role: 'user', content: message });
conversationHistory.push({ role: 'assistant', content: botResponse });

// API request: Send last 10 messages
body: JSON.stringify({ 
    message, 
    history: conversationHistory.slice(-10) 
})

// Server-side: Trim to 8 for token efficiency
const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-8),
    { role: "user", content: message }
];
```

### Memory Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CONTEXT WINDOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐ │
│  │ System Prompt  │  │ Last 8 Messages │  │ Current Message  │ │
│  │  ~2000 tokens  │  │  ~1500 tokens   │  │   ~100 tokens    │ │
│  └────────────────┘  └─────────────────┘  └──────────────────┘ │
│                                                                  │
│  Total: ~3600 tokens per request                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Capabilities Enabled

- Multi-turn conversations
- Reference to previous topics
- Coherent follow-up responses
- Context-aware clarifications

---

## Contextual Action Generation

### Goal-Oriented Behavior

The agent exhibits proactive behavior by suggesting relevant actions based on conversation content:

```javascript
function getContextualActions(userMessage, botResponse) {
    const lower = (userMessage + ' ' + botResponse).toLowerCase();
    const actions = [];
    
    // Resume/hiring intent
    if (lower.includes('resume') || lower.includes('cv') || lower.includes('hire')) 
        actions.push('resume');
    
    // Technical/code interest
    if (lower.includes('project') || lower.includes('code') || lower.includes('github')) 
        actions.push('github', 'projects');
    
    // Connection intent
    if (lower.includes('contact') || lower.includes('reach') || lower.includes('connect') || lower.includes('interview')) 
        actions.push('email', 'linkedin');
    
    // Networking
    if (lower.includes('linkedin') || lower.includes('network')) 
        actions.push('linkedin');
    
    // Return unique actions, max 2
    return [...new Set(actions)].slice(0, 2);
}
```

### Action Registry

```javascript
const quickActions = {
    resume: { 
        text: "Download Resume", 
        href: "Disha Sawant Resume 2025.pdf", 
        icon: "fa-download" 
    },
    github: { 
        text: "View GitHub", 
        href: "https://github.com/dishasawantt", 
        icon: "fa-github" 
    },
    linkedin: { 
        text: "Connect on LinkedIn", 
        href: "https://linkedin.com/in/disha-sawant-7877b21b6/", 
        icon: "fa-linkedin" 
    },
    email: { 
        text: "Send Email", 
        href: "mailto:dishasawantt@gmail.com", 
        icon: "fa-envelope" 
    },
    projects: { 
        text: "See All Projects", 
        href: "index.html#projects", 
        icon: "fa-code" 
    }
};
```

### Intent Detection Matrix

| User Intent | Keywords Detected | Actions Shown |
|-------------|-------------------|---------------|
| Hiring | resume, cv, hire | Download Resume |
| Technical | project, code, github | GitHub, Projects |
| Connection | contact, reach, connect, interview | Email, LinkedIn |
| Networking | linkedin, network | LinkedIn |

---

## Model Configuration

### LLaMA 3.3 70B via Groq

```javascript
const chatCompletion = await groq.chat.completions.create({
    messages,
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 500,
    top_p: 0.9,
});
```

### Parameter Rationale

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `model` | `llama-3.3-70b-versatile` | Best balance of capability, speed, and cost |
| `temperature` | `0.7` | Natural variation without randomness |
| `max_tokens` | `500` | Enforces brevity per guardrails |
| `top_p` | `0.9` | Nucleus sampling for coherent outputs |

### Why Groq?

| Factor | Benefit |
|--------|---------|
| **Speed** | ~10x faster inference than alternatives |
| **Cost** | Competitive pricing for high-volume usage |
| **Quality** | Access to latest open-source LLaMA models |
| **Reliability** | Enterprise-grade uptime |

---

## Easter Egg System

### Client-Side Pattern Matching

Special responses bypass the AI entirely for predefined personality moments:

```javascript
const easterEggs = {
    triggers: ['konami', 'secret', 'easter egg', 'hidden', 'surprise me'],
    responses: [
        "You found a secret! Fun fact: I once debugged code for 6 hours only to find a missing semicolon.",
        "Easter egg unlocked! Here's something not on my resume: I can solve a Rubik's cube.",
        "Secret discovered! Did you know this entire avatar experience was built with vanilla JavaScript?",
        "Hidden message found! When I'm not coding, you'll find me painting watercolors or singing bhajans."
    ]
};

function checkEasterEgg(message) {
    const lower = message.toLowerCase();
    if (easterEggs.triggers.some(t => lower.includes(t))) {
        return easterEggs.responses[Math.floor(Math.random() * easterEggs.responses.length)];
    }
    return null;
}
```

### Implementation Flow

```
User Input
    │
    ▼
checkEasterEgg()
    │
    ├── Match found → Return predefined response (skip AI)
    │
    └── No match → Continue to AI pipeline
```

---

## State-Aware Avatar Behavior

### Video State Machine

The avatar exhibits contextual body language through video transitions:

```
┌─────────┐    Page Load    ┌───────────┐
│  INIT   │────────────────▶│  GREETING │
└─────────┘                 └─────┬─────┘
                                  │
                            User Message
                                  │
                                  ▼
                           ┌───────────┐
                           │  THINKING │◀──────┐
                           └─────┬─────┘       │
                                 │             │
                           AI Response    User Message
                                 │             │
                                 ▼             │
                           ┌───────────┐       │
                           │   IDLE    │───────┘
                           └─────┬─────┘
                                 │
                            User Exits
                                 │
                                 ▼
                           ┌───────────┐
                           │  GOODBYE  │
                           └───────────┘
```

### State Implementation

```javascript
function setThinkingState(thinking) {
    if (thinking) {
        avatarName.classList.add('thinking');
        responseText.innerHTML = '<div class="thinking-indicator">...</div>';
        playIdle();  // Switch to working.mp4
    } else {
        avatarName.classList.remove('thinking');
    }
}

function playGoodbye() {
    switchVideo(videoGoodbye, false);
    displayResponse("Thank you for visiting. Goodbye!");
}
```

---

## Prompt Engineering Techniques

### 1. Role Definition
```
"You ARE Disha."
```
Forces first-person perspective and identity assumption.

### 2. Negative Constraints
```
"Don't recite your resume."
"No emojis. No bullet points."
"Never invent experience or metrics."
```
Tells the model what NOT to do—often more effective than positive guidance.

### 3. Positive Guidance
```
"Be warm and personable."
"End with invitation to ask more."
```
Shapes desired communication style.

### 4. Structured Knowledge
```
CONTACT:
- Email: ...
EDUCATION:
- M.S. ...
```
Clear, parseable format enables reliable information retrieval.

### 5. Escape Hatches
```
"If unsure, suggest checking resume or reaching out directly."
```
Graceful handling of unknown queries without hallucination.

### 6. Length Control
```
"BE BRIEF. Most responses 3-5 sentences."
"max_tokens: 500"
```
Dual enforcement at prompt and API level.

---

## Error Handling

### Rate Limiting

```javascript
if (error.status === 429) {
    return { 
        statusCode: 429, 
        headers, 
        body: JSON.stringify({ 
            error: "Rate limit reached. Please wait a moment and try again." 
        }) 
    };
}
```

### Fallback Response

```javascript
const errorMsg = "I'm having trouble connecting at the moment. Please try again or reach out via email at dishasawantt@gmail.com.";
displayResponse(errorMsg, ['email']);
```

Always provides a path forward even on failure.

---

## Limitations & Trade-offs

| Limitation | Reason | Mitigation |
|------------|--------|------------|
| No real-time data | Static knowledge base | Regular manual updates |
| No tool execution | Simplified architecture | Contextual action buttons |
| No cross-session memory | Stateless design | Conversation history within session |
| Rate limits | Groq API constraints | Graceful 429 handling |
| Knowledge cutoff | Embedded at build time | Scheduled updates |
| No streaming | Simplified implementation | Fast Groq inference (~1-2s) |

---

## Future Enhancements

### Potential Agentic Capabilities

| Enhancement | Description | Complexity |
|-------------|-------------|------------|
| **Tool Use** | Calendar scheduling, email sending | High |
| **Dynamic RAG** | Real-time retrieval from resume/portfolio | Medium |
| **Memory Persistence** | Cross-session conversation recall | Medium |
| **Multi-Modal** | Image/document understanding | High |
| **Streaming** | Token-by-token response display | Low |
| **Function Calling** | Structured action execution | Medium |
| **Voice Cloning** | Custom TTS with Disha's voice | High |

### Implementation Priority

1. **Streaming responses** - Low effort, high impact on perceived speed
2. **Dynamic RAG** - Medium effort, enables auto-updating knowledge
3. **Memory persistence** - Returning visitor recognition
4. **Function calling** - True agentic capabilities

---

## Metrics & Monitoring

### Recommended Tracking

| Metric | Purpose |
|--------|---------|
| Response latency | User experience |
| Conversation length | Engagement |
| Action click-through | Conversion |
| Error rate | Reliability |
| Most common queries | Content optimization |

---

## Security Considerations

| Concern | Implementation |
|---------|----------------|
| API key exposure | Server-side only via env vars |
| Prompt injection | Structured prompt with clear boundaries |
| Data leakage | No PII in knowledge base beyond contact info |
| Rate abuse | Groq-level rate limiting |
| XSS | No raw HTML injection in responses |

---

*Documentation last updated: January 2026*

