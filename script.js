window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) setTimeout(() => loader.classList.add('hidden'), 2000);
    updateActiveNavLink();
});

const scrollProgress = document.getElementById('scroll-progress');
const updateScrollProgress = () => {
    if (scrollProgress) scrollProgress.style.width = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100 + '%';
};

const canvas = document.getElementById('particles-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseParticle = { x: 0, y: 0 };
    
    const resizeCanvas = () => { canvas.width = canvas.parentElement.offsetWidth; canvas.height = canvas.parentElement.offsetHeight; };
    
    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.color = Math.random() > 0.5 ? 'rgba(247, 206, 104,' : 'rgba(212, 132, 106,';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            const dx = mouseParticle.x - this.x, dy = mouseParticle.y - this.y;
            if (Math.sqrt(dx * dx + dy * dy) < 100) { this.x -= dx * 0.02; this.y -= dy * 0.02; }
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color + this.opacity + ')';
            ctx.fill();
        }
    }
    
    const initParticles = () => { particles = Array.from({ length: 80 }, () => new Particle()); };
    
    const connectParticles = () => {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(212, 132, 106, ${0.1 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    };
    
    const animateParticles = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        connectParticles();
        requestAnimationFrame(animateParticles);
    };
    
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouseParticle.x = e.clientX - rect.left;
        mouseParticle.y = e.clientY - rect.top;
    });
    
    resizeCanvas();
    initParticles();
    animateParticles();
    window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });
}

const addTiltEffect = (selector, intensity = 15) => {
    document.querySelectorAll(selector).forEach(el => {
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            el.style.transform = `perspective(1000px) rotateX(${y * intensity}deg) rotateY(${x * -intensity}deg) translateZ(10px)`;
        });
        el.addEventListener('mouseleave', () => el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)');
    });
};

addTiltEffect('.project-card');
addTiltEffect('.certification-card', 10);

document.querySelectorAll('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - rect.left - rect.width / 2) * 0.3}px, ${(e.clientY - rect.top - rect.height / 2) * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => btn.style.transform = 'translate(0, 0)');
});

const animateSkillBars = () => {
    document.querySelectorAll('.skill-progress').forEach(bar => {
        bar.style.setProperty('--progress', bar.getAttribute('data-progress') + '%');
        bar.classList.add('animate');
    });
};

const testimonialCards = document.querySelectorAll('.testimonial-card');
const dots = document.querySelectorAll('.testimonial-dots .dot');
let currentTestimonial = 0, isPaused = false;

const showTestimonial = index => {
    testimonialCards.forEach((card, i) => {
        card.classList.toggle('active', i === index);
        if (dots[i]) dots[i].classList.toggle('active', i === index);
    });
};

if (testimonialCards.length > 1) {
    setInterval(() => { if (!isPaused) { currentTestimonial = (currentTestimonial + 1) % testimonialCards.length; showTestimonial(currentTestimonial); } }, 4000);
    document.querySelector('.testimonial-btn.prev')?.addEventListener('click', () => { currentTestimonial = (currentTestimonial - 1 + testimonialCards.length) % testimonialCards.length; showTestimonial(currentTestimonial); });
    document.querySelector('.testimonial-btn.next')?.addEventListener('click', () => { currentTestimonial = (currentTestimonial + 1) % testimonialCards.length; showTestimonial(currentTestimonial); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { currentTestimonial = i; showTestimonial(i); }));
    const ts = document.querySelector('.testimonials');
    if (ts) { ts.addEventListener('mouseenter', () => isPaused = true); ts.addEventListener('mouseleave', () => isPaused = false); }
}

const skillsSection = document.querySelector('.skills');
if (skillsSection) {
    const skillsObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) { animateSkillBars(); skillsObserver.unobserve(entry.target); } });
    }, { threshold: 0.3 });
    skillsObserver.observe(skillsSection);
}

const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;
const backToTop = document.getElementById('back-to-top');

const initTheme = () => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
    updateThemeIcon();
};

const updateThemeIcon = () => {
    const icon = themeToggle?.querySelector('i');
    if (icon) icon.className = html.getAttribute('data-theme') === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
};

themeToggle?.addEventListener('click', () => {
    const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
    updateNavbarBackground();
});

initTheme();

backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const projectCards = document.querySelectorAll('.project-card');
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        projectCards.forEach((card, i) => {
            const match = filter === 'all' || card.getAttribute('data-category') === filter;
            card.classList.toggle('hidden', !match);
            if (match) card.style.animation = `fadeInUp 0.5s ease ${i * 0.1}s forwards`;
        });
    });
});

navToggle?.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const bars = navToggle.querySelectorAll('.bar');
    bars.forEach((bar, i) => {
        if (navMenu.classList.contains('active')) {
            bar.style.transform = i === 0 ? 'rotate(-45deg) translate(-5px, 6px)' : i === 2 ? 'rotate(45deg) translate(-5px, -6px)' : 'none';
            bar.style.opacity = i === 1 ? '0' : '1';
        } else { bar.style.transform = 'none'; bar.style.opacity = '1'; }
    });
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu?.classList.remove('active');
        navToggle?.querySelectorAll('.bar').forEach(bar => { bar.style.transform = 'none'; bar.style.opacity = '1'; });
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
    });
});

