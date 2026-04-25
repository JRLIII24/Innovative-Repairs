/* ════════════════════════════════════════════════════════════════
   INNOVATIVE REPAIRS — Editorial Craftsmanship Interactions
   ════════════════════════════════════════════════════════════════ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouchDevice = window.matchMedia("(hover: none)").matches;

/* ── Utilities ─────────────────────────────────────────────── */

function debounce(fn, delay = 150) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, n) {
  return (1 - n) * a + n * b;
}

/* ── Year ──────────────────────────────────────────────────── */

function setCurrentYear() {
  document.querySelectorAll("#currentYear").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });
}

/* ── Active nav link ───────────────────────────────────────── */

function setActiveNavLink() {
  const navLinksContainer = document.getElementById("nav-links");
  if (!navLinksContainer) return;

  const links = Array.from(navLinksContainer.querySelectorAll("a[data-navid]"));
  if (!links.length) return;

  const fileName = window.location.pathname.split("/").pop() || "index.html";
  const pageId = fileName === "" || fileName === "index.html" ? "home" : fileName.replace(/\.html$/, "");

  links.forEach((link) => {
    const isActive = link.getAttribute("data-navid") === pageId;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

/* ── Mobile nav ────────────────────────────────────────────── */

function initMobileMenu() {
  const menuToggle = document.getElementById("mobile-menu");
  const navLinks = document.getElementById("nav-links");
  if (!menuToggle || !navLinks) return;

  const icon = menuToggle.querySelector("i");

  const closeMenu = () => {
    navLinks.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    if (icon) {
      icon.classList.remove("fa-xmark");
      icon.classList.add("fa-bars");
    }
  };

  const openMenu = () => {
    navLinks.classList.add("active");
    menuToggle.setAttribute("aria-expanded", "true");
    if (icon) {
      icon.classList.remove("fa-bars");
      icon.classList.add("fa-xmark");
    }
  };

  menuToggle.addEventListener("click", () => {
    if (navLinks.classList.contains("active")) closeMenu();
    else openMenu();
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (
      navLinks.classList.contains("active") &&
      !navLinks.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });
}

/* ── Hero entrance ─────────────────────────────────────────── */

function initHeroAnimation() {
  const heros = document.querySelectorAll(".hero-container, .cinema-hero");
  if (!heros.length) return;

  heros.forEach((hero) => {
    if (prefersReducedMotion) {
      hero.classList.add("is-ready");
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => hero.classList.add("is-ready"));
    });
  });
}

/* ── Scroll reveals (Intersection Observer) ────────────────── */

function initRevealAnimations() {
  const revealElements = Array.from(document.querySelectorAll("[data-reveal], [data-aos]"));
  if (!revealElements.length) return;

  revealElements.forEach((element) => {
    const delay = Number.parseInt(element.getAttribute("data-reveal-delay") || element.getAttribute("data-aos-delay") || "0", 10);
    if (!Number.isNaN(delay) && delay > 0) {
      element.style.setProperty("--reveal-delay", `${delay}ms`);
    }
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8%" }
  );

  revealElements.forEach((element) => observer.observe(element));
}

/* ── Number counter (hero stats) ──────────────────────────── */

function initCounters() {
  const counters = Array.from(document.querySelectorAll("[data-counter]"));
  if (!counters.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    counters.forEach((c) => {
      c.textContent = c.getAttribute("data-counter") + (c.getAttribute("data-suffix") || "");
    });
    return;
  }

  const animateCount = (el) => {
    const target = Number.parseInt(el.getAttribute("data-counter") || "0", 10);
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = value.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((c) => observer.observe(c));
}

/* ── Portfolio carousel (drag + buttons) ──────────────────── */

function initPortfolioCarousel() {
  const carousel = document.querySelector(".portfolio-carousel");
  if (!carousel) return;

  const track = carousel.querySelector(".portfolio-track");
  const slides = Array.from(track.querySelectorAll(".portfolio-slide"));
  const prevBtn = document.querySelector(".carousel-btn.prev");
  const nextBtn = document.querySelector(".carousel-btn.next");
  const progressBar = document.querySelector(".carousel-controls .progress-bar");
  if (!track || !slides.length) return;

  let index = 0;
  const gap = 19; // matches CSS gap

  const updatePosition = () => {
    const slideWidth = slides[0].getBoundingClientRect().width + gap;
    const maxIndex = Math.max(slides.length - getVisibleCount(), 0);
    index = clamp(index, 0, maxIndex);
    track.style.transform = `translateX(${-index * slideWidth}px)`;
    if (progressBar) {
      const total = slides.length;
      const visible = getVisibleCount();
      const widthPct = (visible / total) * 100;
      const offsetPct = (index / total) * 100;
      progressBar.style.width = `${widthPct}%`;
      progressBar.style.transform = `translateX(${(offsetPct / widthPct) * 100}%)`;
    }
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index >= maxIndex;
  };

  const getVisibleCount = () => {
    const containerWidth = carousel.getBoundingClientRect().width;
    const slideWidth = slides[0].getBoundingClientRect().width + gap;
    return Math.max(1, Math.floor(containerWidth / slideWidth));
  };

  prevBtn?.addEventListener("click", () => { index--; updatePosition(); });
  nextBtn?.addEventListener("click", () => { index++; updatePosition(); });

  // Drag to scroll
  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;

  const onDragStart = (clientX) => {
    isDragging = true;
    startX = clientX;
    track.classList.add("dragging");
    const transform = window.getComputedStyle(track).transform;
    if (transform === "none") scrollLeft = 0;
    else {
      const matrix = new DOMMatrix(transform);
      scrollLeft = matrix.m41;
    }
  };

  const onDragMove = (clientX) => {
    if (!isDragging) return;
    const dx = clientX - startX;
    track.style.transform = `translateX(${scrollLeft + dx}px)`;
  };

  const onDragEnd = (clientX) => {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove("dragging");
    const dx = clientX - startX;
    const slideWidth = slides[0].getBoundingClientRect().width + gap;
    const moveBy = Math.round(-dx / slideWidth);
    index += moveBy;
    updatePosition();
  };

  track.addEventListener("mousedown", (e) => { e.preventDefault(); onDragStart(e.clientX); });
  window.addEventListener("mousemove", (e) => onDragMove(e.clientX));
  window.addEventListener("mouseup", (e) => onDragEnd(e.clientX));

  track.addEventListener("touchstart", (e) => onDragStart(e.touches[0].clientX), { passive: true });
  track.addEventListener("touchmove", (e) => onDragMove(e.touches[0].clientX), { passive: true });
  track.addEventListener("touchend", (e) => onDragEnd(e.changedTouches[0].clientX));

  // Auto-advance until the user clicks anywhere in this section, then stop.
  let auto = null;
  let userEngaged = false;
  let inView = false;

  const advance = () => {
    const maxIndex = Math.max(slides.length - getVisibleCount(), 0);
    index = (index >= maxIndex) ? 0 : index + 1;
    updatePosition();
  };
  const startAuto = () => {
    if (auto || userEngaged || !inView) return;
    auto = setInterval(advance, 5500);
  };
  const stopAuto = () => {
    if (auto) { clearInterval(auto); auto = null; }
  };
  const stopForever = () => {
    userEngaged = true;
    stopAuto();
  };

  // First click anywhere in the carousel (slide, button, drag) → stop.
  carousel.addEventListener("pointerdown", stopForever);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) startAuto(); else stopAuto();
      },
      { threshold: 0.2 }
    );
    observer.observe(carousel);
  } else {
    inView = true;
    startAuto();
  }

  window.addEventListener("resize", debounce(updatePosition, 200));
  updatePosition();
}

