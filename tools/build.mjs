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
  if ((cfg.alt_names || {})[lang]) o.alternateName = cfg.alt_names[lang];
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
${cfg.analytics && cfg.analytics.google_site_verification ? `<meta name="google-site-verification" content="${esc(cfg.analytics.google_site_verification)}">` : ''}
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
<link rel="manifest" href="${base}manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${base}assets/css/style.css">`;
}

const k = (t, key, tag = 'span', attrs = '') => `<${tag} data-i18n="${key}"${attrs ? ' ' + attrs : ''}>${esc(t[key])}</${tag}>`;

function indexPage(lang) {
  const t = I18N[lang];
  const base = lang === 'th' ? '' : '../';
  const other = lang === 'th' ? 'en/' : '../';
  const otherLang = lang === 'th' ? 'en' : 'th';
  const nav = [['promos', 'promos'], ['products', 'products'], ['services', 'services'], ['visit', 'visit'], ['hours', 'hours'], ['order', 'order']]
    .map(([id, key]) => `<a href="#${id}" data-i18n="nav.${key}">${esc(t['nav.' + key])}</a>`).join('')
    + `<a href="shops.html" data-i18n="nav.shops">${esc(t['nav.shops'])}</a>`;
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
    <ul class="chips" id="highlights" aria-label="${esc(t['hero.highlights'])}" data-i18n-attr="aria-label:hero.highlights" hidden></ul>
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

<section id="products" class="sec sec--alt"><div class="wrap">
  ${k(t, 'products.title', 'h2')}
  <p data-i18n="products.intro">${esc(t['products.intro'])}</p>
  <ul class="cats" id="cat-list"></ul>
</div></section>

<section id="services" class="sec"><div class="wrap">
  ${k(t, 'services.title', 'h2')}
  <h3 data-i18n="services.services">${esc(t['services.services'])}</h3>
  <ul class="cards" id="service-list"></ul>
  <h3 data-i18n="services.shops">${esc(t['services.shops'])}</h3>
  <ul class="cards" id="shop-list"></ul>
  <p class="actions actions--inline"><a class="btn btn--primary" href="shops.html" data-i18n="services.allShops">${esc(t['services.allShops'])}</a></p>
</div></section>

<section id="visit" class="sec sec--alt"><div class="wrap">
  ${k(t, 'visit.title', 'h2')}
  <div class="map"><iframe id="map" title="${esc(t['visit.map'])}" data-i18n-attr="title:visit.map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
  <p class="actions actions--inline"><a class="btn btn--primary" id="btn-nav2" href="#visit" target="_blank" rel="noopener"><span aria-hidden="true">📍</span> <span data-i18n="visit.openMaps">${esc(t['visit.openMaps'])}</span></a>
  <a class="btn btn--ghost" id="btn-review" href="#visit" target="_blank" rel="noopener" hidden><span aria-hidden="true">⭐</span> <span data-i18n="visit.review">${esc(t['visit.review'])}</span></a></p>
  <dl class="facts" id="facts"></dl>
</div></section>

<section id="hours" class="sec"><div class="wrap">
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

<section id="order" class="sec sec--alt"><div class="wrap">
  ${k(t, 'order.title', 'h2')}
  <p data-i18n="order.text">${esc(t['order.text'])}</p>
  <h3 data-i18n="order.benefitsTitle">${esc(t['order.benefitsTitle'])}</h3>
  <ul class="benefits"><li data-i18n="order.b1">${esc(t['order.b1'])}</li><li data-i18n="order.b2">${esc(t['order.b2'])}</li></ul>
  <p class="ph" data-i18n="order.b3">${esc(t['order.b3'])}</p>
  <p class="actions actions--inline">
    <a class="btn btn--primary" id="btn-web" href="${cfg.official.web[lang]}" target="_blank" rel="noopener noreferrer"><span data-i18n="order.web">${esc(t['order.web'])}</span> <span aria-hidden="true">↗</span><span class="sr"> – <span data-i18n="order.newtab">${esc(t['order.newtab'])}</span></span></a>
    <a class="btn btn--primary" id="btn-ios" href="#order" target="_blank" rel="noopener noreferrer" hidden><span aria-hidden="true">🍎</span> <span data-i18n="order.ios">${esc(t['order.ios'])}</span><span class="sr"> – <span data-i18n="order.newtab">${esc(t['order.newtab'])}</span></span></a>
    <a class="btn btn--primary" id="btn-android" href="#order" target="_blank" rel="noopener noreferrer" hidden><span aria-hidden="true">▶️</span> <span data-i18n="order.android">${esc(t['order.android'])}</span><span class="sr"> – <span data-i18n="order.newtab">${esc(t['order.newtab'])}</span></span></a>
    <a class="btn btn--primary" id="btn-app" href="#order" target="_blank" rel="noopener noreferrer" hidden><span aria-hidden="true">📱</span> <span data-i18n="order.app">${esc(t['order.app'])}</span><span class="sr"> – <span data-i18n="order.newtab">${esc(t['order.newtab'])}</span></span></a>
  </p>
  <p class="ph" id="app-pending" data-i18n="order.appPending">${esc(t['order.appPending'])}</p>
  <p id="app-hint" hidden data-i18n="order.appHint">${esc(t['order.appHint'])}</p>
</div></section>
<section id="faq" class="sec"><div class="wrap">
  ${k(t, 'faq.title', 'h2')}
  <details><summary data-i18n="faq.q1">${esc(t['faq.q1'])}</summary><p data-i18n="faq.a1">${esc(t['faq.a1'])}</p></details>
  <details><summary data-i18n="faq.q2">${esc(t['faq.q2'])}</summary><p data-i18n="faq.a2">${esc(t['faq.a2'])}</p></details>
  <details><summary data-i18n="faq.q3">${esc(t['faq.q3'])}</summary><p data-i18n="faq.a3">${esc(t['faq.a3'])}</p></details>
  <details><summary data-i18n="faq.q4">${esc(t['faq.q4'])}</summary><p data-i18n="faq.a4">${esc(t['faq.a4'])}</p></details>
  
</div></section>

<section id="share" class="sec sec--alt"><div class="wrap">
  ${k(t, 'share.title', 'h2')}
  <p data-i18n="share.text">${esc(t['share.text'])}</p>
  <p class="actions actions--inline" id="share-actions">
    <a class="btn btn--primary" id="sh-line" href="#share" target="_blank" rel="noopener noreferrer"><span data-i18n="share.line">${esc(t['share.line'])}</span></a>
    <a class="btn btn--ghost" id="sh-fb" href="#share" target="_blank" rel="noopener noreferrer"><span data-i18n="share.fb">${esc(t['share.fb'])}</span></a>
    <button class="btn btn--ghost" id="sh-native" type="button" hidden><span data-i18n="share.native">${esc(t['share.native'])}</span></button>
    <button class="btn btn--ghost" id="sh-copy" type="button"><span data-i18n="share.copy">${esc(t['share.copy'])}</span></button>
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
  <p class="foot__aka" id="foot-aka" hidden></p>
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

const shopsData = rd('data/shops.json');
const hasRealShops = (shopsData.items || []).some((x) => !x.is_sample);

function shopsPage(lang) {
  const t = I18N[lang];
  const base = lang === 'th' ? '' : '../';
  const other = lang === 'th' ? 'en/shops.html' : '../shops.html';
  const otherLang = lang === 'th' ? 'en' : 'th';
  const nav = `<a href="./" data-i18n="shops.back">${esc(t['shops.back'])}</a>`;
  return `${head(lang, t, { title: t['shops.meta.title'], desc: t['shops.meta.description'], path: 'shops.html', noindex: !hasRealShops, base })}
