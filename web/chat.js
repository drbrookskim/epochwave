/* ══════════ AI 가이드 챗봇 — Workers AI(Gemma-4), 대화는 KV에 저장 ══════════ */
(function () {
  var sending = false;
  var lastQuery = '';

  /* 세션 ID — localStorage 에 두고 재방문·새로고침에도 KV의 같은 대화로 이어간다 */
  function getSessionId() {
    var KEY = 'btf_chat_session';
    try {
      var id = localStorage.getItem(KEY);
      if (!id) {
        id = (crypto.randomUUID ? crypto.randomUUID() : 'sid-' + Date.now() + '-' + Math.random().toString(36).slice(2));
        localStorage.setItem(KEY, id);
      }
      return id;
    } catch (e) {
      return null;
    }
  }
  var sessionId = getSessionId();

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* 텍스트 내 사건·지수 키워드를 인터랙티브 클릭 태그로 파싱 */
  function formatReply(text, refs) {
    var safe = esc(String(text || '').trim());
    safe = safe.replace(/\n/g, '<br>');

    // 참조 태그 영역 생성
    if (Array.isArray(refs) && refs.length > 0 && App.data && App.data.events) {
      var chips = [];
      refs.forEach(function (r) {
        var ev = App.data.events.find(function (e) { return e.id === r; });
        if (ev) {
          chips.push('<button type="button" class="chat-ref-chip" data-ev-id="' + ev.id + '">📍 ' + esc(ev.year + '.' + ev.month + ' ' + ev.title) + '</button>');
        }
      });
      if (chips.length) {
        safe += '<div class="chat-ref-chips-wrap"><span class="chat-ref-title">관련 사건 바로가기:</span> ' + chips.join(' ') + '</div>';
      }
    }
    return safe;
  }

  function bubble(role, text, opts) {
    opts = opts || {};
    var list = document.getElementById('chatList');
    var b = document.createElement('div');
    b.className = 'chat-msg ' + role + (opts.isError ? ' is-chat-error' : '');

    var contentHTML = role === 'assistant'
      ? formatReply(text, opts.refs)
      : esc(String(text || '').trim());

    if (opts.retryFn) {
      contentHTML += '<div class="chat-retry-wrap"><button type="button" class="chat-retry-btn">↻ 다시 시도</button></div>';
    }

    b.innerHTML = '<div class="chat-bubble">' + contentHTML + '</div>';
    list.appendChild(b);

    // 이벤트 리스너 연결: 참조 사건 클릭 시 타임라인 스크롤 & 카드 오픈
    b.querySelectorAll('.chat-ref-chip').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var evId = btn.dataset.evId;
        if (App.openCardById) {
          App.openCardById(evId);
        } else {
          App.highlightRefs([evId]);
        }
      });
    });

    if (opts.retryFn) {
      var rBtn = b.querySelector('.chat-retry-btn');
      if (rBtn) {
        rBtn.addEventListener('click', function () {
          b.remove();
          opts.retryFn();
        });
      }
    }

    list.scrollTop = list.scrollHeight;
    return b;
  }

  function typingBubble() {
    var list = document.getElementById('chatList');
    var b = document.createElement('div');
    b.className = 'chat-msg assistant is-typing';
    b.innerHTML = '<div class="chat-bubble"><div class="chat-typing-dots"><i></i><i></i><i></i></div><span class="chat-typing-hint">역사적 사건과 시장 지표를 분석하고 있습니다…</span></div>';
    list.appendChild(b);
    list.scrollTop = list.scrollHeight;
    return b;
  }

  /* ── 로컬 지식 엔진 (백엔드 통신 장애 시 안정적 즉시 답변 생성) ── */
  function generateLocalFallback(query) {
    if (!App.data || !App.data.events) {
      return {
        reply: '현재 네트워크 상태가 원활하지 않습니다. 잠시 후 다시 시도해 주세요. (출처: EpochWave 로컬 데이터)',
        refs: []
      };
    }

    var q = query.toLowerCase();
    var events = App.data.events;
    var matched = [];

    // 키워드 기반 관련 사건 검색
    events.forEach(function (ev) {
      var score = 0;
      var str = (ev.title + ' ' + (ev.category || '') + ' ' + (ev.macro || '') + ' ' + (ev.description || '') + ' ' + (ev.marketFlow || '')).toLowerCase();
      
      var words = q.split(/\s+/).filter(function (w) { return w.length >= 2; });
      words.forEach(function (w) {
        if (str.indexOf(w) !== -1) score += 2;
        if (ev.title.toLowerCase().indexOf(w) !== -1) score += 5;
      });

      if (q.indexOf(String(ev.year)) !== -1) score += 6;
      if (score > 0) matched.push({ ev: ev, score: score });
    });

    matched.sort(function (a, b) { return b.score - a.score; });

    if (!matched.length) {
      return {
        reply: '질문하신 내용과 직접 일치하는 역사적 사건을 찾지 못했습니다. 1955년부터 2026년까지의 주요 경제 위기(IMF 외환위기, 닷컴버블, 글로벌 금융위기 등)나 주도주, 특정 연도에 대해 질문해 보세요!\n\n※ 본 서비스는 교육·학술 목적의 역사적 시각화 도구이며 미래 투자 수익을 보장하지 않습니다.',
        refs: []
      };
    }

    var top = matched.slice(0, 2);
    var refs = top.map(function (m) { return m.ev.id; });
    var parts = [];

    parts.push('⚡ [로컬 아카이브 데이터 분석 결과]');
    top.forEach(function (item) {
      var ev = item.ev;
      parts.push('■ [' + ev.year + '년 ' + ev.month + '월] ' + ev.title);
      if (ev.category || ev.macro) {
        parts.push('• 유형/환경: ' + (ev.category || '-') + ' / ' + (ev.macro || '-'));
      }
      if (ev.description) {
        parts.push('• 역사적 맥락: ' + ev.description);
      }
      if (ev.marketFlow) {
        parts.push('• 당시 시장 흐름: ' + ev.marketFlow);
      }
    });

    parts.push('\n※ 데이터 출처: KRX 한국거래소, FRED 세인트루이스 연은, 국가기록원\n※ 본 분석은 역사적 맥락 이해를 위한 자료이며 투자 권유가 아닙니다.');

    return {
      reply: parts.join('\n'),
      refs: refs
    };
  }

  async function send(text) {
    if (sending || !text.trim()) return;
    sending = true;
    lastQuery = text.trim();

    var input = document.getElementById('chatInput');
    var sendBtn = document.getElementById('chatSend');
    input.value = '';
    input.disabled = true; sendBtn.disabled = true;

    bubble('user', lastQuery);
    var typing = typingBubble();

    // 12초 타임아웃 컨트롤러
    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, 12000);

    try {
      var res = await fetch(App.API_BASE + 'api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: lastQuery, sessionId: sessionId }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      var data = await res.json();
      typing.remove();

      if (!res.ok || data.error) {
        // 백엔드 에러 시 로컬 지능 엔진으로 Fallback
        var fb = generateLocalFallback(lastQuery);
        bubble('assistant', fb.reply, { refs: fb.refs });
        App.highlightRefs(fb.refs);
      } else {
        bubble('assistant', data.reply, { refs: data.refs || [] });
        App.highlightRefs(data.refs || []);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      typing.remove();

      // 타임아웃 또는 네트워크 단절 시에도 멈추지 않고 로컬 데이터 엔진으로 완벽 응답
      var fb = generateLocalFallback(lastQuery);
      bubble('assistant', fb.reply, {
        refs: fb.refs,
        retryFn: function () { send(lastQuery); }
      });
      App.highlightRefs(fb.refs);
    } finally {
      sending = false;
      input.disabled = false; sendBtn.disabled = false;
      input.focus();
    }
  }

  /* 외부(사건 카드 태그 등)에서 챗봇에 질문을 보내며 열기 위한 API */
  App.askChat = function (text) {
    var panel = document.getElementById('chatPanel');
    var toggle = document.getElementById('chatToggle');
    if (panel) {
      panel.hidden = false;
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }
    send(text);
  };

  function init() {
    var toggle = document.getElementById('chatToggle');
    var panel  = document.getElementById('chatPanel');
    var closeBtn = document.getElementById('chatClose');
    var form = document.getElementById('chatForm');
    var input = document.getElementById('chatInput');

    toggle.addEventListener('click', function () {
      var opening = panel.hidden;
      panel.hidden = !opening;
      toggle.setAttribute('aria-expanded', String(opening));
      if (opening) input.focus();
    });
    closeBtn.addEventListener('click', function () {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      send(input.value);
    });
    /* 일부 브라우저/IME 조합에서 암묵적 폼 제출이 안 먹는 경우를 대비해 직접 처리 */
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.isComposing && !e.shiftKey) {
        e.preventDefault();
        send(input.value);
      }
    });

    document.querySelectorAll('.chat-suggest').forEach(function (b) {
      b.addEventListener('click', function () { send(b.textContent); });
    });

    restoreHistory();
  }

  /* 페이지를 새로 열어도 KV에 저장된 이전 대화를 이어서 보여준다 */
  async function restoreHistory() {
    if (!sessionId) return;
    try {
      var res = await fetch(App.API_BASE + 'api/chat?sessionId=' + encodeURIComponent(sessionId));
      var data = await res.json();
      var messages = Array.isArray(data.messages) ? data.messages : [];
      if (!messages.length) return;

      var suggests = document.querySelector('.chat-suggests');
      messages.forEach(function (m) {
        if (m.role === 'user' || m.role === 'assistant') bubble(m.role, m.content);
      });
      if (suggests) suggests.hidden = true;   // 이미 대화가 있으면 처음 안내 문구는 굳이 필요 없다
    } catch (e) { /* 복원 실패해도 새 대화로 계속 쓸 수 있으니 조용히 넘어간다 */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* ── 답변에 언급된 사건·주가 지점을 타임라인에서 하이라이트 ── */
  App.highlightRefs = function (refs) {
    Array.prototype.forEach.call(document.querySelectorAll('.is-chat-highlight'), function (el) {
      el.classList.remove('is-chat-highlight');
    });
    if (!refs || !refs.length) return;

    var scroller = document.getElementById('scroller');
    var found = [];

    refs.forEach(function (ref) {
      if (ref.indexOf('tp:') === 0) {
        var tpPin = document.querySelector('.tp-pin[data-tp-id="' + ref + '"]');
        if (tpPin) {
          tpPin.classList.add('is-chat-highlight');
          var pinX = parseFloat(tpPin.style.left) || 0;
          var pinY = parseFloat(tpPin.style.top) || 0;
          found.push({ kind: 'tp', x: pinX, y: pinY, ref: tpPin });
        }
      } else if (ref.indexOf('mkt:') === 0) {
        var parts = ref.split(':');
        var mp = App.marketPoints.find(function (p) { return p.mkId === parts[1] && String(p.year) === parts[2]; });
        if (mp) {
          mp.dot.classList.add('is-chat-highlight');
          mp.halo.classList.add('is-chat-highlight');
          found.push({ kind: 'market', x: mp.x, y: mp.y, ref: mp });
        }
      } else {
        var n = App.nodes.find(function (n) { return n.ev.id === ref; });
        if (n) {
          n.el.classList.add('is-chat-highlight');
          found.push({ kind: 'event', x: n.x, y: n.y, ref: n });
        }
      }
    });
    if (!found.length) return;

    /* 카드를 자동으로 펼치지는 않는다 — 챗 패널에 가려 안 보일 수 있고,
       텍스트 답변으로 이미 설명했으니 펄스 하이라이트 + 스크롤만으로 위치를 짚어준다. */
    var first = found[0];
    var panel = document.getElementById('chatPanel');
    var usable = scroller.clientWidth;
    if (panel && !panel.hidden) usable -= panel.getBoundingClientRect().width + 12;
    scroller.scrollTo({
      left: Math.max(0, first.x - Math.max(usable, 160) / 2),
      behavior: App.reduced ? 'auto' : 'smooth'
    });
  };
})();
