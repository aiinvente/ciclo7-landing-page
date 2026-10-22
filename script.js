(() => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#menu-principal');
  const mobile = window.matchMedia('(max-width: 1100px)');
  const setMenu = (open, restoreFocus = false) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (restoreFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (toggle.getAttribute('aria-expanded') === 'true' && !menu.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
  });
  mobile.addEventListener('change', () => setMenu(false));
  document.querySelector('#ano-atual').textContent = new Date().getFullYear();
})();

(() => {
  const hero = document.querySelector('.hero');
  const slides = [...hero.querySelectorAll('.hero-media .hero-photo')];
  const controls = hero.querySelector('.hero-controls');
  const dots = [...controls.querySelectorAll('.hero-dot')];
  const pause = controls.querySelector('.hero-pause');
  const pauseIcon = pause.querySelector('path');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const interval = 20000;
  let current = 0;
  let paused = false;
  let inView = true;
  let timer;
  let cleanup;
  let requestId = 0;

  const updateControls = () => {
    dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === current);
      dot.setAttribute('aria-pressed', String(index === current));
    });
    pause.disabled = motion.matches;
    pause.setAttribute('aria-pressed', String(paused || motion.matches));
    pause.setAttribute('aria-label', motion.matches ? 'Troca automática desativada por preferência de movimento reduzido' : paused ? 'Retomar troca de imagens' : 'Pausar troca de imagens');
    pauseIcon.setAttribute('d', paused || motion.matches ? 'm9 5 11 7-11 7V5Z' : 'M9 5v14M15 5v14');
  };

  const show = async index => {
    if (index === current) return;
    const request = ++requestId;
    try {
      await slides[index].decode();
    } catch {
      return;
    }
    if (request !== requestId) return;
    clearTimeout(cleanup);
    slides.forEach(slide => slide.classList.remove('is-previous'));
    slides[current].classList.replace('is-active', 'is-previous');
    current = index;
    slides[current].classList.add('is-active');
    cleanup = setTimeout(() => slides.forEach(slide => slide.classList.remove('is-previous')), motion.matches ? 0 : 2000);
    updateControls();
  };

  const syncTimer = () => {
    clearTimeout(timer);
    if (!paused && !motion.matches && !document.hidden && inView) {
      timer = setTimeout(async () => {
        await show((current + 1) % slides.length);
        syncTimer();
      }, interval);
    }
  };

  dots.forEach((dot, index) => dot.addEventListener('click', async () => {
    await show(index);
    syncTimer();
  }));
  pause.addEventListener('click', () => {
    paused = !paused;
    updateControls();
    syncTimer();
  });
  document.addEventListener('visibilitychange', syncTimer);
  motion.addEventListener('change', () => {
    updateControls();
    syncTimer();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      syncTimer();
    }, {threshold:0}).observe(hero);
  }
  controls.hidden = false;
  updateControls();
  syncTimer();
})();
