/* ══════════ 공용 네임스페이스 ══════════ */
var App = {
  data: null,
  nodes: [],
  eraMap: {},
  open: null,
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  /* API는 항상 이 Worker에서 서빙한다 — 이 페이지 자체가 workers.dev에서 열렸으면
     상대경로와 결과가 같고, Cloudflare Pages 같은 다른 오리진에서 열렸어도 그대로 동작한다. */
  API_BASE: 'https://ndk.hello-world-history.workers.dev/'
};

/* ══════════ 스플래시: 로딩 + 진입 ══════════ */
(function () {
  var splash   = document.getElementById('splash');
  var appEl    = document.getElementById('app');
  var btn      = document.getElementById('enterBtn');
  var fill     = document.getElementById('gaugeFill');
  var gtxt     = document.getElementById('gaugeTxt');
  var hint     = document.getElementById('splashHint');
  var ledDest  = document.getElementById('ledDest');
  var ledPres  = document.getElementById('ledPres');
  var ledLast  = document.getElementById('ledLast');

  var destMonthEl     = document.getElementById('destMonth');
  var destDayEl       = document.getElementById('destDay');
  var destHourEl      = document.getElementById('destHour');
  var destMinEl       = document.getElementById('destMin');
  var destAmEl        = document.getElementById('destAm');
  var destPmEl        = document.getElementById('destPm');
  var destAmpmBtn     = document.getElementById('destAmpmBtn');
  var destYearDownBtn = document.getElementById('destYearDown');

  var presMonthEl     = document.getElementById('presMonth');
  var presDayEl       = document.getElementById('presDay');
  var presHourEl      = document.getElementById('presHour');
  var presMinEl       = document.getElementById('presMin');
  var presAmEl        = document.getElementById('presAm');
  var presPmEl        = document.getElementById('presPm');
  var presAmpmBtn     = document.getElementById('presAmpmBtn');
  var presYearDownBtn = document.getElementById('presYearDown');

  var tcWarningEl     = document.getElementById('tcWarning');

  var loaded = false, failed = false, charging = false;

  /* ═══ 목적지 시간 상태 (기본값: 1955년 11월 5일 06:00 AM) ═══ */
  var MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  var destState = {
    year: 1955,
    month: 11, // 1 ~ 12
    day: 5,
    hour: 6,
    min: 0,
    ampm: 'AM'
  };

  /* ═══ 현재(출발) 시간 상태 (기본값: 2026년 10월 26일 01:21 PM) ═══ */
  var presState = {
    year: 2026,
    month: 10,
    day: 26,
    hour: 1,
    min: 21,
    ampm: 'PM'
  };
  var presUserModified = false;

  App.destYear = destState.year;
  App.destMonth = destState.month;
  App.presYear = presState.year;
  App.presMonth = presState.month;

  var warnTimer = null;
  function showWarning(msg) {
    if (!tcWarningEl) return;
    tcWarningEl.innerHTML = '<span class="tc-warn-icon">⚠️</span> ' + msg;
    tcWarningEl.hidden = false;
    clearTimeout(warnTimer);
    warnTimer = setTimeout(function () {
      tcWarningEl.hidden = true;
    }, 3500);
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function renderDest() {
    if (destMonthEl) destMonthEl.textContent = MONTH_NAMES[destState.month - 1];
    if (destDayEl) destDayEl.textContent = pad2(destState.day);
    if (ledDest) ledDest.textContent = destState.year;
    if (destHourEl) destHourEl.textContent = pad2(destState.hour);
    if (destMinEl) destMinEl.textContent = pad2(destState.min);

    if (destAmEl && destPmEl) {
      destAmEl.classList.toggle('is-on', destState.ampm === 'AM');
      destPmEl.classList.toggle('is-on', destState.ampm === 'PM');
    }

    if (destYearDownBtn) {
      destYearDownBtn.classList.toggle('is-disabled', destState.year <= 1955);
    }

    App.destYear = destState.year;
    App.destMonth = destState.month;
  }

  function renderPres() {
    if (presMonthEl) presMonthEl.textContent = MONTH_NAMES[presState.month - 1];
    if (presDayEl) presDayEl.textContent = pad2(presState.day);
    if (ledPres) ledPres.textContent = presState.year;
    if (presHourEl) presHourEl.textContent = pad2(presState.hour);
    if (presMinEl) presMinEl.textContent = pad2(presState.min);

    if (presAmEl && presPmEl) {
      presAmEl.classList.toggle('is-on', presState.ampm === 'AM');
      presPmEl.classList.toggle('is-on', presState.ampm === 'PM');
    }

    if (presYearDownBtn) {
      presYearDownBtn.classList.toggle('is-disabled', presState.year <= 1955);
    }

    App.presYear = presState.year;
    App.presMonth = presState.month;
  }

  function changeDest(unit, delta) {
    if (charging) return;

    if (unit === 'year') {
      var nextYear = destState.year + delta;
      if (nextYear < 1955) {
        showWarning('1955년 이전으로는 시간 설정할 수 없습니다 (타임라인 시작점: 1955년)');
        destState.year = 1955;
        renderDest();
        return;
      }
      destState.year = nextYear;
    } else if (unit === 'month') {
      destState.month = ((destState.month - 1 + delta + 12) % 12) + 1;
      var maxD = new Date(destState.year, destState.month, 0).getDate();
      if (destState.day > maxD) destState.day = maxD;
    } else if (unit === 'day') {
      var maxD = new Date(destState.year, destState.month, 0).getDate();
      destState.day = ((destState.day - 1 + delta + maxD) % maxD) + 1;
    } else if (unit === 'hour') {
      destState.hour = ((destState.hour - 1 + delta + 12) % 12) + 1;
    } else if (unit === 'min') {
      destState.min = (destState.min + delta + 60) % 60;
    }

    renderDest();
  }

  function changePres(unit, delta) {
    if (charging) return;
    presUserModified = true;

    if (unit === 'year') {
      var nextYear = presState.year + delta;
      if (nextYear < 1955) {
        showWarning('1955년 이전으로는 시간 설정할 수 없습니다 (타임라인 시작점: 1955년)');
        presState.year = 1955;
        renderPres();
        return;
      }
      presState.year = nextYear;
    } else if (unit === 'month') {
      presState.month = ((presState.month - 1 + delta + 12) % 12) + 1;
      var maxD = new Date(presState.year, presState.month, 0).getDate();
      if (presState.day > maxD) presState.day = maxD;
    } else if (unit === 'day') {
      var maxD = new Date(presState.year, presState.month, 0).getDate();
      presState.day = ((presState.day - 1 + delta + maxD) % maxD) + 1;
    } else if (unit === 'hour') {
      presState.hour = ((presState.hour - 1 + delta + 12) % 12) + 1;
    } else if (unit === 'min') {
      presState.min = (presState.min + delta + 60) % 60;
    }

    renderPres();
  }

  function promptEdit(unit) {
    if (charging) return;
    if (unit === 'year') {
      var input = prompt('목적지(DESTINATION) 연도를 입력하세요 (1955년 이상):', destState.year);
      if (input === null) return;
      var val = parseInt(input.trim(), 10);
      if (isNaN(val)) return;
      if (val < 1955) {
        showWarning('1955년 이전으로는 설정할 수 없습니다 (1955년으로 자동 조정)');
        destState.year = 1955;
      } else {
        destState.year = val;
      }
      renderDest();
    } else if (unit === 'month') {
      var input = prompt('목적지(DESTINATION) 월을 입력하세요 (1 ~ 12):', destState.month);
      if (input === null) return;
      var val = parseInt(input.trim(), 10);
      if (!isNaN(val) && val >= 1 && val <= 12) {
        destState.month = val;
        renderDest();
      }
    } else if (unit === 'day') {
      var maxD = new Date(destState.year, destState.month, 0).getDate();
      var input = prompt('목적지(DESTINATION) 일을 입력하세요 (1 ~ ' + maxD + '):', destState.day);
      if (input === null) return;
      var val = parseInt(input.trim(), 10);
      if (!isNaN(val) && val >= 1 && val <= maxD) {
        destState.day = val;
        renderDest();
      }
    } else if (unit === 'hour') {
      var input = prompt('목적지(DESTINATION) 시간을 입력하세요 (1 ~ 12):', destState.hour);
      if (input === null) return;
      var val = parseInt(input.trim(), 10);
      if (!isNaN(val) && val >= 1 && val <= 12) {
        destState.hour = val;
        renderDest();
      }
    } else if (unit === 'min') {
      var input = prompt('목적지(DESTINATION) 분을 입력하세요 (0 ~ 59):', destState.min);
      if (input === null) return;
      var val = parseInt(input.trim(), 10);
      if (!isNaN(val) && val >= 0 && val <= 59) {
        destState.min = val;
        renderDest();
      }
    }
  }

  function promptEditPres(unit) {
    if (charging) return;
    presUserModified = true;
    if (unit === 'year') {
      var input = prompt('현재(PRESENT) 연도를 입력하세요 (1955년 이상):', presState.year);
      if (input === null) return;
      var val = parseInt(input.trim(), 10);
      if (isNaN(val)) return;
      if (val < 1955) {
        showWarning('1955년 이전으로는 설정할 수 없습니다 (1955년으로 자동 조정)');
        presState.year = 1955;
      } else {
        presState.year = val;
      }
      renderPres();
    } else if (unit === 'month') {
      var input = prompt('현재(PRESENT) 월을 입력하세요 (1 ~ 12):', presState.month);
      if (input === null) return;
      var val = parseInt(input.trim(), 10);
      if (!isNaN(val) && val >= 1 && val <= 12) {
        presState.month = val;
        renderPres();
      }
    } else if (unit === 'day') {
      var maxD = new Date(presState.year, presState.month, 0).getDate();
      var input = prompt('현재(PRESENT) 일을 입력하세요 (1 ~ ' + maxD + '):', presState.day);
      if (input === null) return;
      var val = parseInt(input.trim(), 10);
      if (!isNaN(val) && val >= 1 && val <= maxD) {
        presState.day = val;
        renderPres();
      }
    } else if (unit === 'hour') {
      var input = prompt('현재(PRESENT) 시간을 입력하세요 (1 ~ 12):', presState.hour);
      if (input === null) return;
      var val = parseInt(input.trim(), 10);
      if (!isNaN(val) && val >= 1 && val <= 12) {
        presState.hour = val;
        renderPres();
      }
    } else if (unit === 'min') {
      var input = prompt('현재(PRESENT) 분을 입력하세요 (0 ~ 59):', presState.min);
      if (input === null) return;
      var val = parseInt(input.trim(), 10);
      if (!isNaN(val) && val >= 0 && val <= 59) {
        presState.min = val;
        renderPres();
      }
    }
  }

  // 화살표 버튼 이벤트 연결 (DESTINATION & PRESENT 공통)
  document.querySelectorAll('.tc-arrow').forEach(function (arrow) {
    arrow.addEventListener('click', function (e) {
      e.stopPropagation();
      var isPres = arrow.closest('.tc-pres') != null;
      var unit = arrow.dataset.unit;
      var delta = parseInt(arrow.dataset.delta, 10);
      if (isPres) {
        changePres(unit, delta);
      } else {
        changeDest(unit, delta);
      }
    });
  });

  // 스크린 클릭/마우스휠 직접 변경 이벤트 연결 (DESTINATION & PRESENT 공통)
  document.querySelectorAll('.tc-click-edit').forEach(function (screen) {
    screen.addEventListener('click', function () {
      var isPres = screen.closest('.tc-pres') != null;
      if (isPres) {
        promptEditPres(screen.dataset.unit);
      } else {
        promptEdit(screen.dataset.unit);
      }
    });
    screen.addEventListener('wheel', function (e) {
      e.preventDefault();
      var isPres = screen.closest('.tc-pres') != null;
      var delta = e.deltaY < 0 ? 1 : -1;
      if (isPres) {
        changePres(screen.dataset.unit, delta);
      } else {
        changeDest(screen.dataset.unit, delta);
      }
    }, { passive: false });
  });

  // AM/PM 토글 버튼 (DEST)
  if (destAmpmBtn) {
    destAmpmBtn.addEventListener('click', function () {
      destState.ampm = destState.ampm === 'AM' ? 'PM' : 'AM';
      renderDest();
    });
  }

  // AM/PM 토글 버튼 (PRES)
  if (presAmpmBtn) {
    presAmpmBtn.addEventListener('click', function () {
      presState.ampm = presState.ampm === 'AM' ? 'PM' : 'AM';
      renderPres();
    });
  }

  renderDest();
  renderPres();

  function paint(p) {
    fill.style.width = (p * 100).toFixed(1) + '%';
    if (charging) {
      gtxt.textContent = Math.round(p * 88) + 'mph';
    } else {
      gtxt.textContent = '88mph';
    }
  }
  paint(0);

  /* LED 미세 깜빡임 — 영화 속 클래식 하드웨어 감성 */
  var flickTargets = [ledDest, ledPres, ledLast].filter(Boolean);
  var flick = setInterval(function () {
    if (!flickTargets.length) return;
    var t = flickTargets[Math.floor(Math.random() * flickTargets.length)];
    t.style.opacity = '.35';
    setTimeout(function () { t.style.opacity = ''; }, 70);
  }, 1400);

  function ready() {
    btn.disabled = false;
    hint.textContent = '준비 완료 — Start On을 누르면 88mph로 시간 도약합니다.';
    btn.focus();
  }

  function fail(msg) {
    failed = true;
    clearInterval(flick);
    hint.textContent = '데이터를 불러오지 못했습니다 · ' + msg;
    hint.style.color = '#FF8080';
  }

  /* ── 버튼을 누르면 88mph 까지 가속하고, 다 차면 워프로 이어진다 ── */
  var CHARGE_MS = 1500;
  function charge(done) {
    charging = true;
    clearInterval(flick);
    splash.classList.add('charging');
    if (presState.year !== destState.year) {
      hint.textContent = '88mph 가속 중… ' + presState.year + '년에서 ' + destState.year + '년으로 도약!';
    } else {
      hint.textContent = '88mph 가속 중… ' + destState.year + '년으로 도약!';
    }

    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / CHARGE_MS);
      /* 후반으로 갈수록 빨라지는 곡선 — 마지막에 확 차오르는 가속감 */
      paint(p * p * (3 - 2 * p));
      if (p < 1) return requestAnimationFrame(step);

      paint(1);
      splash.classList.remove('charging');
      splash.classList.add('charged');
      gtxt.textContent = '88mph';
      hint.textContent = '"Roads we\'re going we don\'t need roads."';
      setTimeout(done, 260);   // 88mph 달성을 눈으로 확인할 짧은 여유
    })(t0);
  }

  /* ── 사건 데이터 로드: 동일 오리진 우선 + Cloudflare Worker API fallback ── */
  var candidates = [
    'events.json',
    'content/events.json',
    'dist/events.json',
    App.API_BASE + 'api/history'
  ];

  function tryFetch(idx) {
    if (idx >= candidates.length) {
      fail('모든 소스에서 데이터를 불러오지 못했습니다.');
      return;
    }
    fetch(candidates[idx])
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        App.data = json;
        var t = json.meta && json.meta.range ? json.meta.range.to : 2026;
        if (!presUserModified) {
          presState.year = t;
          renderPres();
        }
        loaded = true;
        ready();
      })
      .catch(function (err) {
        tryFetch(idx + 1);
      });
  }

  tryFetch(0);

  btn.addEventListener('click', function () {
    if (failed || !App.data || charging) return;
    btn.disabled = true;

    if (App.reduced) {
      paint(1);
      gtxt.textContent = '88mph';
      splash.hidden = true;
      launch();
      return;
    }

    /* 충전이 끝나면 워프: 950ms 동안 화면이 중심으로 빨려들어간다.
       본편은 백색 코어가 터지는 순간(~700ms)에 뒤에서 미리 만들어 둔다. */
    charge(function warp() {
      splash.classList.add('leaving');
      setTimeout(launch, 700);
      setTimeout(function () { splash.hidden = true; }, 980);
    });
  });

  function launch() {
    appEl.hidden = false;
    appEl.classList.add('enter-anim');
    var clear = function () { appEl.classList.remove('enter-anim'); };
    appEl.addEventListener('animationend', clear, { once: true });
    setTimeout(clear, 1400);

    App.build(App.data);
    document.getElementById('scroller').focus({ preventScroll: true });

    /* 소실점으로 빨려들어간 빛이 설정한 목적지 시점에 도착 */
    if (!App.reduced) arrive();
  }

  function arrive() {
    var flash = document.createElement('div');
    flash.className = 'arrival-flash';
    document.body.appendChild(flash);
    setTimeout(function () { flash.remove(); }, 800);

    var glow = [].slice.call(document.querySelectorAll('.depart-mark'));
    if (App.destYear && App.destYear > 1955) {
      var matching = App.nodes.filter(function (n) { return n.ev.year === App.destYear; });
      if (!matching.length) {
        var closest = App.nodes.find(function (n) { return n.ev.year >= App.destYear; });
        if (closest) matching = [closest];
      }
      matching.forEach(function (n) { glow.push(n.el); });
    } else {
      var first = App.nodes[0];
      if (first) glow.push(first.el);
    }

    glow.forEach(function (el) { el.classList.add('is-arrival'); });
    setTimeout(function () {
      glow.forEach(function (el) { el.classList.remove('is-arrival'); });
    }, 5000); // 5초 동안 하이라이트 유지
  }
})();
