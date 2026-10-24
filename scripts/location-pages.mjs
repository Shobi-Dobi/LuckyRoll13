import {
  business,
  businessSchema,
  goshenPlaceSchema,
  localized,
  locations,
  scheduleLastUpdated
} from './locations-schedule-data.mjs';

const productionOrigin = 'https://luckyroll13.com';

const pageCopy = {
  schedule: {
    he: {
      title: 'מערכת שעות אימונים | ג׳יו ג׳יטסו, אגרוף ו־MMA | Lucky Roll13',
      description: 'מערכת השעות המעודכנת של Lucky Roll13 לילדים ולבוגרים בשני סניפים בקריית מוצקין: סניף נווה גנים במנחם בגין 26 וסניף מתנ״ס גושן בקק״ל 23א׳.',
      h1: 'מערכת שעות האימונים של Lucky Roll13',
      eyebrow: 'LUCKY ROLL13 · מערכת שעות',
      intro: 'ב־Lucky Roll13 מתקיימים אימוני ילדים ובוגרים, ג׳יו־ג׳יטסו ברזילאי (BJJ), אגרוף ו־MMA. כאן תמצאו את מערכת השעות המעודכנת בסניף נווה גנים ברחוב מנחם בגין 26 ובסניף מתנ״ס גושן ברחוב קק״ל 23א׳, שניהם בקריית מוצקין.',
      breadcrumb: 'מערכת שעות',
      lastUpdatedLabel: 'עודכן לאחרונה',
      tableCaption: (name) => `מערכת שעות האימונים ב${name}`,
      columns: ['ימים', 'שעה', 'אימון', 'קבוצה'],
      addressLabel: 'כתובת',
      directions: 'ניווט ב־Google Maps',
      waze: 'ניווט ב־Waze',
      locationDetails: 'פרטי המיקום',
      cta: 'לתיאום אימון ניסיון',
      note: 'מומלץ ליצור קשר לפני ההגעה כדי לוודא התאמה לקבוצה ולרמת האימון.',
      whatsapp: 'היי Lucky Roll13, אשמח לתאם אימון ניסיון.'
    },
    en: {
      title: 'Training Schedule | BJJ, Boxing & MMA | Lucky Roll13',
      description: 'View the current Lucky Roll13 timetable for children and adults at two Kiryat Motzkin locations: Neve Ganim at 26 Menachem Begin St. and Matnas Goshen at 23A KKL St.',
      h1: 'Lucky Roll13 Training Schedule',
      eyebrow: 'LUCKY ROLL13 · TRAINING SCHEDULE',
      intro: 'Lucky Roll13 offers classes for children and adults, Brazilian Jiu-Jitsu (BJJ), Boxing and MMA. This page shows the current schedule at the Neve Ganim location at 26 Menachem Begin St. and the Matnas Goshen location at 23A KKL St., both in Kiryat Motzkin.',
      breadcrumb: 'Training Schedule',
      lastUpdatedLabel: 'Last updated',
      tableCaption: (name) => `Training schedule in ${name}`,
      columns: ['Days', 'Time', 'Training', 'Group'],
      addressLabel: 'Address',
      directions: 'Directions in Google Maps',
      waze: 'Directions in Waze',
      locationDetails: 'Location details',
      cta: 'Book a trial class',
      note: 'Please contact us before arriving so we can confirm the right group and training level.',
      whatsapp: 'Hi Lucky Roll13, I would like to book a trial class.'
    }
  },
  goshen: {
    he: {
      title: 'ג׳יו־ג׳יטסו לילדים ולבוגרים במתנ״ס גושן, קריית מוצקין | Lucky Roll13',
      description: 'אימוני ג׳יו־ג׳יטסו BJJ של Lucky Roll13 במתנ״ס גושן, רחוב קק״ל 23א׳, קריית מוצקין. קבוצות לילדים בגילאי 5–7 ו־8–13 ולבוגרים בימי שני וחמישי.',
      h1: 'ג׳יו־ג׳יטסו במתנ״ס גושן, קריית מוצקין',
      eyebrow: 'LUCKY ROLL13 · סניף גושן',
      intro: 'סניף Lucky Roll13 פועל בתוך מתנ״ס גושן, ברחוב קק״ל 23א׳ בקריית מוצקין. אימוני הג׳יו־ג׳יטסו (BJJ) מתקיימים בימי שני וחמישי בקבוצות לילדים ולבוגרים.',
      breadcrumb: 'סניף גושן, קריית מוצקין',
      localIntro: 'מסגרת ג׳יו־ג׳יטסו מקצועית, קהילתית ומדורגת לתושבי קריית מוצקין והקריות, עם קבוצות המותאמות לפי גיל ושעות קבועות ונוחות אחר הצהריים.',
      servicesTitle: 'קבוצות הג׳יו־ג׳יטסו בסניף גושן',
      services: [
        {
          title: 'ילדים בגילאי 5–7',
          text: 'אימון ג׳יו־ג׳יטסו מותאם לילדים הצעירים בימי שני וחמישי, בין 17:00 ל־17:45, במסגרת מסודרת ובהתאם לגיל הקבוצה.',
          href: '/kids/',
          linkLabel: 'מידע על אימוני ילדים'
        },
        {
          title: 'ילדים בגילאי 8–13',
          text: 'אימון ג׳יו־ג׳יטסו לילדים ולנוער הצעיר בימי שני וחמישי, בין 17:45 ל־18:30, בקבוצה המותאמת לטווח הגילים.',
          href: '/kids/',
          linkLabel: 'מידע על אימוני ילדים ונוער'
        },
        {
          title: 'קבוצת בוגרים',
          text: 'אימון ג׳יו־ג׳יטסו לבוגרים בימי שני וחמישי, בין 18:30 ל־19:30, במסגרת מקצועית ובשעה קבועה.',
          href: '/bjj/',
          linkLabel: 'מידע על אימוני ג׳יו־ג׳יטסו'
        }
      ],
      addressTitle: 'איך מגיעים לסניף גושן?',
      addressLabel: 'כתובת',
      directions: 'ניווט ב־Google Maps',
      waze: 'ניווט ב־Waze',
      scheduleTitle: 'מערכת השעות בסניף גושן',
      scheduleLink: 'למערכת השעות המלאה',
      tableCaption: 'מערכת שעות האימונים של Lucky Roll13 במתנ״ס גושן',
      columns: ['ימים', 'שעה', 'אימון', 'קבוצה'],
      ctaTitle: 'רוצים להגיע לאימון ניסיון?',
      ctaText: 'כתבו לנו את גיל המתאמן או המתאמנת, ונעזור לבחור את קבוצת גושן המתאימה לפני ההגעה.',
      cta: 'לתיאום אימון ניסיון',
      whatsapp: 'היי Lucky Roll13, אשמח לתאם אימון ניסיון בסניף גושן בקריית מוצקין.',
      faqTitle: 'שאלות נפוצות על סניף גושן',
      faqEyebrow: 'שאלות נפוצות',
      faq: [
        ['איפה נמצא סניף גושן של Lucky Roll13?', 'הסניף נמצא ברחוב קק״ל 23א׳, קריית מוצקין, בתוך מתנ״ס גושן.'],
        ['באילו ימים מתקיימים האימונים בסניף גושן?', 'האימונים מתקיימים בימי שני וחמישי.'],
        ['מהן שעות אימוני הג׳יו־ג׳יטסו לילדים?', 'ילדים בגילאי 5–7 מתאמנים בג׳יו־ג׳יטסו בשעה 17:00–17:45, וילדים בגילאי 8–13 מתאמנים בשעה 17:45–18:30.'],
        ['מתי מתקיים אימון הג׳יו־ג׳יטסו לבוגרים?', 'אימון הג׳יו־ג׳יטסו לבוגרים מתקיים בימי שני וחמישי בשעה 18:30–19:30.'],
        ['איך מתאמים אימון ניסיון?', 'אפשר לשלוח הודעת WhatsApp או להתקשר ל־054-642-0206. נתאים את הקבוצה לפי גיל וניסיון.']
      ]
    },
    en: {
      title: 'BJJ at Matnas Goshen, Kiryat Motzkin | Lucky Roll13',
      description: 'Lucky Roll13 Brazilian Jiu-Jitsu (BJJ) at Matnas Goshen, 23A KKL St., Kiryat Motzkin. Monday and Thursday groups for ages 5–7, ages 8–13 and adults.',
      h1: 'Brazilian Jiu-Jitsu at Matnas Goshen, Kiryat Motzkin',
      eyebrow: 'LUCKY ROLL13 · GOSHEN LOCATION',
      intro: 'The Lucky Roll13 location operates inside Matnas Goshen at 23A KKL St., Kiryat Motzkin. Brazilian Jiu-Jitsu (BJJ) classes are held on Mondays and Thursdays in age-specific groups for children and adults.',
      breadcrumb: 'Goshen location, Kiryat Motzkin',
      localIntro: 'A structured, community-focused Brazilian Jiu-Jitsu program for Kiryat Motzkin and the Krayot, with age-based groups and convenient fixed afternoon times.',
      servicesTitle: 'Brazilian Jiu-Jitsu groups at Goshen',
      services: [
        {
          title: 'Children ages 5–7',
          text: 'An age-appropriate Brazilian Jiu-Jitsu class on Mondays and Thursdays from 17:00 to 17:45 in a structured group for younger children.',
          href: '/en/kids/',
          linkLabel: 'Kids training information'
        },
        {
          title: 'Children ages 8–13',
          text: 'A Brazilian Jiu-Jitsu class for children and young teens on Mondays and Thursdays from 17:45 to 18:30, matched to this age range.',
          href: '/en/kids/',
          linkLabel: 'Kids and youth training information'
        },
        {
          title: 'Adults group',
          text: 'Brazilian Jiu-Jitsu training for adults on Mondays and Thursdays from 18:30 to 19:30 in a professional group at a fixed time.',
          href: '/en/bjj/',
          linkLabel: 'Brazilian Jiu-Jitsu training information'
        }
      ],
      addressTitle: 'How to reach the Goshen location',
      addressLabel: 'Address',
      directions: 'Directions in Google Maps',
      waze: 'Directions in Waze',
      scheduleTitle: 'Goshen training schedule',
      scheduleLink: 'View the full training schedule',
      tableCaption: 'Lucky Roll13 training schedule at Matnas Goshen',
      columns: ['Days', 'Time', 'Training', 'Group'],
      ctaTitle: 'Want to try a class?',
      ctaText: 'Tell us the participant’s age, and we will help you choose the right Goshen group before you arrive.',
      cta: 'Book a trial class',
      whatsapp: 'Hi Lucky Roll13, I would like to book a trial class at the Goshen location in Kiryat Motzkin.',
      faqTitle: 'Frequently asked questions about the Goshen location',
      faqEyebrow: 'Frequently Asked Questions',
      faq: [
        ['Where is the Lucky Roll13 Goshen location?', 'The location is at 23A KKL St., Kiryat Motzkin, inside Matnas Goshen.'],
        ['Which days are classes held at Goshen?', 'Classes are held on Mondays and Thursdays.'],
        ['What are the children’s Brazilian Jiu-Jitsu class times?', 'Children ages 5–7 train in Brazilian Jiu-Jitsu from 17:00–17:45, and children ages 8–13 train from 17:45–18:30.'],
        ['When is the adults Brazilian Jiu-Jitsu class?', 'The adults Brazilian Jiu-Jitsu class is held on Mondays and Thursdays from 18:30–19:30.'],
        ['How do I book a trial class?', 'Send us a WhatsApp message or call 054-642-0206. We will recommend a group based on age and experience.']
      ]
    }
  }
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function schemaScript(graph) {
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

function whatsappUrl(message) {
  return `https://wa.me/${business.schemaPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
}

function generatedPagePath(pageKey, language) {
  if (pageKey === 'schedule') return language === 'en' ? '/en/schedule/' : '/schedule/';
  if (pageKey === 'goshen') return localized(locations.goshenKiryatMotzkin.route, language);
  throw new Error(`Unknown generated page: ${pageKey}`);
}

function renderBreadcrumbs(pageKey, language) {
  const copy = pageCopy[pageKey][language];
  const homeHref = language === 'en' ? '/en/' : '/';
  const homeLabel = language === 'en' ? 'Home' : 'דף הבית';
  const ariaLabel = language === 'en' ? 'Breadcrumbs' : 'פירורי לחם';
  return `<nav class="breadcrumbs" aria-label="${ariaLabel}"><ol><li><a href="${homeHref}">${homeLabel}</a></li><li aria-current="page">${copy.breadcrumb}</li></ol></nav>`;
}

const servicePaths = {
  bjj: { he: '/bjj/', en: '/en/bjj/' },
  boxing: { he: '/boxing/', en: '/en/boxing/' },
  'women-boxing': { he: '/women-boxing/', en: '/en/women-boxing/' },
  mma: { he: '/mma/', en: '/en/mma/' }
};

function servicePath(session, language) {
  if (!session.service) return '';
  const path = servicePaths[session.service]?.[language];
  if (!path) throw new Error(`Unknown schedule service: ${session.service}`);
  return path;
}

function renderTrainingName(session, language) {
  const label = escapeHtml(localized(session.training, language));
  const path = servicePath(session, language);
  return path ? `<a href="${path}">${label}</a>` : label;
}

function renderScheduleRows(location, language) {
  return location.dayGroups.flatMap((dayGroup) => dayGroup.sessions.map((session) => {
    const audience = localized(session.audience, language);
    return `<tr><th scope="row">${localized(dayGroup.label, language)}</th><td><bdi dir="ltr">${session.time}</bdi></td><td>${renderTrainingName(session, language)}</td><td>${audience || '—'}</td></tr>`;
  })).join('');
}

function renderScheduleTable(location, language, caption, columns) {
  return `<div class="schedule-table-wrap" tabindex="0" role="region" aria-label="${escapeHtml(caption)}"><table class="schedule-table"><caption>${caption}</caption><thead><tr><th scope="col">${columns[0]}</th><th scope="col">${columns[1]}</th><th scope="col">${columns[2]}</th><th scope="col">${columns[3]}</th></tr></thead><tbody>${renderScheduleRows(location, language)}</tbody></table></div>`;
}

function scheduleItemList(language) {
  const itemListElement = [];
  let position = 1;
  for (const location of Object.values(locations)) {
    for (const dayGroup of location.dayGroups) {
      for (const session of dayGroup.sessions) {
        const audience = localized(session.audience, language);
        const trainingName = [
          localized(dayGroup.label, language),
          session.time,
          localized(session.training, language),
          audience
        ].filter(Boolean).join(' — ');
        itemListElement.push({
          '@type': 'ListItem',
          position,
          item: {
            '@type': 'Thing',
            name: trainingName,
            ...(servicePath(session, language) ? { url: `${productionOrigin}${servicePath(session, language)}` } : {}),
            description: `${localized(location.name, language)} — ${localized(location.address, language)}`,
            location: { '@id': location.schemaId },
            provider: { '@id': business.schemaId }
          }
        });
        position += 1;
      }
    }
  }
  return {
    '@type': 'ItemList',
    '@id': `${productionOrigin}/${language === 'en' ? 'en/' : ''}schedule/#timetable`,
    name: language === 'en' ? 'Lucky Roll13 Training Schedule' : 'מערכת שעות האימונים של Lucky Roll13',
    itemListElement
  };
}

function webPageSchema(pageKey, language, copy) {
  const path = generatedPagePath(pageKey, language);
  const pageUrl = productionOrigin + path;
  const about = pageKey === 'schedule'
    ? [{ '@id': business.schemaId }, { '@id': locations.goshenKiryatMotzkin.schemaId }]
    : { '@id': locations.goshenKiryatMotzkin.schemaId };
  const result = {
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: copy.title,
    description: copy.description,
    inLanguage: language === 'en' ? 'en-US' : 'he-IL',
    about
  };
  result.mainEntity = pageKey === 'schedule'
    ? { '@id': `${pageUrl}#timetable` }
    : { '@id': locations.goshenKiryatMotzkin.schemaId };
  return result;
}

function breadcrumbSchema(pageKey, language, copy) {
  const homeUrl = `${productionOrigin}${language === 'en' ? '/en/' : '/'}`;
  const pagePath = generatedPagePath(pageKey, language);
  return {
    '@type': 'BreadcrumbList',
    '@id': `${productionOrigin}${pagePath}#breadcrumbs`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Lucky Roll13', item: homeUrl },
      { '@type': 'ListItem', position: 2, name: copy.breadcrumb, item: `${productionOrigin}${pagePath}` }
    ]
  };
}

