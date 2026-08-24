(function initializeLuckyRoll13Tracking(window, document) {
  'use strict';

  if (window.__luckyRoll13TrackingLoaded) {
    return;
  }

  window.__luckyRoll13TrackingLoaded = true;

  var pixelId = '1404519714948556';

  if (!window.fbq) {
    var fbq = function () {
      fbq.callMethod
        ? fbq.callMethod.apply(fbq, arguments)
        : fbq.queue.push(arguments);
    };

    window.fbq = fbq;
    window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
  }

  if (!document.getElementById('meta-pixel-script')) {
    var pixelScript = document.createElement('script');
    pixelScript.id = 'meta-pixel-script';
    pixelScript.async = true;
    pixelScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(pixelScript);
  }

  if (!window.__luckyRoll13PixelInitialized) {
    window.fbq('init', pixelId);
    window.__luckyRoll13PixelInitialized = true;
  }

  if (!window.__luckyRoll13PageViewTracked) {
    window.fbq('track', 'PageView');
    window.__luckyRoll13PageViewTracked = true;
  }

  if (window.__luckyRoll13ContactTrackingBound) {
    return;
  }

  window.__luckyRoll13ContactTrackingBound = true;

  document.addEventListener('click', function trackContactClick(event) {
    var target = event.target;

    if (!target || typeof target.closest !== 'function') {
      return;
    }

    var link = target.closest('a[href]');

    if (!link) {
      return;
    }

    var url;

    try {
      url = new URL(link.href, window.location.href);
    } catch (error) {
      return;
    }

    var hostname = url.hostname.toLowerCase();
    var contactMethod = null;

    if (
      hostname === 'wa.me' ||
      hostname === 'whatsapp.com' ||
      hostname.endsWith('.whatsapp.com')
    ) {
      contactMethod = 'whatsapp';
    } else if (url.protocol === 'tel:') {
      contactMethod = 'phone';
    }

    if (!contactMethod) {
      return;
    }

    window.fbq('track', 'Contact', {
      contact_method: contactMethod,
      page_url: window.location.href
    });
  });
})(window, document);
