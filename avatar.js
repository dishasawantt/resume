const videoGreeting = document.getElementById('video-greeting');
const videoIdle = document.getElementById('video-idle');
const videoGoodbye = document.getElementById('video-goodbye');
const responseArea = document.getElementById('response-area');
const responseText = document.getElementById('response-text');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceToggle = document.getElementById('voice-toggle');
const micBtn = document.getElementById('mic-btn');
const waveformCanvas = document.getElementById('waveform');
const suggestions = document.getElementById('suggestions');
const suggestionBtns = document.querySelectorAll('.suggestion-btn');
const avatarName = document.getElementById('avatar-name');
const themeToggle = document.getElementById('theme-toggle');
const avatarContent = document.querySelector('.avatar-content');
const chatHistory = document.getElementById('chat-history');
const voiceSelector = document.getElementById('voice-selector');
const voiceSelectorToggle = document.getElementById('voice-selector-toggle');
const voiceDropdownClose = document.getElementById('voice-dropdown-close');
const voiceSelect = document.getElementById('voice-select');
const voicePreviewBtn = document.getElementById('voice-preview-btn');

let currentVideo = null;
let isProcessing = false;
let voiceEnabled = true;
let conversationHistory = [];
let speechSynthesis = window.speechSynthesis;
let preferredVoice = null;
let allVoices = [];
let isHorizontalLayout = false;
let messageCount = 0;
let recognition = null;
let isListening = false;
let waveformAnimationId = null;
let lastAiResponse = '';
let hasPlayedGoodbye = false;

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
        "Easter egg unlocked! Here is something not on my resume: I can solve a Rubik's cube.",
        "Secret discovered! Did you know this entire avatar experience was built with vanilla JavaScript?",
        "Hidden message found! When I'm not coding, you'll find me painting watercolors or singing bhajans."
    ]
};

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

function setupThemeToggle() {
    const savedTheme = localStorage.getItem('avatarTheme') || 'dark';
    if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('avatarTheme', newTheme);
    });
}

function switchToHorizontalLayout() {
    if (isHorizontalLayout) return;
    isHorizontalLayout = true;
    avatarContent.classList.add('horizontal');
}

