# AI Avatar Chatbot - Technical Documentation

## Overview

The AI Avatar Chatbot is an interactive conversational interface that allows visitors to chat with an AI-powered representation of Disha Sawant. It features real-time text-to-speech, speech-to-text input, animated avatar videos, and contextual quick actions.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│  avatar.html    │  avatar.css      │  avatar.js                 │
│  (Structure)    │  (Styling)       │  (Logic & Interactions)    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS POST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Netlify Serverless Function                   │
├─────────────────────────────────────────────────────────────────┤
│  netlify/functions/chat.js                                       │
│  - Request validation                                            │
│  - Conversation history management                               │
│  - Groq API integration                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ API Request
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Groq API                                 │
│                   (LLaMA 3.3 70B Model)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
resume/
├── avatar.html              # Chat interface markup
├── avatar.css               # Chat interface styles
├── avatar.js                # Client-side chat logic
├── netlify/
│   └── functions/
│       └── chat.js          # Serverless API endpoint
└── Assets/
    ├── namaste.mp4          # Greeting video
    ├── working.mp4          # Idle/thinking video
    └── bye.mp4              # Goodbye video
```

---

## Frontend Components

### 1. HTML Structure (`avatar.html`)

**Key Elements:**

| Element | ID/Class | Purpose |
|---------|----------|---------|
| Video Frame | `.video-frame` | Contains avatar video animations |
| Response Area | `#response-area` | Displays AI responses with typing animation |
| Chat History | `#chat-history` | Shows conversation history (horizontal layout) |
| User Input | `#user-input` | Text input field for user messages |
| Send Button | `#send-btn` | Submits user message |
| Voice Toggle | `#voice-toggle` | Enables/disables text-to-speech |
| Mic Button | `#mic-btn` | Activates speech-to-text input |
| Suggestions | `.suggestion-btn` | Quick-start conversation prompts |

**Layout Modes:**
- **Vertical (Default)**: Avatar centered above chat area
- **Horizontal**: Avatar left, chat right (activates after first message)

---

### 2. Styling (`avatar.css`)

**Design System:**

```css
:root {
    --primary: #d4846a;      /* Terracotta */
    --secondary: #f4e4bc;    /* Cream */
    --accent: #e6a756;       /* Gold */
    --golden: #f7ce68;       /* Bright gold */
    --terracotta: #c4704f;   /* Deep terracotta */
    --bg-dark: #0a0908;      /* Near black */
    --bg-card: #1a1614;      /* Dark brown */
    --text-primary: #ffffff;
    --text-secondary: #a89a8c;
    --glass-bg: rgba(26, 22, 20, 0.8);
    --glass-border: rgba(255, 255, 255, 0.1);
}
```

**Theme Support:**
- Dark mode (default)
- Light mode via `[data-theme="light"]` attribute

**Key Animations:**

| Animation | Element | Effect |
|-----------|---------|--------|
| `float` | `.gradient-orb` | Ambient background movement |
| `pulse` | `.status-dot` | Online indicator pulse |
| `blink` | `.cursor` | Typing cursor blink |
| `bounce` | `.thinking-dots span` | Thinking indicator |
| `micPulse` | `.mic-btn.listening` | Active microphone indicator |

**Responsive Breakpoints:**
- `768px`: Mobile layout adjustments
- `480px`: Small mobile optimizations

---

### 3. Client Logic (`avatar.js`)

#### State Management

```javascript
let currentVideo = null;        // Active video element
let isProcessing = false;       // Request in progress flag
let voiceEnabled = true;        // TTS toggle state
let conversationHistory = [];   // Message history for context
let preferredVoice = null;      // Selected TTS voice
let isHorizontalLayout = false; // Layout mode
let messageCount = 0;           // Message counter
let isListening = false;        // STT active state
```

#### Core Functions

**Initialization Flow:**
```
DOMContentLoaded
    ├── loadPreferredVoice()      # Load saved voice preference
    ├── setupVoiceInput()         # Initialize speech recognition
    ├── setupVoiceSelector()      # Voice dropdown handlers
    ├── setupThemeToggle()        # Theme switching
    ├── setupRotatingSuggestions()# Randomize suggestion buttons
    ├── playGreeting()            # Start greeting sequence
    ├── setupEventListeners()     # Bind UI events
    ├── handlePageLeave()         # Exit handlers
    └── preloadVideos()           # Preload video assets
```

**Message Flow:**

```
User Input → handleSend()
    │
    ├── Validate input
    ├── Update UI (disable send, show thinking)
    ├── Check for easter eggs
    │
    ├── POST to /.netlify/functions/chat
    │   └── Body: { message, history }
    │
    ├── Receive response
    ├── displayResponse()
    │   ├── speak() if voice enabled
    │   └── typeText() for animation
    │
    └── Show contextual quick actions
```

#### Key Functions Reference