/* ── Testimonial carousel — manual prev/next arrows ──────────── */

function initTestimonialCarousel() {
  const wrap = document.querySelector(".testimonial-carousel");
  if (!wrap) return;

  const slides = Array.from(wrap.querySelectorAll(".testimonial-slide"));
  if (!slides.length) return;

  const track = wrap.querySelector(".testimonial-track");
  const prevBtn = wrap.querySelector(".testimonial-arrow.prev");
  const nextBtn = wrap.querySelector(".testimonial-arrow.next");
  const counter = wrap.querySelector(".testimonial-counter .cur");
  const total = wrap.querySelector(".testimonial-counter .total");
  if (total) total.textContent = String(slides.length);

  let active = 0;

  const goTo = (i) => {
    active = (i + slides.length) % slides.length;
    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === active));
    if (counter) counter.textContent = String(active + 1);
    if (track) {
      const target = slides[active];
      const offset = target.offsetLeft - track.offsetLeft;
      track.style.transition = "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
      track.style.transform = `translateX(${-offset}px)`;
    }
  };

  slides[0]?.classList.add("is-active");
  goTo(0);

  prevBtn?.addEventListener("click", () => goTo(active - 1));
  nextBtn?.addEventListener("click", () => goTo(active + 1));

  // Recompute slide offset on resize so sizing changes don't desync.
  window.addEventListener("resize", debounce(() => goTo(active), 200));
}