function faqSchema(language, faq) {
  const pagePath = generatedPagePath('goshen', language);
  return {
    '@type': 'FAQPage',
    '@id': `${productionOrigin}${pagePath}#faq`,
    mainEntity: faq.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  };
}

function goshenServiceSchemas(language) {
  const english = language === 'en';
  const pageUrl = `${productionOrigin}${generatedPagePath('goshen', language)}`;
  const services = [
    {
      id: 'children-ages-5-7',
      name: english ? 'Brazilian Jiu-Jitsu for children ages 5–7 at Matnas Goshen' : 'אימון ג׳יו־ג׳יטסו לילדים בגילאי 5–7 במתנ״ס גושן',
      audience: english ? 'Children ages 5–7' : 'ילדים בגילאי 5–7'
    },
    {
      id: 'children-ages-8-13',
      name: english ? 'Brazilian Jiu-Jitsu for children ages 8–13 at Matnas Goshen' : 'אימון ג׳יו־ג׳יטסו לילדים בגילאי 8–13 במתנ״ס גושן',
      audience: english ? 'Children ages 8–13' : 'ילדים בגילאי 8–13'
    },
    {
      id: 'adults',
      name: english ? 'Brazilian Jiu-Jitsu for adults at Matnas Goshen' : 'אימון ג׳יו־ג׳יטסו לבוגרים במתנ״ס גושן',
      audience: english ? 'Adults' : 'בוגרים'
    }
  ];

  return services.map((service) => ({
    '@type': 'Service',
    '@id': `${pageUrl}#${service.id}`,
    name: service.name,
    serviceType: english ? 'Brazilian Jiu-Jitsu (BJJ)' : 'ג׳יו־ג׳יטסו ברזילאי (BJJ)',
    url: pageUrl,
    provider: { '@id': business.schemaId },
    areaServed: { '@id': locations.goshenKiryatMotzkin.schemaId },
    ...(service.audience ? { audience: { '@type': 'Audience', audienceType: service.audience } } : {})
  }));
}

