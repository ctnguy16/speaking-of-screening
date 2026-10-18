/* =============================================================================
   Speaking of Screening — main flow (landing → screener → result → contact → thanks)
   All wording and rules come from assets/config.js. You should not need to edit
   this file to change questions, options or eligibility.
   ============================================================================= */
(function () {
  'use strict';

  var C = window.STUDY_CONFIG;
  var S = C.STUDY;
  var DEMO = !C.APPS_SCRIPT_URL;                 // no backend URL → simulate in the browser
  var app = document.getElementById('app');
  var announcer = document.getElementById('announcer');

  var Q = {};                                    // questions by id
  C.QUESTIONS.forEach(function (q) { Q[q.id] = q; });
  var MAIN = C.QUESTIONS.filter(function (q) { return !q.followUpOnly; });

  var state = {
    screen: 'landing',
    pos: 0,               // position in the current question sequence
    answers: {},          // { questionId: value }
    finished: false,      // true once a result screen has been shown
    submitting: false,
    form: { first: '', last: '', email: '', email2: '', consent: false },
    lastRecord: null,
    dir: null,            // which way the next screen animates in
    prevPct: 0            // progress bar width before the current screen
  };

  /* Motion: short slides between screens. Turned off for people who ask their
     device to reduce motion. */
  var MOTION = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var leaving = false;

  /* ---------- Small helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.25l4.5 4.5L19 7.25"/></svg>',
    checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.25l3 3 6-6.5"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r=".6" fill="currentColor"/></svg>',
    search: '<svg class="search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="6.5" width="13" height="11" rx="2"/><path d="M15.5 10.5l6-3.5v10l-6-3.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path transform="translate(0 -0.8)" d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r=".7" fill="currentColor"/></svg>'
  };

  function announce(text) {
    announcer.textContent = '';
    setTimeout(function () { announcer.textContent = text; }, 60);
  }
  function focusHeading() {
    var h = app.querySelector('[data-focus]');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  function toTop() {                              // glide back to the top instead of jumping
    if ((window.scrollY || window.pageYOffset) > 0) {
      try { window.scrollTo({ top: 0, behavior: MOTION ? 'smooth' : 'auto' }); } catch (e) { window.scrollTo(0, 0); }
    }
  }

  /* Smooth height: #app always matches the height of the screen inside it, and
     eases between heights, so the footer glides up or down when a question is
     shorter or longer (or an error message, answer list or alert appears) instead
     of jumping. Off when "reduce motion" is on or the browser lacks ResizeObserver. */
  var heightWatch = (function () {
    if (!MOTION || !window.ResizeObserver) return function () {};
    var watched = null;
    var ro = new ResizeObserver(function () { sync(); });
    function sync() {
      var el = app.firstElementChild;
      if (el) app.style.height = el.offsetHeight + 'px';
    }
    app.classList.add('smooth-height');
    return function () {
      var el = app.firstElementChild;
      if (el === watched) return;
      if (watched) ro.unobserve(watched);
      watched = el;
      if (el) { ro.observe(el); sync(); }
    };
  })();

  /* ---------- Fill study details into the static header/footer ---------- */
  document.querySelectorAll('[data-bind]').forEach(function (el) {
    var v = S[el.getAttribute('data-bind')]; if (v) el.textContent = v;
  });
  document.querySelectorAll('[data-bind-email]').forEach(function (el) {
    el.textContent = S.contactEmail; el.href = 'mailto:' + S.contactEmail;
  });

  /* ---------- Question sequence + eligibility ---------- */
  function optionFor(q, value) {
    return (q.options || []).filter(function (o) { return o.value === value; })[0];
  }
  function sequence() {
    var seq = [];
    MAIN.forEach(function (q) {
      seq.push(q.id);
      var o = q.type === 'choice' && optionFor(q, state.answers[q.id]);
      if (o && o.result === 'followUp' && o.followUp) seq.push(o.followUp);
    });
    return seq;
  }
  function mainNumber(id) {                       // "Question N of 7" (follow-ups share their parent's number)
    var q = Q[id];
    if (q.followUpOnly) {
      var parent = MAIN.filter(function (m) {
        return (m.options || []).some(function (o) { return o.followUp === id; });
      })[0];
      return MAIN.indexOf(parent) + 1;
    }
    return MAIN.indexOf(q) + 1;
  }
  function resultFor(q, value) {
    if (value == null || value === '') return 'ineligible';
    if (q.type === 'number') {
      var n = Number(value);
      return n >= q.eligibleMin && n <= q.eligibleMax ? 'eligible' : 'ineligible';
    }
    if (q.type === 'state') return C.ACCEPTED_STATES.indexOf(value) > -1 ? 'eligible' : 'ineligible';
    var o = optionFor(q, value);
    if (!o) return 'ineligible';
    if (o.result === 'followUp') return resultFor(Q[o.followUp], state.answers[o.followUp]);
    return o.result;
  }
  function evaluate() {
    var results = MAIN.map(function (q) { return resultFor(q, state.answers[q.id]); });
    var flags = { neverScreened: false };
    sequence().forEach(function (id) {
      var o = Q[id].type === 'choice' && optionFor(Q[id], state.answers[id]);
      if (o && o.flags && o.flags.neverScreened) flags.neverScreened = true;
    });
    var outcome = results.indexOf('ineligible') > -1 ? 'ineligible'
      : results.indexOf('review') > -1 ? 'review' : 'eligible';
    return { outcome: outcome, flags: flags };
  }
  function answerLabel(q, value) {
    if (value == null || value === '') return '';
    if (q.type === 'number') return String(value);
    if (q.type === 'state') return value === q.outsideValue ? q.outsideLabel : value;
    var o = optionFor(q, value); return o ? o.label : String(value);
  }

  /* ---------- History: the phone's Back button steps back through screens ---------- */
  function dirFor(fromS, fromP, toS, toP) {
    if (fromS === 'question' && toS === 'question') return toP >= fromP ? 'fwd' : 'back';
    if (toS === 'question') return 'start';
    if (fromS === 'question' && toS === 'landing') return 'back';
    if (fromS === 'info' && toS === 'landing') return 'back';
    return 'rise';
  }
  function go(screen, pos, replace) {
    if (leaving) return;                        // ignore double taps mid-transition
    var toPos = pos != null ? pos : state.pos;
    var dir = dirFor(state.screen, state.pos, screen, toPos);
    function commit() {
      leaving = false;
      state.screen = screen;
      state.pos = toPos;
      state.dir = dir;
      var entry = { screen: screen, pos: state.pos };
      try {
        if (replace) history.replaceState(entry, ''); else history.pushState(entry, '');
      } catch (e) { /* history may be unavailable in some embeds */ }
      render();
    }
    toTop();
    var current = app.querySelector('[data-anim]');
    if (!MOTION || !current) { commit(); return; }
    leaving = true;
    current.classList.add(dir === 'back' ? 'leave-back' : (dir === 'fwd' ? 'leave-fwd' : 'leave-fade'));
    setTimeout(commit, 160);
  }
  window.addEventListener('popstate', function (ev) {
    var s = ev.state;
    if (!s || state.finished || state.submitting) { resetAll(); render(); return; }
    if (s.screen === 'question' && s.pos >= sequence().length) s.pos = sequence().length - 1;
    state.dir = dirFor(state.screen, state.pos, s.screen, s.pos || 0);
    state.screen = s.screen; state.pos = s.pos || 0;
    render();
  });
  function resetAll() {
    state.screen = 'landing'; state.pos = 0; state.answers = {}; state.finished = false;
    state.form = { first: '', last: '', email: '', email2: '', consent: false };
    state.lastRecord = null;
    state.prevPct = 0;
  }

  /* ---------- Screens ---------- */
  function render() {
    var fn0 = {
      landing: renderLanding, info: renderInfo, question: renderQuestion,
      notEligible: renderNotEligible, contact: renderContact, thanks: renderThanks
    }[state.screen] || renderLanding;
    document.getElementById('main').setAttribute('data-screen', state.screen);
    if (state.screen !== 'question') state.prevPct = 0;
    fn0();
    if (MOTION && state.dir) {
      var target = app.querySelector('[data-anim]');
      if (target) target.classList.add(state.dir === 'fwd' ? 'enter-fwd' : state.dir === 'back' ? 'enter-back' : 'enter-rise');
      if (state.dir === 'start') { var sec = app.querySelector('.screen'); if (sec) sec.classList.add('enter-rise'); }
    }
    state.dir = null;
    heightWatch();
    toTop();
    app.querySelectorAll('[data-restart]').forEach(function (b) {
      b.onclick = function () { resetAll(); go('landing', 0); };
    });
    focusHeading();
  }

  function demoPanelLanding() {
    if (!DEMO) return '';
    return '<div class="demo-panel" role="note">' +
      '<span class="demo-tag">DEMO MODE</span>' +
      '<p>No backend is connected, so nothing leaves this browser. Personal scheduling links to try:</p>' +
      '<ul><li><a href="schedule/index.html?id=abc123#abc123">Lan’s link</a> (id abc123)</li>' +
      '<li><a href="schedule/index.html?id=xk72pq#xk72pq">Mai’s link</a> (id xk72pq)</li>' +
      '<li><a href="schedule/index.html?id=nope99#nope99">An invalid link</a></li></ul>' +
      '</div>';
  }

  function renderLanding() {
    app.innerHTML =
      '<section class="screen stack-lg" data-anim>' +
        '<div class="stack">' +
          '<h1 data-focus>' + esc(S.title) + '</h1>' +
          '<p class="lead">' + esc(S.purpose) + '</p>' +
          '<p class="byline">Please email <strong>' + esc(S.researcher) + '</strong> (Lead Researcher) for any questions.<br>' +
            '<a id="info-link" href="' + esc(C.STUDY_INFO_DOC_URL || '#study-information') + '"' + (C.STUDY_INFO_DOC_URL ? ' target="_blank" rel="noopener"' : '') + '>Click here to see the study information sheet.</a></p>' +
        '</div>' +
        '<div class="stack">' +
          '<h2 style="font-size:22px">What taking part involves</h2>' +
          '<ol class="steps">' +
            '<li><div><h3>Answer a few questions</h3><p>A short eligibility check that takes ' + esc(S.screenerLength) + '.</p></div></li>' +
            '<li><div><h3>Share your email, if you qualify and want to continue</h3><p>The researcher will reach out if there is an interview spot.</p></div></li>' +
            '<li><div><h3>Talk with us on Zoom</h3><p>A ' + esc(S.interviewLength.replace(/minutes$/, 'minute')) + ' private conversation.</p>' +
              '<span class="gift-badge">Thank-you gift: ' + esc(S.giftAmount) + '</span></div></li>' +
          '</ol>' +
        '</div>' +
        '<p class="note">' + ICON.lock + '<span>Your answers are anonymous. We only ask for your name and email if you qualify and choose to share them.</span></p>' +
        '<div class="actions">' +
          '<button type="button" class="btn btn-primary btn-block-sm" id="start-btn">See if I’m eligible ' + ICON.arrowRight + '</button>' +
        '</div>' +
        demoPanelLanding() +
      '</section>';
    document.getElementById('start-btn').onclick = function () { state.answers = {}; go('question', 0); };
    // Study information sheet: opens the Google Doc when STUDY_INFO_DOC_URL is set;
    // until then it shows the placeholder sheet inside the site.
    if (!C.STUDY_INFO_DOC_URL) document.getElementById('info-link').onclick = function (e) { e.preventDefault(); go('info'); };
    announce(S.title + '. Welcome.');
  }

  function renderInfo() {
    var sections = C.STUDY_INFO.map(function (s) {
      return '<section><h2>' + esc(s.heading) + '</h2>' +
        s.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</section>';
    }).join('');
    app.innerHTML =
      '<section class="screen stack-lg" data-anim>' +
        '<div class="stack">' +
          '<button type="button" class="btn btn-quiet back-btn" id="back-btn" style="align-self:flex-start">' + ICON.arrowLeft + ' Back</button>' +
          '<span class="eyebrow">' + esc(S.irbNumber) + '</span>' +
          '<h1 data-focus>Study information</h1>' +
          // TODO(go-live): remove this banner once STUDY_INFO holds the IRB-approved text.
          '<p class="placeholder-banner">This is placeholder text. The final IRB-approved study information sheet will appear here.</p>' +
        '</div>' +
        '<div class="info-sections">' + sections + '</div>' +
        '<div class="actions"><button type="button" class="btn btn-primary btn-block-sm" id="start-btn">See if I’m eligible ' + ICON.arrowRight + '</button></div>' +
      '</section>';
    document.getElementById('back-btn').onclick = function () { history.back(); };
    document.getElementById('start-btn').onclick = function () { state.answers = {}; go('question', 0); };
    announce('Study information');
  }

  /* ----- One question per screen ----- */
  function renderQuestion() {
    var seq = sequence();
    if (state.pos >= seq.length) state.pos = seq.length - 1;
    var id = seq[state.pos], q = Q[id];
    var n = mainNumber(id), total = MAIN.length;
    // Filled share includes the current question: Q1 of 7 ≈ 14%, Q7 = 100%; a follow-up sits halfway.
    var pct = Math.round(((q.followUpOnly ? n + 0.5 : n) / total) * 100);
    var fromPct = MOTION ? state.prevPct : pct;
    var body = '';
    if (q.type === 'choice') body = choiceMarkup(q);
    else if (q.type === 'number') body = numberMarkup(q);
    else if (q.type === 'state') body = stateMarkup(q);

    app.innerHTML =
      '<section class="screen">' +
        '<div class="q-top">' +
          '<div class="q-progress-row">' +
            '<button type="button" class="btn btn-quiet back-btn" id="back-btn">' + ICON.arrowLeft + ' Back</button>' +
            '<span class="q-count" id="q-count">Question ' + n + ' of ' + total + '</span>' +
          '</div>' +
          '<div class="progress" role="progressbar" aria-labelledby="q-count" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + (n - 1) + '">' +
            '<div class="progress-fill" id="progress-fill" style="width:' + fromPct + '%"></div></div>' +
        '</div>' +
        '<form id="q-form" novalidate data-anim>' +
          '<fieldset aria-labelledby="q-title" aria-describedby="' + (q.helper ? 'q-helper ' : '') + (q.why ? 'q-why' : '') + '">' +
            '<div class="q-head">' +
              (q.followUpOnly ? '<span class="q-followup-tag">One more about this</span>' : '') +
              '<h2 class="q-text" id="q-title" data-focus>' + esc(q.text) + '</h2>' +
            '</div>' +
            (q.helper ? '<p class="q-helper" id="q-helper">' + esc(q.helper) + '</p>' : '') +
            (q.why ? '<p class="why" id="q-why"><b>Why we ask:</b> ' + esc(q.why) + '</p>' : '') +
            body +
            '<div id="q-error" class="field-error" hidden>' + ICON.alert + '<span id="q-error-text"></span></div>' +
          '</fieldset>' +
          '<div class="q-nav"><button type="submit" class="btn btn-primary btn-block-sm" id="next-btn">' +
            (state.pos === seq.length - 1 && !hasPendingFollowUp(q) ? 'See my result' : 'Next') + ' ' + ICON.arrowRight + '</button></div>' +
        '</form>' +
      '</section>';

    document.getElementById('back-btn').onclick = function () {
      if (state.pos === 0) go('landing', 0); else go('question', state.pos - 1);
    };
    var fill = document.getElementById('progress-fill');
    state.prevPct = pct;
    if (fromPct !== pct) {
      requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = pct + '%'; }); });
    }
    var form = document.getElementById('q-form');
    if (q.type === 'choice') bindChoice(q);
    if (q.type === 'number') bindNumber(q);
    if (q.type === 'state') bindState(q);
    form.addEventListener('submit', function (e) { e.preventDefault(); next(q); });
    announce('Question ' + n + ' of ' + total + '. ' + q.text);
  }
  function hasPendingFollowUp(q) {
    var o = q.type === 'choice' && optionFor(q, state.answers[q.id]);
    return !!(o && o.result === 'followUp');
  }
  function showQError(msg) {
    var box = document.getElementById('q-error');
    document.getElementById('q-error-text').textContent = msg;
    box.hidden = false;
    box.setAttribute('role', 'alert');
  }
  function next(q) {
    var v = state.answers[q.id];
    if (q.type === 'number') {
      var raw = document.getElementById('age-input').value.trim();
      var n = Number(raw);
      if (!/^\d{1,3}$/.test(raw) || n < q.validMin || n > q.validMax) {
        document.getElementById('age-input').setAttribute('aria-invalid', 'true');
        showQError(q.invalidMessage);
        document.getElementById('age-input').focus();
        return;
      }
      state.answers[q.id] = v = n;
    }
    if (v == null || v === '') {
      showQError(q.type === 'state' ? 'Please choose your state from the list, or choose “' + q.outsideLabel + '”.' : 'Please choose an answer to continue.');
      var first = document.querySelector('#q-form input'); if (first) first.focus();
      return;
    }
    // A disqualifying answer ends the screener right away (skips the remaining questions).
    if (!hasPendingFollowUp(q) && resultFor(q, v) === 'ineligible') { finish(); return; }
    var seq = sequence();
    if (state.pos < seq.length - 1) { go('question', state.pos + 1); return; }
    finish();
  }

  function choiceMarkup(q) {
    var cur = state.answers[q.id];
    return '<div class="choices">' + q.options.map(function (o, i) {
      var id = 'opt-' + q.id + '-' + i;
      return '<div class="choice"><input type="radio" name="' + esc(q.id) + '" id="' + id + '" value="' + esc(o.value) + '"' + (cur === o.value ? ' checked' : '') + '>' +
        '<label class="choice-card" for="' + id + '"><span class="choice-mark">' + ICON.check + '</span><span>' + esc(o.label) + '</span></label></div>';
    }).join('') + '</div>';
  }
  function bindChoice(q) {
    app.querySelectorAll('input[type=radio]').forEach(function (r) {
      r.addEventListener('change', function () {
        var prev = state.answers[q.id];
        state.answers[q.id] = r.value;
        // If a follow-up no longer applies, forget its answer.
        var prevOpt = optionFor(q, prev);
        if (prevOpt && prevOpt.followUp && prev !== r.value) delete state.answers[prevOpt.followUp];
        document.getElementById('q-error').hidden = true;
        var btn = document.getElementById('next-btn');
        var last = state.pos === sequence().length - 1 && !hasPendingFollowUp(q);
        btn.innerHTML = (last ? 'See my result' : 'Next') + ' ' + ICON.arrowRight;
      });
    });
  }

  function numberMarkup(q) {
    var cur = state.answers[q.id];
    return '<div class="field q-age-field">' +
      '<label for="age-input" class="visually-hidden">' + esc(q.text) + '</label>' +
      '<input class="input input-age" id="age-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" ' +
      'placeholder="' + esc(q.placeholder || '') + '" value="' + (cur != null ? esc(cur) : '') + '" aria-describedby="q-error-text">' +
      '</div>';
  }
  function bindNumber(q) {
    var inp = document.getElementById('age-input');
    inp.addEventListener('input', function () {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 3);
      inp.removeAttribute('aria-invalid');
      document.getElementById('q-error').hidden = true;
      state.answers[q.id] = inp.value === '' ? undefined : Number(inp.value);
    });
  }

  /* ----- State combobox (ARIA 1.2 combobox + listbox) ----- */
  var ABBR = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
  var ALL_STATES = Object.keys(ABBR).map(function (k) { return ABBR[k]; }).sort();

  function stateMarkup(q) {
    var cur = state.answers[q.id];
    var curLabel = cur ? answerLabel(q, cur) : '';
    return '<div class="combo">' +
      '<label for="state-input" class="visually-hidden">' + esc(q.text) + '</label>' +
      '<div class="combo-input-wrap">' + ICON.search +
        '<input class="input" id="state-input" type="text" role="combobox" aria-autocomplete="list" aria-expanded="' + (cur ? 'false' : 'true') + '" ' +
        'aria-controls="state-list" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Type your state, like California" value="' + esc(cur && cur !== q.outsideValue ? curLabel : '') + '">' +
        '<button type="button" class="combo-clear" id="state-clear" aria-label="Clear" ' + (cur ? '' : 'hidden') + '>' + ICON.x + '</button>' +
      '</div>' +
      '<ul class="combo-list" id="state-list" role="listbox" aria-label="States" ' + (cur ? 'hidden' : '') + '></ul>' +
      '<div class="combo-chosen" id="state-chosen" ' + (cur ? '' : 'hidden') + '>' + ICON.checkCircle + '<span>Selected: <span id="state-chosen-text">' + esc(curLabel) + '</span></span></div>' +
    '</div>';
  }
  function bindState(q) {
    var inp = document.getElementById('state-input');
    var list = document.getElementById('state-list');
    var clear = document.getElementById('state-clear');
    var chosen = document.getElementById('state-chosen');
    var items = [], active = -1, announceTimer;

    function norm(s) { return s.toLowerCase().replace(/[^a-z ]/g, '').trim(); }
    function matches(text) {
      var t = norm(text);
      if (!t) return ALL_STATES.slice();
      var abbr = ABBR[text.trim().toUpperCase()];
      var starts = [], words = [], contains = [];
      ALL_STATES.forEach(function (s) {
        var n = s.toLowerCase();
        if (n.indexOf(t) === 0) starts.push(s);
        else if (n.split(' ').some(function (w) { return w.indexOf(t) === 0; })) words.push(s);
        else if (t.length > 1 && n.indexOf(t) > -1) contains.push(s);
      });
      var out = starts.concat(words, contains);
      if (abbr && out.indexOf(abbr) === -1) out.unshift(abbr);
      else if (abbr) { out.splice(out.indexOf(abbr), 1); out.unshift(abbr); }
      return out;
    }
    function highlight(name, text) {
      var t = norm(text); if (!t) return esc(name);
      var i = name.toLowerCase().indexOf(t);
      if (i < 0) return esc(name);
      return esc(name.slice(0, i)) + '<mark>' + esc(name.slice(i, i + t.length)) + '</mark>' + esc(name.slice(i + t.length));
    }
    function draw() {
      var text = inp.value;
      var found = matches(text);
      items = found.map(function (s) { return { value: s, label: s }; });
      items.push({ value: q.outsideValue, label: q.outsideLabel, outside: true });
      var cur = state.answers[q.id];
      list.innerHTML = (found.length ? '' : '<li class="empty" role="presentation">No state matches “' + esc(text) + '”. Check the spelling, or choose the option below.</li>') +
        items.map(function (it, i) {
          return '<li role="option" id="state-opt-' + i + '" data-i="' + i + '" aria-selected="' + (cur === it.value) + '"' + (it.outside ? ' class="outside"' : '') + '>' +
            '<span>' + (it.outside ? esc(it.label) : highlight(it.label, text)) + '</span>' + ICON.check + '</li>';
        }).join('');
      active = -1; inp.removeAttribute('aria-activedescendant');
      clearTimeout(announceTimer);
      announceTimer = setTimeout(function () {
        announce(found.length === 1 ? '1 state matches' : found.length + ' states match');
      }, 500);
    }
    function open() { list.hidden = false; inp.setAttribute('aria-expanded', 'true'); draw(); }
    function close() { list.hidden = true; inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant'); active = -1; }
    function setActive(i) {
      var lis = list.querySelectorAll('[role=option]');
      lis.forEach(function (li) { li.classList.remove('active'); });
      if (i < 0 || i >= lis.length) { active = -1; inp.removeAttribute('aria-activedescendant'); return; }
      active = i; lis[i].classList.add('active');
      inp.setAttribute('aria-activedescendant', lis[i].id);
      lis[i].scrollIntoView({ block: 'nearest' });
    }
    function choose(i) {
      var it = items[i]; if (!it) return;
      state.answers[q.id] = it.value;
      inp.value = it.outside ? '' : it.label;
      document.getElementById('state-chosen-text').textContent = it.label;
      chosen.hidden = false; clear.hidden = false;
      document.getElementById('q-error').hidden = true;
      close();
      announce('Selected ' + it.label);
    }
    inp.addEventListener('input', function () {
      delete state.answers[q.id];
      chosen.hidden = true; clear.hidden = !inp.value;
      open();
    });
    inp.addEventListener('focus', function () { if (!state.answers[q.id]) open(); });
    inp.addEventListener('keydown', function (e) {
      var count = items.length;
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) open(); setActive(Math.min(active + 1, count - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (list.hidden) open(); setActive(Math.max(active - 1, 0)); }
      else if (e.key === 'Enter') {
        if (!list.hidden) {
          if (active > -1) { e.preventDefault(); choose(active); }
          else if (items.length === 2 && !items[0].outside) { e.preventDefault(); choose(0); } // one state + the "outside" row
          else if (inp.value.trim()) { e.preventDefault(); }
        }
      } else if (e.key === 'Escape') {
        if (!list.hidden && state.answers[q.id]) { e.preventDefault(); close(); }
        else if (inp.value) { e.preventDefault(); inp.value = ''; delete state.answers[q.id]; chosen.hidden = true; clear.hidden = true; open(); }
      }
    });
    list.addEventListener('click', function (e) {
      var li = e.target.closest('[role=option]'); if (li) { choose(Number(li.getAttribute('data-i'))); inp.focus(); }
    });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep focus in the input
    clear.addEventListener('click', function () {
      inp.value = ''; delete state.answers[q.id]; chosen.hidden = true; clear.hidden = true; open(); inp.focus();
    });
    if (!state.answers[q.id]) draw();
  }

  /* ----- Results ----- */
  function finish() {
    var r = evaluate();
    if (r.outcome === 'ineligible') {
      // No data is saved for people who are not eligible: clear answers from memory.
      state.answers = {};
      state.finished = true;
      go('notEligible', null, true);
    } else {
      state.result = r;
      go('contact');
    }
  }

  function renderNotEligible() {
    app.innerHTML =
      '<section class="screen stack-lg" data-anim>' +
        '<div class="stack">' +
          '<div class="result-mark" aria-hidden="true">' + ICON.heart + '</div>' +
          '<h1 data-focus>Thank you for your time</h1>' +
          '<p class="lead">Based on your answers, this study isn’t the right fit right now. We truly appreciate your interest and the time you took to answer our questions.</p>' +
          '<p>Your answers were not saved.</p>' +
        '</div>' +
        '<div class="note">' + ICON.info + '<span>If you would like to learn more about cervical cancer screening, these resources may help: ' +
          '<a href="' + esc(S.screeningResourcesUrl) + '" target="_blank" rel="noopener">' + esc(S.screeningResourcesLabel) + '</a>.</span></div>' +
        '<div class="actions"><button type="button" class="btn btn-secondary btn-block-sm" data-restart>Back to the start</button></div>' +
      '</section>';
    announce('Thank you for your time.');
  }

  function renderContact() {
    var f = state.form;
    app.innerHTML =
      '<section class="screen stack-lg" data-anim>' +
        '<div class="stack">' +
          '<div class="result-mark gold" aria-hidden="true">' + ICON.checkCircle + '</div>' +
          '<h1 data-focus>You may be a good fit for our study!</h1>' +
          '<p class="lead">If you would like to be interviewed, please share your name and email below. Participants who complete their interview will receive ' + esc(S.giftAmount) + '.</p>' +
        '</div>' +
        '<form class="form" id="contact-form" novalidate>' +
          '<div id="form-alert" tabindex="-1"></div>' +
          '<div class="form-row two">' +
            field('first', 'First name', 'text', f.first, 'given-name') +
            field('last', 'Last name', 'text', f.last, 'family-name') +
          '</div>' +
          field('email', 'Email address', 'email', f.email, 'email', 'We will only use this to contact you about this study.') +
          field('email2', 'Confirm email address', 'email', f.email2, 'email', 'Type it once more so we don’t miss you because of a typo.') +
          '<div class="honeypot" aria-hidden="true"><label for="website">Leave this empty</label><input id="website" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
          '<div class="field">' +
            '<label class="check" for="consent"><input type="checkbox" id="consent" ' + (f.consent ? 'checked' : '') + ' aria-describedby="consent-error">' +
            '<span>I agree to be contacted by email about this study. I understand I can change my mind at any time.</span></label>' +
            '<div class="field-error" id="consent-error" hidden>' + ICON.alert + '<span>Please check this box so we can contact you.</span></div>' +
          '</div>' +
          '<p class="small-print">Your name and email are stored securely and used only for this study. Your eligibility answers will be saved so the researcher can review them.</p>' +
          '<div class="actions"><button type="submit" class="btn btn-primary btn-block-sm" id="submit-btn">Submit</button></div>' +
          (DEMO ? '<div class="demo-panel" role="note"><span class="demo-tag">DEMO MODE</span><p>Submissions are simulated. To preview the error message, use the first name <strong>Test Error</strong>.</p></div>' : '') +
        '</form>' +
      '</section>';

    var form = document.getElementById('contact-form');
    ['first', 'last', 'email', 'email2'].forEach(function (k) {
      var el = document.getElementById(k);
      el.addEventListener('input', function () { state.form[k] = el.value; clearFieldError(k); });
      el.addEventListener('blur', function () { if (el.value) validateField(k); });
    });
    document.getElementById('consent').addEventListener('change', function (e) {
      state.form.consent = e.target.checked;
      if (e.target.checked) { document.getElementById('consent-error').hidden = true; e.target.removeAttribute('aria-invalid'); }
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    announce('You may be a good fit for our study.');
  }
  function field(id, label, type, value, ac, hint) {
    return '<div class="field">' +
      '<label for="' + id + '">' + label + '</label>' +
      (hint ? '<p class="hint" id="' + id + '-hint">' + hint + '</p>' : '') +
      '<input class="input" id="' + id + '" name="' + id + '" type="' + type + '" autocomplete="' + ac + '" value="' + esc(value) + '" ' +
      (type === 'email' ? 'inputmode="email" autocapitalize="off" spellcheck="false" ' : 'autocapitalize="words" ') +
      'aria-describedby="' + (hint ? id + '-hint ' : '') + id + '-error" maxlength="120">' +
      '<div class="field-error" id="' + id + '-error" hidden>' + ICON.alert + '<span></span></div>' +
    '</div>';
  }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function validateField(k) {
    var v = (document.getElementById(k).value || '').trim();
    var msg = '';
    if (k === 'first' && !v) msg = 'Please enter your first name.';
    if (k === 'last' && !v) msg = 'Please enter your last name.';
    if (k === 'email') msg = !v ? 'Please enter your email address.' : (!EMAIL_RE.test(v) ? 'This email doesn’t look complete. Please check it, like name@example.com.' : '');
    if (k === 'email2') {
      var e1 = (document.getElementById('email').value || '').trim();
      msg = !v ? 'Please type your email address again.' : (v.toLowerCase() !== e1.toLowerCase() ? 'The two email addresses don’t match. Please check both.' : '');
    }
    var box = document.getElementById(k + '-error'), inp = document.getElementById(k);
    if (msg) { box.querySelector('span').textContent = msg; box.hidden = false; inp.setAttribute('aria-invalid', 'true'); }
    else { box.hidden = true; inp.removeAttribute('aria-invalid'); }
    return !msg;
  }
  function clearFieldError(k) {
    var box = document.getElementById(k + '-error');
    if (!box.hidden) validateField(k);
  }

  function submit() {
    if (state.submitting) return;
    var ok = ['first', 'last', 'email', 'email2'].map(validateField);
    var consent = document.getElementById('consent');
    if (!consent.checked) { document.getElementById('consent-error').hidden = false; consent.setAttribute('aria-invalid', 'true'); ok.push(false); }
    if (ok.indexOf(false) > -1) {
      var firstBad = document.querySelector('#contact-form [aria-invalid="true"]');
      announce('Please fix the highlighted fields.');
      if (firstBad) firstBad.focus();
      return;
    }
    if (document.getElementById('website').value) return; // bot trap

    var r = state.result || evaluate();
    var record = buildRecord(r);
    var btn = document.getElementById('submit-btn');
    state.submitting = true;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending…';
    document.getElementById('form-alert').innerHTML = '';

    send(record).then(function (res) {
      record.participantId = res.participantId || record.participantId;
      state.lastRecord = record;
      state.submitting = false;
      state.finished = true;
      go('thanks', null, true);
    }).catch(function () {
      state.submitting = false;
      btn.disabled = false;
      btn.textContent = 'Try again';
      var alertBox = document.getElementById('form-alert');
      alertBox.innerHTML = '<div class="alert" role="alert">' + ICON.alert + '<div><p><strong>Something went wrong, and your information wasn’t sent.</strong></p>' +
        '<p>Your answers are still here. Please try again, or email <a href="mailto:' + esc(S.contactEmail) + '">' + esc(S.contactEmail) + '</a>.</p></div></div>';
      alertBox.focus();
    });
  }

  function buildRecord(r) {
    var answers = {};
    C.QUESTIONS.forEach(function (q) { answers[q.id] = answerLabel(q, state.answers[q.id]); });
    return {
      timestamp: new Date().toISOString(),
      participantId: DEMO ? demoId() : '',          // the server creates the real ID
      firstName: state.form.first.trim(),
      lastName: state.form.last.trim(),
      email: state.form.email.trim(),
      answers: answers,
      outcome: C.OUTCOME_LABELS[r.outcome],
      neverScreened: r.flags.neverScreened ? 'Yes' : 'No',
      consentToContact: 'Yes',
      website: ''                                     // honeypot (must stay empty)
    };
  }
  function demoId() {
    var a = new Uint8Array(9); (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]; }).join('').slice(0, 10);
  }

  /* Sends one record. Live: POST to Apps Script. Demo: simulated. */
  function send(record) {
    if (DEMO) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (/^test error$/i.test(record.firstName + ' ' + record.lastName) || /^test error$/i.test(record.firstName)) { reject(new Error('demo failure')); return; }
          try { // lets the demo scheduling page greet this person; demo only
            var key = 'sos-demo-participants';
            var m = JSON.parse(sessionStorage.getItem(key) || '{}'); m[record.participantId] = record.firstName;
            sessionStorage.setItem(key, JSON.stringify(m));
          } catch (e) { /* storage blocked: fine */ }
          resolve({ ok: true, participantId: record.participantId });
        }, 900);
      });
    }
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    return fetch(C.APPS_SCRIPT_URL, {
      method: 'POST',
      // text/plain avoids a CORS preflight, which Apps Script cannot answer.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(record),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) { return res.json(); })
      .then(function (data) {
        clearTimeout(timer);
        if (!data || !data.ok) throw new Error((data && data.error) || 'Submission failed');
        return data;
      }, function (err) { clearTimeout(timer); throw err; });
  }

  function renderThanks() {
    var rec = state.lastRecord || {};
    var demo = '';
    if (DEMO && rec.participantId) {
      var shown = JSON.parse(JSON.stringify(rec)); delete shown.website;
      demo = '<div class="demo-panel" role="note"><span class="demo-tag">DEMO MODE</span>' +
        '<p>This record would be sent to the Google Sheet:</p><pre>' + esc(JSON.stringify(shown, null, 2)) + '</pre>' +
        '<p>Her personal scheduling link: <a href="schedule/index.html?id=' + encodeURIComponent(rec.participantId) + '#' + encodeURIComponent(rec.participantId) + '">schedule/?id=' + esc(rec.participantId) + '</a></p></div>';
    }
    app.innerHTML =
      '<section class="screen stack-lg" data-anim>' +
        '<div class="stack">' +
          '<div class="result-mark" aria-hidden="true"><span class="success-icon">' + ICON.checkCircle + '</span></div>' +
          '<h1 data-focus>Thank you, we received your information</h1>' +
          '<p class="lead">We are grateful you are willing to share your experiences.</p>' +
          '<p>We will review your answers and reach out by email if there is an interview spot available.</p>' +
        '</div>' +
        '<div class="stack"><h2 style="font-size:22px">What happens next</h2>' +
          '<ul class="next-list">' +
            '<li>' + ICON.mail + '<div><strong>We review responses.</strong> ' + esc(S.researcher) + ' will look over your answers and email you ' + esc(S.responseTime) + ' if there is an interview spot for you.</div></li>' +
            '<li>' + ICON.calendar + '<div><strong>You pick a time.</strong> The email will include a personal link to choose an interview time that works for you.</div></li>' +
            '<li>' + ICON.video + '<div><strong>We talk on Zoom.</strong> The Zoom link is emailed after you book. The conversation takes about ' + esc(S.interviewLength) + '.</div></li>' +
          '</ul></div>' +
        '<p class="note">' + ICON.info + '<span>Please watch for an email from <strong>' + esc(S.contactEmail) + '</strong>, and check your spam or junk folder too. Not every eligible person can be interviewed, but we read every response.</span></p>' +
        '<div class="actions"><button type="button" class="btn btn-secondary btn-block-sm" data-restart>Back to the start</button></div>' +
        demo +
      '</section>';
    announce('Thank you, we received your information.');
  }

  /* ---------- Start ---------- */
  try { history.replaceState({ screen: 'landing', pos: 0 }, ''); } catch (e) {}
  render();
  // Do not steal focus on first load: undo the initial heading focus.
  if (document.activeElement && document.activeElement.hasAttribute('data-focus')) document.activeElement.blur();
})();
