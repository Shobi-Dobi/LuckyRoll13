(function initializeSeminarExperience(window, document) {
  'use strict';

  var isEnglish = document.documentElement.lang.toLowerCase().indexOf('en') === 0;
  var copy = isEnglish
    ? {
        currentPrice: 'Current price',
        earlyRegistration: 'Early registration – ₪250',
        registration: 'Registration – ₪299',
        regularPrice: 'Regular price',
        seminarCompleted: 'Seminar completed',
        pastSeminar: 'Past seminar · 25.9.2026',
        archivedSeminar: 'View archived seminar',
        eventCompleted: 'Event completed',
        archive: 'Archive',
        eventDetails: 'Event details <span aria-hidden="true">→</span>'
      }
    : {
        currentPrice: 'המחיר הנוכחי',
        earlyRegistration: 'הרשמה מוקדמת – ₪250',
        registration: 'הרשמה – ₪299',
        regularPrice: 'מחיר רגיל',
        seminarCompleted: 'הסמינר התקיים',
        pastSeminar: 'סמינר עבר · 25.9.2026',
        archivedSeminar: 'לפרטי הסמינר מהארכיון',
        eventCompleted: 'האירוע התקיים',
        archive: 'מהארכיון',
        eventDetails: 'לפרטי האירוע <span aria-hidden="true">←</span>'
      };

  var campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var campaignStorageKey = 'luckyroll13_campaign';
  var campaign = {};
  var currentParams = new URLSearchParams(window.location.search);

  campaignKeys.forEach(function (key) {
    var value = currentParams.get(key);
    if (value) campaign[key] = value.slice(0, 160);
  });

  try {
    if (Object.keys(campaign).length) {
      window.sessionStorage.setItem(campaignStorageKey, JSON.stringify(campaign));
    } else {
      campaign = JSON.parse(window.sessionStorage.getItem(campaignStorageKey) || '{}');
    }
  } catch (error) {
    campaign = campaign || {};
  }

  document.querySelectorAll('[data-preserve-utm]').forEach(function (link) {
    var url;

    try {
      url = new URL(link.href, window.location.href);
    } catch (error) {
      return;
    }

    if (url.origin !== window.location.origin) return;

    Object.keys(campaign).forEach(function (key) {
      url.searchParams.set(key, campaign[key]);
    });

    link.href = url.toString();
  });

  var campaignParameters = {
    campaign_name: campaign.utm_campaign || 'javier_zaruski_north_2026',
    event_location: 'nesher',
    event_date: '2026-09-25'
  };

  Object.keys(campaign).forEach(function (key) {
    campaignParameters[key] = campaign[key];
  });

  function trackSeminarEvent(eventName, link) {
    var parameters = Object.assign({}, campaignParameters, {
      page_location: window.location.href
    });

    if (link) parameters.link_url = link.href;

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, parameters);
    }

    var metaEventMap = {
      seminar_page_view: 'ViewContent',
      seminar_paybox_click: 'InitiateCheckout',
      seminar_whatsapp_click: 'Lead'
    };

    if (typeof window.fbq === 'function' && metaEventMap[eventName]) {
      window.fbq('track', metaEventMap[eventName], parameters);
    }
  }

  var isSeminarPage = document.body.classList.contains('seminar-page');

  if (isSeminarPage && !window.__luckyRoll13SeminarPageViewTracked) {
    window.__luckyRoll13SeminarPageViewTracked = true;
    trackSeminarEvent('seminar_page_view');
  }

  document.addEventListener('click', function trackSeminarClick(event) {
    var target = event.target;

    if (!target || typeof target.closest !== 'function') return;

    var link = target.closest('a[data-seminar-track]');
    if (!link) return;

    var eventName = link.getAttribute('data-seminar-track');
    var supportedEvents = ['seminar_paybox_click', 'seminar_whatsapp_click', 'seminar_maps_click', 'seminar_video_click'];
    if (supportedEvents.indexOf(eventName) !== -1) trackSeminarEvent(eventName, link);
  });

  var now = Date.now();
  var priceCutoff = Date.parse('2026-09-22T00:00:00+03:00');
  var eventEnd = Date.parse('2026-09-25T15:00:00+03:00');
  var eventIsPast = Number.isFinite(eventEnd) && now >= eventEnd;
  var currentTier = now < priceCutoff ? 'early' : 'regular';

  document.querySelectorAll('[data-pricing]').forEach(function (pricing) {
    pricing.querySelectorAll('[data-price-tier]').forEach(function (card) {
      var current = card.getAttribute('data-price-tier') === currentTier;
      card.classList.toggle('is-current', current && !eventIsPast);

      var label = card.querySelector('[data-current-label]');
      if (label) label.textContent = current && !eventIsPast ? copy.currentPrice : '';
    });
  });

  document.querySelectorAll('[data-current-price]').forEach(function (node) {
    node.textContent = currentTier === 'early' ? '₪250' : '₪299';
  });

  document.querySelectorAll('[data-sticky-label]').forEach(function (node) {
    node.textContent = currentTier === 'early' ? copy.earlyRegistration : copy.registration;
  });

  var eventSchema = document.getElementById('seminar-event-schema');

  if (eventSchema) {
    try {
      var schema = JSON.parse(eventSchema.textContent);

      if (eventIsPast) {
        schema.eventStatus = 'https://schema.org/EventCompleted';
        delete schema.offers;
      } else if (currentTier === 'regular') {
        schema.offers = {
          '@type': 'Offer',
          name: copy.regularPrice,
          price: '299',
          priceCurrency: 'ILS',
          url: isEnglish
            ? 'https://luckyroll13.com/en/javier-zaruski-seminar/'
            : 'https://luckyroll13.com/javier-zaruski-seminar/',
          availability: 'https://schema.org/InStock'
        };
      }

      eventSchema.textContent = JSON.stringify(schema);
    } catch (error) {
      // Keep the valid server-rendered JSON-LD if a future edit is malformed.
    }
  }

  if (eventIsPast) {
    document.body.classList.add('event-is-past');
    document.querySelectorAll('[data-event-sales]').forEach(function (node) {
      node.hidden = true;
    });
    document.querySelectorAll('[data-event-status]').forEach(function (status) {
      status.classList.add('is-past');
      status.innerHTML = '<span aria-hidden="true"></span>' + copy.seminarCompleted;
    });
    document.querySelectorAll('[data-event-history]').forEach(function (node) {
      node.hidden = false;
    });
  }

  document.querySelectorAll('[data-home-event-promo]').forEach(function (promo) {
    if (eventIsPast) promo.hidden = true;
  });

  document.querySelectorAll('[data-seminar-promo]').forEach(function (promo) {
    if (!eventIsPast) return;

    promo.classList.add('is-past-event');

    var promoEyebrow = promo.querySelector('[data-seminar-promo-eyebrow]');
    if (promoEyebrow) promoEyebrow.textContent = copy.pastSeminar;

    var promoCta = promo.querySelector('[data-seminar-promo-cta]');
    if (promoCta) promoCta.textContent = copy.archivedSeminar;
  });

  var upcomingList = document.querySelector('[data-upcoming-list]');
  var pastList = document.querySelector('[data-past-list]');

  if (upcomingList && pastList) {
    document.querySelectorAll('[data-event-card][data-event-end]').forEach(function (card) {
      var cardEnd = Date.parse(card.getAttribute('data-event-end'));

      if (!Number.isFinite(cardEnd) || now < cardEnd) return;

      card.classList.add('is-past-event');
      pastList.appendChild(card);

      var cardStatus = card.querySelector('[data-event-status]');

      if (cardStatus) {
        cardStatus.classList.add('is-past');
        cardStatus.innerHTML = '<span aria-hidden="true"></span>' + copy.eventCompleted;
      }

      var cardEyebrow = card.querySelector('.featured-event-copy > .eyebrow');
      if (cardEyebrow) cardEyebrow.textContent = copy.archive;

      var cardCta = card.querySelector('[data-event-card-cta]');
      if (cardCta) cardCta.innerHTML = copy.eventDetails;
    });

    var upcomingEmpty = document.querySelector('[data-upcoming-empty]');
    var pastEmpty = document.querySelector('[data-past-empty]');
    var hasUpcomingEvents = upcomingList.querySelector('[data-event-card]') !== null;
    var hasPastEvents = pastList.querySelector('[data-event-card]') !== null;

    if (upcomingEmpty) upcomingEmpty.hidden = hasUpcomingEvents;
    if (pastEmpty) pastEmpty.hidden = hasPastEvents;
  }
})(window, document);