function renderHead(pageKey, language, copy, graph, assetVersions) {
  const english = language === 'en';
  const hePath = generatedPagePath(pageKey, 'he');
  const enPath = generatedPagePath(pageKey, 'en');
  const canonicalPath = english ? enPath : hePath;
  const canonicalUrl = productionOrigin + canonicalPath;
  const shareImage = `${productionOrigin}/assets/images/hero.webp`;
  return `<head>
  <script>document.documentElement.classList.add('js-enabled');</script>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(copy.title)}</title>
  <meta name="description" content="${escapeHtml(copy.description)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" hreflang="he" href="${productionOrigin + hePath}">
  <link rel="alternate" hreflang="en" href="${productionOrigin + enPath}">
  <link rel="alternate" hreflang="x-default" href="${productionOrigin + hePath}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${english ? 'en_US' : 'he_IL'}">
  <meta property="og:site_name" content="Lucky Roll13">
  <meta property="og:title" content="${escapeHtml(copy.title)}">
  <meta property="og:description" content="${escapeHtml(copy.description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${shareImage}">
  <meta property="og:image:alt" content="${escapeHtml(english ? 'Training at Lucky Roll13' : 'אימון ב־Lucky Roll13')}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(copy.title)}">
  <meta name="twitter:description" content="${escapeHtml(copy.description)}">
  <meta name="twitter:image" content="${shareImage}">
  <link rel="icon" href="/assets/logo.png">
  <link rel="stylesheet" href="/assets/style.css?v=${assetVersions.style}">
  ${schemaScript(graph)}
  <script defer src="/assets/tracking.js?v=${assetVersions.script}"></script>
  <script defer src="/assets/site.js?v=${assetVersions.script}"></script>
</head>`;
}

