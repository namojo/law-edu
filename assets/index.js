/* 홈 — 진행률 집계 + 히어로 터미널 타이핑 데모. 빌드 산출물. */
(function () {
  'use strict';
  var totals = window.PULSE_TOTALS || {};
  var store = window.PulseStore;

  /* ---------- 진행률 ---------- */
  function countFor(id) { return store ? store.load(id).length : 0; }

  function render() {
    if (!store) return;
    var done = 0, all = 0;
    Object.keys(totals).forEach(function (id) {
      var total = totals[id].tasks || 0;
      done += Math.min(countFor(id), total);
      all += total;
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-chapter]'), function (el) {
      var id = el.getAttribute('data-chapter');
      var total = parseInt(el.getAttribute('data-total'), 10) || 0;
      var n = Math.min(countFor(id), total);
      var pct = total ? Math.round((n / total) * 100) : 0;
      var fill = el.querySelector('.progress-fill');
      var label = el.querySelector('.row-progress-text');
      if (fill) fill.style.width = pct + '%';
      if (label) {
        label.textContent = total
          ? '체크리스트 ' + n + ' / ' + total + ' (' + pct + '%)'
          : '체크리스트 없음';
      }
    });

    var pct = all ? Math.round((done / all) * 100) : 0;
    var pctEl = document.querySelector('[data-overall-pct]');
    var textEl = document.querySelector('[data-overall-text]');
    var ring = document.querySelector('.overall-ring');
    if (pctEl) pctEl.textContent = pct + '%';
    if (ring) {
      ring.style.background = 'conic-gradient(var(--marker) ' + pct + '%, #ffffff 0)';
    }
    if (textEl) {
      textEl.textContent = done === 0
        ? '아직 체크한 항목이 없습니다. 1차시부터 시작해 보세요.'
        : '차시와 설치가이드를 합친 ' + all + '개 항목 중 ' + done + '개를 마쳤습니다.' +
          (done === all ? ' 모든 과정을 완주했습니다!' : '');
    }
  }

  var resetAll = document.querySelector('[data-reset-all]');
  if (resetAll && store) {
    resetAll.addEventListener('click', function () {
      if (!window.confirm('모든 차시·설치가이드의 체크 표시를 지웁니다. 계속할까요?')) return;
      Object.keys(totals).forEach(function (id) { store.save(id, []); });
      render();
    });
  }

  render();
  window.addEventListener('pageshow', render);
  window.addEventListener('storage', render);

  /* ---------- 히어로 타이핑 데모 ---------- */
  var demo = document.getElementById('typing-demo');
  if (!demo) return;
  var inEl = demo.querySelector('.in');
  var outEl = demo.querySelector('.out');
  var caret = demo.querySelector('.caret');
  var prompt = '아래 가상 상담 메모를 세 줄로 요약해 주세요. 메모에 없는 사실은 만들지 마세요.';
  var answer = '요약 초안 3줄을 만들었습니다. 근거가 없는 문장은 [확인 필요]로 표시했습니다.';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    inEl.textContent = prompt;
    outEl.textContent = answer;
    if (caret) caret.style.display = 'none';
    return;
  }

  var i = 0;
  function type() {
    inEl.textContent = prompt.slice(0, i);
    i++;
    if (i <= prompt.length) { window.setTimeout(type, 45); return; }
    window.setTimeout(function () {
      outEl.textContent = answer;
      window.setTimeout(function () {
        outEl.textContent = '';
        inEl.textContent = '';
        i = 0;
        window.setTimeout(type, 900);
      }, 4200);
    }, 500);
  }
  window.setTimeout(type, 700);
})();
