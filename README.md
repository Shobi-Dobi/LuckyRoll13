# Lucky Roll13

אתר בית למועדון אמנויות הלחימה Lucky Roll13 בקריית מוצקין.
כולל עמודים למבוגרים, ילדים, בלוג, טופס יצירת קשר וטקסטים מותאמים לקידום SEO.

## IndexNow

האתר כולל קובץ אימות ציבורי וסקריפט בטוח לעדכון Bing ומנועים נוספים שתומכים ב־IndexNow.

בדיקה מקומית בלבד, ללא שליחת מידע:

```sh
node scripts/submit-indexnow.mjs
```

לאחר שהפריסה ל־Production הסתיימה וקובץ האימות זמין באתר, ניתן לשלוח את כל כתובות ה־sitemap:

```sh
node scripts/submit-indexnow.mjs --submit
```

לעדכון עמודים ספציפיים בלבד, חוזרים על `--url` לפי הצורך:

```sh
node scripts/submit-indexnow.mjs --url https://luckyroll13.com/bjj/ --url https://luckyroll13.com/schedule/ --submit
```

הסקריפט פועל במצב dry-run כברירת מחדל, מסרב לכתובות שאינן בדומיין Production, ובמצב שליחה מוודא שקובץ המפתח כבר זמין באתר לפני הפנייה ל־IndexNow.