function renderSchedulePage(language) {
  const copy = pageCopy.schedule[language];
  const locationSections = Object.values(locations).map((location) => {
    const name = localized(location.name, language);
    const scheduleAnchor = location.scheduleAnchor || `schedule-${location.key}`;
    return `<article class="schedule-location schedule-location--${location.accent}" aria-labelledby="${scheduleAnchor}"><h2 id="${scheduleAnchor}">${name}</h2><address><strong>${copy.addressLabel}:</strong> ${localized(location.address, language)}</address><div class="actions"><a class="btn alt" href="${escapeHtml(location.mapUrl)}" target="_blank" rel="noopener">${copy.directions}</a><a class="btn alt" href="${escapeHtml(location.wazeUrl)}" target="_blank" rel="noopener">${copy.waze}</a><a class="btn alt" href="${localized(location.route, language)}">${copy.locationDetails}</a></div>${renderScheduleTable(location, language, copy.tableCaption(name), copy.columns)}</article>`;
  }).join('\n');
  return `<main id="main">
  <section class="page-hero"><div class="wrap">${renderBreadcrumbs('schedule', language)}<div class="eyebrow">${copy.eyebrow}</div><h1>${copy.h1}</h1><p class="lead">${copy.intro}</p><p class="schedule-updated">${copy.lastUpdatedLabel}: <time datetime="${scheduleLastUpdated.iso}">${localized(scheduleLastUpdated, language)}</time></p><div class="actions"><a class="btn" data-trial-cta href="${whatsappUrl(copy.whatsapp)}">${copy.cta}</a></div></div></section>
  <section class="section"><div class="wrap schedule-locations">${locationSections}</div></section>
  <section class="section"><div class="wrap content"><p>${copy.note}</p><div class="actions"><a class="btn" data-trial-cta href="${whatsappUrl(copy.whatsapp)}">${copy.cta}</a></div></div></section>
</main>`;
}

