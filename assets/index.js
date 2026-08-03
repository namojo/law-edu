/* 홈 — 히어로 터미널 타이핑 데모. 빌드 산출물. */
(function () {
  'use strict';

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
