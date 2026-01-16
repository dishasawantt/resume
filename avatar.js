// DOM Elements
const $ = id => document.getElementById(id);
const elements = {
    videoGreeting: $('video-greeting'), videoIdle: $('video-idle'), videoGoodbye: $('video-goodbye'),
    responseArea: $('response-area'), responseText: $('response-text'), userInput: $('user-input'),
    sendBtn: $('send-btn'), voiceToggle: $('voice-toggle'), micBtn: $('mic-btn'),
    waveformCanvas: $('waveform'), suggestions: $('suggestions'), avatarName: $('avatar-name'),
    themeToggle: $('theme-toggle'), chatHistory: $('chat-history'), voiceSelector: $('voice-selector'),
    voiceSelectorToggle: $('voice-selector-toggle'), voiceDropdownClose: $('voice-dropdown-close'),
    voiceSelect: $('voice-select'), voicePreviewBtn: $('voice-preview-btn'),
    avatarContent: document.querySelector('.avatar-content')
};

// State
const state = {
    currentVideo: null, isProcessing: false, voiceEnabled: true, conversationHistory: [],
    preferredVoice: null, allVoices: [], isHorizontalLayout: false, messageCount: 0,
    recognition: null, isListening: false, waveformAnimationId: null, lastAiResponse: '',
    hasPlayedGoodbye: false, pendingToolCall: null
};

// Config
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
        "You found a secret! I once debugged for 6 hours to find a missing semicolon.",
        "Easter egg! I've completed 72 LinkedIn Learning courses.",
        "Secret! This avatar was built with vanilla JavaScript.",
        "Hidden! When not coding, I paint watercolors or sing bhajans."
    ]
};

const suggestionSets = [
    [{ text: "About Me", query: "Tell me about yourself" }, { text: "Ema AI Work", query: "Tell me about your AI work at Ema" }, { text: "22 Certifications", query: "What certifications do you have?" }, { text: "Key Metrics", query: "What metrics have you achieved?" }],
    [{ text: "Experience", query: "What is your work experience?" }, { text: "Healthcare AI", query: "Tell me about Brain Tumor AI" }, { text: "Skills", query: "What are your technical skills?" }, { text: "Projects", query: "What projects have you worked on?" }]
];

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadVoice(); setupVoiceInput(); setupVoiceSelector(); setupTheme(); setupSuggestions();
    playGreeting(); setupEvents(); setupPageLeave(); preloadVideos();
});

// Theme
const setupTheme = () => {
    const saved = localStorage.getItem('avatarTheme') || 'dark';
    if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
    elements.themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('avatarTheme', newTheme);
    });
};

// Layout
const switchToHorizontal = () => { if (!state.isHorizontalLayout) { state.isHorizontalLayout = true; elements.avatarContent.classList.add('horizontal'); } };

// Chat History
const addToHistory = (msg, isUser = false) => {
    const div = document.createElement('div');
    div.className = `chat-message ${isUser ? 'user' : 'ai'}`;
    div.innerHTML = `<div class="message-content">${msg.replace(/\n/g, '<br>')}</div>`;
    elements.chatHistory.appendChild(div);
    elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
};

// Greeting
const getGreeting = () => {
    const h = new Date().getHours();
    const time = h >= 5 && h < 12 ? "Good morning" : h >= 12 && h < 17 ? "Good afternoon" : h >= 17 && h < 21 ? "Good evening" : "Hello";
    return `${time} and Namaste, I am Disha. Feel free to ask me anything about my background, projects, or experience.`;
};

// Suggestions
const setupSuggestions = () => {
    const set = suggestionSets[Math.floor(Math.random() * suggestionSets.length)];
    elements.suggestions.querySelectorAll('.suggestion-btn').forEach((btn, i) => {
        if (set[i]) { btn.textContent = set[i].text; btn.setAttribute('data-query', set[i].query); }
    });
};

