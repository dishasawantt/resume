// DOM Elements
const elements = {
    videoGreeting: document.getElementById('video-greeting'),
    videoIdle: document.getElementById('video-idle'),
    videoGoodbye: document.getElementById('video-goodbye'),
    responseArea: document.getElementById('response-area'),
    responseText: document.getElementById('response-text'),
    userInput: document.getElementById('user-input'),
    sendBtn: document.getElementById('send-btn'),
    voiceToggle: document.getElementById('voice-toggle'),
    micBtn: document.getElementById('mic-btn'),
    waveformCanvas: document.getElementById('waveform'),
    suggestions: document.getElementById('suggestions'),
    avatarName: document.getElementById('avatar-name'),
    themeToggle: document.getElementById('theme-toggle'),
    avatarContent: document.querySelector('.avatar-content'),
    chatHistory: document.getElementById('chat-history'),
    voiceSelector: document.getElementById('voice-selector'),
    voiceSelectorToggle: document.getElementById('voice-selector-toggle'),
    voiceDropdownClose: document.getElementById('voice-dropdown-close'),
    voiceSelect: document.getElementById('voice-select'),
    voicePreviewBtn: document.getElementById('voice-preview-btn')
};

// State
const state = {
    currentVideo: null,
    isProcessing: false,
    voiceEnabled: true,
    conversationHistory: [],
    preferredVoice: null,
    allVoices: [],
    isHorizontalLayout: false,
    messageCount: 0,
    recognition: null,
    isListening: false,
    waveformAnimationId: null,
    lastAiResponse: '',
    hasPlayedGoodbye: false,
    pendingToolCall: null
};

// Configuration
const quickActions = {
    resume: { text: "Download Resume", href: "Disha Sawant Resume 2025.pdf", icon: "fa-download" },
    github: { text: "View GitHub", href: "https://github.com/dishasawantt", icon: "fa-github" },
    linkedin: { text: "Connect on LinkedIn", href: "https://linkedin.com/in/disha-sawant-7877b21b6/", icon: "fa-linkedin" },
    email: { text: "Send Email", href: "mailto:dishasawantt@gmail.com", icon: "fa-envelope" },
    projects: { text: "See All Projects", href: "index.html#projects", icon: "fa-code" }
};

const easterEggs = {
    triggers: ['konami', 'secret', 'easter egg', 'hidden', 'surprise me'],
    responses: [
        "You found a secret! Fun fact: I once debugged code for 6 hours only to find a missing semicolon.",
        "Easter egg unlocked! Did you know I've completed 72 LinkedIn Learning courses?",
        "Secret discovered! This entire avatar experience was built with vanilla JavaScript.",
        "Hidden message found! When I'm not coding, you'll find me painting watercolors or singing bhajans."
    ]
};

const suggestionSets = [
    [{ text: "About Me", query: "Tell me about yourself" }, { text: "Ema AI Work", query: "Tell me about your AI work at Ema" }, { text: "22 Certifications", query: "What certifications do you have?" }, { text: "72 Courses", query: "Tell me about your continuous learning" }],
    [{ text: "Experience", query: "What is your work experience?" }, { text: "Healthcare AI", query: "Tell me about your Brain Tumor AI project" }, { text: "Deep Learning", query: "Tell me about your Deep Learning specialization" }, { text: "Key Metrics", query: "What metrics have you achieved?" }],
    [{ text: "Skills", query: "What are your technical skills?" }, { text: "Projects", query: "What projects have you worked on?" }, { text: "Hobbies", query: "What are your hobbies?" }, { text: "Contact", query: "How can I contact you?" }],
    [{ text: "Education", query: "What is your educational background?" }, { text: "Big Data", query: "Tell me about your Big Data certifications" }, { text: "Best Project", query: "What's your most impactful project?" }, { text: "Why AI?", query: "Why are you passionate about AI?" }]
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPreferredVoice();
    setupVoiceInput();
    setupVoiceSelector();
    setupThemeToggle();
    setupRotatingSuggestions();
    playGreeting();
    setupEventListeners();
    handlePageLeave();
    preloadVideos();
});

// Theme
function setupThemeToggle() {
    const savedTheme = localStorage.getItem('avatarTheme') || 'dark';
    if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
    elements.themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('avatarTheme', newTheme);
    });
}

// Layout
function switchToHorizontalLayout() {
    if (state.isHorizontalLayout) return;
    state.isHorizontalLayout = true;
    elements.avatarContent.classList.add('horizontal');
}

