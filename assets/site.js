(function initializeSiteNavigation(window, document) {
  'use strict';

  var menuButton = document.querySelector('.menu-toggle');
  var navigation = document.getElementById('primary-navigation');

  if (!menuButton || !navigation) {
    return;
  }

  function closeMenu() {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }

  menuButton.addEventListener('click', function toggleMenu() {
    var isOpen = navigation.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  navigation.addEventListener('click', function closeAfterNavigation(event) {
    if (
      event.target &&
      typeof event.target.closest === 'function' &&
      event.target.closest('a[href]')
    ) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', function closeWithEscape(event) {
    if (event.key === 'Escape') {
      closeMenu();
      menuButton.focus();
    }
  });

  document.addEventListener('click', function closeOutsideNavigation(event) {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) {
      closeMenu();
    }
  });

  window.addEventListener('resize', function closeOnDesktop() {
    if (window.innerWidth > 1100) {
      closeMenu();
    }
  });

  var currentPath = window.location.pathname.replace(/index\.html$/, '');

  navigation.querySelectorAll('a[href^="/"]').forEach(function markCurrentPage(link) {
    var linkPath = new URL(link.href, window.location.origin).pathname.replace(/index\.html$/, '');

    if (linkPath === currentPath) {
      link.setAttribute('aria-current', 'page');
    }
  });
})(window, document);
