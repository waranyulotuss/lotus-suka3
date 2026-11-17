/* สถานะเปิด/ปิด, โหลด JSON, แปลข้อความ — ข้อมูลทั้งหมดอยู่ในโฟลเดอร์ data/ และ i18n/ */
(function () {
  'use strict';
  var html = document.documentElement;
  var lang = html.lang === 'en' ? 'en' : 'th';
  var base = html.getAttribute('data-base') || '';
  var DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  var $ = function (s) { return document.querySelector(s); };
  var T = {}, cfg = null;

  function fetchJSON(p) { return fetch(base + p, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); }); }
  function fmt(s, v) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return v[k] != null ? v[k] : ''; }); }
  function isPh(s) { return !s || /[\[\]]/.test(s); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function L(o) { return o ? (o[lang] || o.th || '') : ''; }

  /* ---------- เวลาไทย (Asia/Bangkok) ไม่ขึ้นกับเครื่องผู้ใช้ ---------- */
  function bkk(now) {
    var p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' })
      .formatToParts(now).forEach(function (x) { p[x.type] = x.value; });
    var wd = p.weekday.slice(0, 3).toLowerCase();
    return { y: +p.year, m: +p.month, d: +p.day, min: (+p.hour) * 60 + (+p.minute), wd: wd };
  }
  function ymd(y, m, d) { var dt = new Date(Date.UTC(y, m - 1, d)); return { s: dt.toISOString().slice(0, 10), wd: DAYS[(dt.getUTCDay() + 6) % 7] }; }
  function toMin(s) { var a = s.split(':'); var v = (+a[0]) * 60 + (+a[1]); return v; }
  function hhmm(min) { min = ((min % 1440) + 1440) % 1440; return ('0' + Math.floor(min / 60)).slice(-2) + ':' + ('0' + (min % 60)).slice(-2); }
  /* ช่วงเวลาเปิดของวันที่กำหนด (ตรวจวันหยุดพิเศษก่อน) */
  function intervals(dateS, wd) {
    var cl = (cfg.hours.closures || []).filter(function (c) { return c.date === dateS; })[0];
    if (cl) return cl.closed ? [] : [{ open: cl.open, close: cl.close }];
    return cfg.hours.weekly[wd] || [];
  }
  function norm(iv) { var o = toMin(iv.open), c = toMin(iv.close); if (c === 0 || c === 1440) c = 1440; return { o: o, c: c, over: c <= o }; }
  function computeStatus(now) {
    var n = bkk(now), today = ymd(n.y, n.m, n.d), yest = ymd(n.y, n.m, n.d - 1);
    var m = n.min, i, v;
    var ti = intervals(today.s, today.wd).map(norm);
    for (i = 0; i < ti.length; i++) { v = ti[i]; if (v.over ? m >= v.o : (m >= v.o && m < v.c)) return { open: true, closeAt: v.over ? v.c : v.c }; }
    var yi = intervals(yest.s, yest.wd).map(norm);
    for (i = 0; i < yi.length; i++) { v = yi[i]; if (v.over && m < v.c) return { open: true, closeAt: v.c }; }
    for (var off = 0; off < 8; off++) {
      var dd = ymd(n.y, n.m, n.d + off), list = intervals(dd.s, dd.wd).map(norm).sort(function (a, b) { return a.o - b.o; });
      for (i = 0; i < list.length; i++) if (off > 0 || list[i].o > m) return { open: false, offset: off, wd: dd.wd, openAt: list[i].o, closedToday: off > 0 && intervals(today.s, today.wd).length === 0 };
    }
    return { open: false, none: true };
  }
  function renderStatus() {
    var s = computeStatus(new Date()), box = $('#status'), main = $('#status-main'), sub = $('#status-sub');
    box.classList.remove('is-open', 'is-closed');
    if (s.open) { box.classList.add('is-open'); main.textContent = T['status.open']; sub.textContent = '· ' + fmt(T['status.closesAt'], { time: hhmm(s.closeAt) }); main.removeAttribute('data-i18n'); return; }
    box.classList.add('is-closed'); main.textContent = T['status.closed']; main.removeAttribute('data-i18n');
    if (s.none) { sub.textContent = ''; return; }
    var day = s.offset === 0 ? T['day.today'] : s.offset === 1 ? T['day.tomorrow'] : T['day.' + s.wd];
    sub.textContent = '· ' + fmt(T['status.opensAt'], { day: lang === 'th' ? day : day, time: hhmm(s.openAt) });
  }

  /* ---------- แปลข้อความ ---------- */
  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function (e) { if (T[e.dataset.i18n] != null) e.textContent = T[e.dataset.i18n]; });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (e) { e.dataset.i18nAttr.split(',').forEach(function (p) { var a = p.split(':'); if (T[a[1]] != null) e.setAttribute(a[0], T[a[1]]); }); });
  }

  /* ---------- การ์ดโปรโมชัน ---------- */
  function fmtDate(s) {
    var a = s.split('-'); var d = new Date(Date.UTC(+a[0], +a[1] - 1, +a[2]));
    return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  }
  function renderPromos(data) {
    var n = bkk(new Date()), today = ymd(n.y, n.m, n.d).s, box = $('#promo-list');
    var items = (data.items || []).filter(function (p) { return p.end && p.end >= today && (!p.start || p.start <= today); })
      .sort(function (a, b) { return (a.level === 'hot' ? 0 : 1) - (b.level === 'hot' ? 0 : 1) || a.end.localeCompare(b.end); }).slice(0, 6);
    box.textContent = '';
    if (!items.length) { box.appendChild(el('p', 'empty', T['promos.empty'])); return; }
    items.forEach(function (p) {
      var c = el('article', 'card' + (p.level === 'hot' ? ' card--hot' : ''));
      var top = el('p'); top.style.margin = '0';
      if (p.level === 'hot') top.appendChild(el('span', 'badge badge--hot', T['promos.hot']));
      top.appendChild(el('span', 'badge', fmt(T['promos.until'], { date: fmtDate(p.end) })));
      c.appendChild(top); c.appendChild(el('h3', null, L(p.title))); c.appendChild(el('p', null, L(p.desc)));
      box.appendChild(c);
    });
  }

  /* ---------- บริการ/ร้านค้า ---------- */
  function renderServices(data) {
    [['service', '#service-list'], ['shop', '#shop-list']].forEach(function (g) {
      var ul = $(g[1]); ul.textContent = '';
      var list = (data.items || []).filter(function (x) { return x.kind === g[0]; });
      ul.previousElementSibling.hidden = !list.length;
      list.forEach(function (x) {
        var li = el('li'), ic = el('span', 'ico', x.icon || '•'); ic.setAttribute('aria-hidden', 'true');
        var b = el('div'); b.appendChild(el('b', null, L(x.name))); b.appendChild(el('span', 'd', L(x.desc)));
        if (x.hours) b.appendChild(el('span', 'd', fmt(T['services.hours'], { hours: L(x.hours) })));
        li.appendChild(ic); li.appendChild(b); ul.appendChild(li);
      });
    });
  }

  /* ---------- ปุ่ม/ลิงก์ติดต่อ ---------- */
  function setLink(a, href) {
    if (href) { a.href = href; a.classList.remove('is-placeholder'); a.removeAttribute('data-ph'); a.removeAttribute('aria-disabled'); }
    else { a.href = '#hours'; a.removeAttribute('target'); a.classList.add('is-placeholder'); a.setAttribute('data-ph', T['btn.placeholder']); }
  }
  function mapsHref() {
    if (cfg.maps.link) return cfg.maps.link;
    var q = cfg.geo.lat != null && cfg.geo.lng != null ? cfg.geo.lat + ',' + cfg.geo.lng : (cfg.maps.embed_query || L(cfg.name));
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  }
  function renderContact() {
    setLink($('#btn-call'), cfg.phone.e164 ? 'tel:' + cfg.phone.e164 : '');
    setLink($('#btn-line'), cfg.social.line);
    $('#btn-nav').href = mapsHref(); $('#btn-nav2').href = mapsHref();
    if (cfg.maps.review_link) { var r = $('#btn-review'); r.href = cfg.maps.review_link; r.hidden = false; }
    if (cfg.official.app) { var a = $('#btn-app'); a.href = cfg.official.app; a.hidden = false; }
    var q = cfg.geo.lat != null && cfg.geo.lng != null ? cfg.geo.lat + ',' + cfg.geo.lng : (cfg.maps.embed_query || L(cfg.name));
    $('#map').src = 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&hl=' + lang + '&z=16&output=embed';
    var ul = $('#contact-list'); ul.textContent = '';
    function row(label, node) { var li = el('li'); li.appendChild(el('b', null, label)); li.appendChild(node); ul.appendChild(li); }
    function link(text, href, ext) { var a = el('a', null, text); a.href = href; if (ext) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } return a; }
    row(T['contact.phone'], cfg.phone.e164 ? link(cfg.phone.display, 'tel:' + cfg.phone.e164) : el('span', 'ph', cfg.phone.display));
    row(T['contact.line'], cfg.social.line ? link(cfg.social.line.replace(/^https?:\/\//, ''), cfg.social.line, true) : el('span', 'ph', '[LINE OA]'));
    row(T['contact.facebook'], cfg.social.facebook ? link(cfg.social.facebook.replace(/^https?:\/\//, ''), cfg.social.facebook, true) : el('span', 'ph', '[Facebook Page]'));
    var f = $('#facts'); f.textContent = '';
    [['visit.address', cfg.address], ['visit.landmarks', cfg.directions.landmarks], ['visit.parking', cfg.directions.parking], ['visit.car', cfg.directions.car], ['visit.transit', cfg.directions.transit]].forEach(function (x) {
      var d = el('div'), v = L(x[1]); d.appendChild(el('dt', null, T[x[0]])); d.appendChild(el('dd', isPh(v) ? 'ph' : null, v)); f.appendChild(d);
    });
    $('#foot-addr').textContent = L(cfg.address);
    if (cfg.images && cfg.images.hero) {
      var fig = $('#hero-photo'), im = new Image(); im.src = base + cfg.images.hero.src; im.alt = L(cfg.images.hero.alt); im.loading = 'lazy'; fig.appendChild(im); fig.hidden = false;
    }
  }

  /* ---------- ตารางเวลา ---------- */
  function renderHours() {
    var tb = $('#hours-table'), n = bkk(new Date()); tb.textContent = '';
    DAYS.forEach(function (d) {
      var tr = el('tr', d === n.wd ? 'today' : ''), th = el('th', null, T['day.' + d]); th.scope = 'row';
      var list = cfg.hours.weekly[d] || [], td = el('td');
      td.textContent = list.length ? list.map(function (iv) {
        var s = hhmm(toMin(iv.open)) + '–' + hhmm(toMin(iv.close)), o = norm(iv);
        return s + (o.over ? ' ' + T['hours.nextday'] : '');
      }).join(', ') : T['hours.closed'];
      tr.appendChild(th); tr.appendChild(td); tb.appendChild(tr);
    });
    $('#hours-sample').hidden = !cfg.hours.is_sample;
    var n2 = bkk(new Date()), today = ymd(n2.y, n2.m, n2.d).s;
    var sp = (cfg.hours.closures || []).filter(function (c) { return c.date >= today; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    var ul = $('#special-list'); ul.textContent = '';
    sp.forEach(function (c) {
      var li = el('li', c.closed ? '' : 'open'); li.appendChild(el('b', null, fmtDate(c.date)));
      li.appendChild(document.createElement('br'));
      li.appendChild(document.createTextNode(L(c.label) + ' — ' + (c.closed ? T['hours.specialClosed'] : hhmm(toMin(c.open)) + '–' + hhmm(toMin(c.close)))));
      ul.appendChild(li);
    });
    $('#special').hidden = !sp.length;
  }

  /* ---------- วัดผล (GoatCounter ไม่ใช้คุกกี้; เปิดเมื่อใส่ analytics.goatcounter_code) ---------- */
  function initAnalytics() {
    var code = cfg.analytics && cfg.analytics.goatcounter_code;
    if (!code) return;
    var s = document.createElement('script'); s.async = true; s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', 'https://' + code + '.goatcounter.com/count'); document.head.appendChild(s);
    function track(name) { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: 'event/' + name + '-' + lang, title: name, event: true }); } catch (e) {} }
    [['#btn-call', 'call'], ['#btn-nav', 'navigate'], ['#btn-nav2', 'navigate-map'], ['#btn-line', 'line'], ['#btn-web', 'order-web'], ['#btn-app', 'order-app'], ['#btn-review', 'review'], ['.langbtn', 'switch-lang']]
      .forEach(function (x) { var e = $(x[0]); if (e) e.addEventListener('click', function () { track(x[1]); }); });
    var tel = document.querySelector('#contact-list a[href^="tel:"]'); if (tel) tel.addEventListener('click', function () { track('call-contact'); });
  }

  /* ---------- เริ่มทำงาน ---------- */
  document.querySelectorAll('[data-setlang]').forEach(function (a) { a.addEventListener('click', function () { try { localStorage.setItem('lang', a.dataset.setlang); } catch (e) {} }); });
  Promise.all([fetchJSON('i18n/' + lang + '.json'), fetchJSON('data/config.json'), fetchJSON('data/promotions.json'), fetchJSON('data/services.json')])
    .then(function (r) {
      T = r[0]; cfg = r[1]; applyI18n();
      renderContact(); initAnalytics(); renderHours(); renderPromos(r[2]); renderServices(r[3]); renderStatus();
      setInterval(renderStatus, 30000);
    })
    .catch(function (e) { console.warn('load failed', e); var m = $('#status-main'); if (m) m.textContent = ''; });
})();