/* ── Gallery tabs ─────────────────────────────────────────── */

function initGalleryTabs() {
  const tabContainer = document.querySelector(".gallery-tabs");
  if (!tabContainer) return;

  const tabs = Array.from(tabContainer.querySelectorAll(".tab-link"));
  const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
  if (!tabs.length || !galleryItems.length) return;

  tabContainer.addEventListener("click", (event) => {
    const selectedTab = event.target.closest(".tab-link");
    if (!selectedTab) return;

    const filter = selectedTab.getAttribute("data-tab");
    if (!filter) return;

    tabs.forEach((tab) => tab.classList.toggle("active", tab === selectedTab));

    galleryItems.forEach((item) => {
      const category = item.getAttribute("data-category");
      const shouldShow = filter === "all" || category === filter;
      item.classList.toggle("gallery-item-hidden", !shouldShow);
      item.setAttribute("aria-hidden", shouldShow ? "false" : "true");
    });
  });
}

function prioritizeGalleryPreviews() {
  const previewImages = Array.from(document.querySelectorAll(".gallery-grid .gallery-item img"));
  if (!previewImages.length) return;

  previewImages.forEach((image, index) => {
    if (index < 8) image.setAttribute("loading", "eager");
    if (index < 4) image.setAttribute("fetchpriority", "high");
  });
}

/* ── Lightbox ─────────────────────────────────────────────── */

