document.addEventListener("DOMContentLoaded", () => {
  // AOS Initialization
  AOS.init({
    duration: 1000,
    easing: 'ease-in-out',
    once: true,
    offset: 50,
    // disable: 'mobile' // Uncomment if you want to disable AOS on mobile
  });

  // Carousel Functionality
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
            track.style.transform = `translateX(0px)`; // Reset if slideWidth is 0
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
      if (slides.length > 1) {
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
    startAutoScroll();
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

  // Active Nav Link Highlighting
  const mainNavLinksContainer = document.getElementById('nav-links'); 
  const navLinksItems = mainNavLinksContainer ? Array.from(mainNavLinksContainer.querySelectorAll('a')) : [];

  function setActiveLink() {
    if (!mainNavLinksContainer || navLinksItems.length === 0) return; // Guard clause

    const currentPath = window.location.pathname;
    let pageName = currentPath.split('/').pop();
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

    if (!foundActive && (currentPath === '/' || currentPath.endsWith('/index.html') || currentPath.endsWith('/'))) {
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
        // Re-calculate carousel dimensions on resize
        carousels.forEach(carousel => {
            // This logic is already inside the carousel.forEach loop's event listener for resize
            // but calling updateCarouselDimensions directly might be what's intended here for each carousel.
            const track = carousel.querySelector(".carousel-track");
            if (!track || !track.children.length) return;
            const slides = Array.from(track.children);
             if (slides.length > 0) {
                let slideWidth = slides[0].getBoundingClientRect().width;
                // Get current index from the carousel instance, not recalculating here
                // The existing resize listener within the carousel loop should handle its own update.
                // For simplicity, let's assume the existing carousel resize handler is sufficient.
                // If explicit update needed here, would need to access currentIndex for each carousel.
             }
        });
    });
  }
});document.addEventListener("DOMContentLoaded", () => {
  // AOS Initialization
  AOS.init({
    duration: 1000,
    easing: 'ease-in-out',
    once: true,
    offset: 50,
    // disable: 'mobile' // Uncomment if you want to disable AOS on mobile
  });

  // Carousel Functionality
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
            track.style.transform = `translateX(0px)`; // Reset if slideWidth is 0
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
      if (slides.length > 1) {
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
    startAutoScroll();
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

  // Active Nav Link Highlighting
  const mainNavLinksContainer = document.getElementById('nav-links'); 
  const navLinksItems = mainNavLinksContainer ? Array.from(mainNavLinksContainer.querySelectorAll('a')) : [];

  function setActiveLink() {
    if (!mainNavLinksContainer || navLinksItems.length === 0) return; // Guard clause

    const currentPath = window.location.pathname;
    let pageName = currentPath.split('/').pop();
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

    if (!foundActive && (currentPath === '/' || currentPath.endsWith('/index.html') || currentPath.endsWith('/'))) {
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
        // Re-calculate carousel dimensions on resize
        carousels.forEach(carousel => {
            // This logic is already inside the carousel.forEach loop's event listener for resize
            // but calling updateCarouselDimensions directly might be what's intended here for each carousel.
            const track = carousel.querySelector(".carousel-track");
            if (!track || !track.children.length) return;
            const slides = Array.from(track.children);
             if (slides.length > 0) {
                let slideWidth = slides[0].getBoundingClientRect().width;
                // Get current index from the carousel instance, not recalculating here
                // The existing resize listener within the carousel loop should handle its own update.
                // For simplicity, let's assume the existing carousel resize handler is sufficient.
                // If explicit update needed here, would need to access currentIndex for each carousel.
             }
        });
    });
  }
});