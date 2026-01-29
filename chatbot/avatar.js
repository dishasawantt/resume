const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const PORTFOLIO_URL = "https://dishasawantt.github.io/resume";

const elements = {
    videoGreeting: $('video-greeting'), videoIdle: $('video-idle'), videoGoodbye: $('video-goodbye'),
    responseArea: $('response-area'), responseText: $('response-text'), userInput: $('user-input'),
    sendBtn: $('send-btn'), voiceToggle: $('voice-toggle'), micBtn: $('mic-btn'),
    waveformCanvas: $('waveform'), suggestions: $('suggestions'), avatarName: $('avatar-name'),
    themeToggle: $('theme-toggle'), avatarContent: document.querySelector('.avatar-content'),
    chatHistory: $('chat-history'), voiceSelector: $('voice-selector'),
    voiceSelectorToggle: $('voice-selector-toggle'), voiceDropdownClose: $('voice-dropdown-close'),
    voiceSelect: $('voice-select'), voicePreviewBtn: $('voice-preview-btn')
};

const state = {
    currentVideo: null, isProcessing: false, voiceEnabled: true, conversationHistory: [],
    preferredVoice: null, allVoices: [], isHorizontalLayout: false, messageCount: 0,
    recognition: null, isListening: false, waveformAnimationId: null, hasPlayedGoodbye: false,
    pendingToolCall: null, typingTimeoutId: null, currentTypingText: null,
    greetingMessage: null, hasSpokenGreeting: false
};

const CONFIG = {
    quickActions: {
        resume: { text: "Download Resume", href: `${PORTFOLIO_URL}/Resume%20-%20Disha%20Sawant%202026.pdf`, icon: "fa-download" },
        github: { text: "View GitHub", href: "https://github.com/dishasawantt", icon: "fa-github", brand: true },
        linkedin: { text: "Connect on LinkedIn", href: "https://linkedin.com/in/disha-sawant-7877b21b6/", icon: "fa-linkedin", brand: true },
        email: { text: "Send Email", href: "mailto:dishasawantt@gmail.com", icon: "fa-envelope" },
        projects: { text: "See All Projects", href: `${PORTFOLIO_URL}/index.html#projects`, icon: "fa-code" },
        certifications: { text: "View Certifications", href: `${PORTFOLIO_URL}/index.html#certifications`, icon: "fa-certificate" },
        experience: { text: "View Experience", href: `${PORTFOLIO_URL}/index.html#experience`, icon: "fa-briefcase" },
        education: { text: "View Education", href: `${PORTFOLIO_URL}/index.html#education`, icon: "fa-graduation-cap" },
        skills: { text: "View Skills", href: `${PORTFOLIO_URL}/index.html#skills`, icon: "fa-tools" }
    },
    easterEggs: {
        triggers: ['konami', 'secret', 'easter egg', 'hidden', 'surprise me'],
        responses: [
            "You found a secret! Fun fact: I once debugged code for 6 hours only to find a missing semicolon.",
            "Easter egg unlocked! Did you know I've completed 72 LinkedIn Learning courses?",
            "Secret discovered! This entire avatar experience was built with vanilla JavaScript.",
            "Hidden message found! When I'm not coding, you'll find me painting watercolors or singing bhajans."
        ]
    },
    suggestionSets: [
        [{ text: "About Me", query: "Tell me about yourself" }, { text: "Ema AI Work", query: "Tell me about your AI work at Ema" }, { text: "22 Certifications", query: "What certifications do you have?" }, { text: "72 Courses", query: "Tell me about your continuous learning" }],
        [{ text: "Experience", query: "What is your work experience?" }, { text: "Healthcare AI", query: "Tell me about your Brain Tumor AI project" }, { text: "Deep Learning", query: "Tell me about your Deep Learning specialization" }, { text: "Key Metrics", query: "What metrics have you achieved?" }],
        [{ text: "Skills", query: "What are your technical skills?" }, { text: "Projects", query: "What projects have you worked on?" }, { text: "Hobbies", query: "What are your hobbies?" }, { text: "Contact", query: "How can I contact you?" }],
        [{ text: "Education", query: "What is your educational background?" }, { text: "Big Data", query: "Tell me about your Big Data certifications" }, { text: "Best Project", query: "What's your most impactful project?" }, { text: "Why AI?", query: "Why are you passionate about AI?" }]
    ],
    actionKeywords: {
        projects: ['project', 'brain tumor', 'emotion ai', 'credit default', 'mathui', 'voiceui', 'quadrotor', 'wordecho'],
        github: ['github', 'code', 'repository', 'source'],
        resume: ['resume', 'cv', 'hire'],
        email: ['contact', 'reach out', 'email me'],
        linkedin: ['linkedin', 'network', 'connection'],
        certifications: ['certification', 'certificate', 'coursera', 'deeplearning.ai'],
        experience: ['experience', 'work', 'job', 'intern', 'ema', 'image computers'],
        education: ['education', 'degree', 'university', 'sdsu', 'mumbai', 'gpa'],
        skills: ['skill', 'python', 'javascript', 'tensorflow', 'pytorch', 'react', 'docker', 'aws']
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadPreferredVoice();
    setupVoiceInput();
    setupVoiceSelector();
    setupThemeToggle();
    setupRotatingSuggestions();
    setupEventListeners();
    handlePageLeave();
    preloadVideos();
    playGreeting();
});

