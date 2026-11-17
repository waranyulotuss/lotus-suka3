/* หน้าร้านค้าในศูนย์: โหลด data/shops.json แล้วกรองตามหมวด/คำค้น (ข้อมูลทั้งหมดอยู่ใน data/ และ i18n/) */
(function () {
  'use strict';
  var html = document.documentElement;
  var lang = html.lang === 'en' ? 'en' : 'th';
  var base = html.getAttribute('data-base') || '';
  var $ = function (s) { return document.querySelector(s); };
  var T = {}, cfg = null, data = null, cat = 'all', q = '';

  function fetchJSON(p) { return fetch(base + p, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); }); }
  function fmt(s, v) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return v[k] != null ? v[k] : ''; }); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function L(o) { return o ? (o[lang] || o.th || '') : ''; }
  function fmtDate(s) {
    var a = s.split('-'), d = new Date(Date.UTC(+a[0], +a[1] - 1, +a[2]));
    return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  }
  function todayBkk() {
    var p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return p.year + '-' + p.month + '-' + p.day;
  }
  function track(name) { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: 'event/' + name + '-' + lang, title: name, event: true }); } catch (e) {} }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function (e) { if (T[e.dataset.i18n] != null) e.textContent = T[e.dataset.i18n]; });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (e) { e.dataset.i18nAttr.split(',').forEach(function (p) { var a = p.split(':'); if (T[a[1]] != null) e.setAttribute(a[0], T[a[1]]); }); });
  }

  function catById(id) { return (data.categories || []).filter(function (c) { return c.id === id; })[0]; }

  function renderFilter() {
    var box = $('#shop-filter'); box.textContent = '';
    var all = [{ id: 'all', icon: '', name: { th: T['shops.all'], en: T['shops.all'] } }].concat(data.categories || []);
    all.forEach(function (c) {
      var used = c.id === 'all' || data.items.some(function (x) { return x.category === c.id; });
      if (!used) return;
      var b = el('button', 'pill' + (c.id === cat ? ' is-on' : ''), (c.icon ? c.icon + ' ' : '') + L(c.name));
      b.type = 'button'; b.setAttribute('aria-pressed', c.id === cat ? 'true' : 'false');
      b.addEventListener('click', function () { cat = c.id; renderFilter(); renderList(); try { history.replaceState(null, '', c.id === 'all' ? location.pathname : '#' + c.id); } catch (e) {} track('shop-filter-' + c.id); });
      box.appendChild(b);
    });
  }

  function row(dl, label, val) {
    if (!val) return;
    var d = el('div'); d.appendChild(el('dt', null, label)); d.appendChild(el('dd', null, val)); dl.appendChild(d);
  }

  function renderList() {
    var ul = $('#shop-grid'), today = todayBkk(), term = q.trim().toLowerCase();
    ul.textContent = '';
    var items = (data.items || []).filter(function (x) {
      if (cat !== 'all' && x.category !== cat) return false;
      if (!term) return true;
      return (L(x.name) + ' ' + L(x.desc) + ' ' + L(x.promo)).toLowerCase().indexOf(term) !== -1;
    });
    items.forEach(function (x) {
      var c = catById(x.category), li = el('li', 'shop' + (x.is_sample ? ' is-sample' : '')), art = el('article');
      var head = el('div', 'shop__head');
      var ic = el('span', 'ico', c && c.icon || '🏪'); ic.setAttribute('aria-hidden', 'true');
      var tt = el('div'); tt.appendChild(el('p', 'shop__cat', c ? L(c.name) : '')); tt.appendChild(el('h3', null, L(x.name)));
      head.appendChild(ic); head.appendChild(tt);
      if (x.is_sample) head.appendChild(el('span', 'badge badge--sample', T['shops.sample']));
      art.appendChild(head);
      if (L(x.desc)) art.appendChild(el('p', 'shop__desc', L(x.desc)));
      var promo = L(x.promo), live = !x.valid_until || x.valid_until >= today;
      if (promo && live) {
        var pr = el('div', 'shop__promo'); pr.appendChild(el('b', null, T['shops.promo']));
        pr.appendChild(el('span', null, promo));
        if (x.valid_until) pr.appendChild(el('small', null, fmt(T['shops.until'], { date: fmtDate(x.valid_until) })));
        art.appendChild(pr);
      }
      var dl = el('dl', 'shop__facts'); row(dl, T['shops.where'], L(x.where)); row(dl, T['shops.hours'], L(x.hours));
      if (dl.children.length) art.appendChild(dl);
      li.appendChild(art); ul.appendChild(li);
    });
    $('#shop-none').hidden = items.length > 0;
    $('#shop-count').textContent = items.length ? fmt(T['shops.count'], { n: items.length }) : '';
  }

  function initAnalytics() {
    var code = cfg.analytics && cfg.analytics.goatcounter_code;
    if (!code) return;
    var s = document.createElement('script'); s.async = true; s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', 'https://' + code + '.goatcounter.com/count'); document.head.appendChild(s);
    var call = $('#btn-call'); if (call) call.addEventListener('click', function () { track('call-shops'); });
    var lb = $('.langbtn'); if (lb) lb.addEventListener('click', function () { track('switch-lang'); });
  }

  document.querySelectorAll('[data-setlang]').forEach(function (a) { a.addEventListener('click', function () { try { localStorage.setItem('lang', a.dataset.setlang); } catch (e) {} }); });
  Promise.all([fetchJSON('i18n/' + lang + '.json'), fetchJSON('data/config.json'), fetchJSON('data/shops.json')])
    .then(function (r) {
      T = r[0]; cfg = r[1]; data = r[2]; applyI18n(); initAnalytics();
      var h = location.hash.replace('#', ''); if (h && catById(h)) cat = h;
      $('#shops-sample').hidden = !data.items.some(function (x) { return x.is_sample; });
      $('#shop-q').addEventListener('input', function (e) { q = e.target.value; renderList(); });
      renderFilter(); renderList();
    })
    .catch(function (e) { console.warn('load failed', e); });
})();
