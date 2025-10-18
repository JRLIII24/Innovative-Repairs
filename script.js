document.addEventListener("DOMContentLoaded", () => {
  // AOS Initialization
  AOS.init({
    duration: 500,
    easing: 'ease-in-out',
    once: true,
    offset: 50,
  });

  const heroLogo = document.querySelector('.hero-logo');
  const heroContainer = document.querySelector('.hero-container');

  if (heroLogo && heroContainer) { 
    setTimeout(() => {
      heroLogo.classList.add('slide-in-hero-logo'); 
      heroContainer.classList.add('animate-hero'); 
    }, 300);
  }


  const carousels = document.querySelectorAll(".carousel");
  carousels.forEach(carousel => {
    const track = carousel.querySelector(".carousel-track");
    if (!track || !track.children.length) return;

    const slides = Array.from(track.children);
    const nextButton = carousel.querySelector(".carousel-btn.next");
    const prevButton = carousel.querySelector(".carousel-btn.prev");
    let currentIndex = 0;
    let autoScrollInterval;
    let touchStartX = 0;
    let slideWidth = slides.length > 0 ? slides[0].getBoundingClientRect().width : 0;

    function updateCarouselDimensions() {
      if (slides.length > 0) {
        slideWidth = slides[0].getBoundingClientRect().width;
        if (track && slideWidth > 0) { // Ensure track exists and slideWidth is valid
            track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
        } else if (track) {
            track.style.transform = `translateX(0px)`; // 
        }
      }
    }

    function showSlide(index) {
      if (!slides.length) return;
      if (index >= slides.length) {
        currentIndex = 0;
      } else if (index < 0) {
        currentIndex = slides.length - 1;
      } else {
        currentIndex = index;
      }
      updateCarouselDimensions();
    }
    function nextSlide() { showSlide(currentIndex + 1); }
    function prevSlide() { showSlide(currentIndex - 1); }

    function startAutoScroll() {
      stopAutoScroll();
      if (slides.length > 1) { // Only auto-scroll if there's more than one slide
        autoScrollInterval = setInterval(nextSlide, 5000);
      }
    }
    function stopAutoScroll() { clearInterval(autoScrollInterval); }

    if (nextButton) nextButton.addEventListener("click", () => { stopAutoScroll(); nextSlide(); startAutoScroll(); });
    if (prevButton) prevButton.addEventListener("click", () => { stopAutoScroll(); prevSlide(); startAutoScroll(); });
    
    if (slides.length > 1) {
        track.addEventListener("mouseenter", stopAutoScroll);
        track.addEventListener("mouseleave", startAutoScroll);
        track.addEventListener("touchstart", (e) => { 
          if (e.changedTouches && e.changedTouches.length > 0) {
            touchStartX = e.changedTouches[0].screenX; 
          }
          stopAutoScroll(); 
        }, { passive: true });
        track.addEventListener("touchend", (e) => {
          if (e.changedTouches && e.changedTouches.length > 0) {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;
            if (diff > 50) prevSlide(); 
            else if (diff < -50) nextSlide();
          }
          startAutoScroll();
        });
    }
    
    window.addEventListener('resize', updateCarouselDimensions);
    updateCarouselDimensions(); // Initial call
    if (slides.length > 1) { // Start auto-scroll only if multiple slides
        startAutoScroll();
    }
  });

  // Mobile Menu Toggle
  const menuToggle = document.getElementById("mobile-menu");
  const navLinksUl = document.getElementById("nav-links");

  if (menuToggle && navLinksUl) {
    menuToggle.addEventListener("click", () => {
      navLinksUl.classList.toggle("active");
      const isExpanded = navLinksUl.classList.contains("active");
      menuToggle.setAttribute("aria-expanded", isExpanded.toString());
      menuToggle.innerHTML = isExpanded ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
  }

  const mainNavLinksContainer = document.getElementById('nav-links'); 
  const navLinksItems = mainNavLinksContainer ? Array.from(mainNavLinksContainer.querySelectorAll('a')) : [];

  function setActiveLink() {
    if (!mainNavLinksContainer || navLinksItems.length === 0) return; 

    const currentPath = window.location.pathname.split('/').pop();
    let pageName = currentPath;
    
    if (pageName === '' || pageName === 'index.html') {
      pageName = 'home'; 
    } else {
      pageName = pageName.replace('.html', ''); 
    }

    let foundActive = false;
    navLinksItems.forEach(link => {
      if (link.getAttribute('data-navid') === pageName) {
        link.classList.add('active');
        foundActive = true;
      } else {
        link.classList.remove('active');
      }
    });

    if (!foundActive && (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html'))) {
        const homeLink = mainNavLinksContainer.querySelector('a[data-navid="home"]');
        if (homeLink) {
            homeLink.classList.add('active');
        }
    }
  }
  
  if (mainNavLinksContainer && navLinksItems.length > 0) {
    setActiveLink(); 

    window.addEventListener('resize', () => {
        setActiveLink(); 
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // AOS Initialization
  AOS.init({
    duration: 1000,
    easing: 'ease-in-out',
    once: true,
    offset: 50,
  });

  const heroLogo = document.querySelector('.hero-logo');
  const heroContainer = document.querySelector('.hero-container');

  if (heroLogo && heroContainer) { 
    setTimeout(() => {
      heroLogo.classList.add('slide-in-hero-logo'); 
      heroContainer.classList.add('animate-hero'); 
    }, 300);
  }


  const carousels = document.querySelectorAll(".carousel");
  carousels.forEach(carousel => {
    const track = carousel.querySelector(".carousel-track");
    if (!track || !track.children.length) return;

    const slides = Array.from(track.children);
    const nextButton = carousel.querySelector(".carousel-btn.next");
    const prevButton = carousel.querySelector(".carousel-btn.prev");
    let currentIndex = 0;
    let autoScrollInterval;
    let touchStartX = 0;
    let slideWidth = slides.length > 0 ? slides[0].getBoundingClientRect().width : 0;

    function updateCarouselDimensions() {
      if (slides.length > 0) {
        slideWidth = slides[0].getBoundingClientRect().width;
        if (track && slideWidth > 0) { // Ensure track exists and slideWidth is valid
            track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
        } else if (track) {
            track.style.transform = `translateX(0px)`; // 
        }
      }
    }

    function showSlide(index) {
      if (!slides.length) return;
      if (index >= slides.length) {
        currentIndex = 0;
      } else if (index < 0) {
        currentIndex = slides.length - 1;
      } else {
        currentIndex = index;
      }
      updateCarouselDimensions();
    }
    function nextSlide() { showSlide(currentIndex + 1); }
    function prevSlide() { showSlide(currentIndex - 1); }

    function startAutoScroll() {
      stopAutoScroll();
      if (slides.length > 1) { // Only auto-scroll if there's more than one slide
        autoScrollInterval = setInterval(nextSlide, 5000);
      }
    }
    function stopAutoScroll() { clearInterval(autoScrollInterval); }

    if (nextButton) nextButton.addEventListener("click", () => { stopAutoScroll(); nextSlide(); startAutoScroll(); });
    if (prevButton) prevButton.addEventListener("click", () => { stopAutoScroll(); prevSlide(); startAutoScroll(); });
    
    if (slides.length > 1) {
        track.addEventListener("mouseenter", stopAutoScroll);
        track.addEventListener("mouseleave", startAutoScroll);
        track.addEventListener("touchstart", (e) => { 
          if (e.changedTouches && e.changedTouches.length > 0) {
            touchStartX = e.changedTouches[0].screenX; 
          }
          stopAutoScroll(); 
        }, { passive: true });
        track.addEventListener("touchend", (e) => {
          if (e.changedTouches && e.changedTouches.length > 0) {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;
            if (diff > 50) prevSlide(); 
            else if (diff < -50) nextSlide();
          }
          startAutoScroll();
        });
    }
    
    window.addEventListener('resize', updateCarouselDimensions);
    updateCarouselDimensions(); // Initial call
    if (slides.length > 1) { // Start auto-scroll only if multiple slides
        startAutoScroll();
    }
  });

  // Mobile Menu Toggle
  const menuToggle = document.getElementById("mobile-menu");
  const navLinksUl = document.getElementById("nav-links");

  if (menuToggle && navLinksUl) {
    menuToggle.addEventListener("click", () => {
      navLinksUl.classList.toggle("active");
      const isExpanded = navLinksUl.classList.contains("active");
      menuToggle.setAttribute("aria-expanded", isExpanded.toString());
      menuToggle.innerHTML = isExpanded ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
  }

  // ==========================================================================
  // Gallery Tab Filtering
  // ==========================================================================
  const tabContainer = document.querySelector(".gallery-tabs");
  const galleryItems = document.querySelectorAll(".gallery-item");

  if (tabContainer && galleryItems.length > 0) {
    tabContainer.addEventListener("click", (e) => {
      // Ensure we clicked on a button
      const clickedTab = e.target.closest(".tab-link");
      if (!clickedTab) return;

      // 1. Deactivate all tab buttons
      tabContainer.querySelectorAll(".tab-link").forEach(tab => {
        tab.classList.remove("active");
      });

      // 2. Activate the clicked tab
      clickedTab.classList.add("active");
      const filter = clickedTab.getAttribute("data-tab");

      // 3. Filter the gallery items
      galleryItems.forEach(item => {
        const itemCategory = item.getAttribute("data-category");
        
        if (filter === "all" || itemCategory === filter) {
          item.style.display = "block"; // Show matching items
        } else {
          item.style.display = "none"; // Hide non-matching items
        }
      });
      
      // 4. Refresh AOS to animate in new items
      // (AOS won't re-animate items set to 'once: true', 
      // but this ensures positions are correct for new items)
      AOS.refresh();
    });
  }

  const mainNavLinksContainer = document.getElementById('nav-links'); 
  const navLinksItems = mainNavLinksContainer ? Array.from(mainNavLinksContainer.querySelectorAll('a')) : [];

  function setActiveLink() {
    if (!mainNavLinksContainer || navLinksItems.length === 0) return; 

    const currentPath = window.location.pathname.split('/').pop();
    let pageName = currentPath;
    
    if (pageName === '' || pageName === 'index.html') {
      pageName = 'home'; 
    } else {
      pageName = pageName.replace('.html', ''); 
    }

    let foundActive = false;
    navLinksItems.forEach(link => {
      if (link.getAttribute('data-navid') === pageName) {
        link.classList.add('active');
        foundActive = true;
      } else {
        link.classList.remove('active');
      }
    });

    if (!foundActive && (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html'))) {
        const homeLink = mainNavLinksContainer.querySelector('a[data-navid="home"]');
        if (homeLink) {
            homeLink.classList.add('active');
        }
    }
  }
  
  if (mainNavLinksContainer && navLinksItems.length > 0) {
    setActiveLink(); 

    window.addEventListener('resize', () => {
        setActiveLink(); 
    });
  }
});