// สร้างหน้า HTML (ไทย/อังกฤษ) จาก i18n/*.json + data/config.json
// รัน: node tools/build.mjs   (ไม่มี dependency)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const wr = (f, s) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), s); };

const cfg = rd('data/config.json');
const I18N = { th: rd('i18n/th.json'), en: rd('i18n/en.json') };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isPh = (s) => !s || /[\[\]]/.test(s);
const site = cfg.site_url.replace(/\/$/, '');
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const SCHEMA_DAY = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
const urlOf = (lang, p = '') => `${site}/${lang === 'en' ? 'en/' : ''}${p}`;

function jsonLd(lang) {
  const o = {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    name: cfg.name[lang],
    url: urlOf(lang),
    image: `${site}/${cfg.images.og}`,
    inLanguage: lang,
  };
  if (cfg.phone.e164) o.telephone = cfg.phone.e164;
  if (!isPh(cfg.address[lang])) o.address = { '@type': 'PostalAddress', streetAddress: cfg.address[lang], addressCountry: 'TH' };
  if (cfg.geo.lat != null && cfg.geo.lng != null) o.geo = { '@type': 'GeoCoordinates', latitude: cfg.geo.lat, longitude: cfg.geo.lng };
  const spec = [];
  for (const d of DAYS) for (const iv of cfg.hours.weekly[d] || []) spec.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: SCHEMA_DAY[d], opens: iv.open, closes: iv.close });
  if (spec.length && !cfg.hours.is_sample) o.openingHoursSpecification = spec;
  const same = [cfg.social.facebook, cfg.social.line, cfg.social.google_business_profile].filter(Boolean);
  if (same.length) o.sameAs = same;
  return JSON.stringify(o, null, 2);
}

function head(lang, t, { title, desc, path: p = '', noindex = false, base }) {
  const url = urlOf(lang, p);
  return `<!doctype html>
<html lang="${lang}" data-base="${base}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#306FC7">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="th" href="${urlOf('th', p)}">
<link rel="alternate" hreflang="en" href="${urlOf('en', p)}">
<link rel="alternate" hreflang="x-default" href="${urlOf('th', p)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(cfg.name[lang])}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site}/${cfg.images.og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(t['og.alt'])}">
<meta property="og:locale" content="${lang === 'th' ? 'th_TH' : 'en_US'}">
<meta property="og:locale:alternate" content="${lang === 'th' ? 'en_US' : 'th_TH'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap">
<link rel="stylesheet" href="${base}assets/css/style.css">`;
}

const k = (t, key, tag = 'span', attrs = '') => `<${tag} data-i18n="${key}"${attrs ? ' ' + attrs : ''}>${esc(t[key])}</${tag}>`;

