const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function debounce(fn, delay = 150) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
}

function setCurrentYear() {
  document.querySelectorAll("#currentYear").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });
}

function setActiveNavLink() {
  const navLinksContainer = document.getElementById("nav-links");
  if (!navLinksContainer) return;

  const links = Array.from(navLinksContainer.querySelectorAll("a[data-navid]"));
  if (!links.length) return;

  const fileName = window.location.pathname.split("/").pop() || "index.html";
  const pageId = fileName === "index.html" ? "home" : fileName.replace(/\.html$/, "");

  links.forEach((link) => {
    const isActive = link.getAttribute("data-navid") === pageId;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

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
    if (navLinks.classList.contains("active")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navLinks.addEventListener("click", (event) => {
    const targetLink = event.target.closest("a");
    if (targetLink) closeMenu();
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

function initHeroAnimation() {
  const heroContainer = document.querySelector(".hero-container");
  if (!heroContainer) return;

  if (prefersReducedMotion) {
    heroContainer.classList.add("is-ready");
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroContainer.classList.add("is-ready");
    });
  });
}

function initRevealAnimations() {
  const revealElements = Array.from(document.querySelectorAll("[data-aos]"));
  if (!revealElements.length) return;

  revealElements.forEach((element) => {
    const delay = Number.parseInt(element.getAttribute("data-aos-delay") || "0", 10);
    if (!Number.isNaN(delay) && delay > 0) {
      element.style.setProperty("--reveal-delay", `${delay}ms`);
    }

    const animationType = (element.getAttribute("data-aos") || "").toLowerCase();
    if (animationType.includes("right")) element.classList.add("reveal-right");
    if (animationType.includes("left")) element.classList.add("reveal-left");
    if (animationType.includes("zoom") || animationType.includes("flip")) {
      element.classList.add("reveal-zoom");
    }

    element.classList.add("reveal-ready");
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
    {
      threshold: 0.15,
      rootMargin: "0px 0px -10%"
    }
  );

  revealElements.forEach((element) => observer.observe(element));
}

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
    if (index < 8) {
      image.setAttribute("loading", "eager");
    }

    if (index < 4) {
      image.setAttribute("fetchpriority", "high");
    }
  });
}

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
    if (event.target === overlay) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!overlay.classList.contains("is-open")) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowRight") showNext();
    if (event.key === "ArrowLeft") showPrev();
  });
}

function optimizeMediaLoading() {
  document.querySelectorAll("img").forEach((image) => {
    const isPriorityImage = Boolean(image.closest(".hero-container, .hero, .navbar"));

    if (isPriorityImage) {
      image.setAttribute("fetchpriority", "high");
    } else {
      image.setAttribute("loading", image.getAttribute("loading") || "lazy");
    }

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

        if (entry.isIntersecting && !document.hidden) {
          tryPlay(video);
        } else {
          video.pause();
        }
      });
    },
    {
      threshold: 0.25
    }
  );

  autoplayVideos.forEach((video) => {
    video.muted = true;
    observer.observe(video);
  });

  document.addEventListener("visibilitychange", () => {
    autoplayVideos.forEach((video) => {
      if (document.hidden || !visibilityMap.get(video)) {
        video.pause();
      } else {
        tryPlay(video);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  setActiveNavLink();
  initMobileMenu();
  initHeroAnimation();
  initRevealAnimations();
  initGalleryTabs();
  prioritizeGalleryPreviews();
  initLightbox();
  optimizeMediaLoading();
  initAutoplayVideoVisibility();
});
