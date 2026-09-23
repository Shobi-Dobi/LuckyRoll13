(function initializeSiteNavigation(window, document) {
  'use strict';

  document.documentElement.classList.add('js-enabled');

  var isEnglish = document.documentElement.lang.toLowerCase().indexOf('en') === 0;
  var accessibilityPath = isEnglish ? '/en/accessibility/' : '/accessibility/';
  var footerColumn = document.querySelector('.footer .footer-row > div:first-child');
  var accessibilityLink = document.querySelector('a[href="' + accessibilityPath + '"]');

  if (footerColumn && !accessibilityLink) {
    accessibilityLink = document.createElement('a');
    accessibilityLink.href = accessibilityPath;
    accessibilityLink.textContent = isEnglish ? 'Accessibility statement' : 'הצהרת נגישות';
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

  var attributionKeys = /^(utm_[a-z0-9_]+|gclid|gbraid|wbraid|fbclid|msclkid)$/i;
  var currentParameters = new URLSearchParams(window.location.search);
  var currentHash = '';

  if (window.location.hash) {
    try {
      if (document.getElementById(decodeURIComponent(window.location.hash.slice(1)))) {
        currentHash = window.location.hash;
      }
    } catch (error) {
      currentHash = '';
    }
  }

  document.querySelectorAll('.language-switcher a[href]').forEach(function preserveAttribution(link) {
    var target;

    try {
      target = new URL(link.getAttribute('href'), window.location.origin);
    } catch (error) {
      return;
    }

    currentParameters.forEach(function copyAttribution(value, key) {
      if (attributionKeys.test(key)) target.searchParams.set(key, value);
    });

    if (currentHash) target.hash = currentHash;
    link.href = target.pathname + target.search + target.hash;
  });

  var menuButton = document.querySelector('.menu-toggle');
  var navigation = document.getElementById('primary-navigation');
  var closeButton = navigation && navigation.querySelector('.menu-close');

  if (!menuButton || !navigation) return;

  var openLabel = menuButton.getAttribute('data-open-label') || menuButton.getAttribute('aria-label');
  var closeLabel = menuButton.getAttribute('data-close-label') || openLabel;

  function setMenuState(isOpen, returnFocus) {
    navigation.classList.toggle('is-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? closeLabel : openLabel);

    if (returnFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', function toggleMenu() {
    setMenuState(!navigation.classList.contains('is-open'), false);
  });

  if (closeButton) {
    closeButton.addEventListener('click', function closeFromPanel() {
      setMenuState(false, true);
    });
  }

  navigation.addEventListener('click', function closeAfterNavigation(event) {
    if (event.target && typeof event.target.closest === 'function' && event.target.closest('a[href]')) {
      setMenuState(false, false);
    }
  });

  document.addEventListener('keydown', function closeWithEscape(event) {
    if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
      setMenuState(false, true);
    }
  });

  document.addEventListener('click', function closeOutsideNavigation(event) {
    if (navigation.classList.contains('is-open') && !navigation.contains(event.target) && !menuButton.contains(event.target)) {
      setMenuState(false, false);
    }
  });

  var currentPath = window.location.pathname.replace(/index\.html$/, '');

  navigation.querySelectorAll('a[href^="/"]').forEach(function markCurrentPage(link) {
    var linkPath = new URL(link.href, window.location.origin).pathname.replace(/index\.html$/, '');

    if (linkPath === currentPath) link.setAttribute('aria-current', 'page');
  });
})(window, document);