function renderGoshenPage(language) {
  const copy = pageCopy.goshen[language];
  const location = locations.goshenKiryatMotzkin;
  const services = copy.services.map((service) => `<article class="location-service"><h3>${service.title}</h3><p>${service.text}</p><a href="${service.href}">${service.linkLabel}</a></article>`).join('');
  const faqs = copy.faq.map(([question, answer]) => `<details><summary>${question}</summary><p>${answer}</p></details>`).join('');
  return `<main id="main">
  <section class="page-hero"><div class="wrap">${renderBreadcrumbs('goshen', language)}<div class="eyebrow">${copy.eyebrow}</div><h1>${copy.h1}</h1><p class="lead">${copy.intro}</p><div class="actions"><a class="btn" data-trial-cta href="${whatsappUrl(copy.whatsapp)}">${copy.cta}</a><a class="btn alt" href="${language === 'en' ? '/en/schedule/' : '/schedule/'}">${copy.scheduleLink}</a></div></div></section>
  <section class="section"><div class="wrap content"><p class="lead">${copy.localIntro}</p><h2>${copy.servicesTitle}</h2><div class="grid location-services">${services}</div></div></section>
  <section class="section"><div class="wrap contact"><h2>${copy.addressTitle}</h2><p><strong>${copy.addressLabel}:</strong> ${localized(location.address, language)}</p><div class="actions"><a class="btn" href="${escapeHtml(location.mapUrl)}" target="_blank" rel="noopener">${copy.directions}</a><a class="btn alt" href="${escapeHtml(location.wazeUrl)}" target="_blank" rel="noopener">${copy.waze}</a><a class="btn alt" href="tel:${business.schemaPhone}"><bdi dir="ltr">${business.displayPhone}</bdi></a></div></div></section>
  <section class="section" aria-labelledby="goshen-schedule-title"><div class="wrap"><div class="schedule-location schedule-location--goshen"><h2 id="goshen-schedule-title">${copy.scheduleTitle}</h2>${renderScheduleTable(location, language, copy.tableCaption, copy.columns)}<div class="actions"><a class="btn alt" href="${language === 'en' ? '/en/schedule/' : '/schedule/'}">${copy.scheduleLink}</a></div></div></div></section>
  <section class="section"><div class="wrap contact"><h2>${copy.ctaTitle}</h2><p>${copy.ctaText}</p><div class="actions"><a class="btn" data-trial-cta href="${whatsappUrl(copy.whatsapp)}">${copy.cta}</a><a class="btn alt" href="tel:${business.schemaPhone}"><bdi dir="ltr">${business.displayPhone}</bdi></a></div></div></section>
  <section class="section faq" aria-labelledby="goshen-faq-title"><div class="wrap content"><div class="eyebrow">${copy.faqEyebrow}</div><h2 id="goshen-faq-title">${copy.faqTitle}</h2>${faqs}</div></section>
</main>`;
}

