/* Oyun kabuğu: ekranlar, HUD, bölüm yükleme, başarı/hata akışı */
(function () {
  var WC = (window.WC = window.WC || { levels: {} });
  var U = WC.util, h = U.h, S = WC.state;

  var els = {};
  var current = null;
  var attempt = 0;
  var timerId = null;
  var lastTick = 0;
  var toastTimer = null;

  function $(id) { return document.getElementById(id); }

  function show(which) {
    ['screen-title', 'screen-game', 'screen-final'].forEach(function (id) {
      var e = $(id);
      if (e) e.hidden = (id !== which);
    });
    document.body.setAttribute('data-screen', which);
  }

  function hud() {
    if (!els.lvl) return;
    els.lvl.textContent = 'Bölüm ' + S.level + ' / ' + WC.TOTAL;
    els.bar.style.width = (Math.max(0, S.level - 1) / WC.TOTAL * 100) + '%';
    els.miss.textContent = S.mistakes;
    els.time.textContent = U.formatTime(S.ms);
    els.mute.textContent = WC.sound.isMuted() ? '🔇' : '🔊';
    var meta = WC.meta[S.level - 1];
    if (meta) els.name.textContent = meta.title;
  }

  function tick() {
    var now = Date.now();
    if (S.running) {
      S.ms += now - lastTick;
      if (els.time) els.time.textContent = U.formatTime(S.ms);
    }
    lastTick = now;
  }

  function toast(msg, kind) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.className = 'toast show ' + (kind || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.className = 'toast'; }, 1800);
  }

  function overlay(kind, text) {
    els.overlay.className = 'overlay show ' + kind;
    els.overlayIcon.textContent = kind === 'good' ? '✓' : '✗';
    els.overlayText.textContent = text;
    els.root.classList.add('locked');
  }
  function hideOverlay() {
    els.overlay.className = 'overlay';
    els.root.classList.remove('locked');
  }

  function cleanup() {
    if (current) {
      try { if (typeof current.cleanup === 'function') current.cleanup(); } catch (e) { /* yoksay */ }
      current.scope.dispose();
      current = null;
    }
    hideOverlay();
    els.root.innerHTML = '';
  }

  function startLevel(n) {
    n = Math.max(1, Math.min(WC.TOTAL, n | 0));
    cleanup();
    S.level = n;
    S.save();
    var L = WC.levels[n];
    show('screen-game');
    S.running = true;
    lastTick = Date.now();
    hud();

    els.card.className = 'captcha-card' + (L && L.wide ? ' wide' : '');
    els.card.setAttribute('data-level', n);

    attempt++;
    var sc = U.scope();
    var locked = false;
    var api = {
      n: n,
      scope: sc,
      rand: U.makeRand((Date.now() % 1000000007) + n * 7919 + attempt * 104729),
      setPrompt: function (main, sub) {
        els.promptMain.innerHTML = main;
        els.promptSub.innerHTML = sub || '';
      },
      toast: toast,
      mistake: function (msg) {
        if (locked) return;
        S.mistakes++;
        hud();
        S.save();
        WC.sound.fail();
        toast(msg || 'Yanlış!', 'bad');
      },
      fail: function (msg) {
        if (locked) return;
        locked = true;
        S.mistakes++;
        hud();
        S.save();
        WC.sound.fail();
        overlay('bad', msg || 'Tekrar dene');
        setTimeout(function () { if (current && current.n === n) startLevel(n); }, 1200);
      },
      success: function (msg) {
        if (locked) return;
        locked = true;
        WC.sound.ok();
        S.unlock(n + 1);
        overlay('good', msg || 'Doğrulandı!');
        setTimeout(function () {
          if (!current || current.n !== n) return;
          if (n >= WC.TOTAL) showFinal(); else startLevel(n + 1);
        }, 1050);
      }
    };

    current = { n: n, scope: sc, cleanup: null };
    if (!L) {
      els.root.appendChild(h('p', { class: 'err', text: 'Bu bölüm bulunamadı: ' + n }));
      return;
    }
    try {
      current.cleanup = L.mount(els.root, api);
    } catch (e) {
      if (window.console) console.error(e);
      els.root.appendChild(h('p', { class: 'err', text: 'Bölüm yüklenirken hata oluştu: ' + e.message }));
    }
  }

  function showTitle() {
    cleanup();
    S.running = false;
    show('screen-title');
    var cont = $('btn-continue');
    if (cont) {
      cont.hidden = S.unlocked <= 1 && S.level <= 1;
      cont.textContent = 'Devam et (Bölüm ' + Math.max(S.level, 1) + ')';
    }
    var best = $('best-line');
    if (best) {
      best.textContent = S.best
        ? 'En iyi sonuç: ' + S.best.mistakes + ' hata · ' + U.formatTime(S.best.ms)
        : '';
    }
  }

  function showFinal() {
    cleanup();
    S.running = false;
    var isBest = S.finish();
    show('screen-final');
    var r = S.rank();
    $('final-rank').textContent = r.emoji + ' ' + r.name;
    $('final-time').textContent = U.formatTime(S.ms);
    $('final-mistakes').textContent = S.mistakes;
    $('final-best').textContent = isBest ? 'Yeni rekor!' : (S.best ? 'Rekor: ' + S.best.mistakes + ' hata · ' + U.formatTime(S.best.ms) : '');
    var pic = $('final-pic');
    pic.innerHTML = '';
    if (S.drawing) {
      pic.appendChild(h('img', { src: S.drawing, alt: 'Senin çizdiğin kedi', class: 'final-drawing' }));
      pic.appendChild(h('div', { class: 'cap', text: 'Doğrulanmış kedi: sen' }));
    } else {
      pic.appendChild(h('img', { src: WC.art.toURL(WC.art.catFull(7)), alt: '', class: 'final-cat' }));
    }
    WC.sound.meow();
  }

  function newGame() {
    S.newRun();
    startLevel(1);
  }

  function init() {
    S.load();
    els.card = $('card');
    els.root = $('level-root');
    els.promptMain = $('prompt-main');
    els.promptSub = $('prompt-sub');
    els.lvl = $('hud-level');
    els.name = $('hud-name');
    els.bar = $('hud-bar');
    els.miss = $('hud-miss');
    els.time = $('hud-time');
    els.mute = $('btn-mute');
    els.toast = $('toast');
    els.overlay = $('overlay');
    els.overlayIcon = $('overlay-icon');
    els.overlayText = $('overlay-text');

    $('btn-start').addEventListener('click', function () { WC.sound.click(); newGame(); });
    $('btn-continue').addEventListener('click', function () { WC.sound.click(); startLevel(S.level); });
    $('btn-again').addEventListener('click', function () { WC.sound.click(); newGame(); });
    $('btn-menu').addEventListener('click', function () { showTitle(); });
    $('btn-final-menu').addEventListener('click', function () { showTitle(); });
    $('btn-restart-level').addEventListener('click', function () { WC.sound.click(); if (current) startLevel(current.n); });
    els.mute.addEventListener('click', function () { WC.sound.toggle(); hud(); });

    timerId = setInterval(tick, 250);
    document.addEventListener('visibilitychange', function () { lastTick = Date.now(); });

    var q = null;
    try { q = new URLSearchParams(location.search).get('level'); } catch (e) { /* yoksay */ }
    if (q && /^\d+$/.test(q)) {
      var lv = parseInt(q, 10);
      if (lv >= 1 && lv <= WC.TOTAL) {
        if (lv === 1) { S.mistakes = 0; S.ms = 0; }
        startLevel(lv);
        return;
      }
    }
    showTitle();
  }

  WC.engine = { init: init, startLevel: startLevel, showTitle: showTitle, showFinal: showFinal };
})();
