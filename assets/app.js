/* 변호사 AX 나노디그리 — 공통 스크립트. 빌드 산출물(scripts/build-site.mjs). */
(function () {
  'use strict';

  var STORE_PREFIX = 'pulse-edu/v1/';
  var pageId = document.body.getAttribute('data-page') || 'page';

  /* ---------- localStorage 안전 래퍼 (키 체계는 v1 그대로 유지) ---------- */
  function load(id) {
    try {
      var raw = window.localStorage.getItem(STORE_PREFIX + id);
      if (!raw) return [];
      var v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function save(id, list) {
    try { window.localStorage.setItem(STORE_PREFIX + id, JSON.stringify(list)); } catch (e) {}
  }
  window.PulseStore = { prefix: STORE_PREFIX, load: load, save: save };

  /* ---------- 복사 버튼 ---------- */
  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }

  /* file:// 로 열면 클립보드 권한이 막히는 경우가 있어 구식 방식으로 한 번 더 시도한다 */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }

  function flash(btn, msg) {
    var original = btn.getAttribute('data-original') || btn.textContent;
    btn.setAttribute('data-original', original);
    btn.textContent = msg;
    btn.classList.add('is-done');
    window.setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove('is-done');
    }, 2000);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.code-card');
      var pre = card ? card.querySelector('pre') : null;
      if (!pre) return;
      copyText(pre.innerText).then(
        function () { flash(btn, '복사됨 ✓'); },
        function () { flash(btn, '직접 복사하세요'); }
      );
    });
  });

  /* ---------- 모바일에서는 사이드 박스를 접어 둔다 ---------- */
  var folds = Array.prototype.slice.call(document.querySelectorAll('aside.side .side-box'));
  if (folds.length && window.matchMedia) {
    var mq = window.matchMedia('(max-width: 900px)');
    var sync = function (narrow) {
      folds.forEach(function (d) {
        if (narrow) { if (!d.hasAttribute('data-touched')) d.removeAttribute('open'); }
        else d.setAttribute('open', '');
      });
    };
    folds.forEach(function (d) {
      d.addEventListener('toggle', function () { d.setAttribute('data-touched', '1'); });
    });
    sync(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', function (e) { sync(e.matches); });
  }

  /* ---------- 목차 스크롤 스파이 ---------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.side-toc .toc-list a'));
  if (tocLinks.length) {
    var targets = [];
    tocLinks.forEach(function (a) {
      var id = decodeURIComponent((a.getAttribute('href') || '').slice(1));
      var el = id ? document.getElementById(id) : null;
      if (el) targets.push({ link: a, el: el });
    });

    var current = null;
    var mark = function (link) {
      if (link === current) return;
      if (current) current.classList.remove('on');
      if (link) link.classList.add('on');
      current = link || null;
    };

    /* 스크롤 위치를 지나온 마지막 제목이 "지금 읽는 절"이다 */
    var pick = function () {
      var best = null;
      for (var k = 0; k < targets.length; k++) {
        if (targets[k].el.getBoundingClientRect().top <= 120) best = k;
        else break; // 제목은 문서 순서대로 있으므로 더 볼 필요가 없다
      }
      mark(best === null ? null : targets[best].link);
    };

    var queued = false;
    var frame = window.requestAnimationFrame
      ? function (fn) { window.requestAnimationFrame(fn); }
      : function (fn) { window.setTimeout(fn, 120); };
    var schedule = function () {
      if (queued) return;
      queued = true;
      frame(function () { queued = false; pick(); });
    };

    if (targets.length) {
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      window.addEventListener('load', pick);
      pick();
    }

    tocLinks.forEach(function (a) {
      a.addEventListener('click', function () { mark(a); });
    });
  }

  /* ---------- 체크리스트 ---------- */
  var boxes = Array.prototype.slice.call(document.querySelectorAll('input[data-task]'));
  if (boxes.length) {
    var checkedKeys = load(pageId);
    var set = {};
    checkedKeys.forEach(function (k) { set[k] = true; });

    boxes.forEach(function (box) {
      box.checked = !!set[box.getAttribute('data-task')];
      box.addEventListener('change', persist);
    });

    var panel = document.querySelector('[data-progress-bar]');
    if (panel) panel.hidden = false;
    var fill = document.querySelector('[data-progress-fill]');
    var text = document.querySelector('[data-progress-text]');
    var reset = document.querySelector('[data-reset]');

    if (reset) {
      reset.addEventListener('click', function () {
        if (!window.confirm('이 페이지의 체크 표시를 모두 지웁니다. 계속할까요?')) return;
        boxes.forEach(function (b) { b.checked = false; });
        persist();
      });
    }

    function persist() {
      var keys = boxes.filter(function (b) { return b.checked; })
                      .map(function (b) { return b.getAttribute('data-task'); });
      save(pageId, keys);
      render(keys.length);
    }

    function render(n) {
      var pct = boxes.length ? Math.round((n / boxes.length) * 100) : 0;
      if (fill) fill.style.width = pct + '%';
      if (text) {
        text.textContent = n + ' / ' + boxes.length + ' (' + pct + '%)' +
          (n === boxes.length ? ' — 완료!' : '');
      }
    }

    render(boxes.filter(function (b) { return b.checked; }).length);
  }
})();
