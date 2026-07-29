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
  // Les conteneurs .stagger numérotent leurs enfants pour que la CSS échelonne
  // les entrées. Le rang vit dans une variable CSS : c'est la feuille de style
  // qui décide du rythme, le script se contente de compter.
  document.querySelectorAll('.stagger').forEach(box => {
    Array.from(box.children).forEach((child, i) => {
      child.style.setProperty('--i', i);
    });
  });

  const revealEls = document.querySelectorAll('.reveal, .stagger');

  // Ces éléments démarrent à opacity:0 : si la révélation ne se produit pas,
  // le contenu reste invisible. On ne laisse donc jamais ce cas au hasard.
  const revealAll = () => revealEls.forEach(el => el.classList.add('in-view'));

  if (!('IntersectionObserver' in window)){
    // Navigateur trop ancien : on affiche tout, sans effet.
    revealAll();
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold:0.15, rootMargin:'0px 0px -60px 0px'});
    revealEls.forEach(el => revealObserver.observe(el));

    // Filet de sécurité : si au bout de 2,5 s un élément déjà présent à l'écran
    // n'a toujours pas été révélé, c'est que l'observateur n'a pas fait son
    // travail. On le révèle nous-mêmes plutôt que de laisser un blanc.
    setTimeout(() => {
      revealEls.forEach(el => {
        if (el.classList.contains('in-view')) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in-view');
      });
    }, 2500);
  }

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
  let ringX = 0, ringY = 0, mouseX = 0, mouseY = 0, ringFrame = null;
  // L'anneau rattrape le curseur par interpolation. La boucle ne tourne que
  // pendant ce rattrapage : une fois l'anneau arrivé, elle s'arrête et ne
  // repart qu'au prochain mouvement. Sans ce garde-fou, un requestAnimationFrame
  // tournerait en continu même souris immobile — CPU et batterie pour rien.
  const animateRing = () => {
    const dx = mouseX - ringX, dy = mouseY - ringY;
    ringX += dx * 0.18;
    ringY += dy * 0.18;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      ringFrame = requestAnimationFrame(animateRing);
    } else {
      ringFrame = null;
    }
  };
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
    if (ringFrame === null) ringFrame = requestAnimationFrame(animateRing);
  });
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

  // ---- compte à rebours vers le prochain salon ----
  // La date cible vit dans le HTML (data-countdown), pas ici : la personne qui
  // met le site à jour n'a qu'un attribut à changer, jamais de JavaScript.
  document.querySelectorAll('[data-countdown]').forEach(box => {
    const target = new Date(box.dataset.countdown).getTime();
    if (isNaN(target)) return;

    const slots = {
      days: box.querySelector('[data-cd="days"]'),
      hours: box.querySelector('[data-cd="hours"]'),
      mins: box.querySelector('[data-cd="mins"]'),
      secs: box.querySelector('[data-cd="secs"]')
    };
    const grid = box.querySelector('.cd-grid');
    const past = box.querySelector('.cd-past');
    const pad = n => String(n).padStart(2, '0');

    const tick = () => {
      const left = target - Date.now();
      // Salon passé : on cesse de compter plutôt que d'afficher des négatifs.
      if (left <= 0){
        if (grid) grid.hidden = true;
        if (past) past.hidden = false;
        clearInterval(timer);
        return;
      }
      const s = Math.floor(left / 1000);
      if (slots.days) slots.days.textContent = Math.floor(s / 86400);
      if (slots.hours) slots.hours.textContent = pad(Math.floor(s / 3600) % 24);
      if (slots.mins) slots.mins.textContent = pad(Math.floor(s / 60) % 60);
      if (slots.secs) slots.secs.textContent = pad(s % 60);
    };

    tick();
    const timer = setInterval(tick, 1000);
  });

  // ---- relevé de veille : filtres par catégorie ----
  // Les boutons sont déduits des data-cat réellement présentes dans la page.
  // Ajouter une entrée dans une nouvelle catégorie fait apparaître son filtre
  // sans toucher au code — c'est la page qui se décrit elle-même.
  const register = document.getElementById('register');
  const filterBar = document.getElementById('filters');
  if (register && filterBar){
    const LABELS = {
      sciage:'Sciage',
      sechage:'Séchage',
      energie:'Bois énergie',
      automatisation:'Automatisation',
      evenements:'Événements',
      entreprise:'Entreprise'
    };
    const entries = Array.from(register.querySelectorAll('.entry'));
    const countEl = document.getElementById('entry-count');
    const emptyEl = document.getElementById('register-empty');

    const present = [];
    entries.forEach(en => {
      const c = en.dataset.cat;
      if (c && present.indexOf(c) === -1) present.push(c);
    });

    const makeBtn = (value, label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'filter-btn';
      b.dataset.filter = value;
      b.textContent = label;
      b.setAttribute('aria-pressed', value === 'all' ? 'true' : 'false');
      return b;
    };

    filterBar.appendChild(makeBtn('all', 'Tout'));
    present.forEach(c => filterBar.appendChild(makeBtn(c, LABELS[c] || c)));

    const apply = (value) => {
      let shown = 0;
      entries.forEach(en => {
        const match = (value === 'all' || en.dataset.cat === value);
        en.hidden = !match;
        if (match) shown++;
      });
      filterBar.querySelectorAll('.filter-btn').forEach(b => {
        b.setAttribute('aria-pressed', String(b.dataset.filter === value));
      });
      if (emptyEl) emptyEl.hidden = shown > 0;
      if (countEl){
        countEl.textContent = shown + (shown > 1 ? ' entrées' : ' entrée');
      }
    };

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (btn) apply(btn.dataset.filter);
    });

    apply('all');
  }