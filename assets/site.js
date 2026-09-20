(function initializeSiteNavigation(window, document) {
  'use strict';

  var footerColumn = document.querySelector('.footer .footer-row > div:first-child');
  var accessibilityLink = document.querySelector('a[href="/accessibility/"]');

  if (footerColumn && !accessibilityLink) {
    accessibilityLink = document.createElement('a');
    accessibilityLink.href = '/accessibility/';
    accessibilityLink.textContent = 'הצהרת נגישות';
    footerColumn.appendChild(document.createElement('br'));
    footerColumn.appendChild(accessibilityLink);
  }

  var skipLink = document.querySelector('.skip[href="#main"]');
  var main = document.getElementById('main');

  if (skipLink && main) {
    main.setAttribute('tabindex', '-1');
    skipLink.addEventListener('click', function focusMainContent() {
      window.setTimeout(function () {
        main.focus({ preventScroll: true });
      }, 0);
    });
  }

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
    if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
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