function setupThemeToggle() {
    const saved = localStorage.getItem('avatarTheme') || 'dark';
    if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
    elements.themeToggle?.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('avatarTheme', next);
    });
}

function switchToHorizontalLayout() {
    if (!state.isHorizontalLayout) {
        state.isHorizontalLayout = true;
        elements.avatarContent?.classList.add('horizontal');
    }
}

function addToChatHistory(message, isUser = false, type = 'message') {
    const div = document.createElement('div');
    div.className = `chat-message ${isUser ? 'user' : 'ai'}${type !== 'message' ? ` ${type}` : ''}`;
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = message.replace(/\n/g, '<br>');
    div.appendChild(content);
    elements.chatHistory?.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    elements.chatHistory && requestAnimationFrame(() => elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight);
}

function getGreetingMessage() {
    const h = new Date().getHours();
    const greeting = h >= 5 && h < 12 ? "Good morning" : h >= 12 && h < 17 ? "Good afternoon" : h >= 17 && h < 21 ? "Good evening" : "Hello";
    return `${greeting} and Namaste, I am Disha. Feel free to ask me anything about my background, projects, or experience.`;
}

function setupRotatingSuggestions() {
    const set = CONFIG.suggestionSets[Math.floor(Math.random() * CONFIG.suggestionSets.length)];
    elements.suggestions?.querySelectorAll('.suggestion-btn').forEach((btn, i) => {
        if (set[i]) { btn.textContent = set[i].text; btn.setAttribute('data-query', set[i].query); }
    });
}

function loadPreferredVoice() {
    const loadVoices = () => {
        state.allVoices = speechSynthesis.getVoices();
        populateVoiceSelector();
        const saved = localStorage.getItem('preferredVoice');
        if (saved) {
            const voice = state.allVoices.find(v => v.name === saved);
            if (voice) { state.preferredVoice = voice; if (elements.voiceSelect) elements.voiceSelect.value = saved; return; }
        }
        const preferred = ['Samantha', 'Karen', 'Google US English Female', 'Microsoft Zira', 'Fiona'];
        for (const name of preferred) {
            const found = state.allVoices.find(v => v.name.includes(name));
            if (found) { state.preferredVoice = found; if (elements.voiceSelect) elements.voiceSelect.value = found.name; break; }
        }
        if (!state.preferredVoice) {
            state.preferredVoice = state.allVoices.find(v => v.lang.startsWith('en')) || state.allVoices[0];
            if (state.preferredVoice && elements.voiceSelect) elements.voiceSelect.value = state.preferredVoice.name;
        }
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
}

function populateVoiceSelector() {
    if (!elements.voiceSelect) return;
    elements.voiceSelect.innerHTML = '';
    [{ voices: state.allVoices.filter(v => v.lang.startsWith('en')), label: 'English Voices' },
     { voices: state.allVoices.filter(v => !v.lang.startsWith('en')), label: 'Other Languages' }]
    .forEach(({ voices, label }) => {
        if (voices.length) {
            const group = document.createElement('optgroup');
            group.label = label;
            voices.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.name;
                opt.textContent = `${v.name} (${v.lang})`;
                group.appendChild(opt);
            });
            elements.voiceSelect.appendChild(group);
        }
    });
}

