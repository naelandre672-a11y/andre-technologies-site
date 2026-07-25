  // header compact au scroll
  const header = document.getElementById('site-header');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // menu mobile plein écran
  const burger = document.getElementById('burger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      burger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // lien actif selon la section visible (uniquement si la page a ces sections)
  const sections = ['industrie','energie','etudes','pourquoi'].map(id => document.getElementById(id)).filter(Boolean);
  const navLinks = document.querySelectorAll('.nav-link[data-target]');
  const setActive = () => {
    if (sections.length === 0) return;
    let current = null;
    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom >= 120) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.target === current);
    });
  };
  document.addEventListener('scroll', setActive, {passive:true});
  setActive();

  // reveal au scroll
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold:0.15, rootMargin:'0px 0px -60px 0px'});
  revealEls.forEach(el => revealObserver.observe(el));

  // compteurs animés
  const counters = document.querySelectorAll('.stat-num');
  const animateCount = (el) => {
    if (el.dataset.static){ el.textContent = el.dataset.static; return; }
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, {threshold:0.5});
  counters.forEach(c => counterObserver.observe(c));

  // showcase interactif (ligne de process)
  const showcaseSteps = document.querySelectorAll('.showcase-step');
  const showcaseImgs = document.querySelectorAll('.showcase-visual img');
  showcaseSteps.forEach(step => {
    step.addEventListener('click', () => {
      showcaseSteps.forEach(s => s.classList.remove('active'));
      step.classList.add('active');
      const idx = step.dataset.img;
      showcaseImgs.forEach(img => img.classList.remove('active'));
      showcaseImgs[idx].classList.add('active');
    });
  });

  // boutons magnétiques
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0,0)';
    });
  });

  // curseur personnalisé
  const cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  const cursorRing = document.createElement('div');
  cursorRing.className = 'cursor-ring';
  document.body.append(cursorDot, cursorRing);
  let ringX = 0, ringY = 0, mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
  });
  const animateRing = () => {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
    requestAnimationFrame(animateRing);
  };
  animateRing();
  document.querySelectorAll('a, button, .tilt, .showcase-step').forEach(el => {
    el.addEventListener('mouseenter', () => { cursorDot.classList.add('hovering'); cursorRing.classList.add('hovering'); });
    el.addEventListener('mouseleave', () => { cursorDot.classList.remove('hovering'); cursorRing.classList.remove('hovering'); });
  });

  // hero : spotlight qui révèle une vue rapprochée au survol
  const heroSection = document.getElementById('hero-spotlight');
  const revealLayer = document.getElementById('reveal-layer');
  const revealTag = document.getElementById('reveal-tag');
  if (heroSection){
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      revealLayer.style.webkitMaskPosition = `${x - 170}px ${y - 170}px`;
      revealLayer.style.maskPosition = `${x - 170}px ${y - 170}px`;
      revealTag.style.left = (x + 24) + 'px';
      revealTag.style.top = (y + 24) + 'px';
    });
  }

  // tilt 3D au survol des cartes
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(700px) rotateX(${-py * 8}deg) rotateY(${px * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateY(0)';
    });
  });