function indexPage(lang) {
  const t = I18N[lang];
  const base = lang === 'th' ? '' : '../';
  const other = lang === 'th' ? 'en/' : '../';
  const otherLang = lang === 'th' ? 'en' : 'th';
  const nav = [['promos', 'promos'], ['services', 'services'], ['visit', 'visit'], ['hours', 'hours'], ['order', 'order']]
    .map(([id, key]) => `<a href="#${id}" data-i18n="nav.${key}">${esc(t['nav.' + key])}</a>`).join('');
  const redirect = lang === 'th'
    ? `<script>try{if(localStorage.getItem('lang')==='en'&&!/[?&]nolang/.test(location.search)){location.replace('en/'+location.search+location.hash)}}catch(e){}</script>`
    : '';
  return `${head(lang, t, { title: t['meta.title'], desc: t['meta.description'], base })}
<script type="application/ld+json">
${jsonLd(lang)}
</script>
${redirect}
</head>
<body>
<a class="skip" href="#main" data-i18n="skip">${esc(t.skip)}</a>
<header class="top">
  <div class="top__row">
    <a class="brand" href="${lang === 'th' ? './' : './'}" aria-label="${esc(cfg.name[lang])}"><span class="brand__mark" aria-hidden="true"></span><span data-brand>${esc(cfg.branch_label[lang])}</span></a>
    <a class="langbtn" href="${other}" hreflang="${otherLang}" lang="${otherLang}" data-setlang="${otherLang}" aria-label="${esc(t['lang.switch.label'])}" data-i18n-attr="aria-label:lang.switch.label"><span data-i18n="lang.switch">${esc(t['lang.switch'])}</span></a>
  </div>
  <nav class="top__nav" aria-label="${esc(t['nav.label'])}" data-i18n-attr="aria-label:nav.label">${nav}</nav>
</header>

<main id="main">
<section class="hero" id="top">
  <div class="wrap hero__in">
    <p class="hero__kicker" data-i18n="hero.kicker">${esc(t['hero.kicker'])}</p>
    <h1 data-brand-name>${esc(cfg.name[lang])}</h1>
    <p class="hero__tag" data-i18n="hero.tagline">${esc(t['hero.tagline'])}</p>
    <p class="status" id="status" role="status" aria-live="polite"><span class="status__dot" aria-hidden="true"></span><strong id="status-main" data-i18n="status.loading">${esc(t['status.loading'])}</strong><span id="status-sub"></span></p>
    <div class="actions">
      <a class="btn btn--call" id="btn-call" href="#hours"><span aria-hidden="true">📞</span> <span data-i18n="btn.call">${esc(t['btn.call'])}</span></a>
      <a class="btn btn--nav" id="btn-nav" href="#visit" target="_blank" rel="noopener"><span aria-hidden="true">📍</span> <span data-i18n="btn.navigate">${esc(t['btn.navigate'])}</span></a>
      <a class="btn btn--line" id="btn-line" href="#hours" target="_blank" rel="noopener"><span aria-hidden="true">💬</span> <span data-i18n="btn.line">${esc(t['btn.line'])}</span></a>
    </div>
    <figure class="hero__photo" id="hero-photo" hidden></figure>
  </div>
</section>

<noscript><p class="wrap noscript">${esc(t.noscript)}</p></noscript>

<section id="promos" class="sec"><div class="wrap">
  ${k(t, 'promos.title', 'h2')}
  <div class="grid" id="promo-list"></div>
</div></section>

<section id="services" class="sec sec--alt"><div class="wrap">
  ${k(t, 'services.title', 'h2')}
  <h3 data-i18n="services.services">${esc(t['services.services'])}</h3>
  <ul class="cards" id="service-list"></ul>
  <h3 data-i18n="services.shops">${esc(t['services.shops'])}</h3>
  <ul class="cards" id="shop-list"></ul>
</div></section>

<section id="visit" class="sec"><div class="wrap">
  ${k(t, 'visit.title', 'h2')}
  <div class="map"><iframe id="map" title="${esc(t['visit.map'])}" data-i18n-attr="title:visit.map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
  <p class="actions actions--inline"><a class="btn btn--primary" id="btn-nav2" href="#visit" target="_blank" rel="noopener"><span aria-hidden="true">📍</span> <span data-i18n="visit.openMaps">${esc(t['visit.openMaps'])}</span></a>
  <a class="btn btn--ghost" id="btn-review" href="#visit" target="_blank" rel="noopener" hidden><span aria-hidden="true">⭐</span> <span data-i18n="visit.review">${esc(t['visit.review'])}</span></a></p>
  <dl class="facts" id="facts"></dl>
</div></section>

<section id="hours" class="sec sec--alt"><div class="wrap">
  ${k(t, 'hours.title', 'h2')}
  <p class="sample" id="hours-sample" hidden data-i18n="hours.sample">${esc(t['hours.sample'])}</p>
  <div class="two">
    <div>
      ${k(t, 'hours.daily', 'h3')}
      <table class="hours" id="hours-table"></table>
      <div id="special" hidden>
        ${k(t, 'hours.special', 'h3')}
        <ul class="special" id="special-list"></ul>
      </div>
    </div>
    <div>
      ${k(t, 'contact.title', 'h3')}
      <ul class="contact" id="contact-list"></ul>
    </div>
  </div>
</div></section>

<section id="order" class="sec"><div class="wrap">
  ${k(t, 'order.title', 'h2')}
  <p data-i18n="order.text">${esc(t['order.text'])}</p>
  <p class="actions actions--inline">
    <a class="btn btn--primary" id="btn-web" href="${cfg.official.web[lang]}" target="_blank" rel="noopener noreferrer"><span data-i18n="order.web">${esc(t['order.web'])}</span> <span aria-hidden="true">↗</span><span class="sr"> – <span data-i18n="order.newtab">${esc(t['order.newtab'])}</span></span></a>
    <a class="btn btn--ghost" id="btn-app" href="#order" target="_blank" rel="noopener noreferrer" hidden><span data-i18n="order.app">${esc(t['order.app'])}</span> <span aria-hidden="true">↗</span><span class="sr"> – <span data-i18n="order.newtab">${esc(t['order.newtab'])}</span></span></a>
  </p>
</div></section>
</main>

${footer(lang, t, base)}
<script src="${base}assets/js/main.js" defer></script>
</body>
</html>
`;
}