| Function | Purpose |
|----------|---------|
| `handleSend()` | Main message submission handler |
| `displayResponse(text, actionKeys)` | Render AI response with typing effect |
| `typeText(text, onComplete)` | Character-by-character typing animation |
| `speak(text)` | Text-to-speech playback |
| `switchVideo(element, loop)` | Transition between avatar videos |
| `setThinkingState(boolean)` | Toggle thinking indicator |
| `addToChatHistory(message, isUser)` | Append to conversation history UI |
| `getContextualActions(user, bot)` | Determine relevant quick action buttons |

#### Video States

| Video | Trigger | Loop |
|-------|---------|------|
| `namaste.mp4` | Page load, greeting | Yes |
| `working.mp4` | User sends message, thinking | Yes |
| `bye.mp4` | User clicks "Back to Portfolio" | No |

#### Speech Features

**Text-to-Speech (TTS):**
- Uses Web Speech API (`SpeechSynthesisUtterance`)
- Voice preference saved to localStorage
- Waveform visualization during playback

**Speech-to-Text (STT):**
- Uses Web Speech API (`SpeechRecognition`)
- Falls back gracefully if unsupported
- Auto-submits on speech end

#### Easter Eggs

Hidden responses triggered by keywords:
- `konami`, `secret`, `easter egg`, `hidden`, `surprise me`

---

## Backend (`netlify/functions/chat.js`)

### Endpoint

```
POST /.netlify/functions/chat
```

### Request Format

```json
{
    "message": "string (required)",
    "history": [
        { "role": "user", "content": "..." },
        { "role": "assistant", "content": "..." }
    ]
}
```

### Response Format

**Success (200):**
```json
{
    "response": "AI generated response text"
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Missing or invalid message |
| 405 | Non-POST method |
| 429 | Rate limit exceeded |
| 500 | Server/API error |

### System Prompt

The AI is configured with a detailed system prompt that:

1. **Defines persona**: Disha speaking as herself
2. **Sets tone**: Warm, genuine, conversational
3. **Enforces brevity**: 3-5 sentence responses
4. **Provides knowledge base**:
   - Contact information
   - Education details
   - Technical skills
   - Work experience
   - Project descriptions
   - Certifications
5. **Sets boundaries**: Only uses provided facts

### Groq API Configuration

```javascript
{
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 500,
    top_p: 0.9
}
```

### CORS Headers

```javascript
{
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
}
```

---

## Data Flow

### Conversation Context

The system maintains conversation context by:

1. Storing messages in `conversationHistory` array (client-side)
2. Sending last 10 messages with each request
3. Backend further trims to last 8 for API efficiency

### Quick Actions

Contextual actions are determined by keyword matching:

| Keywords | Actions Shown |
|----------|---------------|
| resume, cv, hire | Download Resume |
| project, code, github | GitHub, Projects |
| contact, reach, connect | Email, LinkedIn |
| linkedin, network | LinkedIn |

---

## Configuration

### Environment Variables

```
GROQ_API_KEY=your_groq_api_key
```

### Local Storage Keys

| Key | Purpose |
|-----|---------|
| `avatarTheme` | Theme preference (dark/light) |
| `preferredVoice` | Selected TTS voice name |

---

## Browser Compatibility

### Required APIs

| API | Purpose | Fallback |
|-----|---------|----------|
| Web Speech Synthesis | Text-to-speech | Feature disabled |
| Web Speech Recognition | Speech-to-text | Mic button hidden |
| Fetch API | HTTP requests | Required |
| CSS Custom Properties | Theming | Required |
| IntersectionObserver | Animations | Graceful degradation |

### Tested Browsers

- Chrome 90+ ✓
- Safari 14+ ✓
- Firefox 88+ ✓
- Edge 90+ ✓

---

## Performance Optimizations

1. **Video Preloading**: All videos preloaded on page load
2. **Lazy Voice Loading**: Voices loaded asynchronously
3. **Debounced Input**: Prevents rapid-fire submissions
4. **Efficient DOM Updates**: Minimal reflows during typing animation
5. **Conversation Trimming**: Only last 10 messages sent to API

---

## Security Considerations

1. **API Key Protection**: GROQ_API_KEY stored as environment variable, never exposed to client
2. **Input Validation**: Server-side message validation
3. **Rate Limiting**: Handled by Groq API (429 responses handled gracefully)
4. **CORS**: Configured for security while allowing cross-origin requests
5. **Content Sanitization**: HTML entities preserved, no raw HTML injection

---

## Deployment

### Netlify Configuration (`netlify.toml`)

```toml
[build]
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
```

### Required Dependencies

```json
{
  "dependencies": {
    "groq-sdk": "^0.x.x"
  }
}
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| No AI response | API key missing | Set GROQ_API_KEY env var |
| Voice not working | Browser blocked | User must interact first |
| Mic not showing | Unsupported browser | Use Chrome/Safari |
| Video not playing | Autoplay blocked | Videos are muted by default |
| Rate limit errors | Too many requests | Wait and retry |

---

## Future Enhancements

- [ ] Streaming responses for faster perceived performance
- [ ] Voice activity detection for continuous conversation
- [ ] Conversation export/share functionality
- [ ] Multi-language support
- [ ] Typing indicators synced with TTS

---

*Documentation last updated: January 2026*

