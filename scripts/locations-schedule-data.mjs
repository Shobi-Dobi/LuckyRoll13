export const scheduleLastUpdated = {
  iso: '2026-10-24',
  he: '24 באוקטובר 2026',
  en: 'October 24, 2026'
};

export const business = {
  name: 'Lucky Roll13',
  schemaId: 'https://luckyroll13.com/#business',
  url: 'https://luckyroll13.com/',
  displayPhone: '054-642-0206',
  schemaPhone: '+972546420206',
  facebook: 'https://www.facebook.com/luckyRoll13/',
  instagram: 'https://www.instagram.com/luckyroll13_boxing_jiujitsu/',
  googleMaps: 'https://maps.google.com/?cid=8832126799717426719',
  logo: 'https://luckyroll13.com/assets/images/luckyroll13-header-logo-1200.webp',
  image: 'https://luckyroll13.com/assets/images/hero.webp'
};

export const locations = {
  kiryatMotzkin: {
    key: 'kiryatMotzkin',
    schemaType: 'SportsActivityLocation',
    schemaId: business.schemaId,
    route: { he: '/kiryat-motzkin/', en: '/en/kiryat-motzkin/' },
    name: { he: 'נווה גנים, קריית מוצקין', en: 'Neve Ganim, Kiryat Motzkin' },
    shortLabel: { he: 'נווה גנים', en: 'Neve Ganim' },
    scheduleAnchor: 'schedule-neve-ganim',
    address: {
      he: 'מנחם בגין 26, קריית מוצקין',
      en: '26 Menachem Begin St., Kiryat Motzkin',
      streetAddress: { he: 'מנחם בגין 26', en: '26 Menachem Begin St.' },
      addressLocality: { he: 'קריית מוצקין', en: 'Kiryat Motzkin' },
      addressCountry: 'IL'
    },
    mapUrl: business.googleMaps,
    wazeUrl: 'https://www.waze.com/ul?q=%D7%9E%D7%A0%D7%97%D7%9D%20%D7%91%D7%92%D7%99%D7%9F%2026%20%D7%A7%D7%A8%D7%99%D7%99%D7%AA%20%D7%9E%D7%95%D7%A6%D7%A7%D7%99%D7%9F&navigate=yes',
    accent: 'motzkin',
    containedInPlace: {
      name: { he: 'שכונת נווה גנים, קריית מוצקין', en: 'Neve Ganim neighborhood, Kiryat Motzkin' }
    },
    dayGroups: [
      {
        days: ['sunday', 'wednesday'],
        label: { he: 'ראשון ורביעי', en: 'Sunday and Wednesday' },
        sessions: [
          {
            time: '18:00–18:45',
            service: 'bjj',
            training: { he: 'ג׳יו־ג׳יטסו', en: 'Brazilian Jiu-Jitsu (BJJ)' },
            audience: { he: 'גילאי 5–7', en: 'Ages 5–7' }
          },
          {
            time: '18:45–19:30',
            service: 'bjj',
            training: { he: 'ג׳יו־ג׳יטסו', en: 'Brazilian Jiu-Jitsu (BJJ)' },
            audience: { he: 'גילאי 8–13', en: 'Ages 8–13' }
          },
          {
            time: '19:30–20:30',
            service: 'boxing',
            training: { he: 'אגרוף', en: 'Boxing' },
            audience: { he: 'נוער ובוגרים', en: 'Youth and adults' }
          },
          {
            time: '20:30–21:30',
            service: 'bjj',
            training: { he: 'ג׳יו־ג׳יטסו', en: 'Brazilian Jiu-Jitsu (BJJ)' },
            audience: { he: 'נערים ובוגרים', en: 'Teens and adults' }
          }
        ]
      },
      {
        days: ['tuesday'],
        label: { he: 'שלישי', en: 'Tuesday' },
        sessions: [
          {
            time: '14:30–15:30',
            service: 'mma',
            training: { he: 'MMA', en: 'MMA' },
            audience: { he: 'גילאי 8–13', en: 'Ages 8–13' }
          }
        ]
      },
      {
        days: ['friday'],
        label: { he: 'שישי', en: 'Friday' },
        sessions: [
          {
            time: '08:00–09:00',
            training: { he: 'אימון בוקר', en: 'Morning training' },
            audience: { he: '', en: '' }
          },
          {
            time: '09:00–10:00',
            service: 'women-boxing',
            training: { he: 'אגרוף', en: 'Boxing' },
            audience: { he: 'לנשים בלבד', en: 'Women only' }
          },
          {
            time: '10:00–12:00',
            training: { he: 'מזרן פתוח', en: 'Open mat' },
            audience: { he: '', en: '' }
          },
          {
            time: '12:00–13:00',
            service: 'mma',
            training: { he: 'MMA', en: 'MMA' },
            audience: { he: 'גילאי 8–13', en: 'Ages 8–13' }
          }
        ]
      }
    ]
  },
  goshenKiryatMotzkin: {
    key: 'goshenKiryatMotzkin',
    schemaType: 'Place',
    schemaId: 'https://luckyroll13.com/#goshen-kiryat-motzkin',
    route: { he: '/goshen-kiryat-motzkin/', en: '/en/goshen-kiryat-motzkin/' },
    name: { he: 'מתנ״ס גושן, קריית מוצקין', en: 'Matnas Goshen, Kiryat Motzkin' },
    shortLabel: { he: 'גושן', en: 'Goshen' },
    address: {
      he: 'רחוב קק״ל 23א׳, קריית מוצקין — בתוך מתנ״ס גושן',
      en: '23A KKL St., Kiryat Motzkin — inside Matnas Goshen',
      streetAddress: { he: 'רחוב קק״ל 23א׳', en: '23A KKL St.' },
      addressLocality: { he: 'קריית מוצקין', en: 'Kiryat Motzkin' },
      addressCountry: 'IL'
    },
    mapUrl: 'https://www.google.com/maps/dir/?api=1&destination=%D7%9E%D7%AA%D7%A0%D7%B4%D7%A1%20%D7%92%D7%95%D7%A9%D7%9F%2C%20%D7%A9%D7%93%D7%A8%D7%95%D7%AA%20%D7%A7%D7%A7%D7%B4%D7%9C%2023%D7%90%2C%20%D7%A7%D7%A8%D7%99%D7%99%D7%AA%20%D7%9E%D7%95%D7%A6%D7%A7%D7%99%D7%9F',
    wazeUrl: 'https://www.waze.com/he/live-map/directions/%D7%9E%D7%AA%D7%A0%D7%A1-%D7%92%D7%95%D7%A9%D7%9F-%D7%A9%D7%93%D7%A8%D7%95%D7%AA-%D7%A7%D7%A7%D7%9C-23%D7%90-%D7%A7%D7%A8%D7%99%D7%99%D7%AA-%D7%9E%D7%95%D7%A6%D7%A7%D7%99%D7%9F?to=place.w.23003464.229903571.154337',
    accent: 'goshen',
    containedInPlace: {
      name: { he: 'מתנ״ס גושן', en: 'Matnas Goshen Community Center' },
      url: 'https://www.mozkin.org.il/page.php?bc=AC5&id=140&m=42&type=matClass'
    },
    dayGroups: [
      {
        days: ['monday', 'thursday'],
        label: { he: 'שני וחמישי', en: 'Monday and Thursday' },
        sessions: [
          {
            time: '17:00–17:45',
            service: 'bjj',
            training: { he: 'ג׳יו־ג׳יטסו', en: 'Brazilian Jiu-Jitsu (BJJ)' },
            audience: { he: 'ילדים בגילאי 5–7', en: 'Children ages 5–7' }
          },
          {
            time: '17:45–18:30',
            service: 'bjj',
            training: { he: 'ג׳יו־ג׳יטסו', en: 'Brazilian Jiu-Jitsu (BJJ)' },
            audience: { he: 'ילדים בגילאי 8–13', en: 'Children ages 8–13' }
          },
          {
            time: '18:30–19:30',
            service: 'bjj',
            training: { he: 'ג׳יו־ג׳יטסו', en: 'Brazilian Jiu-Jitsu (BJJ)' },
            audience: { he: 'בוגרים', en: 'Adults' }
          }
        ]
      }
    ]
  }
};