export function renderSharedFooter(language) {
  const english = language === 'en';
  const motzkin = locations.kiryatMotzkin;
  const goshen = locations.goshenKiryatMotzkin;
  const schedulePath = english ? '/en/schedule/' : '/schedule/';
  const contactPath = english ? '/en/contact/' : '/contact/';
  const accessibilityPath = english ? '/en/accessibility/' : '/accessibility/';
  return `<footer class="footer"><div class="wrap footer-row">
  <div><strong>${business.name}</strong><br>${english ? 'Training for children and adults in Kiryat Motzkin and the Krayot' : 'אימונים לילדים ולבוגרים בקריית מוצקין והקריות'}<br><a href="${business.facebook}" target="_blank" rel="noopener">Facebook</a> · <a href="${business.instagram}" target="_blank" rel="noopener">Instagram</a></div>
  <div><strong><a href="${localized(motzkin.route, language)}">${localized(motzkin.name, language)}</a></strong><br>${localized(motzkin.address, language)}<br><a href="${escapeHtml(motzkin.mapUrl)}" target="_blank" rel="noopener">Google Maps</a> · <a href="${escapeHtml(motzkin.wazeUrl)}" target="_blank" rel="noopener">Waze</a></div>
  <div><strong><a href="${localized(goshen.route, language)}">${localized(goshen.name, language)}</a></strong><br>${localized(goshen.address, language)}<br><a href="${escapeHtml(goshen.mapUrl)}" target="_blank" rel="noopener">Google Maps</a> · <a href="${escapeHtml(goshen.wazeUrl)}" target="_blank" rel="noopener">Waze</a></div>
  <div><a href="tel:${business.schemaPhone}"><bdi dir="ltr">${business.displayPhone}</bdi></a><br><a href="${schedulePath}">${english ? 'Training Schedule' : 'מערכת שעות'}</a> · <a href="${contactPath}">${english ? 'Contact' : 'צור קשר'}</a><br><a href="${accessibilityPath}">${english ? 'Accessibility Statement' : 'הצהרת נגישות'}</a></div>
</div></footer>`;
}