function setupVoiceSelector() {
    if (!elements.voiceSelectorToggle) return;
    elements.voiceSelectorToggle.addEventListener('click', () => elements.voiceSelector?.classList.toggle('open'));
    elements.voiceDropdownClose?.addEventListener('click', () => elements.voiceSelector?.classList.remove('open'));
    document.addEventListener('click', e => {
        if (elements.voiceSelector && !elements.voiceSelector.contains(e.target)) elements.voiceSelector.classList.remove('open');
    });
    elements.voiceSelect?.addEventListener('change', () => {
        const voice = state.allVoices.find(v => v.name === elements.voiceSelect.value);
        if (voice) { state.preferredVoice = voice; localStorage.setItem('preferredVoice', voice.name); }
    });
    elements.voicePreviewBtn?.addEventListener('click', () => speak("Hello, this is how I will sound when speaking."));
}

function speak(text) {
    if (!state.voiceEnabled || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = state.preferredVoice;
    u.rate = 0.95;
    u.pitch = 1.0;
    u.onstart = startWaveformAnimation;
    u.onend = stopWaveformAnimation;
    speechSynthesis.speak(u);
}

function toggleVoice() {
    state.voiceEnabled = !state.voiceEnabled;
    elements.voiceToggle?.classList.toggle('muted', !state.voiceEnabled);
    if (!state.voiceEnabled) { speechSynthesis.cancel(); stopWaveformAnimation(); }
}

function setupVoiceInput() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { if (elements.micBtn) elements.micBtn.style.display = 'none'; return; }
    
    state.recognition = new SR();
    Object.assign(state.recognition, { continuous: false, interimResults: true, lang: 'en-US' });
    
    state.recognition.onstart = () => {
        state.isListening = true;
        elements.micBtn?.classList.add('listening');
        if (elements.userInput) elements.userInput.placeholder = 'Listening...';
    };
    state.recognition.onresult = e => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) transcript += e.results[i][0].transcript;
        if (elements.userInput) elements.userInput.value = transcript;
        if (e.results[e.results.length - 1].isFinal) { stopListening(); handleSend(); }
    };
    state.recognition.onerror = state.recognition.onend = stopListening;
}

function startListening() {
    if (!state.recognition || state.isListening || state.isProcessing) return;
    try { state.recognition.start(); } catch {}
}

function stopListening() {
    state.isListening = false;
    elements.micBtn?.classList.remove('listening');
    if (elements.userInput) elements.userInput.placeholder = 'Ask me anything...';
    try { state.recognition?.stop(); } catch {}
}

function startWaveformAnimation() {
    if (!elements.waveformCanvas) return;
    const ctx = elements.waveformCanvas.getContext('2d');
    const len = 64, data = new Uint8Array(len);
    
    const draw = () => {
        state.waveformAnimationId = requestAnimationFrame(draw);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 100 + 50;
        const { width: w, height: h } = elements.waveformCanvas;
        ctx.clearRect(0, 0, w, h);
        const bw = (w / len) * 2.5;
        let x = 0;
        for (let i = 0; i < len; i++) {
            const bh = (data[i] / 255) * h * 0.8;
            const g = ctx.createLinearGradient(0, h, 0, h - bh);
            g.addColorStop(0, '#d4846a');
            g.addColorStop(1, '#f7ce68');
            ctx.fillStyle = g;
            ctx.fillRect(x, h - bh, bw - 1, bh);
            x += bw;
        }
    };
    elements.waveformCanvas.classList.add('active');
    draw();
}

function stopWaveformAnimation() {
    if (state.waveformAnimationId) { cancelAnimationFrame(state.waveformAnimationId); state.waveformAnimationId = null; }
    if (elements.waveformCanvas) {
        elements.waveformCanvas.classList.remove('active');
        elements.waveformCanvas.getContext('2d').clearRect(0, 0, elements.waveformCanvas.width, elements.waveformCanvas.height);
    }
}

