(function initializeLuckyRoll13Tracking(window, document) {
  'use strict';

  if (window.__luckyRoll13TrackingLoaded) {
    return;
  }

  window.__luckyRoll13TrackingLoaded = true;

  var gaMeasurementId = 'G-P90EZYYDSS';
  var pixelId = '1404519714948556';

  window.dataLayer = window.dataLayer || [];

  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  if (!document.getElementById('ga4-script')) {
    var gaScript = document.createElement('script');
    gaScript.id = 'ga4-script';
    gaScript.async = true;
    gaScript.src =
      'https://www.googletagmanager.com/gtag/js?id=' +
      encodeURIComponent(gaMeasurementId);
    document.head.appendChild(gaScript);
  }

  if (!window.__luckyRoll13Ga4Initialized) {
    window.gtag('js', new Date());
    window.gtag('config', gaMeasurementId);
    window.__luckyRoll13Ga4Initialized = true;
  }

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

    if (contactMethod === 'whatsapp') {
      var shouldWaitForGa4 =
        !event.defaultPrevented &&
        (typeof event.button !== 'number' || event.button === 0) &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        (!link.target || link.target.toLowerCase() === '_self');
      var continueNavigation = null;

      if (shouldWaitForGa4) {
        event.preventDefault();

        var navigationCompleted = false;

        continueNavigation = function () {
          if (navigationCompleted) {
            return;
          }

          navigationCompleted = true;
          window.location.assign(link.href);
        };
      }

      var ga4EventParameters = {
        send_to: gaMeasurementId,
        link_url: link.href,
        page_location: window.location.href,
        transport_type: 'beacon'
      };

      if (continueNavigation) {
        ga4EventParameters.event_callback = continueNavigation;
        ga4EventParameters.event_timeout = 300;
      }

      window.gtag('event', 'whatsapp_lead', ga4EventParameters);

      if (continueNavigation) {
        window.setTimeout(continueNavigation, 350);
      }
    }

    window.fbq('track', 'Contact', {
      contact_method: contactMethod,
      page_url: window.location.href
    });
  });
})(window, document);
