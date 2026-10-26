const productionOrigin = 'https://luckyroll13.com';

const image = (path, type, width, height, heAlt, enAlt) => ({
  url: `${productionOrigin}${path}`,
  type,
  width,
  height,
  alt: { he: heAlt, en: enAlt }
});

// One source of truth for social previews. Landscape images are preferred when
// the site already has a suitable, page-relevant asset.
export const socialImageByRoute = {
  home: image(
    '/assets/images/bjj-hero-1600.webp',
    'image/webp',
    1600,
    1066,
    'צוות Lucky Roll13 באולם האימונים',
    'The Lucky Roll13 team at the training gym'
  ),
  boxing: image(
    '/assets/images/boxing-hero.jpeg',
    'image/jpeg',
    1206,
    1410,
    'אימון אגרוף ב־Lucky Roll13',
    'Boxing training at Lucky Roll13'
  ),
  'women-boxing': image(
    '/assets/images/women-boxing-social-20261021.jpg',
    'image/jpeg',
    1200,
    630,
    'אימוני אגרוף לנשים ב־Lucky Roll13',
    "Women's Boxing training at Lucky Roll13"
  ),
  bjj: image(
    '/assets/images/bjj-feature.webp',
    'image/webp',
    2048,
    1365,
    'אימון ג׳יו־ג׳יטסו BJJ ב־Lucky Roll13',
    'Brazilian Jiu-Jitsu training at Lucky Roll13'
  ),
  kids: image(
    '/assets/images/kids-hero-1600.webp',
    'image/webp',
    1600,
    1066,
    'ילדים באימון אומנויות לחימה ב־Lucky Roll13',
    'Kids martial arts training at Lucky Roll13'
  ),
  mma: image(
    '/assets/images/mma-hero.jpeg',
    'image/jpeg',
    941,
    2048,
    'אימון MMA לילדים ונוער ב־Lucky Roll13',
    'MMA training for kids and youth at Lucky Roll13'
  ),
  adults: image(
    '/assets/images/bar-sarusi-coach.webp',
    'image/webp',
    1280,
    1600,
    'אימון אישי באגרוף ב־Lucky Roll13',
    'Personal Boxing training at Lucky Roll13'
  ),
  about: image(
    '/assets/images/bjj-hero-1600.webp',
    'image/webp',
    1600,
    1066,
    'צוות וקהילת Lucky Roll13',
    'The Lucky Roll13 team and community'
  ),
  collaborations: image(
    '/assets/images/collab-group-certificate-1200.webp',
    'image/webp',
    1200,
    800,
    'מאמנים ומתאמנים באירוע ג׳יו־ג׳יטסו מקצועי',
    'Coaches and athletes at a professional Jiu-Jitsu event'
  ),
  events: image(
    '/assets/images/javier-zaruski-jiu-jitsu-seminar-group-1280.webp',
    'image/webp',
    1280,
    714,
    'משתתפי סמינר Javier Zaruski בישראל',
    'Participants at the Javier Zaruski seminar in Israel'
  ),
  'javier-zaruski-seminar': image(
    '/assets/images/javier-zaruski-jiu-jitsu-seminar-group-1280.webp',
    'image/webp',
    1280,
    714,
    'משתתפי סמינר Javier Zaruski בישראל',
    'Participants at the Javier Zaruski seminar in Israel'
  ),
  'kiryat-motzkin': image(
    '/assets/images/bjj-hero-1600.webp',
    'image/webp',
    1600,
    1066,
    'צוות Lucky Roll13 באולם האימונים',
    'The Lucky Roll13 team at the training gym'
  ),
  goshen: image(
    '/assets/images/community-1200.webp',
    'image/webp',
    1200,
    800,
    'קהילת הג׳יו־ג׳יטסו של Lucky Roll13',
    'The Lucky Roll13 Brazilian Jiu-Jitsu community'
  ),
  schedule: image(
    '/assets/images/bjj-hero-1600.webp',
    'image/webp',
    1600,
    1066,
    'צוות Lucky Roll13 באולם האימונים',
    'The Lucky Roll13 team at the training gym'
  ),
  contact: image(
    '/assets/images/bjj-hero-1600.webp',
    'image/webp',
    1600,
    1066,
    'צוות Lucky Roll13 באולם האימונים',
    'The Lucky Roll13 team at the training gym'
  ),
  accessibility: image(
    '/assets/images/bjj-hero-1600.webp',
    'image/webp',
    1600,
    1066,
    'צוות Lucky Roll13 באולם האימונים',
    'The Lucky Roll13 team at the training gym'
  ),
  guide: image(
    '/assets/images/community-1200.webp',
    'image/webp',
    1200,
    800,
    'מתאמנים בקהילת Lucky Roll13',
    'Members of the Lucky Roll13 training community'
  )
};