export function localized(value, language) {
  return value?.[language] ?? value;
}

export function postalAddress(location, language) {
  return {
    '@type': 'PostalAddress',
    streetAddress: localized(location.address.streetAddress, language),
    addressLocality: localized(location.address.addressLocality, language),
    addressCountry: location.address.addressCountry
  };
}

export function businessSchema(language) {
  const areaServed = language === 'en'
    ? [
        ['City', 'Kiryat Motzkin'],
        ['City', 'Kiryat Bialik'],
        ['City', 'Kiryat Yam'],
        ['City', 'Kiryat Ata'],
        ['Place', 'Kiryat Haim'],
        ['Place', 'Krayot']
      ]
    : [
        ['City', 'קריית מוצקין'],
        ['City', 'קריית ביאליק'],
        ['City', 'קריית ים'],
        ['City', 'קריית אתא'],
        ['Place', 'קריית חיים'],
        ['Place', 'הקריות']
      ];
  return {
    '@type': 'SportsActivityLocation',
    '@id': business.schemaId,
    name: business.name,
    alternateName: 'Lucky Roll13 – Boxing & Jiu-Jitsu',
    url: business.url,
    telephone: business.schemaPhone,
    logo: business.logo,
    image: business.image,
    address: postalAddress(locations.kiryatMotzkin, language),
    containedInPlace: {
      '@type': 'Place',
      name: localized(locations.kiryatMotzkin.containedInPlace.name, language)
    },
    areaServed: areaServed.map(([type, name]) => ({ '@type': type, name })),
    sameAs: [business.facebook, business.instagram, business.googleMaps],
    hasMap: business.googleMaps
  };
}

export function goshenPlaceSchema(language) {
  const location = locations.goshenKiryatMotzkin;
  return {
    '@type': 'Place',
    '@id': location.schemaId,
    name: `${business.name} – ${localized(location.name, language)}`,
    url: `https://luckyroll13.com${location.route.he}`,
    telephone: business.schemaPhone,
    address: postalAddress(location, language),
    containedInPlace: {
      '@type': 'Place',
      name: localized(location.containedInPlace.name, language),
      url: location.containedInPlace.url
    },
    hasMap: location.mapUrl
  };
}