function switchVideo(el, loop = false) {
    [elements.videoGreeting, elements.videoIdle, elements.videoGoodbye].forEach(v => {
        if (v && v !== el) { v.classList.remove('active'); v.pause(); }
    });
    if (!el) return;
    el.classList.add('active');
    el.loop = loop;
    el.muted = true;
    el.currentTime = 0;
    el.play().catch(() => document.addEventListener('click', () => el.play(), { once: true }));
    state.currentVideo = el;
}

function playGreeting() {
    const msg = getGreetingMessage();
    state.greetingMessage = msg;
    const gt = document.querySelector('.greeting-text');
    if (gt) gt.textContent = msg;
    const start = () => { 
        switchVideo(elements.videoGreeting, true); 
        setTimeout(() => displayResponse(msg, [], null, true), 500); 
    };
    elements.videoGreeting?.readyState >= 3 ? start() : elements.videoGreeting?.addEventListener('canplay', start, { once: true });
    
    const speakGreetingOnInteraction = () => {
        if (!state.hasSpokenGreeting && state.voiceEnabled && state.greetingMessage) {
            state.hasSpokenGreeting = true;
            speak(state.greetingMessage);
        }
    };
    document.addEventListener('click', speakGreetingOnInteraction, { once: true });
    document.addEventListener('keydown', speakGreetingOnInteraction, { once: true });
}

function preloadVideos() {
    [elements.videoGreeting, elements.videoIdle, elements.videoGoodbye].forEach(v => {
        if (v) { v.muted = true; v.volume = 0; v.load(); }
    });
}

function setupEventListeners() {
    elements.sendBtn?.addEventListener('click', handleSend);
    elements.userInput?.addEventListener('keypress', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
    elements.voiceToggle?.addEventListener('click', toggleVoice);
    elements.micBtn?.addEventListener('click', () => state.isListening ? stopListening() : startListening());
    $$('.suggestion-btn').forEach(btn => btn.addEventListener('click', () => { if (elements.userInput) elements.userInput.value = btn.getAttribute('data-query'); handleSend(); }));
    $$('.quick-action-btn[data-query]').forEach(btn => btn.addEventListener('click', () => { if (elements.userInput) elements.userInput.value = btn.getAttribute('data-query'); handleSend(); }));
}

function handlePageLeave() {
    document.querySelector('.close-btn')?.addEventListener('click', e => {
        e.preventDefault();
        if (!state.hasPlayedGoodbye) {
            state.hasPlayedGoodbye = true;
            switchVideo(elements.videoGoodbye, false);
            displayResponse("Thank you for visiting. Goodbye!");
            setTimeout(() => window.location.href = PORTFOLIO_URL, 2500);
        }
    });
    const cleanup = () => { speechSynthesis.cancel(); stopWaveformAnimation(); };
    window.addEventListener('pagehide', cleanup);
    window.addEventListener('beforeunload', () => speechSynthesis.cancel());
    document.addEventListener('visibilitychange', () => { if (document.hidden) cleanup(); });
}

let lastRequestTime = 0;
const REQUEST_COOLDOWN = 2000;

async function handleSend() {
    const msg = elements.userInput?.value.trim();
    if (!msg) return;
    
    const now = Date.now();
    if (now - lastRequestTime < REQUEST_COOLDOWN) return;
    lastRequestTime = now;
    
    if (state.typingTimeoutId) {
        clearTimeout(state.typingTimeoutId);
        state.typingTimeoutId = null;
        if (state.currentTypingText) finishTyping(state.currentTypingText);
    }
    
    if (state.isProcessing) { if (elements.userInput) elements.userInput.value = ''; return; }
    
    state.isProcessing = true;
    if (elements.sendBtn) elements.sendBtn.disabled = true;
    if (elements.userInput) { elements.userInput.value = ''; elements.userInput.blur(); elements.userInput.focus(); }
    state.messageCount++;

    if (state.messageCount === 1) {
        switchToHorizontalLayout();
        if (state.currentVideo === elements.videoGreeting) switchVideo(elements.videoIdle, true);
        const greetingText = elements.responseText?.textContent;
        if (greetingText) addToChatHistory(greetingText, false);
        if (elements.responseArea) elements.responseArea.style.display = 'none';
    }

    addToChatHistory(msg, true);
    if (elements.suggestions) elements.suggestions.style.display = 'none';
    state.pendingToolCall = null;

    const egg = checkEasterEgg(msg);
    if (egg) {
        setThinkingState(true);
        await new Promise(r => setTimeout(r, 800));
        setThinkingState(false);
        displayResponse(egg, []);
        state.isProcessing = false;
        if (elements.sendBtn) elements.sendBtn.disabled = false;
        return;
    }

    setThinkingState(true);
    state.conversationHistory.push({ role: 'user', content: msg });

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, history: state.conversationHistory.slice(-4) })
        });
        
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();
        setThinkingState(false);

        if (data.toolCall?.requiresApproval) {
            state.pendingToolCall = data.toolCall;
            state.conversationHistory.push({ role: 'assistant', content: data.response });
            displayResponse(data.response, [], () => addApprovalButtons(data.toolCall));
        } else {
            const resp = data.response || "I couldn't process that request.";
            state.conversationHistory.push({ role: 'assistant', content: resp });
            displayResponse(resp, getContextualActions(msg, resp), () => {
                if (data.schedulingUrl) addSchedulingCard(data.schedulingUrl, data.eventName, data.duration);
            });
        }
    } catch {
        setThinkingState(false);
        displayResponse("I'm having trouble connecting. Please try again or email dishasawantt@gmail.com.", ['email']);
    } finally {
        state.isProcessing = false;
        if (elements.sendBtn) elements.sendBtn.disabled = false;
        elements.userInput?.focus();
    }
}

