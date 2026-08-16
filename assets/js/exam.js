/* =============================================================
   CCAR-F Study Hub — mock exam engine
   ============================================================= */
(function () {
'use strict';

var TOTAL_SECONDS = 120 * 60;
var PASS_SCALED = 720;

var S = {
  started: false,
  mode: 'study',          // 'study' | 'exam'
  order: [],              // array of indices into QUESTIONS
  cur: 0,
  answers: {},            // n -> ['A'] | ['A','C']
  revealed: {},           // n -> true (study mode: answer locked & explained)
  flags: {},              // n -> true
  endsAt: null,
  submitted: false,
  tick: null
};

/* ---------- utilities ---------- */
function $(id) { return document.getElementById(id); }
function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function sameSet(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  var x = a.slice().sort().join(','), y = b.slice().sort().join(',');
  return x === y;
}
function q(i) { return QUESTIONS[S.order[i]]; }
function fmtTime(s) {
  if (s < 0) s = 0;
  var m = Math.floor(s / 60), r = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
}

/* ---------- persistence ---------- */
function save() {
  store.set('exam', {
    started: S.started, mode: S.mode, order: S.order, cur: S.cur,
    answers: S.answers, revealed: S.revealed, flags: S.flags,
    endsAt: S.endsAt, submitted: S.submitted
  });
}
function load() {
  var d = store.get('exam', null);
  if (!d || !d.started || !Array.isArray(d.order) || d.order.length !== QUESTIONS.length) return false;
  S.started = true; S.mode = d.mode; S.order = d.order; S.cur = d.cur || 0;
  S.answers = d.answers || {}; S.revealed = d.revealed || {}; S.flags = d.flags || {};
  S.endsAt = d.endsAt; S.submitted = !!d.submitted;
  return true;
}

/* ---------- start / reset ---------- */
function start(mode, shuffled) {
  S.started = true;
  S.mode = mode;
  S.order = QUESTIONS.map(function (_, i) { return i; });
  if (shuffled) shuffle(S.order);
  S.cur = 0; S.answers = {}; S.revealed = {}; S.flags = {};
  S.submitted = false;
  S.endsAt = Date.now() + TOTAL_SECONDS * 1000;
  save();
  showExam();
}

function resetAll() {
  if (!confirm('Discard this attempt and all answers?')) return;
  store.del('exam');
  clearInterval(S.tick);
  S = { started: false, mode: 'study', order: [], cur: 0, answers: {}, revealed: {}, flags: {}, endsAt: null, submitted: false, tick: null };
  $('intro').classList.remove('hide');
  $('examView').classList.add('hide');
  $('resultView').classList.add('hide');
  $('examBar').classList.add('hide');
  window.scrollTo(0, 0);
}

/* ---------- timer ---------- */
function startTimer() {
  clearInterval(S.tick);
  S.tick = setInterval(function () {
    if (S.submitted) { clearInterval(S.tick); return; }
    var left = Math.floor((S.endsAt - Date.now()) / 1000);
    var t = $('timer');
    t.textContent = fmtTime(left);
    t.className = 'timer' + (left <= 300 ? ' crit' : left <= 900 ? ' low' : '');
    if (left <= 0) { clearInterval(S.tick); submit(true); }
  }, 1000);
}

/* ---------- rendering ---------- */
function showExam() {
  $('intro').classList.add('hide');
  $('resultView').classList.add('hide');
  $('examView').classList.remove('hide');
  $('examBar').classList.remove('hide');
  $('modeLabel').textContent = S.mode === 'exam' ? 'Exam mode' : 'Study mode';
  if (S.mode === 'exam' && !S.submitted) { startTimer(); }
  else { $('timer').textContent = S.submitted ? 'done' : 'study'; $('timer').className = 'timer'; }
  renderNav();
  renderQuestion();
}

function renderNav() {
  var nav = $('qnav');
  nav.innerHTML = '';
  S.order.forEach(function (qi, i) {
    var item = QUESTIONS[qi];
    var b = el('button', null, String(i + 1));
    var answered = !!S.answers[item.n];
    var cls = [];
    if (answered) cls.push('answered');
    if (S.flags[item.n]) cls.push('flagged');
    if (i === S.cur) cls.push('current');
    if (S.submitted || S.revealed[item.n]) {
      cls = cls.filter(function (c) { return c !== 'answered'; });
      cls.push(sameSet(S.answers[item.n], item.correct) ? 'correct' : 'wrong');
    }
    b.className = cls.join(' ');
    b.title = 'Q' + (i + 1) + ' · ' + DOMAINS[item.domain].name;
    b.onclick = function () { S.cur = i; save(); renderNav(); renderQuestion(); window.scrollTo(0, 0); };
    nav.appendChild(b);
  });
  var answeredCount = Object.keys(S.answers).length;
  $('answeredCount').textContent = answeredCount + ' / ' + QUESTIONS.length + ' answered';
  $('progressBar').style.width = (answeredCount / QUESTIONS.length * 100) + '%';
}

function renderQuestion() {
  var item = q(S.cur);
  var root = $('qbody');
  root.innerHTML = '';

  var card = el('div', 'qcard');

  /* meta */
  var meta = el('div', 'qmeta');
  meta.appendChild(el('span', 'tag accent', 'Q' + (S.cur + 1) + ' of ' + QUESTIONS.length));
  meta.appendChild(el('span', 'tag info', DOMAINS[item.domain].name));
  meta.appendChild(el('span', 'tag', item.topic));
  if (item.type === 'multi') meta.appendChild(el('span', 'tag warn', 'Select 2'));
  card.appendChild(meta);

  /* scenario */
  var sc = SCENARIOS[item.sc];
  if (sc) {
    var box = el('div', 'scenario');
    box.appendChild(el('div', 'sc-title', 'Scenario · ' + sc.title));
    box.appendChild(el('div', null, sc.text));
    card.appendChild(box);
  }

  card.appendChild(el('div', 'qstem', item.stem));
  if (item.type === 'multi') card.appendChild(el('div', 'qhint', 'Select exactly TWO answers.'));

  /* options */
  var locked = S.submitted || S.revealed[item.n];
  var opts = el('div', 'opts');
  ['A', 'B', 'C', 'D'].forEach(function (L) {
    if (!item.opts[L]) return;
    var chosen = (S.answers[item.n] || []).indexOf(L) !== -1;
    var isCorrect = item.correct.indexOf(L) !== -1;

    var lab = el('label', 'opt' + (chosen ? ' sel' : '') + (locked ? ' locked' : ''));
    if (locked) {
      lab.classList.remove('sel');
      if (isCorrect) lab.classList.add('is-correct');
      else if (chosen) lab.classList.add('is-wrong');
    }

    var inp = document.createElement('input');
    inp.type = item.type === 'multi' ? 'checkbox' : 'radio';
    inp.name = 'q' + item.n;
    inp.checked = chosen;
    inp.disabled = locked;
    inp.onchange = function () { choose(item, L, inp.checked); };
    lab.appendChild(inp);
    lab.appendChild(el('span', 'lt', L));
    lab.appendChild(el('span', null, item.opts[L]));
    if (locked) {
      lab.appendChild(el('span', 'verdict', isCorrect ? 'CORRECT' : (chosen ? 'YOUR PICK' : '')));
    }
    opts.appendChild(lab);
  });
  card.appendChild(opts);

  /* explanation */
  if (locked) card.appendChild(explainBlock(item));

  root.appendChild(card);

  /* actions */
  var act = el('div', 'exam-actions');

  var prev = el('button', 'btn ghost', '← Previous');
  prev.disabled = S.cur === 0;
  prev.onclick = function () { S.cur--; save(); renderNav(); renderQuestion(); window.scrollTo(0, 0); };
  act.appendChild(prev);

  var next = el('button', 'btn ghost', 'Next →');
  next.disabled = S.cur === QUESTIONS.length - 1;
  next.onclick = function () { S.cur++; save(); renderNav(); renderQuestion(); window.scrollTo(0, 0); };
  act.appendChild(next);

  var flag = el('button', 'btn ghost', S.flags[item.n] ? '⚑ Unflag' : '⚐ Flag for review');
  flag.onclick = function () { S.flags[item.n] = !S.flags[item.n]; save(); renderNav(); renderQuestion(); };
  act.appendChild(flag);

  if (S.mode === 'study' && !S.submitted && !S.revealed[item.n]) {
    var check = el('button', 'btn', 'Check answer');
    check.disabled = !answerComplete(item);
    check.onclick = function () { S.revealed[item.n] = true; save(); renderNav(); renderQuestion(); };
    act.appendChild(check);
  }

  var sub = el('button', 'btn' + (S.submitted ? ' ghost' : ''), S.submitted ? 'View results' : 'Submit exam');
  sub.onclick = function () { S.submitted ? showResults() : submit(false); };
  act.appendChild(sub);

  root.appendChild(act);

  var kb = el('div', 'kbdrow');
  kb.style.marginTop = '14px';
  kb.innerHTML = '<kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> select · <kbd>←</kbd><kbd>→</kbd> navigate · <kbd>F</kbd> flag' +
    (S.mode === 'study' ? ' · <kbd>Enter</kbd> check answer' : '');
  root.appendChild(kb);
}

function explainBlock(item) {
  var wrap = el('div', 'explain');
  var got = sameSet(S.answers[item.n], item.correct);
  var ans = item.correct.join(' + ');

  wrap.appendChild(el('div', 'verdict-banner ' + (got ? 'ok' : 'bad'),
    got ? '✓ Correct — the answer is ' + ans
        : '✗ Incorrect — the answer is ' + ans +
          (S.answers[item.n] ? '. You chose ' + S.answers[item.n].join(' + ') + '.' : '. No answer recorded.')));

  wrap.appendChild(el('h5', null, 'The rule behind it'));
  wrap.appendChild(el('div', 'note rule', item.rule));

  wrap.appendChild(el('h5', null, 'Every option, judged'));
  var ul = el('ul', 'why-list');
  ['A', 'B', 'C', 'D'].forEach(function (L) {
    if (!item.opts[L] || !item.why[L]) return;
    var isCorrect = item.correct.indexOf(L) !== -1;
    var li = el('li');
    li.appendChild(el('span', 'wl ' + (isCorrect ? 'ok' : 'bad'), L + (isCorrect ? ' ✓' : ' ✗')));
    li.appendChild(el('span', null, item.why[L]));
    ul.appendChild(li);
  });
  wrap.appendChild(ul);
  return wrap;
}

function answerComplete(item) {
  var a = S.answers[item.n] || [];
  return item.type === 'multi' ? a.length === 2 : a.length === 1;
}

function choose(item, L, checked) {
  var a = (S.answers[item.n] || []).slice();
  if (item.type === 'multi') {
    if (checked) {
      if (a.length >= 2) a.shift();      // keep the two most recent picks
      if (a.indexOf(L) === -1) a.push(L);
    } else {
      a = a.filter(function (x) { return x !== L; });
    }
  } else {
    a = [L];
  }
  if (a.length) S.answers[item.n] = a; else delete S.answers[item.n];
  save();
  renderNav();
  renderQuestion();
}

/* ---------- submit & results ---------- */
function submit(auto) {
  var unanswered = QUESTIONS.length - Object.keys(S.answers).length;
  var incomplete = QUESTIONS.filter(function (it) {
    return S.answers[it.n] && it.type === 'multi' && S.answers[it.n].length !== 2;
  }).length;
  if (!auto) {
    var msg = 'Submit the exam?';
    if (unanswered) msg += '\n\n' + unanswered + ' question(s) unanswered.';
    if (incomplete) msg += '\n' + incomplete + ' select-2 question(s) have only one answer.';
    if (!confirm(msg)) return;
  }
  S.submitted = true;
  clearInterval(S.tick);
  save();
  showResults();
}

function scoreIt() {
  var byDomain = {};
  Object.keys(DOMAINS).forEach(function (d) { byDomain[d] = { right: 0, total: 0 }; });
  var right = 0;
  QUESTIONS.forEach(function (it) {
    byDomain[it.domain].total++;
    if (sameSet(S.answers[it.n], it.correct)) { right++; byDomain[it.domain].right++; }
  });
  var scaled = Math.round(100 + (right / QUESTIONS.length) * 900);
  return { right: right, total: QUESTIONS.length, scaled: scaled, byDomain: byDomain };
}

function showResults() {
  $('intro').classList.add('hide');
  $('examView').classList.add('hide');
  $('examBar').classList.add('hide');
  var v = $('resultView');
  v.classList.remove('hide');
  v.innerHTML = '';

  var r = scoreIt();
  var passed = r.scaled >= PASS_SCALED;

  var hero = el('div', 'result-hero card');
  var ring = el('div', 'score-ring');
  ring.style.setProperty('--pct', Math.round(r.scaled / 1000 * 100));
  ring.style.setProperty('--rc', passed ? 'var(--ok)' : 'var(--bad)');
  ring.innerHTML = '<div><div class="sv">' + r.scaled + '</div><div class="sl">scaled / 1000</div></div>';
  hero.appendChild(ring);
  hero.appendChild(el('h2', null, (passed ? 'Pass' : 'Below the passing score') +
    ' — ' + r.right + ' of ' + r.total + ' correct'));
  hero.style.paddingTop = '26px';
  hero.querySelector('h2').style.cssText = 'border:0;margin:0 0 6px;padding:0;color:' + (passed ? 'var(--ok)' : 'var(--bad)');
  hero.appendChild(el('p', 'muted', 'The real exam passes at <strong>' + PASS_SCALED + '/1000</strong>' +
    ' (about ' + Math.ceil(PASS_SCALED_ITEMS()) + ' of 60 items). Aim for 850+ here before you book, because a ' +
    'proctored closed-book room costs points a practice run does not.'));
  v.appendChild(hero);

  /* domain breakdown */
  var dom = el('div', 'card');
  dom.style.marginTop = '18px';
  dom.appendChild(el('h3', 'mt0', 'By domain'));
  dom.appendChild(el('p', 'small muted', 'Item counts follow the published blueprint weightings, so a weak domain here is a real signal about where to go back to the documentation.'));
  Object.keys(DOMAINS).forEach(function (d) {
    var b = r.byDomain[d];
    var pct = b.total ? Math.round(b.right / b.total * 100) : 0;
    var row = el('div', 'bar-row');
    row.appendChild(el('div', null, DOMAINS[d].name + ' <span class="muted small">· ' + DOMAINS[d].weight + '%</span>'));
    var bar = el('div', 'bar');
    var i = el('i'); i.style.width = pct + '%';
    i.className = pct >= 80 ? 'good' : pct < 60 ? 'poor' : '';
    bar.appendChild(i);
    row.appendChild(bar);
    row.appendChild(el('div', 'small', '<strong>' + b.right + '/' + b.total + '</strong> · ' + pct + '%'));
    dom.appendChild(row);
  });
  v.appendChild(dom);

  /* weak areas */
  var weak = Object.keys(DOMAINS).filter(function (d) {
    var b = r.byDomain[d]; return b.total && (b.right / b.total) < 0.7;
  });
  if (weak.length) {
    var w = el('div', 'note trap');
    w.style.marginTop = '18px';
    w.innerHTML = '<b>Go back to the documentation for these</b>' +
      weak.map(function (d) { return DOMAINS[d].name; }).join(' · ') +
      '. Read the topic sections and redo the matching exercises before retaking — the "why the others are ruled ' +
      'out" text below is where the marginal points live.';
    v.appendChild(w);
  }

  /* missed list */
  var missed = QUESTIONS.filter(function (it) { return !sameSet(S.answers[it.n], it.correct); });
  var m = el('div', 'card');
  m.style.marginTop = '18px';
  m.appendChild(el('h3', 'mt0', missed.length ? 'Questions to review (' + missed.length + ')' : 'Nothing missed'));
  if (missed.length) {
    var list = el('div');
    list.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px';
    missed.forEach(function (it) {
      var idx = S.order.indexOf(QUESTIONS.indexOf(it));
      var b = el('button', 'chip', 'Q' + (idx + 1) + ' · ' + it.topic);
      b.style.cssText = 'width:auto;display:inline-block;margin:0;padding:5px 10px;font-size:12.5px';
      b.onclick = function () { S.cur = idx; save(); showExam(); window.scrollTo(0, 0); };
      list.appendChild(b);
    });
    m.appendChild(list);
  } else {
    m.appendChild(el('p', 'mb0 muted', 'A clean sweep. Retake with the order shuffled to confirm you learned the principles rather than the answer letters.'));
  }
  v.appendChild(m);

  var act = el('div', 'exam-actions');
  var rev = el('button', 'btn', 'Review every question with explanations');
  rev.onclick = function () { S.cur = 0; showExam(); window.scrollTo(0, 0); };
  act.appendChild(rev);
  var again = el('button', 'btn ghost', 'Retake (shuffled)');
  again.onclick = function () { store.del('exam'); start(S.mode, true); window.scrollTo(0, 0); };
  act.appendChild(again);
  var rst = el('button', 'btn ghost', 'Start over');
  rst.onclick = resetAll;
  act.appendChild(rst);
  v.appendChild(act);

  window.scrollTo(0, 0);
}

function PASS_SCALED_ITEMS() { return (PASS_SCALED - 100) / 900 * QUESTIONS.length; }

/* ---------- keyboard ---------- */
document.addEventListener('keydown', function (e) {
  if (!S.started || S.submitted && false) return;
  if (!$('examView') || $('examView').classList.contains('hide')) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
  var item = q(S.cur);
  if (e.key === 'ArrowLeft' && S.cur > 0) { S.cur--; save(); renderNav(); renderQuestion(); }
  else if (e.key === 'ArrowRight' && S.cur < QUESTIONS.length - 1) { S.cur++; save(); renderNav(); renderQuestion(); }
  else if (/^[1-4]$/.test(e.key)) {
    if (S.submitted || S.revealed[item.n]) return;
    var L = ['A', 'B', 'C', 'D'][parseInt(e.key, 10) - 1];
    if (!item.opts[L]) return;
    var chosen = (S.answers[item.n] || []).indexOf(L) !== -1;
    choose(item, L, item.type === 'multi' ? !chosen : true);
  }
  else if (e.key === 'f' || e.key === 'F') { S.flags[item.n] = !S.flags[item.n]; save(); renderNav(); renderQuestion(); }
  else if (e.key === 'Enter' && S.mode === 'study' && !S.revealed[item.n] && answerComplete(item)) {
    S.revealed[item.n] = true; save(); renderNav(); renderQuestion();
  }
});

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', function () {
  $('startStudy').onclick = function () { start('study', $('shuffleOpt').checked); };
  $('startExam').onclick  = function () { start('exam',  $('shuffleOpt').checked); };
  $('resetBtn').onclick   = resetAll;
  $('submitTop').onclick  = function () { S.submitted ? showResults() : submit(false); };

  /* blueprint table on the intro screen */
  var tb = $('blueprintBody');
  if (tb) {
    var counts = {};
    QUESTIONS.forEach(function (it) { counts[it.domain] = (counts[it.domain] || 0) + 1; });
    Object.keys(DOMAINS).forEach(function (d) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + DOMAINS[d].name + '</td><td>' + DOMAINS[d].weight + '%</td><td>' + (counts[d] || 0) + '</td>';
      tb.appendChild(tr);
    });
    var multi = QUESTIONS.filter(function (it) { return it.type === 'multi'; }).length;
    $('multiCount').textContent = multi;
  }

  if (load()) {
    if (S.submitted) showResults();
    else showExam();
  }
});

})();