// Voice
const loadVoice = () => {
    const load = () => {
        state.allVoices = speechSynthesis.getVoices();
        populateVoices(state.allVoices);
        const saved = localStorage.getItem('preferredVoice');
        if (saved) { const v = state.allVoices.find(x => x.name === saved); if (v) { state.preferredVoice = v; elements.voiceSelect.value = saved; return; } }
        const preferred = ['Samantha', 'Karen', 'Google US English Female', 'Microsoft Zira'];
        for (const name of preferred) { const v = state.allVoices.find(x => x.name.includes(name)); if (v) { state.preferredVoice = v; elements.voiceSelect.value = v.name; break; } }
        if (!state.preferredVoice) state.preferredVoice = state.allVoices.find(v => v.lang.startsWith('en')) || state.allVoices[0];
    };
    load(); speechSynthesis.onvoiceschanged = load;
};

const populateVoices = voices => {
    elements.voiceSelect.innerHTML = '';
    const en = voices.filter(v => v.lang.startsWith('en')), other = voices.filter(v => !v.lang.startsWith('en'));
    [{ voices: en, label: 'English' }, { voices: other, label: 'Other' }].forEach(({ voices: list, label }) => {
        if (list.length) {
            const group = document.createElement('optgroup'); group.label = label;
            list.forEach(v => { const opt = document.createElement('option'); opt.value = v.name; opt.textContent = `${v.name} (${v.lang})`; group.appendChild(opt); });
            elements.voiceSelect.appendChild(group);
        }
    });
};

const setupVoiceSelector = () => {
    if (!elements.voiceSelectorToggle) return;
    elements.voiceSelectorToggle.addEventListener('click', () => elements.voiceSelector.classList.toggle('open'));
    elements.voiceDropdownClose.addEventListener('click', () => elements.voiceSelector.classList.remove('open'));
    document.addEventListener('click', e => { if (!elements.voiceSelector.contains(e.target)) elements.voiceSelector.classList.remove('open'); });
    elements.voiceSelect.addEventListener('change', () => {
        const v = state.allVoices.find(x => x.name === elements.voiceSelect.value);
        if (v) { state.preferredVoice = v; localStorage.setItem('preferredVoice', v.name); }
    });
    elements.voicePreviewBtn.addEventListener('click', () => speak("Hello, this is how I will sound."));
};

const speak = text => {
    if (!state.voiceEnabled || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = state.preferredVoice; u.rate = 0.95; u.pitch = 1.0;
    u.onstart = startWaveform; u.onend = stopWaveform;
    speechSynthesis.speak(u);
};

const toggleVoice = () => {
    state.voiceEnabled = !state.voiceEnabled;
    elements.voiceToggle.classList.toggle('muted', !state.voiceEnabled);
    if (!state.voiceEnabled) { speechSynthesis.cancel(); stopWaveform(); }
};

// Voice Input
const setupVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) { elements.micBtn && (elements.micBtn.style.display = 'none'); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.recognition = new SR(); state.recognition.continuous = false; state.recognition.interimResults = true; state.recognition.lang = 'en-US';
    state.recognition.onstart = () => { state.isListening = true; elements.micBtn?.classList.add('listening'); elements.userInput.placeholder = 'Listening...'; };
    state.recognition.onresult = e => {
        let t = ''; for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
        elements.userInput.value = t;
        if (e.results[e.results.length - 1].isFinal) { stopListening(); handleSend(); }
    };
    state.recognition.onerror = state.recognition.onend = stopListening;
};

const startListening = () => { if (state.recognition && !state.isListening && !state.isProcessing) try { state.recognition.start(); } catch {} };
const stopListening = () => { state.isListening = false; elements.micBtn?.classList.remove('listening'); elements.userInput.placeholder = 'Ask me anything...'; try { state.recognition?.stop(); } catch {} };