// Chat History
function addToChatHistory(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'ai'}`;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = message.replace(/\n/g, '<br>');
    messageDiv.appendChild(contentDiv);
    elements.chatHistory.appendChild(messageDiv);
    elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
}

// Greeting
function getGreetingMessage() {
    const hour = new Date().getHours();
    const timeGreeting = hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 17 ? "Good afternoon" : hour >= 17 && hour < 21 ? "Good evening" : "Hello";
    return `${timeGreeting} and Namaste, I am Disha. Feel free to ask me anything about my background, projects, or experience.`;
}

// Suggestions
function setupRotatingSuggestions() {
    const randomSet = suggestionSets[Math.floor(Math.random() * suggestionSets.length)];
    elements.suggestions.querySelectorAll('.suggestion-btn').forEach((btn, i) => {
        if (randomSet[i]) {
            btn.textContent = randomSet[i].text;
            btn.setAttribute('data-query', randomSet[i].query);
        }
    });
}

// Voice
function loadPreferredVoice() {
    const loadVoices = () => {
        state.allVoices = speechSynthesis.getVoices();
        populateVoiceSelector(state.allVoices);
        
        const savedVoiceName = localStorage.getItem('preferredVoice');
        if (savedVoiceName) {
            const savedVoice = state.allVoices.find(v => v.name === savedVoiceName);
            if (savedVoice) {
                state.preferredVoice = savedVoice;
                elements.voiceSelect.value = savedVoiceName;
                return;
            }
        }
        
        const preferredNames = ['Samantha', 'Karen', 'Google US English Female', 'Microsoft Zira', 'Fiona'];
        for (const name of preferredNames) {
            const found = state.allVoices.find(v => v.name.includes(name));
            if (found) {
                state.preferredVoice = found;
                elements.voiceSelect.value = found.name;
                break;
            }
        }
        
        if (!state.preferredVoice) {
            state.preferredVoice = state.allVoices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) 
                || state.allVoices.find(v => v.lang.startsWith('en')) 
                || state.allVoices[0];
            if (state.preferredVoice) elements.voiceSelect.value = state.preferredVoice.name;
        }
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
}

function populateVoiceSelector(voices) {
    elements.voiceSelect.innerHTML = '';
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const otherVoices = voices.filter(v => !v.lang.startsWith('en'));
    
    [{ voices: englishVoices, label: 'English Voices' }, { voices: otherVoices, label: 'Other Languages' }].forEach(({ voices: voiceList, label }) => {
        if (voiceList.length) {
            const group = document.createElement('optgroup');
            group.label = label;
            voiceList.forEach(v => {
                const option = document.createElement('option');
                option.value = v.name;
                option.textContent = `${v.name} (${v.lang})`;
                group.appendChild(option);
            });
            elements.voiceSelect.appendChild(group);
        }
    });
}

function setupVoiceSelector() {
    if (!elements.voiceSelectorToggle) return;
    
    elements.voiceSelectorToggle.addEventListener('click', () => elements.voiceSelector.classList.toggle('open'));
    elements.voiceDropdownClose.addEventListener('click', () => elements.voiceSelector.classList.remove('open'));
    document.addEventListener('click', (e) => {
        if (!elements.voiceSelector.contains(e.target)) elements.voiceSelector.classList.remove('open');
    });
    
    elements.voiceSelect.addEventListener('change', () => {
        const selectedVoice = state.allVoices.find(v => v.name === elements.voiceSelect.value);
        if (selectedVoice) {
            state.preferredVoice = selectedVoice;
            localStorage.setItem('preferredVoice', elements.voiceSelect.value);
        }
    });
    
    elements.voicePreviewBtn.addEventListener('click', () => speak("Hello, this is how I will sound when speaking."));
}

function speak(text) {
    if (!state.voiceEnabled || !text) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = state.preferredVoice;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = startWaveformAnimation;
    utterance.onend = stopWaveformAnimation;
    speechSynthesis.speak(utterance);
}

function toggleVoice() {
    state.voiceEnabled = !state.voiceEnabled;
    elements.voiceToggle.classList.toggle('muted', !state.voiceEnabled);
    if (!state.voiceEnabled) {
        speechSynthesis.cancel();
        stopWaveformAnimation();
    }
}

// Voice Input
function setupVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        if (elements.micBtn) elements.micBtn.style.display = 'none';
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = false;
    state.recognition.interimResults = true;
    state.recognition.lang = 'en-US';
    
    state.recognition.onstart = () => {
        state.isListening = true;
        elements.micBtn?.classList.add('listening');
        elements.userInput.placeholder = 'Listening...';
    };
    
    state.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        elements.userInput.value = transcript;
        if (event.results[event.results.length - 1].isFinal) {
            stopListening();
            handleSend();
        }
    };
    
    state.recognition.onerror = stopListening;
    state.recognition.onend = stopListening;
}

function startListening() {
    if (!state.recognition || state.isListening || state.isProcessing) return;
    try { state.recognition.start(); } catch (e) { console.error('Could not start recognition:', e); }
}

function stopListening() {
    state.isListening = false;
    elements.micBtn?.classList.remove('listening');
    elements.userInput.placeholder = 'Ask me anything...';
    try { state.recognition?.stop(); } catch (e) {}
}

// Waveform Animation
function startWaveformAnimation() {
    if (!elements.waveformCanvas) return;
    const ctx = elements.waveformCanvas.getContext('2d');
    const bufferLength = 64;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
        state.waveformAnimationId = requestAnimationFrame(draw);
        for (let i = 0; i < bufferLength; i++) dataArray[i] = Math.random() * 100 + 50;
        
        const { width, height } = elements.waveformCanvas;
        ctx.clearRect(0, 0, width, height);
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height * 0.8;
            const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, '#d4846a');
            gradient.addColorStop(1, '#f7ce68');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
            x += barWidth;
        }
    };
    
    elements.waveformCanvas.classList.add('active');
    draw();
}

function stopWaveformAnimation() {
    if (state.waveformAnimationId) {
        cancelAnimationFrame(state.waveformAnimationId);
        state.waveformAnimationId = null;
    }
    if (elements.waveformCanvas) {
        elements.waveformCanvas.classList.remove('active');
        elements.waveformCanvas.getContext('2d').clearRect(0, 0, elements.waveformCanvas.width, elements.waveformCanvas.height);
    }
}

// Video Controls
function switchVideo(videoElement, loop = false) {
    [elements.videoGreeting, elements.videoIdle, elements.videoGoodbye].forEach(v => {
        if (v !== videoElement) {
            v.classList.remove('active');
            v.pause();
        }
    });
    videoElement.classList.add('active');
    videoElement.loop = loop;
    videoElement.muted = true;
    videoElement.currentTime = 0;
    videoElement.play().catch(() => document.addEventListener('click', () => videoElement.play(), { once: true }));
    state.currentVideo = videoElement;
}

function playGreeting() {
    const greetingMessage = getGreetingMessage();
    const greetingText = document.querySelector('.greeting-text');
    if (greetingText) greetingText.textContent = greetingMessage;
    
    const startVideo = () => {
        switchVideo(elements.videoGreeting, true);
        setTimeout(() => displayResponse(greetingMessage), 500);
    };
    
    if (elements.videoGreeting.readyState >= 3) startVideo();
    else elements.videoGreeting.addEventListener('canplay', startVideo, { once: true });
}

function playIdle() { switchVideo(elements.videoIdle, true); }
function playGoodbye() { switchVideo(elements.videoGoodbye, false); displayResponse("Thank you for visiting. Goodbye!"); }

function preloadVideos() {
    [elements.videoGreeting, elements.videoIdle, elements.videoGoodbye].forEach(v => {
        v.muted = true;
        v.volume = 0;
        v.load();
    });
}

// Event Listeners
function setupEventListeners() {
    elements.sendBtn.addEventListener('click', handleSend);
    elements.userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    elements.voiceToggle.addEventListener('click', toggleVoice);
    elements.micBtn?.addEventListener('click', () => state.isListening ? stopListening() : startListening());
    
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.userInput.value = btn.getAttribute('data-query');
            handleSend();
        });
    });
    
    document.querySelectorAll('.quick-action-btn[data-query]').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.userInput.value = btn.getAttribute('data-query');
            handleSend();
        });
    });
}

function handlePageLeave() {
    document.querySelector('.close-btn').addEventListener('click', (e) => {
        e.preventDefault();
        if (!state.hasPlayedGoodbye) {
            state.hasPlayedGoodbye = true;
            playGoodbye();
            setTimeout(() => window.location.href = 'index.html', 2500);
        }
    });
    
    const cleanup = () => {
        speechSynthesis.cancel();
        stopWaveformAnimation();
    };
    
    window.addEventListener('pagehide', cleanup);
    window.addEventListener('beforeunload', () => speechSynthesis.cancel());
    document.addEventListener('visibilitychange', () => { if (document.hidden) cleanup(); });
}

// Message Handling
async function handleSend() {
    const message = elements.userInput.value.trim();
    if (!message || state.isProcessing) return;
    
    state.isProcessing = true;
    elements.sendBtn.disabled = true;
    elements.userInput.value = '';
    state.messageCount++;

    // First message handling
    if (state.messageCount === 1) {
        const currentGreeting = elements.responseText.textContent;
        if (currentGreeting) {
            addToChatHistory(currentGreeting, false);
            state.lastAiResponse = currentGreeting;
        }
        switchToHorizontalLayout();
        if (state.currentVideo === elements.videoGreeting) switchVideo(elements.videoIdle, true);
    } else if (state.lastAiResponse) {
        addToChatHistory(state.lastAiResponse, false);
    }

    addToChatHistory(message, true);
    elements.suggestions.style.display = 'none';
    document.getElementById('quick-actions')?.style.setProperty('display', 'none');

    // Easter egg check
    const easterEggResponse = checkEasterEgg(message);
    if (easterEggResponse) {
        setThinkingState(true);
        await delay(800);
        setThinkingState(false);
        displayResponse(easterEggResponse, []);
        state.lastAiResponse = easterEggResponse;
        state.isProcessing = false;
        elements.sendBtn.disabled = false;
        return;
    }

    setThinkingState(true);
    state.conversationHistory.push({ role: 'user', content: message });

    try {
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                history: state.conversationHistory.slice(-10),
                toolExecutionData: state.pendingToolCall
            })
        });
        
        if (!response.ok) throw new Error('Request failed');
        const data = await response.json();

        setThinkingState(false);

        if (state.pendingToolCall) {
            state.pendingToolCall = null;
            displayResponse(data.response, []);
            if (data.schedulingUrl) addSchedulingCard(data.schedulingUrl, data.eventName, data.duration);
            state.lastAiResponse = data.response;
            state.conversationHistory.push({ role: 'assistant', content: data.response });
        } else if (data.toolCall?.requiresApproval) {
            state.pendingToolCall = data.toolCall;
            displayResponse(data.response, []);
            state.lastAiResponse = data.response;
            state.conversationHistory.push({ role: 'assistant', content: data.response });
            addApprovalButtons(data.toolCall);
        } else {
            const botResponse = data.response || "I apologize, but I could not process that request.";
            state.conversationHistory.push({ role: 'assistant', content: botResponse });
            displayResponse(botResponse, getContextualActions(message, botResponse));
            state.lastAiResponse = botResponse;
        }
    } catch (error) {
        console.error('Error:', error);
        setThinkingState(false);
        const errorMsg = "I am having trouble connecting. Please try again or reach out via email at dishasawantt@gmail.com.";
        displayResponse(errorMsg, ['email']);
        state.lastAiResponse = errorMsg;
    } finally {
        state.isProcessing = false;
        elements.sendBtn.disabled = false;
        elements.userInput.focus();
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function checkEasterEgg(message) {
    const lower = message.toLowerCase();
    if (easterEggs.triggers.some(t => lower.includes(t))) {
        return easterEggs.responses[Math.floor(Math.random() * easterEggs.responses.length)];
    }
    return null;
}

function getContextualActions(userMessage, botResponse) {
    const lower = (userMessage + ' ' + botResponse).toLowerCase();
    const actionMap = {
        resume: ['resume', 'cv', 'hire'],
        github: ['project', 'code', 'github'],
        projects: ['project', 'code'],
        email: ['contact', 'reach', 'connect', 'interview'],
        linkedin: ['linkedin', 'network', 'connect']
    };
    
    const actions = [];
    for (const [action, keywords] of Object.entries(actionMap)) {
        if (keywords.some(k => lower.includes(k))) actions.push(action);
    }
    return [...new Set(actions)].slice(0, 2);
}

// UI State
function setThinkingState(thinking) {
    if (thinking) {
        elements.avatarName.classList.add('thinking');
        elements.responseText.innerHTML = '<div class="thinking-indicator"><span>Thinking</span><div class="thinking-dots"><span></span><span></span><span></span></div></div>';
        playIdle();
    } else {
        elements.avatarName.classList.remove('thinking');
    }
}

function displayResponse(text, actionKeys = []) {
    if (state.voiceEnabled) speak(text);
    typeText(text, () => { if (actionKeys.length) showQuickActions(actionKeys); });
    elements.responseArea.scrollTop = 0;
}

function showQuickActions(actionKeys) {
    document.querySelector('.quick-actions')?.remove();
    const container = document.createElement('div');
    container.className = 'quick-actions';
    
    actionKeys.forEach(key => {
        const action = quickActions[key];
        if (action) {
            const link = document.createElement('a');
            link.href = action.href;
            link.className = 'quick-action-btn';
            link.target = action.href.startsWith('http') ? '_blank' : '_self';
            link.rel = 'noopener';
            const iconClass = ['fa-download', 'fa-envelope', 'fa-code'].includes(action.icon) ? 'fas' : 'fab';
            link.innerHTML = `<i class="${iconClass} ${action.icon}"></i> ${action.text}`;
            container.appendChild(link);
        }
    });
    
    document.querySelector('.chat-section').insertBefore(container, document.querySelector('.input-area'));
    requestAnimationFrame(() => container.classList.add('visible'));
}

function typeText(text, onComplete = null) {
    elements.responseText.innerHTML = '<span class="cursor">|</span>';
    document.querySelector('.quick-actions')?.remove();
    const cursor = elements.responseText.querySelector('.cursor');
    const chars = text.split('');
    let i = 0;
    
    const typeChar = () => {
        if (i < chars.length) {
            const char = chars[i];
            const span = document.createElement('span');
            span.className = 'char';
            span.innerHTML = char === '\n' ? '<br>' : char === ' ' ? ' ' : char;
            elements.responseText.insertBefore(span, cursor);
            i++;
            elements.responseArea.scrollTop = elements.responseArea.scrollHeight;
            const charDelay = '.!?'.includes(char) ? 150 : ',;:'.includes(char) ? 80 : 25;
            setTimeout(typeChar, charDelay);
        } else {
            cursor.remove();
            if (onComplete) onComplete();
        }
    };
    typeChar();
}

// Tool Approval UI
function addApprovalButtons(toolCall) {
    document.querySelector('.tool-approval-buttons')?.remove();
    
    const approvalDiv = document.createElement('div');
    approvalDiv.className = 'tool-approval-buttons';
    
    const buttonLabels = {
        send_contact_email: '<i class="fas fa-paper-plane"></i> Send Message',
        send_documents: '<i class="fas fa-file-pdf"></i> Send Documents',
        schedule_meeting: '<i class="fas fa-calendar-check"></i> Get Link'
    };
    
    const approveBtn = document.createElement('button');
    approveBtn.className = 'btn btn-approve';
    approveBtn.innerHTML = buttonLabels[toolCall.function] || '<i class="fas fa-check"></i> Proceed';
    approveBtn.onclick = async () => {
        approvalDiv.remove();
        setThinkingState(true);
        await handleSend();
    };
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
    cancelBtn.onclick = () => {
        state.pendingToolCall = null;
        approvalDiv.remove();
        const cancelMsg = "No problem! Let me know if you need anything else.";
        addToChatHistory(cancelMsg, false);
        state.lastAiResponse = cancelMsg;
        state.conversationHistory.push({ role: 'assistant', content: cancelMsg });
    };
    
    approvalDiv.appendChild(approveBtn);
    approvalDiv.appendChild(cancelBtn);
    document.querySelector('.chat-section').insertBefore(approvalDiv, document.querySelector('.input-area'));
}

function addSchedulingCard(url, eventName, duration) {
    document.querySelector('.scheduling-card')?.remove();
    
    const cardDiv = document.createElement('div');
    cardDiv.className = 'scheduling-card';
    const durationText = duration ? `${duration} minutes` : '';
    
    cardDiv.innerHTML = `
        <div class="scheduling-card-header">
            <i class="fas fa-calendar-alt"></i>
            <h3>${eventName || 'Schedule a Meeting'}</h3>
        </div>
        ${durationText ? `<p class="scheduling-duration">${durationText}</p>` : ''}
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="scheduling-link-btn">
            <i class="fas fa-external-link-alt"></i> Open Calendar
        </a>
        <button class="copy-link-btn" onclick="copySchedulingLink('${url}')">
            <i class="fas fa-copy"></i> Copy Link
        </button>
    `;
    
    document.querySelector('.chat-section').insertBefore(cardDiv, document.querySelector('.input-area'));
    setTimeout(() => cardDiv.classList.add('visible'), 100);
}

function copySchedulingLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.querySelector('.copy-link-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
        }, 2000);
    }).catch(err => console.error('Failed to copy:', err));
}

window.copySchedulingLink = copySchedulingLink;
