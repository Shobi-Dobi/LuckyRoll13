(function initializeLuckyRoll13Tracking(window, document) {
  'use strict';

  var localQaHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  var localQaDisabled = new URLSearchParams(window.location.search).get('qa_no_tracking') === '1';

  if (localQaHost && localQaDisabled) {
    window.__luckyRoll13TrackingSuppressedForQa = true;
    return;
  }

  if (window.__luckyRoll13TrackingLoaded) {
    return;
  }

  window.__luckyRoll13TrackingLoaded = true;

  var gaMeasurementId = 'G-P90EZYYDSS';
  var pixelId = '1404519714948556';
  var pendingLeadStorageKey = 'luckyroll13:pending-form-lead';
  var trackedLeadStoragePrefix = 'luckyroll13:tracked-form-lead:';

  function getSessionStorage() {
    try {
      return window.sessionStorage;
    } catch (error) {
      return null;
    }
  }

  function readSessionItem(storage, key) {
    try {
      return storage ? storage.getItem(key) : null;
    } catch (error) {
      return null;
    }
  }

  function writeSessionItem(storage, key, value) {
    try {
      if (!storage) return false;
      storage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function removeSessionItem(storage, key) {
    try {
      if (storage) storage.removeItem(key);
    } catch (error) {
      // Storage restrictions must never break navigation or form submission.
    }
  }

  function readFormValue(form, fieldName) {
    var field = form.elements && form.elements.namedItem(fieldName);
    return field && typeof field.value === 'string' ? field.value : '';
  }

  function trackedLeadFormName(form) {
    if (!form || typeof form.matches !== 'function' || !form.matches('form')) {
      return '';
    }

    var formName = (form.getAttribute('name') || '').trim();
    var method = (form.getAttribute('method') || form.method || '').toUpperCase();

    if (!/(^|-)lead$/i.test(formName) || method !== 'POST') {
      return '';
    }

    if (form.hasAttribute('data-track-lead-form')) {
      return formName;
    }

    if (form.getAttribute('data-netlify') === 'true') {
      return formName;
    }

    var netlifyFormName = form.elements && form.elements.namedItem('form-name');
    var hasProcessedNetlifyIdentity =
      netlifyFormName &&
      String(netlifyFormName.tagName || '').toLowerCase() === 'input' &&
      String(netlifyFormName.type || '').toLowerCase() === 'hidden' &&
      netlifyFormName.value === formName;

    return hasProcessedNetlifyIdentity ? formName : '';
  }

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

  function trackConfirmedFormLead() {
    var normalizedPath = window.location.pathname.replace(/\/+$/, '');
    var isThankYouPage =
      normalizedPath === '/thank-you.html' ||
      normalizedPath === '/thank-you' ||
      normalizedPath === '/en/thank-you';

    if (!isThankYouPage) return;

    var storage = getSessionStorage();

    if (!storage) return;

    var pendingLead;

    try {
      pendingLead = JSON.parse(readSessionItem(storage, pendingLeadStorageKey) || 'null');
    } catch (error) {
      removeSessionItem(storage, pendingLeadStorageKey);
      return;
    }

    if (
      !pendingLead ||
      typeof pendingLead.id !== 'string' ||
      typeof pendingLead.formName !== 'string' ||
      typeof pendingLead.createdAt !== 'number' ||
      Date.now() - pendingLead.createdAt > 2 * 60 * 60 * 1000
    ) {
      removeSessionItem(storage, pendingLeadStorageKey);
      return;
    }

    var trackedLeadStorageKey = trackedLeadStoragePrefix + pendingLead.id;

    if (readSessionItem(storage, trackedLeadStorageKey)) {
      removeSessionItem(storage, pendingLeadStorageKey);
      return;
    }

    if (!writeSessionItem(storage, trackedLeadStorageKey, '1')) return;
    removeSessionItem(storage, pendingLeadStorageKey);

    var ga4LeadParameters = {
      send_to: gaMeasurementId,
      form_name: pendingLead.formName,
      form_language: pendingLead.language || '',
      interest: pendingLead.interest || '',
      preferred_location: pendingLead.preferredLocation || '',
      lead_source: 'website_form',
      source_page: pendingLead.sourcePage || '',
      page_location: window.location.href,
      transport_type: 'beacon'
    };

    window.gtag('event', 'generate_lead', ga4LeadParameters);
    window.gtag('event', 'trial_form_success', ga4LeadParameters);

    var metaLeadParameters = {
      content_name: pendingLead.formName,
      content_category: 'website_form',
      form_language: pendingLead.language || '',
      interest: pendingLead.interest || '',
      preferred_location: pendingLead.preferredLocation || '',
      page_url: pendingLead.sourcePage || window.location.href
    };

    window.fbq('track', 'Lead', metaLeadParameters, {
      eventID: pendingLead.id
    });
    window.fbq('track', 'Contact', {
      contact_method: 'website_form',
      form_name: pendingLead.formName,
      page_url: pendingLead.sourcePage || window.location.href
    }, {
      eventID: pendingLead.id + '-contact'
    });
  }

  trackConfirmedFormLead();

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
    var clickEventName = null;
    var isTrialCta = link.hasAttribute('data-trial-cta');

    if (
      hostname === 'wa.me' ||
      hostname === 'whatsapp.com' ||
      hostname.endsWith('.whatsapp.com')
    ) {
      contactMethod = 'whatsapp';
      clickEventName = 'whatsapp_click';
    } else if (url.protocol === 'tel:') {
      contactMethod = 'phone';
      clickEventName = 'phone_click';
    } else if (
      hostname === 'maps.app.goo.gl' ||
      hostname === 'maps.google.com' ||
      (hostname.endsWith('google.com') && url.pathname.indexOf('/maps') !== -1)
    ) {
      clickEventName = 'maps_click';
    } else if (hostname === 'waze.com' || hostname.endsWith('.waze.com')) {
      clickEventName = 'waze_click';
    }

    if (!clickEventName && !isTrialCta) {
      return;
    }

    if (clickEventName) {
      window.gtag('event', clickEventName, {
        send_to: gaMeasurementId,
        link_url: link.href,
        page_location: window.location.href,
        transport_type: 'beacon'
      });
    }

    if (isTrialCta) {
      window.gtag('event', 'trial_booking_click', {
        send_to: gaMeasurementId,
        link_url: link.href,
        page_location: window.location.href,
        transport_type: 'beacon'
      });
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

    if (contactMethod) {
      window.fbq('track', 'Contact', {
        contact_method: contactMethod,
        page_url: window.location.href
      });
    }
  });

  document.addEventListener('submit', function trackTrialFormSubmit(event) {
    var form = event.target;
    var formName = trackedLeadFormName(form);

    if (!formName) return;

    var language = readFormValue(form, 'language') || document.documentElement.lang || '';
    var interest = readFormValue(form, 'interest');
    var preferredLocation = readFormValue(form, 'preferred-location');
    var storage = getSessionStorage();

    if (storage) {
      writeSessionItem(
        storage,
        pendingLeadStorageKey,
        JSON.stringify({
          id: formName + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10),
          formName: formName,
          language: language,
          interest: interest,
          preferredLocation: preferredLocation,
          sourcePage: window.location.pathname + window.location.search,
          createdAt: Date.now()
        })
      );
    }

    window.gtag('event', 'trial_form_submit', {
      send_to: gaMeasurementId,
      form_name: formName,
      form_language: language,
      interest: interest,
      preferred_location: preferredLocation,
      page_location: window.location.href,
      transport_type: 'beacon'
    });
  });
})(window, document);
