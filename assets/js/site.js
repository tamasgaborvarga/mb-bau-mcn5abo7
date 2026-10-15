/* MB-BAU – minimális, függőségmentes JS.
   Az oldal JS nélkül is teljes értékű (tartalom, linkek, tel:/mailto:). */
(function () {
  'use strict';
  var d = document, de = d.documentElement;
  de.classList.add('js');

  /* ---- navigáció: mobil panel + szolgáltatás-lenyíló ---- */
  var burger = d.querySelector('.burger'), nav = d.getElementById('nav');
  var setNav = function (open) {
    if (!burger || !nav) return;
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    d.body.style.overflow = open && matchMedia('(max-width:1060px)').matches ? 'hidden' : '';
  };
  if (burger) burger.addEventListener('click', function () { setNav(burger.getAttribute('aria-expanded') !== 'true'); });
  var subBtn = d.querySelector('.nav-btn'), sub = d.getElementById('sub-sz');
  var setSub = function (open) {
    if (!subBtn || !sub) return;
    sub.classList.toggle('open', open);
    subBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  if (subBtn) {
    subBtn.addEventListener('click', function (e) { e.stopPropagation(); setSub(subBtn.getAttribute('aria-expanded') !== 'true'); });
    d.addEventListener('click', function (e) { if (!sub.contains(e.target) && e.target !== subBtn) setSub(false); });
    var hs = subBtn.parentElement;
    hs.addEventListener('focusout', function (e) { if (!hs.contains(e.relatedTarget)) setSub(false); });
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setSub(false); setNav(false); } });
  matchMedia('(min-width:1061px)').addEventListener('change', function () { setNav(false); });

  /* ---- megjelenés-animáció (IntersectionObserver) ---- */
  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && rv.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* ---- referencia-szűrő ---- */
  var fbar = d.querySelector('.filters');
  if (fbar) {
    var cards = d.querySelectorAll('.pgrid .pcard'), cnt = d.getElementById('pcount');
    var btns = d.querySelectorAll('button[data-f]'), groups = d.querySelectorAll('.pgroup'), empty = d.getElementById('pempty');
    var apply = function (f, push) {
      var n = 0;
      cards.forEach(function (c) {
        var show = f === 'all' || (c.getAttribute('data-cat') || '').split(',').indexOf(f) > -1;
        c.hidden = !show; if (show) n++;
      });
      groups.forEach(function (g) { g.hidden = !g.querySelector('.pcard:not([hidden])'); });
      fbar.querySelectorAll('button[data-f]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-f') === f ? 'true' : 'false'); });
      if (cnt) cnt.textContent = n + ' referencia';
      if (empty) empty.hidden = n > 0;
      if (push && history.replaceState) history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f);
    };
    btns.forEach(function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-f'), true); }); });
    var h = (location.hash || '').replace('#', '');
    if (h && fbar.querySelector('[data-f="' + h + '"]')) apply(h, false);
  }

  /* ---- galéria lightbox (<dialog>) ---- */
  var gal = d.querySelector('.gal');
  if (gal && typeof HTMLDialogElement === 'function') {
    var links = Array.prototype.slice.call(gal.querySelectorAll('a')), cur = 0;
    var dlg = d.createElement('dialog'); dlg.className = 'lb'; dlg.setAttribute('aria-label', 'Képnézegető');
    dlg.innerHTML = '<div class="lb-in"><div class="lb-img"><img alt=""></div><div class="lb-bar"><span class="lb-cap"></span><span class="lb-n"></span></div></div>' +
      '<button class="x" type="button" aria-label="Bezárás">&times;</button><button class="p" type="button" aria-label="Előző kép">&#8249;</button><button class="nx" type="button" aria-label="Következő kép">&#8250;</button>';
    d.body.appendChild(dlg);
    var im = dlg.querySelector('img'), cap = dlg.querySelector('.lb-cap'), num = dlg.querySelector('.lb-n');
    function show(i) {
      cur = (i + links.length) % links.length;
      var a = links[cur], inner = a.querySelector('img');
      im.src = a.getAttribute('href'); im.alt = inner ? inner.alt : '';
      cap.textContent = im.alt; num.textContent = (cur + 1) + ' / ' + links.length;
    }
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); show(i); dlg.showModal(); }); });
    dlg.querySelector('.x').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('.p').addEventListener('click', function () { show(cur - 1); });
    dlg.querySelector('.nx').addEventListener('click', function () { show(cur + 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  /* ---- kapcsolatfelvételi űrlap ----
     Valódi ellenőrzés + két működési mód:
     1) Ha a <form data-endpoint="https://..."> ki van töltve, JSON POST megy a végpontra (e-mail-küldő backend szükséges).
     2) Ha nincs végpont: az ellenőrzött üzenet előre kitöltve megnyitja az ügyfél levelezőprogramját (mailto:). Ezt a felület nyíltan közli. */
  var form = d.getElementById('contact-form');
  if (form) {
    var status = d.getElementById('form-status');
    var MAIL = form.getAttribute('data-mail') || 'info@mb-bau.hu';
    var ENDPOINT = form.getAttribute('data-endpoint') || '';
    function setErr(el, msg) {
      var f = el.closest('.fld, .chk'); if (!f) return;
      var m = f.querySelector('.err');
      if (msg) { f.classList.add('bad'); el.setAttribute('aria-invalid', 'true'); if (m) m.textContent = msg; }
      else { f.classList.remove('bad'); el.removeAttribute('aria-invalid'); }
    }
    function validate(el) {
      var v = (el.value || '').trim(), msg = '';
      if (el.name === 'nev' && v.length < 2) msg = 'Kérjük, adja meg a nevét.';
      else if (el.name === 'email') {
        if (!v) msg = 'Kérjük, adja meg az e-mail-címét.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Az e-mail-cím formátuma nem megfelelő (pl. nev@példa.hu).';
      }
      else if (el.name === 'telefon' && v && !/^[+0-9 ()\/.-]{7,22}$/.test(v)) msg = 'A telefonszám formátuma nem megfelelő (pl. +36 72 212 018).';
      else if (el.name === 'tipus' && !v) msg = 'Kérjük, válassza ki a projekt típusát.';
      else if (el.name === 'uzenet' && v.length < 10) msg = 'Kérjük, írjon néhány mondatot a tervezett projektről (legalább 10 karakter).';
      else if (el.name === 'adatvedelem' && !el.checked) msg = 'A küldéshez el kell fogadnia az adatkezelési tájékoztatót.';
      setErr(el, msg); return !msg;
    }
    var fields = form.querySelectorAll('input:not([name=hp]), select, textarea');
    fields.forEach(function (el) {
      el.addEventListener('blur', function () { if (el.type !== 'checkbox' && (el.value || el.closest('.fld').classList.contains('bad'))) validate(el); });
      el.addEventListener('input', function () { if (el.closest('.bad')) validate(el); });
      el.addEventListener('change', function () { if (el.closest('.bad') || el.type === 'checkbox') validate(el); });
    });
    function say(kind, title, text) {
      status.className = 'status show ' + kind; status.setAttribute('role', kind === 'fail' ? 'alert' : 'status');
      status.innerHTML = '<b></b><span></span>'; status.firstChild.textContent = title; status.lastChild.textContent = text;
      status.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      fields.forEach(function (el) { if (!validate(el) && !first) first = el; });
      if (first) { first.focus(); say('fail', 'Néhány mező javításra szorul.', 'Kérjük, nézze át a pirossal jelölt mezőket, majd küldje el újra.'); return; }
      if (form.querySelector('[name=hp]').value) return; // spam-csapda (honeypot)
      var data = {}; new FormData(form).forEach(function (v, k) { if (k !== 'hp') data[k] = String(v).trim(); });
      if (ENDPOINT) {
        var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
        fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); say('ok', 'Köszönjük, az üzenet elküldve.', 'Megkeresésére a megadott elérhetőségeken válaszolunk.'); })
          .catch(function () { say('fail', 'Az üzenet most nem küldhető el.', 'Kérjük, próbálja újra, vagy írjon közvetlenül a ' + MAIL + ' címre, illetve hívja a +36 72 212 018 számot.'); })
          .then(function () { btn.disabled = false; });
        return;
      }
      var body = ['Név: ' + data.nev, data.cegnev ? 'Cég: ' + data.cegnev : '', 'E-mail: ' + data.email, data.telefon ? 'Telefon: ' + data.telefon : '', 'Projekt típusa: ' + data.tipus, '', data.uzenet].filter(function (x, i) { return x !== '' || i === 5; }).join('\n');
      location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Ajánlat-/konzultációkérés a honlapról – ' + data.tipus) + '&body=' + encodeURIComponent(body);
      say('ok', 'Megnyitottuk a levelezőprogramját.', 'Az űrlap adatai előre kitöltött e-mailben várják – a küldés a levelezőprogramban történik. Ha nem nyílt meg, írjon közvetlenül a ' + MAIL + ' címre.');
    });
  }
})();
