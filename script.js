(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Loading sequence */
  const preloader = $('#preloader');
  const preloaderBar = $('#preloaderBar');
  const preloaderCount = $('#preloaderCount');
  let progress = 0;
  let loaderFinished = false;

  const finishLoader = () => {
    if (loaderFinished || !preloader) return;
    loaderFinished = true;
    progress = 100;
    if (preloaderBar) preloaderBar.style.width = '100%';
    if (preloaderCount) preloaderCount.value = '100';
    window.setTimeout(() => preloader.classList.add('is-done'), reduceMotion ? 0 : 220);
  };

  if (preloader && !reduceMotion) {
    const loadingTimer = window.setInterval(() => {
      const remaining = 92 - progress;
      progress += Math.max(1, Math.ceil(remaining * 0.09));
      progress = Math.min(progress, 92);
      if (preloaderBar) preloaderBar.style.width = `${progress}%`;
      if (preloaderCount) preloaderCount.value = String(progress).padStart(2, '0');
      if (loaderFinished) window.clearInterval(loadingTimer);
    }, 65);
    window.addEventListener('load', () => {
      window.clearInterval(loadingTimer);
      finishLoader();
    }, { once: true });
    window.setTimeout(finishLoader, 2200);
  } else {
    finishLoader();
  }

  /* Header, progress, and section-aware navigation */
  const header = $('#siteHeader');
  const progressBar = $('#scrollProgress');
  let scrollQueued = false;

  const updateScrollUI = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? scrollTop / scrollable : 0;
    if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
    if (header) header.classList.toggle('is-scrolled', scrollTop > 24);
    scrollQueued = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });
  updateScrollUI();

  const navLinks = $$('.desktop-nav a');
  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-28% 0px -62% 0px', threshold: 0 });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* Mobile navigation */
  const menuButton = $('#menuButton');
  const mobileNav = $('#mobileNav');

  const setMenu = (open) => {
    if (!menuButton || !mobileNav || !header) return;
    menuButton.setAttribute('aria-expanded', String(open));
    mobileNav.setAttribute('aria-hidden', String(!open));
    mobileNav.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };

  menuButton?.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  $$('.mobile-nav a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') setMenu(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) setMenu(false);
  }, { passive: true });

  /* Entrance reveals */
  const reveals = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((element) => element.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.11, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((element) => revealObserver.observe(element));
  }

  /* Typed identity line */
  const typedRole = $('#typedRole');
  const roles = ['产品探索者', '辩手', '风景记录者', '合唱爱好者', '生活体验派'];
  if (typedRole && !reduceMotion) {
    let roleIndex = 0;
    let characterIndex = roles[0].length;
    let deleting = false;

    const typeNext = () => {
      const role = roles[roleIndex];
      if (!deleting) {
        characterIndex += 1;
        typedRole.textContent = role.slice(0, characterIndex);
        if (characterIndex >= role.length) {
          deleting = true;
          window.setTimeout(typeNext, 1450);
          return;
        }
      } else {
        characterIndex -= 1;
        typedRole.textContent = role.slice(0, Math.max(0, characterIndex));
        if (characterIndex <= 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
        }
      }
      window.setTimeout(typeNext, deleting ? 52 : 105);
    };
    window.setTimeout(() => {
      deleting = true;
      typeNext();
    }, 1600);
  }

  /* Gentle hero depth on precise pointers */
  const heroVisual = $('#heroVisual');
  const supportsPrecisePointer = window.matchMedia('(pointer: fine)').matches;
  if (heroVisual && supportsPrecisePointer && !reduceMotion) {
    heroVisual.addEventListener('pointermove', (event) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      heroVisual.style.transform = `perspective(1100px) rotateY(${x * 3.5}deg) rotateX(${-y * 3.5}deg)`;
    });
    heroVisual.addEventListener('pointerleave', () => {
      heroVisual.style.transform = '';
    });
  }

  /* Lazy-load tennis video; user control always wins */
  const tennisVideo = $('#tennisVideo');
  const videoToggle = $('#videoToggle');
  let videoLoaded = false;
  let manuallyPaused = false;

  const setVideoButton = (playing) => {
    if (!videoToggle) return;
    videoToggle.classList.toggle('is-playing', playing);
    videoToggle.setAttribute('aria-pressed', String(playing));
    videoToggle.setAttribute('aria-label', playing ? '暂停网球训练视频' : '播放网球训练视频');
  };

  const loadVideo = () => {
    if (!tennisVideo || videoLoaded) return;
    const source = tennisVideo.dataset.src;
    if (!source) return;
    tennisVideo.src = source;
    tennisVideo.load();
    videoLoaded = true;
  };

  const playVideo = () => {
    if (!tennisVideo) return;
    loadVideo();
    const promise = tennisVideo.play();
    if (promise && typeof promise.then === 'function') {
      promise.then(() => setVideoButton(true)).catch(() => setVideoButton(false));
    }
  };

  if (tennisVideo && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
          loadVideo();
          if (!reduceMotion && !manuallyPaused) playVideo();
        } else if (!tennisVideo.paused) {
          tennisVideo.pause();
          setVideoButton(false);
        }
      });
    }, { threshold: [0, 0.45, 0.8] });
    videoObserver.observe(tennisVideo);
  }

  videoToggle?.addEventListener('click', () => {
    if (!tennisVideo) return;
    if (tennisVideo.paused) {
      manuallyPaused = false;
      playVideo();
    } else {
      manuallyPaused = true;
      tennisVideo.pause();
      setVideoButton(false);
    }
  });
  tennisVideo?.addEventListener('pause', () => setVideoButton(false));
  tennisVideo?.addEventListener('play', () => setVideoButton(true));

  /* Photography lightbox */
  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightboxImage');
  const lightboxTitle = $('#lightboxTitle');
  const lightboxCaption = $('#lightboxCaption');
  const lightboxIndex = $('#lightboxIndex');
  const lightboxClose = $('#lightboxClose');
  const lightboxPrev = $('#lightboxPrev');
  const lightboxNext = $('#lightboxNext');
  const photoItems = $$('.photo-item');
  let activePhoto = 0;

  const renderLightbox = (index) => {
    if (!photoItems.length || !lightboxImage) return;
    activePhoto = (index + photoItems.length) % photoItems.length;
    const item = photoItems[activePhoto];
    const thumbnail = $('img', item);
    lightboxImage.src = item.dataset.full || thumbnail?.src || '';
    lightboxImage.alt = thumbnail?.alt || '';
    if (lightboxTitle) lightboxTitle.textContent = item.dataset.title || '';
    if (lightboxCaption) lightboxCaption.textContent = item.dataset.caption || '';
    if (lightboxIndex) lightboxIndex.textContent = `${String(activePhoto + 1).padStart(2, '0')} / ${String(photoItems.length).padStart(2, '0')}`;
  };

  const openLightbox = (index) => {
    if (!lightbox) return;
    renderLightbox(index);
    document.body.classList.add('lightbox-open');
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else lightbox.setAttribute('open', '');
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    document.body.classList.remove('lightbox-open');
    if (typeof lightbox.close === 'function' && lightbox.open) lightbox.close();
    else lightbox.removeAttribute('open');
  };

  photoItems.forEach((item, index) => item.addEventListener('click', () => openLightbox(index)));
  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', () => renderLightbox(activePhoto - 1));
  lightboxNext?.addEventListener('click', () => renderLightbox(activePhoto + 1));
  lightbox?.addEventListener('close', () => document.body.classList.remove('lightbox-open'));
  document.addEventListener('keydown', (event) => {
    if (!lightbox?.open) return;
    if (event.key === 'ArrowLeft') renderLightbox(activePhoto - 1);
    if (event.key === 'ArrowRight') renderLightbox(activePhoto + 1);
  });

  /* OOTD reel controls */
  const styleReel = $('#styleReel');
  const scrollReel = (direction) => {
    if (!styleReel) return;
    const firstFrame = $('.style-frame', styleReel);
    const gap = Number.parseFloat(getComputedStyle(styleReel).gap) || 20;
    const distance = firstFrame ? firstFrame.getBoundingClientRect().width + gap : window.innerWidth * 0.75;
    styleReel.scrollBy({ left: direction * distance, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  $('#reelPrev')?.addEventListener('click', () => scrollReel(-1));
  $('#reelNext')?.addEventListener('click', () => scrollReel(1));

  /* Copy and reveal contact information */
  const toast = $('#toast');
  let toastTimer;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-showing');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-showing'), 1800);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制到剪贴板');
    } catch (_) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      showToast(copied ? '已复制到剪贴板' : '请手动复制');
    }
  };

  $$('.copy-contact').forEach((button) => {
    button.addEventListener('click', () => copyText(button.dataset.copy || ''));
  });

  /* Ability radar: drawn from the legend list so values live in one place */
  const radarSvg = $('#radarChart');
  const radarItems = $$('#radarLegend li');
  if (radarSvg && radarItems.length >= 3) {
    const NS = 'http://www.w3.org/2000/svg';
    const cx = 230;
    const cy = 210;
    const radius = 140;
    const count = radarItems.length;
    const data = radarItems.map((item) => ({
      label: item.querySelector('span').textContent.trim(),
      value: Math.max(0, Math.min(100, Number(item.dataset.value) || 0))
    }));
    const point = (index, r) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
    };
    const el = (tag, attrs, parent) => {
      const node = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      parent.appendChild(node);
      return node;
    };
    const ring = (r) => data.map((_, i) => point(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');

    for (let level = 1; level <= 5; level += 1) {
      el('polygon', { points: ring((radius * level) / 5), class: level === 5 ? 'radar-grid radar-grid--outer' : 'radar-grid' }, radarSvg);
    }
    data.forEach((_, i) => {
      const [x, y] = point(i, radius);
      el('line', { x1: cx, y1: cy, x2: x.toFixed(1), y2: y.toFixed(1), class: 'radar-axis' }, radarSvg);
    });
    [60, 80, 100].forEach((mark) => {
      const scale = el('text', { x: cx + 5, y: (cy - (radius * mark) / 100 + 12).toFixed(1), class: 'radar-scale' }, radarSvg);
      scale.textContent = String(mark);
    });

    const shapeWrap = el('g', { class: 'radar-shape-wrap' }, radarSvg);
    el('polygon', {
      points: data.map((d, i) => point(i, (radius * d.value) / 100).map((n) => n.toFixed(1)).join(',')).join(' '),
      class: 'radar-shape'
    }, shapeWrap);
    const dots = data.map((d, i) => {
      const [x, y] = point(i, (radius * d.value) / 100);
      return el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 4.5, class: 'radar-dot' }, shapeWrap);
    });

    data.forEach((d, i) => {
      const [x, y] = point(i, radius + 30);
      const cos = Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / count);
      const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
      const label = el('text', { x: x.toFixed(1), y: (y + 5).toFixed(1), 'text-anchor': anchor, class: 'radar-label' }, radarSvg);
      el('tspan', {}, label).textContent = d.label;
      const value = el('tspan', { dx: 6, class: 'radar-value' }, label);
      value.textContent = String(d.value);
    });

    radarSvg.setAttribute('aria-label', `能力雷达图：${data.map((d) => `${d.label} ${d.value}`).join('，')}`);

    radarItems.forEach((item, i) => {
      const toggle = (on) => {
        item.classList.toggle('is-active', on);
        dots[i].classList.toggle('is-active', on);
      };
      item.addEventListener('mouseenter', () => toggle(true));
      item.addEventListener('mouseleave', () => toggle(false));
    });
  }

  const year = $('#currentYear');
  if (year) year.textContent = String(new Date().getFullYear());
})();