function checkEasterEgg(msg) {
    const lower = msg.toLowerCase();
    return CONFIG.easterEggs.triggers.some(t => lower.includes(t)) 
        ? CONFIG.easterEggs.responses[Math.floor(Math.random() * CONFIG.easterEggs.responses.length)] 
        : null;
}

function getContextualActions(userMsg, botResp) {
    if (/what's your (name|email)|need your|provide|placeholder/i.test(botResp)) return [];
    const lower = (userMsg + ' ' + botResp).toLowerCase();
    const actions = [];
    for (const [action, keywords] of Object.entries(CONFIG.actionKeywords)) {
        if (keywords.some(k => lower.includes(k))) actions.push(action);
    }
    return [...new Set(actions)].slice(0, 2);
}

function setThinkingState(thinking) {
    if (thinking) {
        elements.avatarName?.classList.add('thinking');
        if (elements.responseText) elements.responseText.innerHTML = '<div class="thinking-indicator"><span>Thinking</span><div class="thinking-dots"><span></span><span></span><span></span></div></div>';
        switchVideo(elements.videoIdle, true);
    } else {
        elements.avatarName?.classList.remove('thinking');
    }
}

function displayResponse(text, actionKeys = [], onComplete = null, skipSpeak = false) {
    if (state.voiceEnabled && !skipSpeak) speak(text);
    if (elements.responseArea) elements.responseArea.style.display = 'block';
    state.currentTypingText = text;
    typeText(text, () => {
        state.currentTypingText = null;
        if (state.messageCount > 0) {
            addToChatHistory(text, false);
            if (elements.responseArea) elements.responseArea.style.display = 'none';
        }
        if (actionKeys.length) showQuickActions(actionKeys);
        if (onComplete) onComplete();
    });
}

function finishTyping(text) {
    state.currentTypingText = null;
    addToChatHistory(text, false);
    if (elements.responseArea) elements.responseArea.style.display = 'none';
    if (elements.responseText) elements.responseText.innerHTML = '';
}

function showQuickActions(keys) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-message ai quick-actions-wrapper';
    const div = document.createElement('div');
    div.className = 'quick-actions';
    keys.forEach(key => {
        const action = CONFIG.quickActions[key];
        if (action) {
            const a = document.createElement('a');
            a.href = action.href;
            a.className = 'quick-action-btn';
            a.target = '_blank';
            a.rel = 'noopener';
            a.innerHTML = `<i class="${action.brand ? 'fab' : 'fas'} ${action.icon}"></i> ${action.text}`;
            div.appendChild(a);
        }
    });
    wrapper.appendChild(div);
    elements.chatHistory?.appendChild(wrapper);
    scrollToBottom();
    requestAnimationFrame(() => div.classList.add('visible'));
}

