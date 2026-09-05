/* ══════════ 노드 → 엣지 → 사각형 전개 인터랙션 ══════════ */
(function () {
  var NS = 'http://www.w3.org/2000/svg';

  var EDGE_MS   = 200;   // 엣지가 뻗는 시간
  var UNFOLD_MS = 430;   // 사각형이 펼쳐지는 시간
  var CLOSE_MS  = 200;   // 접히는 시간
  var RADIUS    = 16;    // 카드 라운드 (clip-path와 CSS가 동일해야 함)
  var NODE_R    = 25;    // 엣지가 출발하는 노드 반경
  var GAP       = 58;    // 노드와 카드 사이 가로 여백
  var VOFF      = 34;    // 노드와 앵커 모서리 사이 세로 어긋남
  var INSET     = 7;     // 앵커 지점을 모서리에서 살짝 안쪽으로

  /* 앵커 모서리별 clip-path 시퀀스: 시작 → 폭 전개 완료 → 높이 전개 완료 */
  var CLIP = {
    'top-left':     ['inset(0 100% 100% 0',   'inset(0 0 100% 0'],
    'top-right':    ['inset(0 0 100% 100%',   'inset(0 0 100% 0'],
    'bottom-left':  ['inset(100% 100% 0 0',   'inset(100% 0 0 0'],
    'bottom-right': ['inset(100% 0 0 100%',   'inset(100% 0 0 0']
  };
  var R = ' round ' + RADIUS + 'px)';
  var DONE = 'inset(0 0 0 0' + R;

  var state = null;   // { id, card, path, cap, key, anims:[], deactivate }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  App._esc = esc;

  /* ── 각 기업 공식 홈페이지 매핑 ── */
  var COMPANY_URLS = {
    // 미국/글로벌 테크·AI
    'Apple': 'https://www.apple.com',
    '애플': 'https://www.apple.com',
    'Microsoft': 'https://www.microsoft.com',
    '마이크로소프트': 'https://www.microsoft.com',
    'Intel': 'https://www.intel.com',
    '인텔': 'https://www.intel.com',
    'Nvidia': 'https://www.nvidia.com',
    '엔비디아': 'https://www.nvidia.com',
    'OpenAI': 'https://openai.com',
    'Google': 'https://about.google',
    'Alphabet': 'https://abc.xyz',
    '구글': 'https://about.google',
    'Amazon': 'https://www.aboutamazon.com',
    '아마존': 'https://www.aboutamazon.com',
    'Meta': 'https://about.meta.com',
    'Tesla': 'https://www.tesla.com',
    '테슬라': 'https://www.tesla.com',
    'Cisco Systems': 'https://www.cisco.com',
    'Qualcomm': 'https://www.qualcomm.com',
    'Yahoo!': 'https://www.yahoo.com',
    'eBay': 'https://www.ebay.com',
    'RIM (블랙베리)': 'https://www.blackberry.com',
    'Broadcom': 'https://www.broadcom.com',
    'IBM': 'https://www.ibm.com',
    'Xerox': 'https://www.xerox.com',
    'Polaroid': 'https://www.polaroid.com',
    'Eastman Kodak': 'https://www.kodak.com',
    'Sony': 'https://www.sony.com',
    '소니': 'https://www.sony.com',
    'TSMC': 'https://www.tsmc.com',
    'ASML': 'https://www.asml.com',

    // 미국 에너지/금융/산업
    'ExxonMobil': 'https://corporate.exxonmobil.com',
    'Schlumberger': 'https://www.slb.com',
    'Occidental': 'https://www.oxy.com',
    'Chevron': 'https://www.chevron.com',
    'Enphase Energy': 'https://enphase.com',
    'General Electric': 'https://www.geaerospace.com',
    'GE Aerospace': 'https://www.geaerospace.com',
    'Procter & Gamble': 'https://us.pg.com',
    'Pfizer': 'https://www.pfizer.com',
    'Citigroup': 'https://www.citigroup.com',
    'Bank of America': 'https://www.bankofamerica.com',
    'JPMorgan Chase': 'https://www.jpmorganchase.com',
    'Johnson & Johnson': 'https://www.jnj.com',
    'Berkshire Hathaway': 'https://www.berkshirehathaway.com',
    'UnitedHealth': 'https://www.unitedhealthgroup.com',
    'Eli Lilly': 'https://www.lilly.com',
    'Caterpillar': 'https://www.caterpillar.com',

    // 한국 반도체·전자·플랫폼
    '삼성전자': 'https://www.samsung.com/sec/',
    '삼성': 'https://www.samsung.com/sec/',
    'SK하이닉스': 'https://www.skhynix.com',
    'LG전자': 'https://www.lge.co.kr',
    'LG': 'https://www.lge.co.kr',
    'NAVER': 'https://www.navercorp.com',
    '네이버': 'https://www.navercorp.com',
    '카카오': 'https://www.kakaocorp.com',
    '다음(Daum)': 'https://www.daum.net',
    '한글과컴퓨터': 'https://www.hancom.com',
    'SK텔레콤': 'https://www.sktelecom.com',
    '한국이동통신': 'https://www.sktelecom.com',
    'KT': 'https://www.kt.com',

    // 한국 중공업·자동차·소재·배터리
    '현대차': 'https://www.hyundai.com',
    '현대': 'https://www.hyundai.com',
    '기아': 'https://www.kia.com',
    '현대건설': 'https://www.hdec.kr',
    '현대중공업': 'https://hd-hhi.com',
    '현대미포조선': 'https://www.hmd.co.kr',
    'POSCO': 'https://www.posco.com',
    '포항제철': 'https://www.posco.com',
    '대림산업': 'https://www.dlenc.co.kr',
    '삼환기업': 'http://www.samwhan.co.kr',
    '두산중공업': 'https://www.doosanenerbility.com',
    '두산에너빌리티': 'https://www.doosanenerbility.com',
    '한화에어로스페이스': 'https://www.hanwhaaerospace.co.kr',
    '한화솔루션': 'https://www.hanwhasolutions.com',
    '한미반도체': 'https://www.hanmisemi.com',
    'LG화학': 'https://www.lgchem.com',
    'LG에너지솔루션': 'https://www.lgensol.com',
    '삼성SDI': 'https://www.samsungsdi.co.kr',
    'SK이노베이션': 'https://www.skinnovation.com',
    'S-Oil': 'https://www.s-oil.com',
    '에코프로': 'https://www.ecopro.co.kr',
    '에코프로비엠': 'https://www.ecopro.co.kr',
    '엘앤에프': 'http://www.landf.co.kr',
    '포스코DX': 'https://www.poscodx.com',
    '레인보우로보틱스': 'https://www.rainbow-robotics.com',

    // 한국 바이오·소비재·금융
    '셀트리온': 'https://www.celltrion.com',
    '셀트리온제약': 'http://www.celltrionpharm.com',
    '삼성바이오로직스': 'https://samsungbiologics.com',
    '유한양행': 'https://www.yuhan.co.kr',
    '씨젠': 'https://www.seegene.co.kr',
    '신풍제약': 'https://www.shinpoong.co.kr',
    '메디톡스': 'https://www.medytox.com',
    '휴젤': 'https://www.hugel-inc.com',
    '클래시스': 'https://www.classys.com',
    '삼양식품': 'https://www.samyangfoods.com',
    '삼립식품': 'https://spcsamlip.co.kr',
    '태평양화학(아모레)': 'https://www.apgroup.com',
    '아모레퍼시픽': 'https://www.apgroup.com',
    'JYP Ent.': 'https://www.jype.com',
    '기업은행': 'https://www.ibk.co.kr',
    '삼성물산': 'https://www.samsungcnt.com',
    '새롬기술': 'http://www.solborn.co.kr',
    '골드뱅크': 'https://namu.wiki/w/%EA%B3%A8%EB%93%9C%EB%B1%85%ED%81%AC',
    '메가스터디': 'http://www.megastudyholdings.com',
    '수젠텍': 'http://www.sugentech.com',
    '서울반도체': 'http://www.seoulsemicon.com',
    '바이로메드(헬릭스미스)': 'https://www.helixmith.com',
    '바이로메드': 'https://www.helixmith.com',
    '헬릭스미스': 'https://www.helixmith.com',
    '한미약품': 'https://www.hanmi.co.kr',
    'KT&G': 'https://www.ktng.com',
    'NHN (네이버)': 'https://www.navercorp.com',
    '카카오게임즈': 'https://www.kakaogamescorp.com',
    '펄어비스': 'https://www.pearlabyss.com',
    'EDGC': 'https://www.edgc.com',
    '미래에셋증권(구 대우증권)': 'https://securities.miraeasset.com',
    '현대코퍼레이션(구 현대상사)': 'https://www.hyundaicorp.com',
    'Mobil': 'https://corporate.exxonmobil.com',

    // 복합 주도주 묶음
    'Exxon & Mobil': [
      { name: 'ExxonMobil', url: 'https://corporate.exxonmobil.com' },
      { name: 'Mobil', url: 'https://corporate.exxonmobil.com' }
    ],
    'Occidental & Chevron': [
      { name: 'Occidental', url: 'https://www.oxy.com' },
      { name: 'Chevron', url: 'https://www.chevron.com' }
    ],
    'Citigroup & Bank of America': [
      { name: 'Citigroup', url: 'https://www.citigroup.com' },
      { name: 'Bank of America', url: 'https://www.bankofamerica.com' }
    ],
    '금융·무역·건설 트로이카': [
      { name: '현대건설', url: 'https://www.hdec.kr' },
      { name: '미래에셋증권(구 대우증권)', url: 'https://securities.miraeasset.com' },
      { name: '현대코퍼레이션(구 현대상사)', url: 'https://www.hyundaicorp.com' }
    ],
    '현대차 & 기아': [
      { name: '현대차', url: 'https://www.hyundai.com' },
      { name: '기아', url: 'https://www.kia.com' }
    ],
    'SK이노베이션 & S-Oil': [
      { name: 'SK이노베이션', url: 'https://www.skinnovation.com' },
      { name: 'S-Oil', url: 'https://www.s-oil.com' }
    ],
    '카카오 & NAVER': [
      { name: '카카오', url: 'https://www.kakaocorp.com' },
      { name: 'NAVER', url: 'https://www.navercorp.com' }
    ],
    'LG에너지솔루션·삼성SDI': [
      { name: 'LG에너지솔루션', url: 'https://www.lgensol.com' },
      { name: '삼성SDI', url: 'https://www.samsungsdi.co.kr' }
    ],
    '삼성바이오로직스·셀트리온': [
      { name: '삼성바이오로직스', url: 'https://samsungbiologics.com' },
      { name: '셀트리온', url: 'https://www.celltrion.com' }
    ],
    '수젠텍 & EDGC': [
      { name: '수젠텍', url: 'http://www.sugentech.com' },
      { name: 'EDGC', url: 'https://www.edgc.com' }
    ],
    '셀트리온헬스케어 & 제약': [
      { name: '셀트리온', url: 'https://www.celltrion.com' },
      { name: '셀트리온제약', url: 'http://www.celltrionpharm.com' }
    ],
    '에코프로비엠 & 엘앤에프': [
      { name: '에코프로비엠', url: 'https://www.ecopro.co.kr' },
      { name: '엘앤에프', url: 'http://www.landf.co.kr' }
    ],
    '카카오게임즈 & 펄어비스': [
      { name: '카카오게임즈', url: 'https://www.kakaogamescorp.com' },
      { name: '펄어비스', url: 'https://www.pearlabyss.com' }
    ],
    '클래시스 & 휴젤': [
      { name: '클래시스', url: 'https://www.classys.com' },
      { name: '휴젤', url: 'https://www.hugel-inc.com' }
    ]
  };
  App.COMPANY_URLS = COMPANY_URLS;

  function getCompanyUrlByName(name) {
    if (!name) return null;
    var clean = String(name).trim();
    if (COMPANY_URLS[clean]) {
      var val = COMPANY_URLS[clean];
      return Array.isArray(val) ? val[0].url : val;
    }
    for (var k in COMPANY_URLS) {
      if (k.length >= 2 && (clean.indexOf(k) !== -1 || k.indexOf(clean) !== -1)) {
        var v = COMPANY_URLS[k];
        return Array.isArray(v) ? v[0].url : v;
      }
    }
    return null;
  }

  function getLeaderLinks(ld) {
    if (Array.isArray(ld.links) && ld.links.length > 0) return ld.links;
    if (ld.url) return [{ name: ld.name, url: ld.url }];

    var name = ld.name;
    if (COMPANY_URLS[name]) {
      var val = COMPANY_URLS[name];
      if (Array.isArray(val)) return val;
      return [{ name: name, url: val }];
    }

    var parts = name.split(/[&·,/]/).map(function (s) { return s.trim(); }).filter(Boolean);
    var res = [];
    parts.forEach(function (part) {
      var u = getCompanyUrlByName(part);
      if (u) res.push({ name: part, url: u });
    });
    return res;
  }

  function sideHTML(kind, d, delay) {
    if (!d) return '';
    var tag = kind === 'world' ? 'WORLD · 세계' : 'KOREA · 한국';
    var figs = (d.figures || []).map(function (f) {
      var cUrl = getCompanyUrlByName(f);
      if (cUrl) {
        return '<a href="' + esc(cUrl) + '" target="_blank" rel="noopener noreferrer" class="fig fig-link" title="' + esc(f) + ' 공식 홈페이지 열기 (새 창)">' +
          esc(f) + ' ↗' +
        '</a>';
      }
      return '<span class="fig">' + esc(f) + '</span>';
    }).join('');
    return '' +
      '<section class="side ' + kind + ' stagger" style="animation-delay:' + delay + 'ms">' +
        '<div class="side-top">' +
          '<span class="side-tag">' + tag + '</span>' +
          '<span class="side-head">' + esc(d.headline) + '</span>' +
        '</div>' +
        '<p class="side-body">' + esc(d.body) + '</p>' +
        (figs ? '<div class="figs">' + figs + '</div>' : '') +
      '</section>';
  }

  /* ── 사건 당시 시장 반응 (Market Impact) HTML 렌더러 ── */
  function marketImpactHTML(ev, delay) {
    var impact = ev.marketImpact;
    var yr = ev.year;
    var stats = [];
    var econNotes = [];
    var tps = [];

    (App.data.markets || []).forEach(function (mk) {
      var pt = (mk.series || []).find(function (p) { return p[0] === yr; });
      if (pt) {
        var idx = mk.series.findIndex(function (p) { return p[0] === yr; });
        var prev = idx > 0 ? mk.series[idx - 1][1] : null;
        var chg = prev != null ? ((pt[1] - prev) / prev * 100) : null;
        stats.push({ mk: mk, val: pt[1], chg: chg, pt: pt });
      }
      (mk.notes || []).forEach(function (n) {
        if (n.year === yr && !econNotes.some(function (en) { return en.note.headline === n.headline; })) {
          econNotes.push({ mk: mk, note: n });
        }
      });
      (mk.turningPoints || []).forEach(function (tp) {
        if (tp.year === yr) {
          tps.push({ mk: mk, tp: tp });
        }
      });
    });

    if (!impact && stats.length === 0 && econNotes.length === 0) return '';

    var statsHTML = stats.map(function (s) {
      return '' +
        '<div class="ev-mkt-stat-chip" style="--mc:' + s.mk.color + '" data-mkt-id="' + s.mk.id + '" data-year="' + yr + '">' +
          '<span class="ev-stat-name">' + s.mk.label + '</span>' +
          '<span class="ev-stat-val">' + s.val.toLocaleString() + '</span>' +
          (s.chg != null
            ? '<span class="ev-stat-chg ' + (s.chg >= 0 ? 'up' : 'dn') + '">' + (s.chg >= 0 ? '▲' : '▼') + Math.abs(s.chg).toFixed(1) + '%</span>'
            : '') +
        '</div>';
    }).join('');

    var primaryMk = (ev.anchor === 'korea'
      ? stats.find(function (s) { return s.mk.id === 'kospi'; })
      : (stats.find(function (s) { return s.mk.id === 'nasdaq'; }) || stats.find(function (s) { return s.mk.id === 'nyse'; })))
      || stats[0];

    var jumpBtnHTML = primaryMk ? (
      '<button type="button" class="ev-jump-mkt-btn" data-mkt-id="' + primaryMk.mk.id + '" data-year="' + yr + '" style="--mc:' + primaryMk.mk.color + '">' +
        '<span>📈 ' + yr + '년 ' + primaryMk.mk.label + ' 곡선 보기</span> →' +
      '</button>'
    ) : '';

    var tpBtnHTML = tps.length > 0 ? (
      '<button type="button" class="ev-jump-tp-btn" data-mkt-id="' + tps[0].mk.id + '" data-year="' + yr + '" style="--mc:' + tps[0].mk.color + '">' +
        '<span>' + (tps[0].tp.type === 'peak' ? '▲ 역사적 고점' : '▼ 역사적 저점') + ' & 주도주 보기</span> →' +
      '</button>'
    ) : '';

    var econNoteHTML = econNotes.length > 0 ? (
      '<div class="ev-mkt-econ-note">' +
        '<span class="ev-mkt-econ-tag" style="color:' + econNotes[0].mk.color + '">경제사 실록</span> ' +
        esc(econNotes[0].note.headline) + ' — ' + esc(econNotes[0].note.body) +
      '</div>'
    ) : '';

    var summaryText = impact ? impact.summary : (econNotes.length > 0 ? econNotes[0].note.body : '');
    var detailText = impact && impact.detail ? impact.detail : '';

    // 이벤트 스터디 3단계 충격 분석 층위 (P1 과제: 연간 등락률과 사건 직접 반응 분리)
    var tiersHTML = '' +
      '<div class="ev-impact-tiers">' +
        '<div class="ev-tier-head">📊 이벤트 스터디 3단계 파급 경로</div>' +
        '<div class="ev-tier-row">' +
          '<span class="ev-tier-badge l1">즉시 충격 (D-Day)</span>' +
          '<span class="ev-tier-desc">' + (ev.marketImpact ? esc(ev.marketImpact.tag) : '뉴스 발표 직후 단기 변동성 및 시장 심리 급변') + '</span>' +
        '</div>' +
        '<div class="ev-tier-row">' +
          '<span class="ev-tier-badge l2">단기 전개 (1~3M)</span>' +
          '<span class="ev-tier-desc">' + (ev.macro ? esc(ev.macro) + ' 환경 속 자금 이동 및 신용 스프레드 변동' : '유동성 수급 및 정책 당국의 1차 대응') + '</span>' +
        '</div>' +
        '<div class="ev-tier-row">' +
          '<span class="ev-tier-badge l3">구조 변화 (1Y+)</span>' +
          '<span class="ev-tier-desc">' + (ev.category ? esc(ev.category) + ' 국면 통과 후 산업 구조조정 및 벤치마크 재평가' : '거시경제 체질 변화 및 주도 섹터 재편') + '</span>' +
        '</div>' +
      '</div>';

    return '' +
      '<section class="side ev-mkt-impact stagger" style="animation-delay:' + delay + 'ms">' +
        '<div class="side-top">' +
          '<span class="side-tag" style="color:#4DA3FF">시장 반응 및 이벤트 분석</span>' +
          (impact ? '<span class="ev-impact-badge ' + (impact.type || '') + '">' + esc(impact.tag) + '</span>' : '') +
        '</div>' +
        (summaryText ? '<p class="ev-impact-summary">' + esc(summaryText) + '</p>' : '') +
        (detailText ? '<p class="ev-impact-detail">' + esc(detailText) + '</p>' : '') +
        (ev.marketFlow ? '<p class="ev-market-flow-text"><strong>당시 시장 흐름:</strong> ' + esc(ev.marketFlow) + '</p>' : '') +
        tiersHTML +
        (econNoteHTML || '') +
        (statsHTML ? '<div class="ev-mkt-stats-wrap"><div class="ev-mkt-stats-grid">' + statsHTML + '</div><div class="ev-stat-note">※ 상기 수치는 당해 연말 종가(Year-end Close) 기준 연간 등락률입니다.</div></div>' : '') +
        '<div class="ev-mkt-actions">' + jumpBtnHTML + tpBtnHTML + '</div>' +
      '</section>';
  }

  /* 노드/사건 카드와 주가 상세 팝업이 공유하는 저수준 전개 로직.
     opts: { id, x, y, track, color, ariaLabel, html, originR, afterRender(card), activate(), deactivate() } */
  App._openUnfold = function (opts, instant) {
    App.closeCard(true);
    /* 안전망 — 직전 카드가 닫히는 중(지연된 drop() 대기)이었다면 state 에는
       이미 없지만 DOM에는 남아 있다. 새로 열기 전에 잔여물을 강제로 치운다. */
    Array.prototype.forEach.call(document.querySelectorAll('#cards .card'), function (el) { el.remove(); });
    Array.prototype.forEach.call(document.querySelectorAll('#edgeLayer .edge, #edgeLayer .edge-cap'), function (el) { el.remove(); });

    var scroller = document.getElementById('scroller');
    var cardsEl  = document.getElementById('cards');
    var edgeLayer = document.getElementById('edgeLayer');
    var stage = App.stage;
    var originR = opts.originR != null ? opts.originR : NODE_R;

    var vw = (scroller && scroller.clientWidth) || window.innerWidth || 800;
    var sc = (scroller && scroller.scrollLeft) || 0;

    /* 1. 반응형 카드 너비 */
    var CARD_W = Math.min(380, Math.max(260, vw - 36));
    var PAD = 16;

    /* ── 카드 DOM (먼저 만들어 높이를 잰다) ── */
    var card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', opts.ariaLabel);
    card.style.setProperty('--c', opts.color);
    card.style.setProperty('--cw', CARD_W + 'px');
    card.style.setProperty('--cx', '0px');
    card.style.setProperty('--cy', '0px');
    card.style.clipPath = 'inset(0 100% 100% 0' + R;
    card.innerHTML = opts.html;

    /* 닫기 (✕) 버튼 자동 주입 */
    var headEl = card.querySelector('.card-head');
    if (headEl) {
      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'card-close';
      closeBtn.setAttribute('aria-label', '카드 닫기');
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        App.closeCard();
      });
      headEl.appendChild(closeBtn);
    }

    card.addEventListener('click', function (e) { e.stopPropagation(); });
    // 카드 위에서의 휠은 카드의 기본 스크롤 동작이 일어나도록 이벤트 전파 중지
    card.addEventListener('wheel', function (e) { e.stopPropagation(); }, { passive: true });

    // 카드 내부의 모든 외부 링크 클릭 시 상위(카드/무대)로의 이벤트 전파를 차단하고,
    // 브라우저 네이티브 기본 동작으로 새 탭(새 창)이 100% 안전하게 열리도록 보장 (팝업 차단 완전 방지)
    Array.prototype.forEach.call(card.querySelectorAll('a[target="_blank"]'), function (a) {
      a.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    });
    cardsEl.appendChild(card);
    if (opts.afterRender) opts.afterRender(card);

    var H = card.offsetHeight;

    /* ── 2. 가로 배치 & 화면 잘림/가려짐 방지 ── */
    var narrow = CARD_W + GAP + 40 > vw;
    var target, cx;

    if (narrow) {
      target = Math.max(0, Math.min(opts.x - vw / 2, stage.w - vw));
      cx = Math.max(target + PAD, Math.min(opts.x - 30, target + vw - CARD_W - PAD));
    } else {
      var placeRight = true;
      if (opts.x - sc > vw - (CARD_W + GAP + 40)) {
        placeRight = false;
      } else if (opts.x - sc < (CARD_W + GAP + 40)) {
        placeRight = true;
      } else {
        placeRight = (opts.x - sc <= vw * 0.5);
      }

      cx = placeRight ? (opts.x + GAP) : (opts.x - GAP - CARD_W);

      // 노드와 카드가 둘 다 화면에 여유롭게 들어오도록 scroll target 계산
      var minX = Math.min(opts.x - 30, cx);
      var maxX = Math.max(opts.x + 30, cx + CARD_W);

      if (maxX - minX <= vw - PAD * 2) {
        if (minX < sc + PAD) {
          target = minX - PAD;
        } else if (maxX > sc + vw - PAD) {
          target = maxX - vw + PAD;
        } else {
          target = sc;
        }
      } else {
        target = placeRight ? (opts.x - PAD - 40) : (cx - PAD);
      }
      target = Math.max(0, Math.min(target, stage.w - vw));

      // 가로 뷰포트 내 완벽 수용 보정 (화면 밖 1px도 잘리지 않음)
      cx = Math.max(target + PAD, Math.min(cx, target + vw - CARD_W - PAD));
    }

    cx = Math.max(PAD, Math.min(cx, stage.w - CARD_W - PAD));
    if (target !== sc) scroller.scrollTo({ left: target, behavior: App.reduced ? 'auto' : 'smooth' });

    /* ── 3. 세로 배치 & 화면(뷰포트) 잘림/가려짐 방지 ── */
    var viewH = (scroller && scroller.clientHeight) || window.innerHeight || 600;
    var cyTop = opts.track === 'world' ? opts.y + VOFF : opts.y - VOFF - H;
    var minTop = 14;
    var maxBottom = Math.min(stage.h, viewH) - 18; // 뷰포트 하단 바깥으로 넘어가지 않음
    var maxAvailH = Math.max(180, maxBottom - minTop);

    if (H > maxAvailH) H = maxAvailH;

    if (cyTop + H > maxBottom) {
      cyTop = Math.max(minTop, maxBottom - H);
    }
    if (cyTop < minTop) {
      cyTop = minTop;
    }

    // 뷰포트 바닥을 넘지 않도록 안전한 동적 max-height 설정
    var dynCmh = Math.min(maxAvailH, Math.max(180, maxBottom - cyTop));
    card.style.setProperty('--cmh', dynCmh + 'px');
    card.style.setProperty('--cx', cx.toFixed(1) + 'px');
    card.style.setProperty('--cy', cyTop.toFixed(1) + 'px');

    /* ── 앵커 = 노드에서 가장 가까운 모서리 = 사각형의 시작점 ── */
    var cornerX = (opts.x <= cx + CARD_W / 2) ? 'left' : 'right';
    var cornerY = (opts.y <= cyTop + H / 2) ? 'top' : 'bottom';
    var key = cornerY + '-' + cornerX;

    var ax = cornerX === 'left' ? cx + INSET : cx + CARD_W - INSET;
    var ay = cornerY === 'top' ? cyTop + INSET : cyTop + H - INSET;

    /* ── 엣지: 노드에서 앵커까지 ── */
    var dx = ax - opts.x, dy = ay - opts.y;
    var L = Math.hypot(dx, dy) || 1;
    var sx = opts.x + dx / L * originR;
    var sy = opts.y + dy / L * originR;
    var d = 'M' + sx + ' ' + sy +
            ' C' + (sx + dx * 0.5) + ' ' + sy +
            ' ' + (ax - dx * 0.25) + ' ' + ay +
            ' ' + ax + ' ' + ay;

    var path = document.createElementNS(NS, 'path');
    path.setAttribute('class', 'edge');
    path.setAttribute('d', d);
    path.setAttribute('stroke', opts.color);
    path.style.color = opts.color;   // drop-shadow 의 currentColor 용
    edgeLayer.appendChild(path);

    var cap = document.createElementNS(NS, 'circle');
    cap.setAttribute('class', 'edge-cap');
    cap.setAttribute('cx', ax); cap.setAttribute('cy', ay); cap.setAttribute('r', 4);
    cap.setAttribute('fill', opts.color);
    cap.style.opacity = '0';
    edgeLayer.appendChild(cap);

    if (opts.activate) opts.activate();
    document.getElementById('app').classList.add('has-open');

    state = { id: opts.id, card: card, path: path, cap: cap, key: key, anims: [], deactivate: opts.deactivate };

    /* ── 애니메이션 ── */
    if (App.reduced || instant) {
      card.style.clipPath = DONE;
      card.classList.add('revealing');
      cap.style.opacity = '1';
      return;
    }

    try {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      state.anims.push(path.animate(
        [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: EDGE_MS, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }
      ));
    } catch (e) {}

    state.anims.push(cap.animate(
      [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)' }],
      { duration: 160, delay: EDGE_MS - 30, easing: 'ease-out', fill: 'forwards' }
    ));

    var seq = CLIP[key] || CLIP['top-left'];
    state.anims.push(card.animate([
      { clipPath: seq[0] + R, offset: 0 },
      { clipPath: seq[1] + R, offset: 0.45 },
      { clipPath: DONE,       offset: 1 }
    ], {
      duration: UNFOLD_MS, delay: EDGE_MS - 10,
      easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'both'
    }));

    setTimeout(function () {
      if (state && state.card === card) {
        card.style.clipPath = DONE;
        card.classList.add('revealing');
      }
    }, EDGE_MS + UNFOLD_MS + 20);
  };

  /* ══════════ 사건 카드 ══════════ */
  App.openCard = function (ev, nodeEl, pos, instant) {
    var era = pos.era;
    var impactBadge = ev.marketImpact ? (
      '<span class="ev-impact-badge ' + (ev.marketImpact.type || '') + '">' +
        esc(ev.marketImpact.tag) +
      '</span>'
    ) : '';

    var tagsHTML = '';
    if (ev.category || ev.macro) {
      tagsHTML = '<div class="ev-tags-wrap stagger" style="animation-delay:85ms">' +
        (ev.category ? '<span class="ev-tag cat" title="사건 유형 (클릭 시 AI 가이드 비교 질문)">🏷️ ' + esc(ev.category) + '</span>' : '') +
        (ev.macro ? '<span class="ev-tag macro" title="당시 거시경제 환경">🌐 ' + esc(ev.macro) + '</span>' : '') +
      '</div>';
    }

    App._openUnfold({
      id: ev.id, x: pos.x, y: pos.y, track: pos.track, color: era.color,
      ariaLabel: ev.title,
      html:
        '<header class="card-head">' +
          '<div class="card-when stagger" style="animation-delay:0ms">' +
            '<span class="ym">' + ev.year + '.' + String(ev.month).padStart(2, '0') + '</span>' +
            '<span class="era">' + esc(era.label || '') + '</span>' +
            impactBadge +
          '</div>' +
          '<h2 class="card-title stagger" style="animation-delay:60ms">' + esc(ev.title) + '</h2>' +
          tagsHTML +
          (ev.note ? '<p class="card-note stagger" style="animation-delay:110ms">' + esc(ev.note) + '</p>' : '') +
        '</header>' +
        '<div class="card-body">' +
          sideHTML('world', ev.world, 150) +
          sideHTML('korea', ev.korea, 210) +
          marketImpactHTML(ev, 260) +
        '</div>',
      afterRender: function (card) {
        // 사건 유형 태그 클릭 시 관련 유사 사건 비교 질문을 챗봇으로 전송
        var catTag = card.querySelector('.ev-tag.cat');
        if (catTag && ev.category) {
          catTag.addEventListener('click', function (e) {
            e.stopPropagation();
            if (window.App && typeof App.askChat === 'function') {
              App.askChat(ev.category + ' 유형의 다른 역사적 사건들과 당시 시장 반응은 어땠나요?');
            }
          });
        }

        // 당시 주가 곡선 바로가기 버튼
        var jumpMktBtn = card.querySelector('.ev-jump-mkt-btn');
        if (jumpMktBtn) {
          jumpMktBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            var mktId = jumpMktBtn.dataset.mktId;
            var yr = Number(jumpMktBtn.dataset.year);
            var mp = (App.marketPoints || []).find(function (p) { return p.mkId === mktId && p.year === yr; })
                     || (App.marketPoints || []).find(function (p) { return p.year === yr; });
            if (mp) {
              var mk = (App.data.markets || []).find(function (m) { return m.id === mp.mkId; });
              var pt = mk && (mk.series || []).find(function (p) { return p[0] === yr; });
              if (mk && pt) {
                App.openMarketCard(mk, pt, mp.x, mp.y, mp.dot);
              }
            }
          });
        }

        // 당시 고점/저점 주도주 바로가기 버튼
        var jumpTpBtn = card.querySelector('.ev-jump-tp-btn');
        if (jumpTpBtn) {
          jumpTpBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            var mktId = jumpTpBtn.dataset.mktId;
            var yr = Number(jumpTpBtn.dataset.year);
            var mk = (App.data.markets || []).find(function (m) { return m.id === mktId; });
            var tp = mk && (mk.turningPoints || []).find(function (t) { return t.year === yr; });
            if (tp) {
              var pin = document.querySelector('.tp-pin[data-mkt="' + mktId + '"][data-year="' + yr + '"]');
              var pinX = pin ? parseFloat(pin.style.left) : pos.x;
              var pinY = pin ? parseFloat(pin.style.top) : pos.y;
              App.openTurningPointCard(tp, mk, pinX, pinY, pin);
            }
          });
        }

        // 지수 미니 칩 클릭 시 해당 지수 카드로 이동
        Array.prototype.forEach.call(card.querySelectorAll('.ev-mkt-stat-chip'), function (chip) {
          chip.addEventListener('click', function (e) {
            e.stopPropagation();
            var mktId = chip.dataset.mktId;
            var yr = Number(chip.dataset.year);
            var mp = (App.marketPoints || []).find(function (p) { return p.mkId === mktId && p.year === yr; });
            if (mp) {
              var mk = (App.data.markets || []).find(function (m) { return m.id === mktId; });
              var pt = mk && (mk.series || []).find(function (p) { return p[0] === yr; });
              if (mk && pt) {
                App.openMarketCard(mk, pt, mp.x, mp.y, mp.dot);
              }
            }
          });
        });
      },
      activate: function () {
        nodeEl.classList.add('is-open');
        nodeEl.setAttribute('aria-expanded', 'true');
        if (App.highlightMarketYear) App.highlightMarketYear(ev.year, true);
      },
      deactivate: function () {
        nodeEl.classList.remove('is-open');
        nodeEl.setAttribute('aria-expanded', 'false');
        if (App.highlightMarketYear) App.highlightMarketYear(null, false);
      }
    }, instant);
  };

  /* ══════════ 주가 상세 팝업 — 같은 해에 등록된 사건으로 바로 이어준다 ══════════ */
  App.openMarketCard = function (mk, point, x, y, dotEl) {
    var series = mk.series;
    var i = series.findIndex(function (p) { return p[0] === point[0]; });
    var prev = i > 0 ? series[i - 1][1] : null;
    var chg = prev != null ? (point[1] - prev) / prev * 100 : null;
    var track = mk.track;

    var econNote = (mk.notes || []).find(function (n) { return n.year === point[0]; });
    var related = App.data.events.filter(function (e) { return e.year === point[0]; });
    var delay = 170;

    var econHTML = '';
    if (econNote) {
      econHTML =
        '<section class="side mkt-econ stagger" style="animation-delay:' + delay + 'ms">' +
          '<div class="side-top">' +
            '<span class="side-tag" style="color:' + mk.color + '">ECONOMY · 경제사</span>' +
            '<span class="side-head">' + esc(econNote.headline) + '</span>' +
          '</div>' +
          '<p class="side-body">' + esc(econNote.body) + '</p>' +
        '</section>';
      delay += 45;
    }

    var relHTML = related.length
      ? related.map(function (e, idx) {
          var side = e.anchor === 'korea' ? e.korea : e.world;
          var era = App.eraMap[e.era] || {};
          var d = delay + idx * 45;
          return (
            '<section class="side mkt-rel stagger" data-event-id="' + e.id + '" style="animation-delay:' + d + 'ms">' +
              '<div class="side-top">' +
                '<span class="side-tag" style="color:' + (era.color || '#8899BB') + '">' + e.year + '.' + String(e.month).padStart(2, '0') + '</span>' +
                '<span class="side-head">' + esc(e.title) + '</span>' +
              '</div>' +
              '<p class="side-body">' + esc(side.headline) + '</p>' +
              '<div class="figs"><span class="fig mkt-jump">이 사건 열기 →</span></div>' +
            '</section>'
          );
        }).join('')
      : (econNote ? '' : '<p class="mkt-empty stagger" style="animation-delay:' + delay + 'ms">등록된 사건이 없는 해입니다.</p>');

    App._openUnfold({
      id: 'mkt:' + mk.id + ':' + point[0], x: x, y: y, track: track, color: mk.color,
      ariaLabel: mk.label + ' ' + point[0] + '년',
      originR: 7,
      html:
        '<header class="card-head">' +
          '<div class="card-when stagger" style="animation-delay:0ms">' +
            '<span class="ym">' + point[0] + '</span>' +
            '<span class="era" style="color:' + mk.color + '; border-color:' + mk.color + '55">' + mk.label + '</span>' +
          '</div>' +
          '<h2 class="card-title stagger" style="animation-delay:60ms">' + point[1].toLocaleString() + '</h2>' +
          (chg != null
            ? '<p class="card-note mkt-chg-note ' + (chg >= 0 ? 'up' : 'dn') + ' stagger" style="animation-delay:110ms">' +
                (chg >= 0 ? '▲' : '▼') + Math.abs(chg).toFixed(1) + '% 전년 대비' +
              '</p>'
            : '') +
        '</header>' +
        '<div class="card-body">' + econHTML + relHTML + '</div>',
      afterRender: function (card) {
        Array.prototype.forEach.call(card.querySelectorAll('.mkt-rel'), function (sec) {
          sec.addEventListener('click', function () {
            var target = App.nodes.find(function (n) { return n.ev.id === sec.dataset.eventId; });
            if (target) App.openCard(target.ev, target.el, { x: target.x, y: target.y, track: target.track, era: target.era });
          });
        });
      },
      activate: function () {
        if (!dotEl) return;
        dotEl.classList.add('is-active');
        if (dotEl.previousElementSibling) dotEl.previousElementSibling.classList.add('is-active');
      },
      deactivate: function () {
        if (!dotEl) return;
        dotEl.classList.remove('is-active');
        if (dotEl.previousElementSibling) dotEl.previousElementSibling.classList.remove('is-active');
      }
    });
  };

  /* ── 역사적 고점·저점 및 당시 주도주 상세 카드 ── */
  App.openTurningPointCard = function (tp, mk, x, y, pinEl) {
    App.closeCard(true);

    var isPeak = tp.type === 'peak';
    var track = mk.track;
    var leadersHTML = '';
    if (Array.isArray(tp.leaders) && tp.leaders.length > 0) {
      leadersHTML =
        '<section class="side tp-leaders-sec stagger" style="animation-delay:180ms">' +
          '<div class="side-top">' +
            '<span class="side-head">당시 핵심 주도주</span>' +
          '</div>' +
          '<div class="tp-leaders-list">' +
            tp.leaders.map(function (ld) {
              var links = getLeaderLinks(ld);
              var namesHTML = '';

              if (links && links.length === 1) {
                var lk = links[0];
                var companyTitle = esc(lk.name) + ' 홈페이지로 가기';
                namesHTML = (
                  '<a href="' + esc(lk.url) + '" target="_blank" rel="noopener noreferrer" ' +
                     'class="tp-leader-name-link" ' +
                     'title="' + companyTitle + '" ' +
                     'aria-label="' + companyTitle + '">' +
                    '<strong class="tp-leader-name">' + esc(ld.name) + '</strong>' +
                    '<span class="tp-link-icon" aria-hidden="true">↗</span>' +
                  '</a>'
                );
              } else if (links && links.length > 1) {
                namesHTML = '<span class="tp-leader-names-group">' +
                  links.map(function (lk, idx) {
                    var companyTitle = esc(lk.name) + ' 홈페이지로 가기';
                    var linkHtml = (
                      '<a href="' + esc(lk.url) + '" target="_blank" rel="noopener noreferrer" ' +
                         'class="tp-leader-name-link" ' +
                         'title="' + companyTitle + '" ' +
                         'aria-label="' + companyTitle + '">' +
                        '<strong class="tp-leader-name">' + esc(lk.name) + '</strong>' +
                        '<span class="tp-link-icon" aria-hidden="true">↗</span>' +
                      '</a>'
                    );
                    return idx === 0 ? linkHtml : ('<span class="tp-leader-sep">&</span>' + linkHtml);
                  }).join('') +
                '</span>';
              } else {
                namesHTML = '<strong class="tp-leader-name">' + esc(ld.name) + '</strong>';
              }

              return (
                '<div class="tp-leader-item">' +
                  '<div class="tp-leader-name-wrap">' +
                    '<div class="tp-leader-title-group">' +
                      '<span class="tp-leader-badge" style="color:' + mk.color + '; border-color:' + mk.color + '55">주도주</span>' +
                      namesHTML +
                    '</div>' +
                  '</div>' +
                  (ld.desc ? '<p class="tp-leader-desc">' + esc(ld.desc) + '</p>' : '') +
                '</div>'
              );
            }).join('') +
          '</div>' +
        '</section>';
    }

    var descHTML = tp.desc ? (
      '<section class="side stagger" style="animation-delay:120ms">' +
        '<div class="side-top">' +
          '<span class="side-head">역사적 배경 및 시장 흐름</span>' +
        '</div>' +
        '<p class="side-body">' + esc(tp.desc) + '</p>' +
      '</section>'
    ) : '';

    var whenText = tp.year + '년' + (tp.month ? ' ' + tp.month + '월' : '');

    App._openUnfold({
      id: 'tp:' + mk.id + ':' + tp.year + ':' + (tp.month || 0),
      x: x, y: y, track: track, color: mk.color,
      ariaLabel: mk.label + ' ' + whenText + ' ' + (isPeak ? '고점' : '저점'),
      originR: 8,
      html:
        '<header class="card-head">' +
          '<div class="card-when stagger" style="animation-delay:0ms">' +
            '<span class="ym">' + whenText + '</span>' +
            '<span class="era" style="color:' + mk.color + '; border-color:' + mk.color + '55">' + mk.label + '</span>' +
            '<span class="tp-type-tag ' + tp.type + '">' + (isPeak ? '▲ 역사적 고점' : '▼ 역사적 저점') + '</span>' +
          '</div>' +
          '<h2 class="card-title stagger" style="animation-delay:60ms">' + esc(tp.title) + '</h2>' +
          '<p class="card-note mkt-chg-note ' + (isPeak ? 'up' : 'dn') + ' stagger" style="animation-delay:100ms">' +
            esc(tp.value) + (tp.change ? ' <span class="tp-chg-sub">(' + esc(tp.change) + ')</span>' : '') +
          '</p>' +
        '</header>' +
        '<div class="card-body">' + descHTML + leadersHTML + '</div>',
      activate: function () {
        if (pinEl) pinEl.classList.add('is-active');
      },
      deactivate: function () {
        if (pinEl) pinEl.classList.remove('is-active');
      }
    });
  };

  App.closeCard = function (instant) {
    if (!state) return;
    var s = state;
    state = null;

    if (s.deactivate) s.deactivate();
    document.getElementById('app').classList.remove('has-open');

    s.anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });

    function drop() {
      if (s.card.parentNode) s.card.parentNode.removeChild(s.card);
      if (s.path.parentNode) s.path.parentNode.removeChild(s.path);
      if (s.cap.parentNode) s.cap.parentNode.removeChild(s.cap);
    }
    if (instant || App.reduced) { drop(); return; }

    var seq = CLIP[s.key];
    s.card.classList.remove('revealing');
    s.card.animate([
      { clipPath: DONE,       offset: 0 },
      { clipPath: seq[1] + R, offset: 0.55 },
      { clipPath: seq[0] + R, offset: 1 }
    ], { duration: CLOSE_MS, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });

    s.cap.animate([{ opacity: 1 }, { opacity: 0 }],
      { duration: 110, delay: CLOSE_MS - 60, fill: 'forwards' });

    var len = s.path.getTotalLength();
    s.path.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: len }],
      { duration: 160, delay: CLOSE_MS - 40, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });

    setTimeout(drop, CLOSE_MS + 140);
  };

  /* 사건 ID로 스크롤 이동 및 카드 자동 오픈 */
  App.openCardById = function (evId) {
    var n = (App.nodes || []).find(function (item) { return item.ev.id === evId; });
    if (!n) return;
    var scroller = document.getElementById('scroller');
    if (scroller) {
      scroller.scrollTo({
        left: Math.max(0, n.x - scroller.clientWidth / 2),
        behavior: App.reduced ? 'auto' : 'smooth'
      });
    }
    setTimeout(function () {
      App.openCard(n.ev, n.el, { x: n.x, y: n.y, track: n.ev.anchor || 'world', era: App.eraMap[n.ev.era] || {} });
    }, 180);
  };

  Object.defineProperty(App, 'open', {
    get: function () { return state ? { id: state.id } : null; }
  });
})();
