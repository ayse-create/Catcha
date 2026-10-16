/* Bölüm 1–4: klasik CAPTCHA */
(function () {
  var WC = window.WC, U = WC.util, h = U.h, A = WC.art;

  /* ---------- Ortak: hareketli metin CAPTCHA'sı (Bölüm 3 ve 16) ---------- */
  var CHARSET = 'ACDEFGHJKLMNPRTUVWXY34679';

  function randomText(R, n) {
    var s = '';
    for (var i = 0; i < n; i++) s += CHARSET.charAt(Math.floor(R.next() * CHARSET.length));
    return s;
  }

  /* mode: 'moving' (Bölüm 3) veya 'chaotic' (Bölüm 16) */
  function textCaptcha(canvas, text, mode, scope, R) {
    var W = 420, H = 150;
    var ctx = U.setupCanvas(canvas, W, H);
    var n = text.length;
    var colors = [], phases = [], i;
    for (i = 0; i < n; i++) {
      colors.push('hsl(' + Math.floor(R.range(0, 360)) + ',55%,32%)');
      phases.push({ a: R.range(0, 6.28), b: R.range(0, 6.28), c: R.range(0, 6.28), d: R.range(0, 6.28) });
    }
    var noise = [];
    for (i = 0; i < (mode === 'chaotic' ? 14 : 6); i++) {
      noise.push({ x1: R.range(0, W), y1: R.range(0, H), x2: R.range(0, W), y2: R.range(0, H), c: 'hsla(' + Math.floor(R.range(0, 360)) + ',50%,45%,.45)', p: R.range(0, 6.28) });
    }
    var dots = [];
    for (i = 0; i < 60; i++) dots.push({ x: R.range(0, W), y: R.range(0, H), r: R.range(0.6, 1.8) });

    var t0 = performance.now();
    scope.raf(function (now) {
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f4efe6';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      dots.forEach(function (d) { ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill(); });

      var chaotic = mode === 'chaotic';
      noise.forEach(function (l) {
        ctx.strokeStyle = l.c;
        ctx.lineWidth = chaotic ? 2.2 : 1.6;
        ctx.beginPath();
        var sh = chaotic ? Math.sin(t * 2 + l.p) * 30 : 0;
        ctx.moveTo(l.x1 + sh, l.y1);
        ctx.quadraticCurveTo((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2 + sh, l.x2 - sh, l.y2);
        ctx.stroke();
      });

      var step = (W - 60) / n;
      for (var k = 0; k < n; k++) {
        var p = phases[k];
        var x = 40 + step * k + step / 2;
        var y = H / 2 + 14;
        var rot, sx = 1, sy = 1, skew = 0, size = 58, alpha = 1;
        if (!chaotic) {
          y += Math.sin(t * 1.9 + p.a) * 9;
          x += Math.sin(t * 1.1 + p.b) * 5;
          rot = Math.sin(t * 1.4 + p.c) * 0.4;
          // kısa süreliğine ters çevrilme
          if (Math.sin(t * 0.8 + p.d) > 0.94) sx = -1;
          if (Math.sin(t * 0.7 + p.b * 1.3) > 0.97) sy = -1;
        } else {
          y += Math.sin(t * 3.1 + p.a) * 14 + (Math.random() - 0.5) * 5;
          x += Math.sin(t * 1.7 + p.b) * 9 + (Math.random() - 0.5) * 3;
          rot = Math.sin(t * 2.3 + p.c) * 0.75;
          skew = Math.sin(t * 2.7 + p.d) * 0.5;
          size = 50 + Math.sin(t * 2.1 + p.b) * 10;
          alpha = 0.7 + Math.sin(t * 4 + p.a) * 0.3;
          if (Math.sin(t * 1.1 + p.d) > 0.86) sx = -1;
          if (Math.sin(t * 0.9 + p.a * 1.7) > 0.93) sy = -1;
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.transform(1, 0, skew, 1, 0, 0);
        ctx.scale(sx, sy);
        ctx.globalAlpha = alpha;
        ctx.font = '900 ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,.9)';
        ctx.strokeText(text.charAt(k), 0, 0);
        ctx.fillStyle = chaotic ? 'hsl(' + Math.floor((t * 90 + k * 55) % 360) + ',60%,32%)' : colors[k];
        ctx.fillText(text.charAt(k), 0, 0);
        ctx.restore();
      }
      // üstten geçen çizgiler
      ctx.strokeStyle = 'rgba(40,30,20,.35)';
      ctx.lineWidth = 1.5;
      for (i = 0; i < (chaotic ? 4 : 2); i++) {
        ctx.beginPath();
        var yy = 30 + i * 35 + Math.sin(t * 1.5 + i) * 8;
        ctx.moveTo(0, yy);
        ctx.bezierCurveTo(W * 0.3, yy - 24, W * 0.6, yy + 24, W, yy + Math.sin(t + i) * 14);
        ctx.stroke();
      }
    });
  }
  WC.textCaptcha = textCaptcha;
  WC.randomText = randomText;

  /* ---------- Bölüm 1 ---------- */
  WC.levels[1] = {
    title: "I'm not a cat",
    mount: function (root, api) {
      api.setPrompt("Prove you're <span class=\"hl\">not a cat</span>", 'Tek bir kontrol ve içeridesin.');
      var state = 'idle'; // idle | loading | checked
      var spin = h('span', { class: 'cb-spin' });
      var mark = h('span', { class: 'cb-mark', text: '✓' });
      var box = h('button', { class: 'cb-box', role: 'checkbox', 'aria-checked': 'false', 'aria-label': "I'm not a cat" }, spin, mark);
      var verify = h('button', { class: 'btn primary', text: 'Verify' });

      var widget = h('div', { class: 'cb-widget' },
        box,
        h('span', { class: 'cb-label', text: "I'm not a cat" }),
        h('span', { class: 'cb-logo' }, h('img', { src: A.toURL(A.catHead(3)), alt: '' }), h('small', { text: 'WhiskerCatcha' })));

      box.addEventListener('click', function () {
        if (state !== 'idle') return;
        state = 'loading';
        WC.sound.click();
        box.classList.add('loading');
        api.scope.timeout(function () {
          state = 'checked';
          box.classList.remove('loading');
          box.classList.add('checked');
          box.setAttribute('aria-checked', 'true');
          WC.sound.pop();
        }, 800);
      });
      verify.addEventListener('click', function () {
        if (state !== 'checked') {
          api.toast(state === 'loading' ? 'Bir saniye, kontrol ediliyor…' : 'Önce kutuyu işaretle, insan.', 'bad');
          return;
        }
        api.success();
      });

      root.appendChild(h('div', { class: 'lvl1' }, widget,
        h('div', { class: 'actions' }, h('span', { class: 'note', text: 'Gerçek zorluk henüz başlamadı.' }), verify)));
    }
  };

  /* ---------- Bölüm 2 ---------- */
  WC.levels[2] = {
    title: 'Find the cat',
    mount: function (root, api) {
      api.setPrompt('Click on the <span class="hl">cat</span>', 'Tek bir görsel. Kedi bir yerlerde saklanıyor.');
      var scene = A.hiddenCatScene(Math.floor(api.rand.next() * 1e9));
      var img = h('img', { class: 'scene-img', src: A.toURL(scene.svg), alt: 'Kalabalık bir oda', draggable: 'false' });
      var wrap = h('div', { class: 'scene-wrap' }, img);
      var misses = 0, done = false;
      var counter = h('span', { class: 'note', text: 'Yanlış tıklama: 0' });

      function ring(px, py, cls) {
        var r = img.getBoundingClientRect();
        var d = h('div', { class: 'ring ' + cls, style: { left: (px / scene.w * r.width) + 'px', top: (py / scene.h * r.height) + 'px' } });
        wrap.appendChild(d);
        return d;
      }

      img.addEventListener('pointerdown', function (e) {
        if (done) return;
        var r = img.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width * scene.w;
        var py = (e.clientY - r.top) / r.height * scene.h;
        if (U.dist(px, py, scene.cat.x, scene.cat.y) <= scene.cat.r) {
          done = true;
          var d = ring(scene.cat.x, scene.cat.y, 'good');
          d.style.width = d.style.height = (scene.cat.r * 2 / scene.w * r.width) + 'px';
          WC.sound.meow();
          api.scope.timeout(function () { api.success('Kediyi buldun!'); }, 650);
        } else {
          misses++;
          counter.textContent = 'Yanlış tıklama: ' + misses;
          var w = ring(px, py, 'bad');
          api.scope.timeout(function () { w.remove(); }, 600);
          api.mistake('Orada kedi yok');
          if (misses === 5) {
            api.toast('İpucu: parlayan bölgeye bak', 'good');
            var hint = ring(scene.cat.x, scene.cat.y, 'hint');
            hint.style.width = hint.style.height = (scene.cat.r * 3.4 / scene.w * r.width) + 'px';
          }
        }
      });
      root.appendChild(wrap);
      root.appendChild(h('div', { class: 'actions' }, counter));
    }
  };

  /* ---------- Bölüm 3 ---------- */
  WC.levels[3] = {
    title: 'Moving Letters',
    mount: function (root, api) {
      api.setPrompt('Type the <span class="hl">moving letters</span>', 'Harfler oynuyor, dönüyor, bazen ters dönüyor.');
      var text = randomText(api.rand, 5);
      var canvas = h('canvas', { class: 'cap-canvas', 'aria-label': 'Hareketli harfler' });
      var input = h('input', { class: 'text-input', type: 'text', maxlength: '5', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: '· · · · ·' });
      var verify = h('button', { class: 'btn primary', text: 'Verify' });
      textCaptcha(canvas, text, 'moving', api.scope, api.rand);

      function check() {
        var v = input.value.trim().toUpperCase();
        if (v === text) api.success();
        else api.fail('Yanlış harfler. Yeni bir tane geliyor.');
      }
      verify.addEventListener('click', check);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
      root.appendChild(canvas);
      root.appendChild(h('div', { class: 'stack' }, input));
      root.appendChild(h('div', { class: 'actions' }, h('span', { class: 'note', text: 'Büyük/küçük harf fark etmez.' }), verify));
      api.scope.timeout(function () { try { input.focus(); } catch (e) { /* yoksay */ } }, 100);
    }
  };

  /* ---------- Bölüm 4 ---------- */
  function buildTileGrid(root, api, opts) {
    // opts: { target: 'cat'|'nocat', cols, count, tileKinds }
    var R = api.rand;
    var count = opts.cols * opts.rows;
    var kinds = [];
    var cats = R.int(Math.floor(count * 0.35), Math.ceil(count * 0.5));
    var i;
    var catKinds = ['cat', 'cat', 'edge', 'small', 'edge'];
    for (i = 0; i < cats; i++) kinds.push(catKinds[i % catKinds.length]);
    // en az bir zor (kısmi/küçük) kedi olsun
    if (kinds.indexOf('edge') < 0 && kinds.indexOf('small') < 0) kinds[0] = 'edge';
    for (i = cats; i < count; i++) kinds.push('none');
    kinds = R.shuffle(kinds);

    var grid = h('div', { class: 'img-grid g' + opts.cols });
    var tiles = [];
    kinds.forEach(function (k, idx) {
      var seed = Math.floor(R.next() * 1e9);
      var img = h('img', { src: A.toURL(A.tile(seed, k)), alt: '', draggable: 'false' });
      var t = h('button', { class: 'tile', type: 'button', 'aria-pressed': 'false' }, img, h('span', { class: 'check', text: '✓' }));
      t.addEventListener('click', function () {
        t.classList.toggle('sel');
        t.setAttribute('aria-pressed', t.classList.contains('sel') ? 'true' : 'false');
        WC.sound.click();
      });
      tiles.push({ el: t, kind: k, idx: idx });
      grid.appendChild(t);
    });
    return { grid: grid, tiles: tiles };
  }

  WC.levels[4] = {
    title: 'Select the cat pictures',
    mount: function (root, api) {
      api.setPrompt('Select all squares with <span class="hl">cats</span>', 'Kedinin küçük bir kısmı görünse bile o kare sayılır.');
      var g = buildTileGrid(root, api, { cols: 3, rows: 3 });
      var verify = h('button', { class: 'btn primary', text: 'Verify' });
      verify.addEventListener('click', function () {
        var missed = 0, extra = 0;
        g.tiles.forEach(function (t) {
          var isCat = t.kind !== 'none';
          var sel = t.el.classList.contains('sel');
          if (isCat && !sel) { missed++; t.el.classList.add('wrong'); }
          if (!isCat && sel) { extra++; t.el.classList.add('wrong'); }
        });
        if (!missed && !extra) api.success();
        else api.fail(missed ? 'Bir kediyi kaçırdın' : 'Kedi olmayan kare seçtin');
      });
      root.appendChild(g.grid);
      root.appendChild(h('div', { class: 'actions' }, h('span', { class: 'note', text: 'Bittiğinde Verify’a bas.' }), verify));
    }
  };

  WC.buildTileGrid = buildTileGrid;
})();