</head>
<body class="shops">
<a class="skip" href="#main" data-i18n="skip">${esc(t.skip)}</a>
<header class="top">
  <div class="top__row">
    <a class="brand" href="./" aria-label="${esc(cfg.name[lang])}"><span class="brand__mark" aria-hidden="true"></span><span>${esc(cfg.branch_label[lang])}</span></a>
    <a class="langbtn" href="${other}" hreflang="${otherLang}" lang="${otherLang}" data-setlang="${otherLang}" aria-label="${esc(t['lang.switch.label'])}"><span data-i18n="lang.switch">${esc(t['lang.switch'])}</span></a>
  </div>
  <nav class="top__nav" aria-label="${esc(t['nav.label'])}">${nav}</nav>
</header>
<main id="main">
<section class="hero hero--shops"><div class="wrap hero__in">
  <p class="hero__kicker" data-i18n="shops.kicker">${esc(t['shops.kicker'])}</p>
  <h1 data-i18n="shops.h1">${esc(t['shops.h1'])}</h1>
  <p class="hero__tag" data-i18n="shops.tagline">${esc(t['shops.tagline'])}</p>
</div></section>

<section class="sec"><div class="wrap">
  <p class="sample" id="shops-sample" hidden data-i18n="shops.sampleNote">${esc(t['shops.sampleNote'])}</p>
  <div class="shopbar">
    <div class="field">
      <label for="shop-q" data-i18n="shops.search">${esc(t['shops.search'])}</label>
      <input id="shop-q" type="search" autocomplete="off" placeholder="${esc(t['shops.search.ph'])}" data-i18n-attr="placeholder:shops.search.ph">
    </div>
    <div class="pills" id="shop-filter" role="group" aria-label="${esc(t['shops.filter'])}" data-i18n-attr="aria-label:shops.filter"></div>
  </div>
  <p class="count" id="shop-count" role="status" aria-live="polite"></p>
  <ul class="shopgrid" id="shop-grid"></ul>
  <p class="empty" id="shop-none" hidden data-i18n="shops.none">${esc(t['shops.none'])}</p>