function typeText(text, onComplete = null) {
    if (state.typingTimeoutId) { clearTimeout(state.typingTimeoutId); state.typingTimeoutId = null; }
    if (!elements.responseText) { if (onComplete) onComplete(); return; }
    
    elements.responseText.innerHTML = '<span class="cursor">|</span>';
    const cursor = elements.responseText.querySelector('.cursor');
    const chars = text.split('');
    let i = 0;
    
    const type = () => {
        if (i < chars.length) {
            const c = chars[i];
            const span = document.createElement('span');
            span.className = 'char';
            span.innerHTML = c === '\n' ? '<br>' : c === ' ' ? ' ' : c;
            elements.responseText.insertBefore(span, cursor);
            i++;
            if (elements.responseArea) elements.responseArea.scrollTop = elements.responseArea.scrollHeight;
            state.typingTimeoutId = setTimeout(type, '.!?'.includes(c) ? 80 : ',;:'.includes(c) ? 40 : 12);
        } else {
            cursor?.remove();
            state.typingTimeoutId = null;
            if (onComplete) onComplete();
        }
    };
    type();
}

function addApprovalButtons(toolCall) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-message ai';
    const div = document.createElement('div');
    div.className = 'tool-approval-buttons';
    
    const labels = { send_documents: '<i class="fas fa-file-pdf"></i> Send Documents', schedule_meeting: '<i class="fas fa-calendar-alt"></i> Schedule Meeting' };
    
    const approveBtn = document.createElement('button');
    approveBtn.className = 'btn btn-approve';
    approveBtn.innerHTML = labels[toolCall.function] || '<i class="fas fa-check"></i> Proceed';
    approveBtn.onclick = async () => {
        const tool = state.pendingToolCall;
        if (!tool) return;
        div.innerHTML = '<span style="opacity:0.6"><i class="fas fa-spinner fa-spin"></i> Processing...</span>';
        setThinkingState(true);
        state.pendingToolCall = null;
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: '', history: state.conversationHistory.slice(-4), toolExecutionData: tool })
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setThinkingState(false);
            state.conversationHistory.push({ role: 'assistant', content: data.response });
            displayResponse(data.response, [], () => {
                if (data.schedulingUrl) addSchedulingCard(data.schedulingUrl, data.eventName, data.duration);
            });
        } catch {
            setThinkingState(false);
            displayResponse("I had trouble with that. Please try again.", []);
        }
    };
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
    cancelBtn.onclick = () => {
        state.pendingToolCall = null;
        div.innerHTML = '<span style="opacity:0.6">Cancelled</span>';
        const msg = "No problem! Let me know if you need anything else.";
        addToChatHistory(msg, false);
        state.conversationHistory.push({ role: 'assistant', content: msg });
    };
    
    div.appendChild(approveBtn);
    div.appendChild(cancelBtn);
    wrapper.appendChild(div);
    elements.chatHistory?.appendChild(wrapper);
    scrollToBottom();
}

function addSchedulingCard(url, eventName, duration) {
    const card = document.createElement('div');
    card.className = 'chat-message ai scheduling-card';
    card.innerHTML = `
        <div class="message-content">
            <div class="scheduling-card-header"><i class="fas fa-calendar-alt"></i><h3>${eventName || 'Schedule a Meeting'}</h3></div>
            ${duration ? `<p class="scheduling-duration">${duration} minutes</p>` : ''}
            <a href="${url}" target="_blank" rel="noopener" class="scheduling-link-btn"><i class="fas fa-external-link-alt"></i> Open Calendar</a>
            <button class="copy-link-btn" onclick="copySchedulingLink('${url}')"><i class="fas fa-copy"></i> Copy Link</button>
        </div>
    `;
    elements.chatHistory?.appendChild(card);
    scrollToBottom();
    setTimeout(() => card.classList.add('visible'), 100);
}

window.copySchedulingLink = url => {
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.querySelector('.copy-link-btn');
        if (!btn) return;
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2000);
    }).catch(() => {});
};