const updateActiveNavLink = () => {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(section => { if (section.getBoundingClientRect().top <= 100) current = section.getAttribute('id'); });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
};

const updateNavbarBackground = () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const scrolled = window.scrollY > 100;
    navbar.style.background = scrolled 
        ? (isDark ? 'rgba(26, 22, 20, 0.98)' : 'rgba(253, 249, 245, 0.98)')
        : (isDark ? 'rgba(26, 22, 20, 0.85)' : 'rgba(253, 249, 245, 0.85)');
    navbar.style.boxShadow = scrolled ? '0 2px 20px rgba(0, 0, 0, 0.15)' : '0 2px 20px rgba(0, 0, 0, 0.1)';
};

window.addEventListener('scroll', () => {
    updateActiveNavLink();
    updateNavbarBackground();
    backToTop?.classList.toggle('visible', window.scrollY > 500);
    updateScrollProgress();
});

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', e => {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            const easterEgg = document.getElementById('easter-egg');
            if (easterEgg) { easterEgg.classList.add('active'); document.body.style.overflow = 'hidden'; }
            konamiIndex = 0;
        }
    } else konamiIndex = 0;
    
    if (e.key === 'Escape' && navMenu?.classList.contains('active')) {
        navMenu.classList.remove('active');
        navToggle?.querySelectorAll('.bar').forEach(bar => { bar.style.transform = 'none'; bar.style.opacity = '1'; });
    }
});

document.getElementById('close-easter')?.addEventListener('click', () => {
    document.getElementById('easter-egg')?.classList.remove('active');
    document.body.style.overflow = '';
});

document.getElementById('contact-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const fd = new FormData(this);
    window.location.href = `mailto:dishasawantt@gmail.com?subject=${encodeURIComponent(fd.get('subject'))}&body=${encodeURIComponent(`Name: ${fd.get('name')}\nEmail: ${fd.get('email')}\n\nMessage:\n${fd.get('message')}`)}`;
    showNotification('Thank you! Your email client should open now.', 'success');
    this.reset();
});

const showNotification = (message, type = 'info') => {
    document.querySelector('.notification')?.remove();
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<div class="notification-content"><span>${message}</span><button class="notification-close">&times;</button></div>`;
    Object.assign(notification.style, {
        position: 'fixed', top: '100px', right: '20px',
        background: type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: 'white', padding: '1rem 1.5rem', borderRadius: '15px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        zIndex: '10000', transform: 'translateX(400px)', transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)', maxWidth: '350px'
    });
    notification.querySelector('.notification-content').style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 1rem;';
    notification.querySelector('.notification-close').style.cssText = 'background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1;';
    document.body.appendChild(notification);
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    });
    setTimeout(() => { if (notification.parentNode) { notification.style.transform = 'translateX(400px)'; setTimeout(() => notification.remove(), 300); } }, 5000);
};

document.querySelectorAll('.contact-item a').forEach(link => {
    if (link.href.startsWith('mailto:') || link.href.startsWith('tel:')) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const text = this.href.replace(/^mailto:|^tel:/, '');
            navigator.clipboard?.writeText(text).then(() => showNotification(`${text} copied!`, 'success'));
            setTimeout(() => window.location.href = this.href, 1000);
        });
    }
});

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('animate'); });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.timeline-item, .project-card, .certification-card, .skills-column').forEach(el => observer.observe(el));

document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    if (img.complete) img.classList.add('loaded');
    else img.addEventListener('load', () => img.classList.add('loaded'));
});

document.querySelectorAll('.skill-bar-item').forEach(item => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'progressbar');
    const progress = item.querySelector('.skill-progress');
    if (progress) {
        item.setAttribute('aria-valuenow', progress.getAttribute('data-progress'));
        item.setAttribute('aria-valuemin', '0');
        item.setAttribute('aria-valuemax', '100');
    }
});

let isHeroImageHovered = false;
const heroImageEl = document.querySelector('.image-container');
if (heroImageEl) {
    heroImageEl.addEventListener('mouseenter', () => { isHeroImageHovered = true; heroImageEl.style.transform = 'rotate(0deg)'; });
    heroImageEl.addEventListener('mouseleave', () => { isHeroImageHovered = false; heroImageEl.style.transform = 'rotate(-5deg)'; });
}

window.addEventListener('mousemove', e => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    document.querySelectorAll('.blob').forEach((blob, i) => {
        blob.style.transform = `translate(${x * (i + 1) * 20}px, ${y * (i + 1) * 20}px)`;
    });
    if (heroImageEl && window.scrollY < window.innerHeight && !isHeroImageHovered) {
        heroImageEl.style.transform = `rotate(-5deg) translate(${x * 15}px, ${y * 15}px)`;
    }
});

document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        Object.assign(ripple.style, {
            position: 'absolute', background: 'rgba(255, 255, 255, 0.3)', borderRadius: '50%',
            transform: 'scale(0)', animation: 'ripple 0.6s linear', pointerEvents: 'none',
            left: `${e.clientX - rect.left - 50}px`, top: `${e.clientY - rect.top - 50}px`,
            width: '100px', height: '100px'
        });
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
});

const style = document.createElement('style');
style.textContent = '@keyframes ripple { to { transform: scale(4); opacity: 0; } }';
document.head.appendChild(style);