// Waveform
const startWaveform = () => {
    if (!elements.waveformCanvas) return;
    const ctx = elements.waveformCanvas.getContext('2d'), data = new Uint8Array(64);
    const draw = () => {
        state.waveformAnimationId = requestAnimationFrame(draw);
        for (let i = 0; i < 64; i++) data[i] = Math.random() * 100 + 50;
        const { width: w, height: h } = elements.waveformCanvas;
        ctx.clearRect(0, 0, w, h);
        const bw = (w / 64) * 2.5; let x = 0;
        for (let i = 0; i < 64; i++) {
            const bh = (data[i] / 255) * h * 0.8;
            const g = ctx.createLinearGradient(0, h, 0, h - bh); g.addColorStop(0, '#d4846a'); g.addColorStop(1, '#f7ce68');
            ctx.fillStyle = g; ctx.fillRect(x, h - bh, bw - 1, bh); x += bw;
        }
    };
    elements.waveformCanvas.classList.add('active'); draw();
};

const stopWaveform = () => {
    if (state.waveformAnimationId) { cancelAnimationFrame(state.waveformAnimationId); state.waveformAnimationId = null; }
    if (elements.waveformCanvas) { elements.waveformCanvas.classList.remove('active'); elements.waveformCanvas.getContext('2d').clearRect(0, 0, elements.waveformCanvas.width, elements.waveformCanvas.height); }
};

// Video
const switchVideo = (v, loop = false) => {
    [elements.videoGreeting, elements.videoIdle, elements.videoGoodbye].forEach(x => { if (x !== v) { x.classList.remove('active'); x.pause(); } });
    v.classList.add('active'); v.loop = loop; v.muted = true; v.currentTime = 0;
    v.play().catch(() => document.addEventListener('click', () => v.play(), { once: true }));
    state.currentVideo = v;
};

const playGreeting = () => {
    const msg = getGreeting();
    const gt = document.querySelector('.greeting-text'); if (gt) gt.textContent = msg;
    const start = () => { switchVideo(elements.videoGreeting, true); setTimeout(() => displayResponse(msg), 500); };
    elements.videoGreeting.readyState >= 3 ? start() : elements.videoGreeting.addEventListener('canplay', start, { once: true });
};

const playIdle = () => switchVideo(elements.videoIdle, true);
const playGoodbye = () => { switchVideo(elements.videoGoodbye, false); displayResponse("Thank you for visiting. Goodbye!"); };
const preloadVideos = () => [elements.videoGreeting, elements.videoIdle, elements.videoGoodbye].forEach(v => { v.muted = true; v.volume = 0; v.load(); });