function addToChatHistory(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'ai'}`;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = message.replace(/\n/g, '<br>');
    messageDiv.appendChild(contentDiv);
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function getGreetingMessage() {
    const hour = new Date().getHours();
    const timeGreeting = hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 17 ? "Good afternoon" : hour >= 17 && hour < 21 ? "Good evening" : "Hello";
    return `${timeGreeting} and Namaste, I am Disha. Feel free to ask me anything about my background, projects, or experience.`;
}

function setupRotatingSuggestions() {
    const starters = [
        [{ text: "About Me", query: "Tell me about yourself" }, { text: "Experience", query: "What is your work experience?" }, { text: "Projects", query: "What projects have you worked on?" }, { text: "Skills", query: "What are your technical skills?" }],
        [{ text: "Education", query: "What is your educational background?" }, { text: "AI Work", query: "Tell me about your AI and machine learning experience" }, { text: "Certifications", query: "What certifications do you have?" }, { text: "Contact", query: "How can I contact you?" }],
        [{ text: "Recent Role", query: "Tell me about your most recent job" }, { text: "Tech Stack", query: "What technologies do you work with?" }, { text: "Robotics", query: "Tell me about your robotics projects" }, { text: "Interests", query: "What are you passionate about?" }]
    ];
    const randomSet = starters[Math.floor(Math.random() * starters.length)];
    suggestions.querySelectorAll('.suggestion-btn').forEach((btn, i) => {
        if (randomSet[i]) { btn.textContent = randomSet[i].text; btn.setAttribute('data-query', randomSet[i].query); }
    });
}

function loadPreferredVoice() {
    const loadVoices = () => {
        allVoices = speechSynthesis.getVoices();
        populateVoiceSelector(allVoices);
        const savedVoiceName = localStorage.getItem('preferredVoice');
        if (savedVoiceName) {
            const savedVoice = allVoices.find(v => v.name === savedVoiceName);
            if (savedVoice) { preferredVoice = savedVoice; voiceSelect.value = savedVoiceName; return; }
        }
        const preferredNames = ['Samantha', 'Karen', 'Google US English Female', 'Microsoft Zira', 'Fiona'];
        for (const name of preferredNames) {
            const found = allVoices.find(v => v.name.includes(name));
            if (found) { preferredVoice = found; voiceSelect.value = found.name; break; }
        }
        if (!preferredVoice) {
            preferredVoice = allVoices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) || allVoices.find(v => v.lang.startsWith('en')) || allVoices[0];
            if (preferredVoice) voiceSelect.value = preferredVoice.name;
        }
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
}

function populateVoiceSelector(voices) {
    voiceSelect.innerHTML = '';
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const otherVoices = voices.filter(v => !v.lang.startsWith('en'));
    if (englishVoices.length) {
        const engGroup = document.createElement('optgroup');
        engGroup.label = 'English Voices';
        englishVoices.forEach(v => { const o = document.createElement('option'); o.value = v.name; o.textContent = `${v.name} (${v.lang})`; engGroup.appendChild(o); });
        voiceSelect.appendChild(engGroup);
    }
    if (otherVoices.length) {
        const otherGroup = document.createElement('optgroup');
        otherGroup.label = 'Other Languages';
        otherVoices.forEach(v => { const o = document.createElement('option'); o.value = v.name; o.textContent = `${v.name} (${v.lang})`; otherGroup.appendChild(o); });
        voiceSelect.appendChild(otherGroup);
    }
}

function setupVoiceSelector() {
    if (!voiceSelectorToggle) return;
    voiceSelectorToggle.addEventListener('click', () => voiceSelector.classList.toggle('open'));
    voiceDropdownClose.addEventListener('click', () => voiceSelector.classList.remove('open'));
    document.addEventListener('click', (e) => { if (!voiceSelector.contains(e.target)) voiceSelector.classList.remove('open'); });
    voiceSelect.addEventListener('change', () => {
        const selectedVoice = allVoices.find(v => v.name === voiceSelect.value);
        if (selectedVoice) { preferredVoice = selectedVoice; localStorage.setItem('preferredVoice', voiceSelect.value); }
    });
    voicePreviewBtn.addEventListener('click', () => speak("Hello, this is how I will sound when speaking."));
}

function speak(text) {
    if (!voiceEnabled || !text) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = preferredVoice;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => startWaveformAnimation();
    utterance.onend = () => stopWaveformAnimation();
    speechSynthesis.speak(utterance);
}

function setupVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        if (micBtn) micBtn.style.display = 'none';
        return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => { isListening = true; micBtn?.classList.add('listening'); userInput.placeholder = 'Listening...'; };
    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
        userInput.value = transcript;
        if (event.results[event.results.length - 1].isFinal) { stopListening(); handleSend(); }
    };
    recognition.onerror = () => stopListening();
    recognition.onend = () => stopListening();
}

function startListening() {
    if (!recognition || isListening || isProcessing) return;
    try { recognition.start(); } catch (e) { console.error('Could not start recognition:', e); }
}

function stopListening() {
    isListening = false;
    micBtn?.classList.remove('listening');
    userInput.placeholder = 'Ask me anything...';
    try { recognition?.stop(); } catch (e) {}
}

function startWaveformAnimation() {
    if (!waveformCanvas) return;
    const ctx = waveformCanvas.getContext('2d');
    const bufferLength = 64;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
        waveformAnimationId = requestAnimationFrame(draw);
        for (let i = 0; i < bufferLength; i++) dataArray[i] = Math.random() * 100 + 50;
        const { width, height } = waveformCanvas;
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
    waveformCanvas.classList.add('active');
    draw();
}

function stopWaveformAnimation() {
    if (waveformAnimationId) { cancelAnimationFrame(waveformAnimationId); waveformAnimationId = null; }
    if (waveformCanvas) {
        waveformCanvas.classList.remove('active');
        waveformCanvas.getContext('2d').clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    }
}

function switchVideo(videoElement, loop = false) {
    [videoGreeting, videoIdle, videoGoodbye].forEach(v => { if (v !== videoElement) { v.classList.remove('active'); v.pause(); } });
    videoElement.classList.add('active');
    videoElement.loop = loop;
    videoElement.muted = true;
    videoElement.currentTime = 0;
    videoElement.play().catch(() => document.addEventListener('click', () => videoElement.play(), { once: true }));
    currentVideo = videoElement;
}

function playGreeting() {
    const greetingMessage = getGreetingMessage();
    const greetingText = document.querySelector('.greeting-text');
    if (greetingText) greetingText.textContent = greetingMessage;
    const startVideo = () => {
        switchVideo(videoGreeting, true);
        setTimeout(() => displayResponse(greetingMessage), 500);
    };
    if (videoGreeting.readyState >= 3) startVideo();
    else videoGreeting.addEventListener('canplay', startVideo, { once: true });
}

function playIdle() { switchVideo(videoIdle, true); }
function playGoodbye() { switchVideo(videoGoodbye, false); displayResponse("Thank you for visiting. Goodbye!"); }

function setupEventListeners() {
    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
    voiceToggle.addEventListener('click', toggleVoice);
    micBtn?.addEventListener('click', () => isListening ? stopListening() : startListening());
    suggestionBtns.forEach(btn => btn.addEventListener('click', () => { userInput.value = btn.getAttribute('data-query'); handleSend(); }));
}

function toggleVoice() {
    voiceEnabled = !voiceEnabled;
    voiceToggle.classList.toggle('muted', !voiceEnabled);
    if (!voiceEnabled) { speechSynthesis.cancel(); stopWaveformAnimation(); }
}

function handlePageLeave() {
    document.querySelector('.close-btn').addEventListener('click', (e) => {
        e.preventDefault();
        if (!hasPlayedGoodbye) { hasPlayedGoodbye = true; playGoodbye(); setTimeout(() => window.location.href = 'index.html', 2500); }
    });
    window.addEventListener('pagehide', () => { speechSynthesis.cancel(); stopWaveformAnimation(); });
    window.addEventListener('beforeunload', () => { speechSynthesis.cancel(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { speechSynthesis.cancel(); stopWaveformAnimation(); } });
}

async function handleSend() {
    const message = userInput.value.trim();
    if (!message || isProcessing) return;
    isProcessing = true;
    sendBtn.disabled = true;
    userInput.value = '';
    messageCount++;

    if (messageCount === 1) {
        const currentGreeting = responseText.textContent;
        if (currentGreeting) { addToChatHistory(currentGreeting, false); lastAiResponse = currentGreeting; }
        switchToHorizontalLayout();
        if (currentVideo === videoGreeting) switchVideo(videoIdle, true);
    } else if (lastAiResponse) addToChatHistory(lastAiResponse, false);

    addToChatHistory(message, true);
    suggestions.style.display = 'none';

    const easterEggResponse = checkEasterEgg(message);
    if (easterEggResponse) {
        setThinkingState(true);
        await delay(800);
        setThinkingState(false);
        displayResponse(easterEggResponse, []);
        lastAiResponse = easterEggResponse;
        isProcessing = false;
        sendBtn.disabled = false;
        return;
    }

    setThinkingState(true);
    conversationHistory.push({ role: 'user', content: message });

    try {
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history: conversationHistory.slice(-10) })
        });
        if (!response.ok) throw new Error('Request failed');
        const data = await response.json();
        const botResponse = data.response || "I apologize, but I could not process that request.";
        conversationHistory.push({ role: 'assistant', content: botResponse });
        setThinkingState(false);
        displayResponse(botResponse, getContextualActions(message, botResponse));
        lastAiResponse = botResponse;
    } catch (error) {
        console.error('Error:', error);
        setThinkingState(false);
        const errorMsg = "I am having trouble connecting at the moment. Please try again or reach out via email at dishasawantt@gmail.com.";
        displayResponse(errorMsg, ['email']);
        lastAiResponse = errorMsg;
    } finally {
        isProcessing = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function checkEasterEgg(message) {
    const lower = message.toLowerCase();
    if (easterEggs.triggers.some(t => lower.includes(t))) return easterEggs.responses[Math.floor(Math.random() * easterEggs.responses.length)];
    return null;
}

function getContextualActions(userMessage, botResponse) {
    const lower = (userMessage + ' ' + botResponse).toLowerCase();
    const actions = [];
    if (lower.includes('resume') || lower.includes('cv') || lower.includes('hire')) actions.push('resume');
    if (lower.includes('project') || lower.includes('code') || lower.includes('github')) actions.push('github', 'projects');
    if (lower.includes('contact') || lower.includes('reach') || lower.includes('connect') || lower.includes('interview')) actions.push('email', 'linkedin');
    if (lower.includes('linkedin') || lower.includes('network')) actions.push('linkedin');
    return [...new Set(actions)].slice(0, 2);
}

function setThinkingState(thinking) {
    if (thinking) {
        avatarName.classList.add('thinking');
        responseText.innerHTML = '<div class="thinking-indicator"><span>Thinking</span><div class="thinking-dots"><span></span><span></span><span></span></div></div>';
        playIdle();
    } else {
        avatarName.classList.remove('thinking');
    }
}

function displayResponse(text, actionKeys = []) {
    const onComplete = () => { if (actionKeys.length) showQuickActions(actionKeys); };
    if (voiceEnabled) speak(text);
    typeText(text, onComplete);
    responseArea.scrollTop = 0;
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
    responseText.innerHTML = '<span class="cursor">|</span>';
    document.querySelector('.quick-actions')?.remove();
    const cursor = responseText.querySelector('.cursor');
    const chars = text.split('');
    let i = 0;
    const typeChar = () => {
        if (i < chars.length) {
            const char = chars[i];
            const span = document.createElement('span');
            span.className = 'char';
            span.innerHTML = char === '\n' ? '<br>' : char === ' ' ? ' ' : char;
            responseText.insertBefore(span, cursor);
            i++;
            responseArea.scrollTop = responseArea.scrollHeight;
            const delay = '.!?'.includes(char) ? 150 : ',;:'.includes(char) ? 80 : 25;
            setTimeout(typeChar, delay);
        } else {
            cursor.remove();
            if (onComplete) onComplete();
        }
    };
    typeChar();
}

function preloadVideos() { [videoGreeting, videoIdle, videoGoodbye].forEach(v => { v.muted = true; v.volume = 0; v.load(); }); }
