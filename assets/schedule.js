/* =============================================================================
   Speaking of Screening — interview scheduling page (/schedule/?id=…)
   Looks up the personal ID, greets her by first name, then shows the open
   interview times and books the one she picks. Live: times come from your
   Google Calendar via Apps Script (APPS_SCRIPT_URL) and the booking is added to
   it. Demo: a mock 2-week calendar. Settings live in assets/config.js.
   ============================================================================= */
(function () {
  'use strict';

  var C = window.STUDY_CONFIG;
  var S = C.STUDY;
  var DEMO = !C.APPS_SCRIPT_URL;
  var app = document.getElementById('app');
  var announcer = document.getElementById('announcer');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function announce(t) { announcer.textContent = ''; setTimeout(function () { announcer.textContent = t; }, 60); }
  function focusEl(el) { if (el) { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); } }

  /* ---------- Motion (same feel as the main flow) ----------
     Screens fade/slide, buttons settle in one after another, the calendar card and
     the page ease to their new heights so the footer glides. Everything is skipped
     when the device asks to reduce motion. */
  var MOTION = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var LEAVE_MS = 160;

  // Keeps `box` exactly as tall as its first child and eases between heights.
  function smoothHeight(box) {
    if (!MOTION || !window.ResizeObserver || !box) return function () {};
    var watched = null;
    var ro = new ResizeObserver(function () { sync(); });
    function sync() {
      var c = box.firstElementChild; if (!c) return;
      var cs = getComputedStyle(box);
      var extra = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
      box.style.height = (c.offsetHeight + extra) + 'px';
    }
    box.classList.add('smooth-height');
    return function () {
      var c = box.firstElementChild;
      if (c === watched) { sync(); return; }
      if (watched) ro.unobserve(watched);
      watched = c;
      if (c) { ro.observe(c); sync(); }
    };
  }
  var watchApp = smoothHeight(app);
  watchApp();

  // Swap the contents of `box`: animate the old content out, put new content in, animate it in.
  function swap(box, html, enterClass, leaveClass, after) {
    var old = box.firstElementChild;
    function put() {
      box.innerHTML = html;
      var neu = box.firstElementChild;
      if (MOTION && neu && enterClass) neu.classList.add(enterClass);
      if (after) after(neu);
    }
    if (!MOTION || !old) { put(); return; }
    old.classList.add(leaveClass || 'leave-fade');
    setTimeout(put, LEAVE_MS);
  }
  function stagger(root, selector) {               // sets --i so buttons settle in one after another
    root.querySelectorAll(selector).forEach(function (el, i) { el.style.setProperty('--i', Math.min(i, 12)); });
  }

  // "New to Zoom?" panel: animated open and close.
  function animateDetails(d) {
    var summary = d.querySelector('summary'), body = d.querySelector('.zoom-body');
    if (!summary || !body) return;
    summary.addEventListener('click', function (e) {
      if (!MOTION) return;
      e.preventDefault();
      if (d.classList.contains('is-animating')) return;
      d.classList.add('is-animating');
      if (!d.open) {
        d.open = true;
        var h = body.scrollHeight;
        body.style.height = '0px'; body.style.opacity = '0';
        requestAnimationFrame(function () { body.style.height = h + 'px'; body.style.opacity = '1'; });
      } else {
        body.style.height = body.scrollHeight + 'px';
        requestAnimationFrame(function () { body.style.height = '0px'; body.style.opacity = '0'; });
      }
      body.addEventListener('transitionend', function done(ev) {
        if (ev.propertyName !== 'height') return;
        body.removeEventListener('transitionend', done);
        if (body.style.height === '0px') d.open = false;
        body.style.height = ''; body.style.opacity = '';
        d.classList.remove('is-animating');
      });
    });
  }

  var ICON = {
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="6.5" width="13" height="11" rx="2"/><path d="M15.5 10.5l6-3.5v10l-6-3.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r=".7" fill="currentColor"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>',
    checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.25l3 3 6-6.5"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r=".6" fill="currentColor"/></svg>'
  };

  document.querySelectorAll('[data-bind]').forEach(function (el) { var v = S[el.getAttribute('data-bind')]; if (v) el.textContent = v; });
  document.querySelectorAll('[data-bind-email]').forEach(function (el) { el.textContent = S.contactEmail; el.href = 'mailto:' + S.contactEmail; });

  /* ---------- 1. Read and look up the personal ID ---------- */
  function readId() {
    var id = '';
    try { id = new URLSearchParams(location.search).get('id') || ''; } catch (e) {}
    if (!id && location.hash) id = decodeURIComponent(location.hash.slice(1)); // fallback: /schedule/#abc123
    id = id.trim();
    return /^[A-Za-z0-9_-]{4,64}$/.test(id) ? id : '';
  }

  // A person is { firstName, booking: {start, end} | null, slots: [{start, end}, …] } (Dates).
  function toSlot(s) { return { start: new Date(s.start), end: new Date(s.end) }; }
  var DEMO_BOOKINGS = 'sos-demo-bookings';      // demo only: remembers bookings in this browser tab
  function demoBookings() {
    try { return JSON.parse(sessionStorage.getItem(DEMO_BOOKINGS) || '{}'); } catch (e) { return {}; }
  }

  function lookup(id) {
    if (!id) return Promise.resolve(null);
    if (DEMO) {
      var name = C.MOCK_PARTICIPANTS[id];
      if (!name) {
        try { name = JSON.parse(sessionStorage.getItem('sos-demo-participants') || '{}')[id]; } catch (e) {}
      }
      var booked = demoBookings()[id];
      var booking = booked ? { start: new Date(booked), end: new Date(new Date(booked).getTime() + C.SCHEDULING.slotMinutes * 60000) } : null;
      return new Promise(function (r) {
        setTimeout(function () { r(name ? { firstName: name, booking: booking, slots: booking ? [] : buildSlots() } : null); }, 500);
      });
    }
    // Live: Apps Script returns ONLY the first name and the open times (or her booked time) for a valid ID.
    return fetch(C.APPS_SCRIPT_URL + '?id=' + encodeURIComponent(id), { method: 'GET' })
      .then(function (res) { return res.json(); })
      .then(function (d) {
        if (d && d.ok && d.firstName) {
          return { firstName: String(d.firstName), booking: d.booking ? toSlot(d.booking) : null, slots: (d.slots || []).map(toSlot) };
        }
        if (d && d.error) throw new Error(d.error);   // server problem, not a bad link
        return null;
      });
  }

  /* Books one time. Resolves { ok: true, booking } or { ok: false, error: 'taken' | 'already_booked' | 'invalid_link', booking? };
     rejects on network or server errors. */
  function book(id, slot) {
    if (DEMO) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          try { var m = demoBookings(); m[id] = slot.start.toISOString(); sessionStorage.setItem(DEMO_BOOKINGS, JSON.stringify(m)); } catch (e) { /* storage blocked: fine */ }
          resolve({ ok: true, booking: slot });
        }, 900);
      });
    }
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
    return fetch(C.APPS_SCRIPT_URL, {
      method: 'POST',
      // text/plain avoids a CORS preflight, which Apps Script cannot answer.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'book', id: id, start: slot.start.toISOString(), timeZone: tz }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) { return res.json(); })
      .then(function (d) {
        clearTimeout(timer);
        if (d && d.ok && d.booking) return { ok: true, booking: toSlot(d.booking) };
        if (d && /^(taken|already_booked|invalid_link)$/.test(d.error)) {
          return { ok: false, error: d.error, booking: d.booking ? toSlot(d.booking) : null };
        }
        throw new Error((d && d.error) || 'Booking failed');
      }, function (err) { clearTimeout(timer); throw err; });
  }

  function renderInvalid(problem) {
    var html =
      '<section class="screen stack-lg"><div class="stack">' +
        '<p class="eyebrow">Interview scheduling</p>' +
        '<h1 id="title">' + (problem ? 'We couldn’t load your link' : 'This link isn’t valid') + '</h1>' +
        '<p class="lead">' + (problem
          ? 'Something went wrong on our side. Please try again in a few minutes, or contact the study team at '
          : 'Please contact the study team at ') +
        '<a href="mailto:' + esc(S.contactEmail) + '">' + esc(S.contactEmail) + '</a>' + (problem ? '.' : ', and we will send you a new link.') + '</p>' +
      '</div>' +
      (DEMO ? demoLinks() : '') +
      '</section>';
    swap(app, html, 'enter-rise', 'leave-fade', function () {
      watchApp();
      focusEl(document.getElementById('title'));
    });
  }
  function demoLinks() {
    return '<div class="demo-panel" role="note"><span class="demo-tag">DEMO MODE</span>' +
      '<p>Sample personal links: <a href="index.html?id=abc123#abc123">Lan</a> · <a href="index.html?id=xk72pq#xk72pq">Mai</a> · <a href="index.html?id=h9w3rt#h9w3rt">Thu</a> · <a href="../">Back to the study page</a></p></div>';
  }

  /* ---------- 2. The page for a valid link ---------- */
  var fmtDow = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
  var fmtDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  var fmtLong = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  var fmtTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  // Bold time-zone name for a given date, so it switches on its own between e.g.
  // "Pacific Daylight Time" and "Pacific Standard Time" when daylight saving ends.
  function tzName(date) {
    var name;
    try {
      name = new Intl.DateTimeFormat('en-US', { timeZoneName: 'long' }).formatToParts(date)
        .filter(function (p) { return p.type === 'timeZoneName'; })[0].value;
    } catch (e) { name = 'your local time'; }
    return '<strong>' + esc(name) + '</strong>';
  }

  function summaryCard(b) {
    return '<div class="summary-card"><span class="big">' + esc(fmtLong.format(b.start)) + '</span>' +
      '<span>' + esc(fmtTime.format(b.start)) + ' – ' + esc(fmtTime.format(b.end)) + ' (' + tzName(b.start) + ')</span>' +
      '<span>On Zoom with ' + esc(S.researcher) + '</span></div>';
  }

  function renderWelcome(person, id) {
    var html =
      '<section class="screen stack-lg">' +
        '<div class="stack">' +
          '<p class="eyebrow">Interview scheduling</p>' +
          '<h1 id="title">Welcome back, ' + esc(person.firstName) + '!</h1>' +
          '<p class="lead">Thank you for being part of ' + esc(S.title) + '. Please choose a time for your interview of about ' + esc(S.interviewLength) + '.</p>' +
        '</div>' +
        '<div class="stack"><div id="cal" class="cal"></div></div>' +
        zoomMarkup('After you book, we will email you the Zoom link.') +
        (DEMO ? demoLinks() : '') +
      '</section>';
    swap(app, html, 'enter-rise', 'leave-fade', function () {
      watchApp();
      mountCalendar(document.getElementById('cal'), person, id);
      animateDetails(app.querySelector('details.zoom'));
      focusEl(document.getElementById('title'));
      announce('Welcome back, ' + person.firstName);
    });
  }

  // Shown when she opens her link after booking.
  function renderBooked(person) {
    var html =
      '<section class="screen stack-lg">' +
        '<div class="stack">' +
          '<p class="eyebrow">Interview scheduling</p>' +
          '<h1 id="title">You’re booked, ' + esc(person.firstName) + '!</h1>' +
          '<p class="lead">Thank you for being part of ' + esc(S.title) + '. Here is your interview time.</p>' +
        '</div>' +
        summaryCard(person.booking) +
        '<p>Need to change your time? Email <a href="mailto:' + esc(S.contactEmail) + '">' + esc(S.contactEmail) + '</a>.</p>' +
        zoomMarkup('We will email you the Zoom link before your interview.') +
        (DEMO ? demoLinks() : '') +
      '</section>';
    swap(app, html, 'enter-rise', 'leave-fade', function () {
      watchApp();
      animateDetails(app.querySelector('details.zoom'));
      focusEl(document.getElementById('title'));
      announce('You’re booked, ' + person.firstName);
    });
  }

  function zoomMarkup(linkNote) {
    return '<div class="stack">' +
          '<div class="note">' + ICON.video + '<span>All interviews are on <strong>Zoom</strong>. ' + linkNote + ' You can join from a phone, tablet or computer.</span></div>' +
          '<details class="zoom">' +
            '<summary>New to Zoom? Here’s what to expect ' + ICON.chevron + '</summary>' +
            '<div class="zoom-body"><ul>' +
              '<li>Zoom is free. On a phone, install the free Zoom app before your interview. On a computer, you can join from your web browser.</li>' +
              '<li>At your interview time, open the email from us and tap the Zoom link. You may wait a moment until the researcher lets you in.</li>' +
              '<li>Find a quiet, private place where you feel comfortable talking. Headphones help.</li>' +
              // TODO(go-live): confirm the camera policy with your IRB protocol.
              '<li>You may keep your camera off if you prefer. Only the researcher will be on the call.</li>' +
              '<li>Want to practice? Visit <a href="https://zoom.us/test" target="_blank" rel="noopener">zoom.us/test</a> to try a test meeting.</li>' +
              '<li>Need to change your time? Email <a href="mailto:' + esc(S.contactEmail) + '">' + esc(S.contactEmail) + '</a>.</li>' +
            '</ul></div>' +
          '</details>' +
        '</div>';
  }

  /* ---------- 3. Mock open times (demo only; live times come from Apps Script) ---------- */
  function tzOffset(date, tz) {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(date);
    var p = {}; parts.forEach(function (x) { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - date.getTime();
  }
  function zoned(y, m, d, hh, mm, tz) {           // wall time in tz → Date
    var guess = Date.UTC(y, m - 1, d, hh, mm);
    var off = tzOffset(new Date(guess), tz), t = guess - off;
    var off2 = tzOffset(new Date(t), tz);
    return new Date(off2 === off ? t : guess - off2);
  }
  function teamDateParts(date, tz) {
    var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' })
      .formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
    return { y: +p.year, m: +p.month, d: +p.day, wd: p.weekday };
  }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }

  function buildSlots() {
    var cfg = C.SCHEDULING, tz = cfg.teamTimeZone, slots = [];
    var now = new Date();
    for (var i = 1; i <= cfg.daysAhead; i++) {
      var dayRef = new Date(now.getTime() + i * 86400000);
      var t = teamDateParts(dayRef, tz);
      if (t.wd === 'Sun') continue;
      var times = t.wd === 'Sat' ? cfg.saturdaySlots : cfg.weekdaySlots;
      times.forEach(function (hm) {
        var key = t.y + '-' + t.m + '-' + t.d + ' ' + hm;
        if (hash(key) % 100 < 38) return;          // pretend ~38% of times are already booked
        var start = zoned(t.y, t.m, t.d, +hm.split(':')[0], +hm.split(':')[1], tz);
        slots.push({ start: start, end: new Date(start.getTime() + cfg.slotMinutes * 60000) });
      });
    }
    return slots;
  }

  /* ---------- 4. Time picker: pick a day → pick a time → confirm (books it) ---------- */
  function mountCalendar(root, person, id) {
    var byDay, order;
    function setSlots(slots) {
      byDay = {}; order = [];
      slots.forEach(function (s) {
        var k = s.start.getFullYear() + '-' + (s.start.getMonth() + 1) + '-' + s.start.getDate();
        if (!byDay[k]) { byDay[k] = []; order.push(k); }
        byDay[k].push(s);
      });
    }
    setSlots(person.slots);
    var st = { step: order.length ? 'day' : 'none', day: null, slot: null, notice: false, booked: null, sending: false };
    function mins(s) { return Math.round((s.end - s.start) / 60000); }

    function head(title, sub) {
      return '<div class="cal-head"><h2 id="cal-title">' + title + '</h2>' + (sub ? '<p class="cal-tz">' + sub + '</p>' : '') + '</div>';
    }
    function draw() {
      var html = '';
      if (st.step === 'none') {
        html = head('No open times right now') +
          '<p>All the interview times coming up are taken. Please email <a href="mailto:' + esc(S.contactEmail) + '">' + esc(S.contactEmail) + '</a> and we will find a time that works for you.</p>';
      } else if (st.step === 'day') {
        html = (st.notice ? '<div class="alert" role="alert">' + ICON.alert + '<div><p><strong>Sorry, someone just booked that time.</strong></p><p>Please choose another time.</p></div></div>' : '') +
          head('Step 1 of 2: Pick a day', 'Each interview is ' + mins(byDay[order[0]][0]) + ' minutes. Times are shown in ' + tzName(byDay[order[0]][0].start) + '.') +
          '<div class="day-grid" role="group" aria-labelledby="cal-title">' +
          order.map(function (k) {
            var d = byDay[k][0].start, n = byDay[k].length;
            return '<button type="button" class="day-btn" data-day="' + k + '" aria-pressed="' + (st.day === k) + '">' +
              '<span class="dow">' + esc(fmtDow.format(d)) + '</span><span class="date">' + esc(fmtDate.format(d)) + '</span>' +
              '<span class="count">' + n + (n === 1 ? ' time open' : ' times open') + '</span></button>';
          }).join('') + '</div>';
      } else if (st.step === 'slot') {
        var list = byDay[st.day];
        html = '<button type="button" class="btn btn-quiet back-btn" data-back="day" style="align-self:flex-start">' + ICON.arrowLeft + ' Choose a different day</button>' +
          head('Step 2 of 2: Pick a time on ' + esc(fmtLong.format(list[0].start)), 'Times are shown in ' + tzName(list[0].start) + '.') +
          '<div class="slot-list" role="group" aria-labelledby="cal-title">' +
          list.map(function (s, i) {
            return '<button type="button" class="slot-btn" data-slot="' + i + '"><span>' + esc(fmtTime.format(s.start)) + ' – ' + esc(fmtTime.format(s.end)) +
              ' <small>(' + mins(s) + ' min)</small></span>' + ICON.arrowRight + '</button>';
          }).join('') + '</div>';
      } else if (st.step === 'confirm') {
        html = '<button type="button" class="btn btn-quiet back-btn" data-back="slot" style="align-self:flex-start">' + ICON.arrowLeft + ' Choose a different time</button>' +
          head('Please confirm your interview time') +
          summaryCard(byDay[st.day][st.slot]) +
          '<div id="book-error" tabindex="-1"></div>' +
          '<div class="actions"><button type="button" class="btn btn-primary btn-block-sm" data-confirm>Confirm this time</button></div>';
      } else {
        html = '<div class="cal-head"><span class="success-icon" style="width:48px;height:48px;display:block;color:var(--uci-green)">' + ICON.checkCircle + '</span>' +
          '<h2 id="cal-title">You’re all set, ' + esc(person.firstName) + '!</h2></div>' +
          summaryCard(st.booked) +
          '<p>We sent a confirmation to the email address you gave us. If you need to change your time, email ' +
          '<a href="mailto:' + esc(S.contactEmail) + '">' + esc(S.contactEmail) + '</a>.</p>' +
          (DEMO ? '<p class="small-print">Demo only: on the live site, this time is added to the researcher’s Google Calendar and a confirmation email is sent.</p>' : '');
      }
      return '<div class="cal-step">' + html + '</div>';
    }
    var watchCal = smoothHeight(root);
    var busy = false;
    function show(dir, focus) {
      var enter = dir === 'back' ? 'enter-back' : dir === 'rise' ? 'enter-rise' : dir === 'none' ? '' : 'enter-fwd';
      var leave = dir === 'back' ? 'leave-back' : dir === 'rise' ? 'leave-fade' : 'leave-fwd';
      busy = true;
      swap(root, draw(), enter, leave, function (step) {
        busy = false;
        stagger(step, '.day-btn, .slot-btn');
        watchCal();
        if (focus) focusEl(document.getElementById('cal-title'));
      });
    }

    function confirmBooking(btn) {
      st.sending = true;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Booking…';
      document.getElementById('book-error').innerHTML = '';
      book(id, byDay[st.day][st.slot]).then(function (res) {
        st.sending = false;
        if (res.ok) { st.booked = res.booking; st.step = 'done'; announce('Your interview is booked.'); show('rise', true); return; }
        if (res.error === 'already_booked' && res.booking) { person.booking = res.booking; renderBooked(person); return; }
        if (res.error === 'invalid_link') { renderInvalid(false); return; }
        // 'taken': someone else got there first. Reload the open times and start again.
        return lookup(id).then(function (fresh) {
          if (!fresh) { renderInvalid(false); return; }
          if (fresh.booking) { renderBooked(fresh); return; }
          setSlots(fresh.slots);
          st.day = null; st.slot = null; st.notice = true;
          st.step = order.length ? 'day' : 'none';
          announce('Sorry, someone just booked that time. Please choose another time.');
          show('back', true);
        });
      }).catch(function () {
        st.sending = false;
        btn.disabled = false;
        btn.textContent = 'Try again';
        var box = document.getElementById('book-error');
        box.innerHTML = '<div class="alert" role="alert">' + ICON.alert + '<div><p><strong>Something went wrong, and your time wasn’t booked.</strong></p>' +
          '<p>Please try again, or email <a href="mailto:' + esc(S.contactEmail) + '">' + esc(S.contactEmail) + '</a>.</p></div></div>';
        box.focus();
      });
    }

    root.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t || busy || st.sending) return;
      if (t.hasAttribute('data-confirm')) { confirmBooking(t); return; }
      var dir = 'fwd';
      if (t.hasAttribute('data-day')) { st.day = t.getAttribute('data-day'); st.step = 'slot'; st.notice = false; }
      else if (t.hasAttribute('data-slot')) { st.slot = +t.getAttribute('data-slot'); st.step = 'confirm'; }
      else if (t.hasAttribute('data-back')) { st.step = t.getAttribute('data-back'); dir = 'back'; }
      else return;
      // Show the tap as a selection for a beat before moving on.
      if (t.hasAttribute('data-day')) {
        root.querySelectorAll('.day-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
      }
      t.classList.add('is-picked');
      var top = root.getBoundingClientRect().top;
      if (top < 0) { try { root.scrollIntoView({ block: 'start', behavior: MOTION ? 'smooth' : 'auto' }); } catch (err) { root.scrollIntoView(); } }
      busy = true;
      setTimeout(function () { show(dir, true); }, MOTION && dir !== 'back' ? 120 : 0);
    });
    show('none', false);
  }

  /* ---------- Start ---------- */
  var id = readId();
  if (!id) { renderInvalid(false); return; }
  lookup(id).then(function (person) {
    if (!person) renderInvalid(false);
    else if (person.booking) renderBooked(person);
    else renderWelcome(person, id);
  }).catch(function () { renderInvalid(true); });
})();