export function renderGeneratedPage(pageKey, language, { header, footer, assetVersions }) {
  const copy = pageCopy[pageKey][language];
  const graph = pageKey === 'schedule'
    ? [businessSchema(language), goshenPlaceSchema(language), webPageSchema(pageKey, language, copy), breadcrumbSchema(pageKey, language, copy), scheduleItemList(language)]
    : [businessSchema(language), goshenPlaceSchema(language), ...goshenServiceSchemas(language), webPageSchema(pageKey, language, copy), breadcrumbSchema(pageKey, language, copy), faqSchema(language, copy.faq)];
  const main = pageKey === 'schedule' ? renderSchedulePage(language) : renderGoshenPage(language);
  const mobileLabel = language === 'en' ? 'Send us a WhatsApp message' : 'שלחו הודעה ב־WhatsApp';
  return `<!doctype html>
<html lang="${language}" dir="${language === 'en' ? 'ltr' : 'rtl'}">
${renderHead(pageKey, language, copy, graph, assetVersions)}
<body>
  <a class="skip" href="#main">${language === 'en' ? 'Skip to content' : 'דלגו לתוכן'}</a>
  ${header}
  ${main}
  ${footer}
  <a class="mobile-wa" data-trial-cta href="${whatsappUrl(copy.whatsapp)}">${mobileLabel}</a>
</body>
</html>`;
}
