window.PQEPage = window.PQEPage || {};

window.PQEApp = {
  init() {
    // Navigation link listeners
    const navLinks = document.querySelectorAll('.nav-link');
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.querySelector('.nav-toggle');

    // Mobile nav toggle
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const target = link.getAttribute('href');
        if (target && target.startsWith('#')) {
          event.preventDefault();
          const pageId = target.replace('#', '');
          this.setActivePage(pageId);
          window.location.hash = target;

          // Close mobile menu if open
          if (navMenu && navMenu.classList.contains('open')) {
            navMenu.classList.remove('open');
            if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });

    // Hashchange listener for browser back/forward buttons
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        this.setActivePage(hash);
      }
    });

    // Determine initial page from hash or default to home
    const initialHash = window.location.hash.replace('#', '');
    const validPages = ['home', 'generator', 'encryption', 'keygen', 'test', 'settings', 'about'];
    const startPage = validPages.includes(initialHash) ? initialHash : 'home';
    this.setActivePage(startPage);

    // Initialize all page controllers
    Object.keys(window.PQEPage).forEach((key) => {
      if (typeof window.PQEPage[key] === 'function') {
        window.PQEPage[key]();
      }
    });
  },

  setActivePage(pageName) {
    // Map generator alias to home
    const targetId = pageName === 'generator' ? 'home' : pageName;

    const sections = document.querySelectorAll('.page-section');
    let found = false;

    sections.forEach((section) => {
      const isTarget = section.id === targetId;
      if (isTarget) found = true;
      section.classList.toggle('active', isTarget);
      section.classList.toggle('d-none', !isTarget);
    });

    // If target not found, fallback to home
    if (!found) {
      const homeSection = document.getElementById('home');
      if (homeSection) {
        homeSection.classList.add('active');
        homeSection.classList.remove('d-none');
      }
    }

    // Update nav links active state
    const links = document.querySelectorAll('.nav-link');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      const isTargetLink = href === `#${targetId}` || (targetId === 'home' && href === '#generator');
      link.classList.toggle('active', isTargetLink);
      link.setAttribute('aria-current', isTargetLink ? 'page' : 'false');
    });

    document.body.dataset.page = targetId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.PQEApp.init();
});