function footer(lang, t, base) {
  return `<footer class="foot"><div class="wrap">
  <p class="foot__disc"><strong data-i18n="footer.disclaimer">${esc(t['footer.disclaimer'])}</strong></p>
  <p><a href="${cfg.official.web[lang]}" target="_blank" rel="noopener noreferrer" data-i18n="footer.official">${esc(t['footer.official'])}</a> · <a href="${base ? '' : ''}privacy.html" data-i18n="footer.privacy">${esc(t['footer.privacy'])}</a></p>
  <p class="foot__addr"><span data-i18n="footer.address">${esc(t['footer.address'])}</span>: <span id="foot-addr">${esc(cfg.address[lang])}</span></p>
</div></footer>`;
}

function privacyPage(lang) {
  const t = I18N[lang];
  const base = lang === 'th' ? '' : '../';
  return `${head(lang, t, { title: t['privacy.title'], desc: t['privacy.p1'], path: 'privacy.html', base })}
</head>
<body>
<main id="main" class="wrap simple">
  <h1 data-i18n="privacy.h1">${esc(t['privacy.h1'])}</h1>
  <p>${esc(t['privacy.p1'])}</p><p>${esc(t['privacy.p2'])}</p><p>${esc(t['privacy.p3'])}</p>
  <p><a class="btn btn--primary" href="./">${esc(t['privacy.back'])}</a></p>
</main>
${footer(lang, t, base).replace('privacy.html', 'privacy.html')}
</body>
</html>
`;
}

function notFound() {
  // 404 ใช้ path แบบ absolute จาก repo root ไม่ได้ (project site) จึงใช้ base ผ่านสคริปต์
  const t = I18N.th, e = I18N.en;
  const pathBase = new URL(site + '/').pathname; // เช่น /REPO/
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(t['404.title'])} | 404</title>
<link rel="stylesheet" href="${pathBase}assets/css/style.css">
</head>
<body>
<main class="wrap simple">
  <h1>${esc(t['404.title'])} <small>/ ${esc(e['404.title'])}</small></h1>
  <p>${esc(t['404.text'])}<br>${esc(e['404.text'])}</p>
  <p><a class="btn btn--primary" href="${pathBase}">${esc(t['404.back'])} / ${esc(e['404.back'])}</a></p>
</main>
</body>
</html>
`;
}

wr('index.html', indexPage('th'));
wr('en/index.html', indexPage('en'));
wr('privacy.html', privacyPage('th'));
wr('en/privacy.html', privacyPage('en'));
wr('404.html', notFound());

const today = new Date().toISOString().slice(0, 10);
const urls = [['', 'index'], ['privacy.html', 'privacy']].flatMap(([p]) => ['th', 'en'].map((l) => {
  const alts = ['th', 'en'].map((x) => `    <xhtml:link rel="alternate" hreflang="${x}" href="${urlOf(x, p)}"/>`).concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${urlOf('th', p)}"/>`).join('\n');
  return `  <url>\n    <loc>${urlOf(l, p)}</loc>\n    <lastmod>${today}</lastmod>\n${alts}\n  </url>`;
}));
wr('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
wr('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
console.log('built: index.html, en/index.html, privacy (th/en), 404.html, sitemap.xml, robots.txt');