// Events
const setupEvents = () => {
    elements.sendBtn.addEventListener('click', handleSend);
    elements.userInput.addEventListener('keypress', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
    elements.voiceToggle.addEventListener('click', toggleVoice);
    elements.micBtn?.addEventListener('click', () => state.isListening ? stopListening() : startListening());
    document.querySelectorAll('.suggestion-btn').forEach(btn => btn.addEventListener('click', () => { elements.userInput.value = btn.getAttribute('data-query'); handleSend(); }));
    document.querySelectorAll('.quick-action-btn[data-query]').forEach(btn => btn.addEventListener('click', () => { elements.userInput.value = btn.getAttribute('data-query'); handleSend(); }));
};

const setupPageLeave = () => {
    document.querySelector('.close-btn').addEventListener('click', e => {
        e.preventDefault();
        if (!state.hasPlayedGoodbye) { state.hasPlayedGoodbye = true; playGoodbye(); setTimeout(() => window.location.href = 'index.html', 2500); }
    });
    const cleanup = () => { speechSynthesis.cancel(); stopWaveform(); };
    window.addEventListener('pagehide', cleanup);
    window.addEventListener('beforeunload', () => speechSynthesis.cancel());
    document.addEventListener('visibilitychange', () => { if (document.hidden) cleanup(); });
};

// Message Handling
async function handleSend() {
    const msg = elements.userInput.value.trim();
    if (!msg) return;
    if (state.isProcessing) { elements.userInput.value = ''; return; }
    
    state.isProcessing = true; elements.sendBtn.disabled = true;
    elements.userInput.value = ''; elements.userInput.blur(); elements.userInput.focus();
    state.messageCount++;

    if (state.messageCount === 1) {
        const g = elements.responseText.textContent;
        if (g) { addToHistory(g, false); state.lastAiResponse = g; }
        switchToHorizontal();
        if (state.currentVideo === elements.videoGreeting) switchVideo(elements.videoIdle, true);
    } else if (state.lastAiResponse) addToHistory(state.lastAiResponse, false);

    addToHistory(msg, true);
    elements.suggestions.style.display = 'none';
    document.getElementById('quick-actions')?.style.setProperty('display', 'none');

    const egg = checkEasterEgg(msg);
    if (egg) { setThinking(true); await delay(800); setThinking(false); displayResponse(egg); state.lastAiResponse = egg; state.isProcessing = false; elements.sendBtn.disabled = false; return; }

    setThinking(true);
    state.conversationHistory.push({ role: 'user', content: msg });
    if (state.pendingToolCall) { document.querySelector('.tool-approval-buttons')?.remove(); state.pendingToolCall = null; }

    try {
        const res = await fetch('/.netlify/functions/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, history: state.conversationHistory.slice(-10) }) });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setThinking(false);

        if (data.toolCall?.requiresApproval) {
            state.pendingToolCall = data.toolCall;
            displayResponse(data.response); state.lastAiResponse = data.response;
            state.conversationHistory.push({ role: 'assistant', content: data.response });
            addApprovalButtons(data.toolCall);
        } else {
            const bot = data.response || "Could you rephrase that?";
            state.conversationHistory.push({ role: 'assistant', content: bot });
            displayResponse(bot, getActions(msg, bot));
            if (data.schedulingUrl) addSchedulingCard(data.schedulingUrl, data.eventName, data.duration);
            state.lastAiResponse = bot;
        }
    } catch {
        setThinking(false);
        const err = "Having trouble connecting. Email me at dishasawantt@gmail.com.";
        displayResponse(err, ['email']); state.lastAiResponse = err;
    } finally { state.isProcessing = false; elements.sendBtn.disabled = false; elements.userInput.focus(); }
}

const delay = ms => new Promise(r => setTimeout(r, ms));
const checkEasterEgg = msg => easterEggs.triggers.some(t => msg.toLowerCase().includes(t)) ? easterEggs.responses[Math.floor(Math.random() * easterEggs.responses.length)] : null;

const getActions = (user, bot) => {
    const lower = (user + ' ' + bot).toLowerCase();
    const map = { projects: ['project', 'brain tumor', 'emotion ai'], github: ['github', 'code'], resume: ['resume', 'cv', 'hire'], email: ['contact', 'reach'], linkedin: ['linkedin', 'network'] };
    return [...new Set(Object.entries(map).filter(([, kw]) => kw.some(k => lower.includes(k))).map(([a]) => a))].slice(0, 2);
};

// UI
const setThinking = on => {
    if (on) { elements.avatarName.classList.add('thinking'); elements.responseText.innerHTML = '<div class="thinking-indicator"><span>Thinking</span><div class="thinking-dots"><span></span><span></span><span></span></div></div>'; playIdle(); }
    else elements.avatarName.classList.remove('thinking');
};

const displayResponse = (text, actions = []) => { if (state.voiceEnabled) speak(text); typeText(text, () => { if (actions.length) showQuickActions(actions); }); elements.responseArea.scrollTop = 0; };

const showQuickActions = keys => {
    document.querySelector('.quick-actions')?.remove();
    const c = document.createElement('div'); c.className = 'quick-actions';
    keys.forEach(k => {
        const a = quickActions[k]; if (!a) return;
        const link = document.createElement('a');
        link.href = a.href; link.className = 'quick-action-btn';
        link.target = a.href.startsWith('http') ? '_blank' : '_self'; link.rel = 'noopener';
        link.innerHTML = `<i class="${['fa-download', 'fa-envelope', 'fa-code'].includes(a.icon) ? 'fas' : 'fab'} ${a.icon}"></i> ${a.text}`;
        c.appendChild(link);
    });
    document.querySelector('.chat-section').insertBefore(c, document.querySelector('.input-area'));
    requestAnimationFrame(() => c.classList.add('visible'));
};

const typeText = (text, done = null) => {
    elements.responseText.innerHTML = '<span class="cursor">|</span>';
    document.querySelector('.quick-actions')?.remove();
    const cursor = elements.responseText.querySelector('.cursor'), chars = text.split('');
    let i = 0;
    const type = () => {
        if (i < chars.length) {
            const ch = chars[i], span = document.createElement('span');
            span.className = 'char'; span.innerHTML = ch === '\n' ? '<br>' : ch === ' ' ? ' ' : ch;
            elements.responseText.insertBefore(span, cursor); i++;
            elements.responseArea.scrollTop = elements.responseArea.scrollHeight;
            setTimeout(type, '.!?'.includes(ch) ? 150 : ',;:'.includes(ch) ? 80 : 25);
        } else { cursor.remove(); done?.(); }
    };
    type();
};

// Tool Approval
const addApprovalButtons = tc => {
    document.querySelector('.tool-approval-buttons')?.remove();
    const div = document.createElement('div'); div.className = 'tool-approval-buttons';
    const labels = { send_documents: '<i class="fas fa-file-pdf"></i> Send Documents', schedule_meeting: '<i class="fas fa-calendar-alt"></i> Schedule Meeting' };
    
    const approve = document.createElement('button'); approve.className = 'btn btn-approve';
    approve.innerHTML = labels[tc.function] || '<i class="fas fa-check"></i> Proceed';
    approve.onclick = async () => {
        div.remove(); setThinking(true);
        try {
            const res = await fetch('/.netlify/functions/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: '', history: state.conversationHistory.slice(-10), toolExecutionData: state.pendingToolCall }) });
            if (!res.ok) throw new Error();
            const data = await res.json();
            state.pendingToolCall = null; setThinking(false);
            displayResponse(data.response);
            if (data.schedulingUrl) addSchedulingCard(data.schedulingUrl, data.eventName, data.duration);
            state.lastAiResponse = data.response;
            state.conversationHistory.push({ role: 'assistant', content: data.response });
        } catch { setThinking(false); displayResponse("Had trouble. Try again."); state.pendingToolCall = null; }
    };
    
    const cancel = document.createElement('button'); cancel.className = 'btn btn-cancel';
    cancel.innerHTML = '<i class="fas fa-times"></i> Cancel';
    cancel.onclick = () => { state.pendingToolCall = null; div.remove(); const m = "No problem! Let me know if you need anything."; addToHistory(m, false); state.lastAiResponse = m; state.conversationHistory.push({ role: 'assistant', content: m }); };
    
    div.appendChild(approve); div.appendChild(cancel);
    document.querySelector('.chat-section').insertBefore(div, document.querySelector('.input-area'));
};

const addSchedulingCard = (url, name, duration) => {
    document.querySelector('.scheduling-card')?.remove();
    const card = document.createElement('div'); card.className = 'scheduling-card';
    card.innerHTML = `<div class="scheduling-card-header"><i class="fas fa-calendar-alt"></i><h3>${name || 'Schedule Meeting'}</h3></div>
        ${duration ? `<p class="scheduling-duration">${duration} minutes</p>` : ''}
        <a href="${url}" target="_blank" rel="noopener" class="scheduling-link-btn"><i class="fas fa-external-link-alt"></i> Open Calendar</a>
        <button class="copy-link-btn" onclick="copySchedulingLink('${url}')"><i class="fas fa-copy"></i> Copy Link</button>`;
    document.querySelector('.chat-section').insertBefore(card, document.querySelector('.input-area'));
    setTimeout(() => card.classList.add('visible'), 100);
};

const copySchedulingLink = url => {
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.querySelector('.copy-link-btn');
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!'; btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2000);
    }).catch(() => {});
};

window.copySchedulingLink = copySchedulingLink;