function initLightbox() {
  const links = Array.from(document.querySelectorAll("a[data-lightbox]"));
  if (!links.length) return;

  const groups = new Map();
  links.forEach((link) => {
    const group = link.getAttribute("data-lightbox") || "default";
    const currentGroup = groups.get(group) || [];
    currentGroup.push(link);
    groups.set(group, currentGroup);
  });

  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Close image viewer">&times;</button>
    <button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous image">&#10094;</button>
    <figure class="lightbox-figure">
      <img class="lightbox-image" alt="" decoding="async" />
      <figcaption class="lightbox-caption"></figcaption>
    </figure>
    <button type="button" class="lightbox-nav lightbox-next" aria-label="Next image">&#10095;</button>
  `;
  document.body.appendChild(overlay);

  const image = overlay.querySelector(".lightbox-image");
  const caption = overlay.querySelector(".lightbox-caption");
  const closeButton = overlay.querySelector(".lightbox-close");
  const prevButton = overlay.querySelector(".lightbox-prev");
  const nextButton = overlay.querySelector(".lightbox-next");

  let currentGroupLinks = [];
  let currentIndex = 0;

  const syncImage = () => {
    const activeLink = currentGroupLinks[currentIndex];
    if (!activeLink) return;

    const href = activeLink.getAttribute("href");
    const title = activeLink.getAttribute("data-title") || "";
    const linkedImage = activeLink.querySelector("img");

    image.src = href || "";
    image.alt = linkedImage?.alt || title || "Project image";
    caption.textContent = title;

    const hasMultiple = currentGroupLinks.length > 1;
    prevButton.hidden = !hasMultiple;
    nextButton.hidden = !hasMultiple;
  };

  const openLightbox = (selectedLink) => {
    const group = selectedLink.getAttribute("data-lightbox") || "default";
    currentGroupLinks = groups.get(group) || [selectedLink];
    currentIndex = Math.max(currentGroupLinks.indexOf(selectedLink), 0);
    syncImage();
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
  };

  const closeLightbox = () => {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    image.src = "";
  };

  const showNext = () => {
    if (currentGroupLinks.length < 2) return;
    currentIndex = (currentIndex + 1) % currentGroupLinks.length;
    syncImage();
  };

  const showPrev = () => {
    if (currentGroupLinks.length < 2) return;
    currentIndex = (currentIndex - 1 + currentGroupLinks.length) % currentGroupLinks.length;
    syncImage();
  };

  document.addEventListener("click", (event) => {
    const targetLink = event.target.closest("a[data-lightbox]");
    if (!targetLink) return;
    event.preventDefault();
    openLightbox(targetLink);
  });

  closeButton?.addEventListener("click", closeLightbox);
  nextButton?.addEventListener("click", showNext);
  prevButton?.addEventListener("click", showPrev);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (!overlay.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowRight") showNext();
    if (event.key === "ArrowLeft") showPrev();
  });
}

/* ── Custom cursor (desktop hover devices only) ───────────── */

function initCustomCursor() {
  if (isTouchDevice || prefersReducedMotion) return;

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  document.body.appendChild(dot);

  let mouseX = 0, mouseY = 0;
  let dotX = 0, dotY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  const tick = () => {
    dotX = lerp(dotX, mouseX, 0.22);
    dotY = lerp(dotY, mouseY, 0.22);
    dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  };
  tick();

  const hoverables = "a, button, .service-card, .gallery-item, .portfolio-slide, .carousel-btn, .testimonial-dot, .tab-link, .image-marquee-item";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(hoverables)) dot.classList.add("is-hovering");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(hoverables)) dot.classList.remove("is-hovering");
  });
}

/* ── Magnetic buttons ─────────────────────────────────────── */

function initMagneticButtons() {
  if (isTouchDevice || prefersReducedMotion) return;

  const buttons = document.querySelectorAll("[data-magnetic]");
  buttons.forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translate(0, 0)";
    });
  });
}

/* ── Parallax scroll on .parallax elements ────────────────── */

function initParallax() {
  if (prefersReducedMotion) return;

  const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
  if (!parallaxItems.length) return;

  let ticking = false;

  const update = () => {
    parallaxItems.forEach((item) => {
      const speed = Number.parseFloat(item.getAttribute("data-parallax") || "0.2");
      const rect = item.getBoundingClientRect();
      const viewportH = window.innerHeight;
      if (rect.bottom < 0 || rect.top > viewportH) return;
      const offset = (rect.top - viewportH / 2) * speed * -1;
      item.style.transform = `translateY(${offset}px)`;
    });
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });

  update();
}

/* ── Media optimization ───────────────────────────────────── */

function optimizeMediaLoading() {
  document.querySelectorAll("img").forEach((image) => {
    const isPriorityImage = Boolean(image.closest(".hero-container, .hero, .navbar"));
    if (isPriorityImage) image.setAttribute("fetchpriority", "high");
    else image.setAttribute("loading", image.getAttribute("loading") || "lazy");
    image.setAttribute("decoding", image.getAttribute("decoding") || "async");
  });

  document.querySelectorAll("iframe").forEach((iframe) => {
    iframe.setAttribute("loading", iframe.getAttribute("loading") || "lazy");
    iframe.setAttribute("referrerpolicy", iframe.getAttribute("referrerpolicy") || "strict-origin-when-cross-origin");
  });

  document.querySelectorAll("video").forEach((video) => {
    video.setAttribute("preload", video.getAttribute("preload") || "metadata");
    video.setAttribute("playsinline", "");
  });
}

function initAutoplayVideoVisibility() {
  const autoplayVideos = Array.from(document.querySelectorAll("video[autoplay]"));
  if (!autoplayVideos.length || prefersReducedMotion || !("IntersectionObserver" in window)) return;

  const visibilityMap = new Map();

  const tryPlay = (video) => {
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        visibilityMap.set(video, entry.isIntersecting);
        if (entry.isIntersecting && !document.hidden) tryPlay(video);
        else video.pause();
      });
    },
    { threshold: 0.25 }
  );

  autoplayVideos.forEach((video) => {
    video.muted = true;
    observer.observe(video);
  });

  document.addEventListener("visibilitychange", () => {
    autoplayVideos.forEach((video) => {
      if (document.hidden || !visibilityMap.get(video)) video.pause();
      else tryPlay(video);
    });
  });
}

/* ── Init ─────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  setActiveNavLink();
  initMobileMenu();
  initHeroAnimation();
  initRevealAnimations();
  initCounters();
  initPortfolioCarousel();
  initTestimonialCarousel();
  initGalleryTabs();
  prioritizeGalleryPreviews();
  initLightbox();
  initCustomCursor();
  initMagneticButtons();
  initParallax();
  optimizeMediaLoading();
  initAutoplayVideoVisibility();
});