</div></section>

<section class="sec sec--alt"><div class="wrap">
  ${k(t, 'shops.join.title', 'h2')}
  <p data-i18n="shops.join.text">${esc(t['shops.join.text'])}</p>
  <p class="actions actions--inline"><a class="btn btn--call" id="btn-call" href="tel:${esc(cfg.phone.e164)}"><span aria-hidden="true">📞</span> <span data-i18n="shops.join.btn">${esc(t['shops.join.btn'])}</span> ${esc(cfg.phone.display)}</a>
  <a class="btn btn--ghost" href="./" data-i18n="shops.back">${esc(t['shops.back'])}</a></p>
</div></section>
</main>
${footer(lang, t, base)}
<script src="${base}assets/js/shops.js" defer></script>
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
wr('shops.html', shopsPage('th'));
wr('en/shops.html', shopsPage('en'));
wr('404.html', notFound());
wr('manifest.webmanifest', JSON.stringify({ name: cfg.name.th, short_name: cfg.branch_label.th, start_url: './', scope: './', display: 'standalone', background_color: '#ffffff', theme_color: '#306FC7', lang: 'th', icons: [{ src: 'assets/img/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] }, null, 2) + '\n');

const today = new Date().toISOString().slice(0, 10);
const urls = [['', 'index'], ['privacy.html', 'privacy']].concat(hasRealShops ? [['shops.html', 'shops']] : []).flatMap(([p]) => ['th', 'en'].map((l) => {
  const alts = ['th', 'en'].map((x) => `    <xhtml:link rel="alternate" hreflang="${x}" href="${urlOf(x, p)}"/>`).concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${urlOf('th', p)}"/>`).join('\n');
  return `  <url>\n    <loc>${urlOf(l, p)}</loc>\n    <lastmod>${today}</lastmod>\n${alts}\n  </url>`;
}));
wr('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
wr('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
console.log('built: index.html, en/index.html, privacy (th/en), 404.html, sitemap.xml, robots.txt');