// Only pages that exceeded the chosen search-snippet limits are overridden.
// Visible page copy and business facts remain untouched.
export const pageMetadataOverrides = {
  home: {
    he: {
      description: 'שני סניפי אומנויות לחימה בקריית מוצקין: נווה גנים במנחם בגין 26 ומתנ״ס גושן בקק״ל 23א׳. אגרוף, BJJ, MMA, ילדים ואימונים אישיים.'
    },
    en: {
      description: "Lucky Roll13 offers Boxing, BJJ, kids' MMA and personal training at Neve Ganim and Matnas Goshen in Kiryat Motzkin, serving the Krayot."
    }
  },
  adults: {
    he: {
      title: 'אימונים אישיים באגרוף ו־BJJ בקריית מוצקין | Lucky Roll13'
    },
    en: {
      title: 'Personal Boxing & BJJ in Kiryat Motzkin | Lucky Roll13'
    }
  },
  boxing: {
    en: {
      description: 'Boxing in Kiryat Motzkin and Krayot for beginners and advanced students, with group and personal training focused on technique, footwork, and fitness.'
    }
  },
  kids: {
    en: {
      title: 'Kids Martial Arts in Kiryat Motzkin | Lucky Roll13',
      description: "Kids' martial arts at Neve Ganim and Matnas Goshen in Kiryat Motzkin, with age-based groups focused on confidence, discipline, fitness, and technique."
    }
  },
  'kiryat-motzkin': {
    he: {
      title: 'אומנויות לחימה בנווה גנים, קריית מוצקין | Lucky Roll13'
    },
    en: {
      title: 'Martial Arts in Neve Ganim, Kiryat Motzkin | Lucky Roll13',
      description: "Visit Lucky Roll13 at 26 Menachem Begin St., Neve Ganim, Kiryat Motzkin for Boxing, BJJ, kids' MMA, Women's Boxing and personal training."
    }
  },
  goshen: {
    he: {
      title: 'ג׳יו־ג׳יטסו במתנ״ס גושן, קריית מוצקין | Lucky Roll13'
    },
    en: {
      title: 'BJJ at Matnas Goshen, Kiryat Motzkin | Lucky Roll13'
    }
  },
  schedule: {
    en: {
      description: 'Current Lucky Roll13 timetable for children and adults at Neve Ganim and Matnas Goshen, our two martial arts locations in Kiryat Motzkin.'
    }
  },
  contact: {
    en: {
      description: 'Book a trial class at Lucky Roll13 and get details about martial arts training at our Neve Ganim and Matnas Goshen locations in Kiryat Motzkin.'
    }
  },
  guide: {
    he: {
      title: 'איך לבחור אומנות לחימה בקריות? | Lucky Roll13'
    },
    en: {
      title: 'Which Martial Art Is Right for Me in Krayot? | Lucky Roll13',
      description: "Compare Boxing, BJJ, kids' MMA, Women's Boxing, kids' classes and personal training in Krayot by age, goal and training style."
    }
  }
};
