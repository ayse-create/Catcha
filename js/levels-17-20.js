/* Bölüm 17–20: algı sınavı */
(function () {
  var WC = window.WC, U = WC.util, h = U.h, A = WC.art;

  /* ---------- Bölüm 17: Find the 93% Circle ---------- */
  function pieSVG(p, rot) {
    var cx = 50, cy = 50, r = 42, body;
    if (p >= 0.999) {
      body = '<circle cx="50" cy="50" r="42" fill="#ff8a4c"/>';
    } else {
      var a0 = rot, a1 = rot + p * Math.PI * 2;
      var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      var large = (a1 - a0) > Math.PI ? 1 : 0;
      body = '<path d="M ' + cx + ' ' + cy + ' L ' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' Z" fill="#ff8a4c"/>';
    }
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="50" cy="50" r="42" fill="#efe6d8"/>' + body +
      '<circle cx="50" cy="50" r="42" fill="none" stroke="#2b2d42" stroke-width="2.5"/></svg>';
  }
  WC.pieSVG = pieSVG;

  WC.levels[17] = {
    title: 'Find the 93% Circle',
    mount: function (root, api) {
      api.setPrompt('Select the circle that is exactly <span class="hl">93% full</span>', 'Eksik dilimin büyüklüğüne bak. Daireler rastgele döndürülmüş.');
      var R = api.rand;
      var decoys = R.shuffle([64, 72, 80, 86, 89, 96, 98, 100]).slice(0, 8);
      var vals = R.shuffle(decoys.concat([93]));
      var selected = -1;
      var grid = h('div', { class: 'pie-grid' });
      var btns = [];
      vals.forEach(function (v, i) {
        var rot = R.range(0, Math.PI * 2);
        var b = h('button', { class: 'pie', type: 'button', 'aria-label': 'Daire ' + (i + 1), html: pieSVG(v / 100, rot) });
        b.addEventListener('click', function () {
          selected = i;
          btns.forEach(function (x) { x.classList.remove('sel'); });
          b.classList.add('sel');
          WC.sound.click();
        });
        btns.push(b);
        grid.appendChild(b);
      });
      var verify = h('button', { class: 'btn primary', text: 'Verify' });
      verify.addEventListener('click', function () {
        if (selected < 0) { api.toast('Bir daire seç', 'bad'); return; }
        if (vals[selected] === 93) api.success();
        else api.fail('O daire %' + vals[selected] + ' doluydu');
      });
      root.appendChild(grid);
      root.appendChild(h('div', { class: 'actions' }, h('span', { class: 'note', text: 'Aralarında %64–%100 arası daireler var.' }), verify));
    }
  };

  /* ---------- Bölüm 18: Endless Cat Squares ---------- */
  WC.levels[18] = {
    title: 'Endless Cat Squares',
    mount: function (root, api) {
      api.setPrompt('Select all squares with <span class="hl">cats</span>', 'Seçtiğin kare yerine yenisi gelir. Bu iş bitecek mi?');
      var R = api.rand;
      var TARGET = 12, count = 0, over = false;
      var tiles = [];
      var grid = h('div', { class: 'img-grid g4' });
      var status = h('div', { class: 'endless-status' });
      var verify = h('button', { class: 'btn primary', text: 'Verify' });

      function kindRand(forceCat) {
        if (forceCat || R.chance(0.42)) return R.pick(['cat', 'cat', 'edge', 'small']);
        return 'none';
      }
      function setTile(t, kind) {
        t.kind = kind;
        var seed = Math.floor(R.next() * 1e9);
        t.img.src = A.toURL(A.tile(seed, kind));
      }
      function catsOnBoard() { return tiles.filter(function (t) { return t.kind !== 'none'; }).length; }
      function renderStatus() {
        status.innerHTML = '🐾 Doğrulanan kediler: <b>' + count + '</b> / <b>∞</b>';
      }

      var i;
      for (i = 0; i < 16; i++) {
        (function (i) {
          var img = h('img', { alt: '', draggable: 'false' });
          var b = h('button', { class: 'tile', type: 'button' }, img);
          var t = { el: b, img: img, kind: 'none', busy: false };
          b.addEventListener('click', function () {
            if (over || t.busy) return;
            if (t.kind === 'none') {
              b.classList.add('wrong');
              api.scope.timeout(function () { b.classList.remove('wrong'); }, 400);
              api.mistake('Bu karede kedi yok');
              return;
            }
            t.busy = true;
            count++;
            renderStatus();
            WC.sound.pop();
            b.classList.add('fading');
            if (count >= TARGET) {
              over = true;
              status.innerHTML = '✅ Tamamlandı. Aslında hedef <b>' + TARGET + '</b> kediydi.';
              WC.sound.meow();
              api.scope.timeout(function () { api.success('Sonsuz değilmiş!'); }, 900);
              return;
            }
            api.scope.timeout(function () {
              var needCat = catsOnBoard() - 1 < 3;
              setTile(t, kindRand(needCat));
              b.classList.remove('fading');
              b.classList.add('pop-in');
              api.scope.timeout(function () { b.classList.remove('pop-in'); t.busy = false; }, 400);
            }, 380);
          });
          tiles.push(t);
          grid.appendChild(b);
        })(i);
      }
      // başlangıçta 5-7 kedi
      var catSlots = R.shuffle(tiles.map(function (_, idx) { return idx; })).slice(0, R.int(5, 7));
      tiles.forEach(function (t, idx) { setTile(t, catSlots.indexOf(idx) >= 0 ? R.pick(['cat', 'cat', 'edge', 'small']) : 'none'); });

      verify.addEventListener('click', function () {
        if (over) return;
        var msgs = ['Henüz yeterli kanıt yok. Devam et.', 'Hmm, emin değiliz. Birkaç kedi daha.', 'Doğrulama sürüyor…', 'Neredeyse! (Hayır, değil.)'];
        api.toast(R.pick(msgs), 'bad');
        if (catsOnBoard() < 3) {
          var nonCats = tiles.filter(function (t) { return t.kind === 'none'; });
          if (nonCats.length) setTile(R.pick(nonCats), 'cat');
        }
      });

      renderStatus();
      root.appendChild(grid);
      root.appendChild(status);
      root.appendChild(h('div', { class: 'actions' }, h('span', { class: 'note', text: 'Kedisiz kareye tıklama!' }), verify));
    }
  };

  /* ---------- Bölüm 19: Catch the Escaping Cats ---------- */
  WC.levels[19] = {
    title: 'Catch the Escaping Cats',
    mount: function (root, api) {
      api.setPrompt('Catch <span class="hl">6 escaping cats</span>', '30 saniyen var. Kediler seni görünce kaçar; yakaladıkça diğerleri hızlanır.');
      var R = api.rand;
      var NEED = 6, TOTAL = 8, LIMIT = 30;
      var caught = 0, over = false, timeLeft = LIMIT;
      var area = h('div', { class: 'esc-area' });
      var info = h('div', { class: 'esc-info' });
      var cats = [];
      var mouse = { x: -999, y: -999, in: false };
      var SIZE = 64;

      function updateInfo() {
        info.innerHTML = '🐱 <b>' + caught + '</b> / ' + NEED + ' &nbsp;·&nbsp; ⏱ <b>' + Math.ceil(timeLeft) + '</b> sn';
      }

      for (var i = 0; i < TOTAL; i++) {
        (function (i) {
          var img = h('img', { class: 'esc-cat', src: A.toURL(A.catFull(i + 31)), alt: 'Kaçan kedi', draggable: 'false', style: { width: SIZE + 'px' } });
          var c = {
            el: img, x: R.range(20, 300), y: R.range(20, 200),
            vx: R.range(-1, 1), vy: R.range(-1, 1), caught: false, turn: R.range(0.5, 1.8)
          };
          var m = Math.hypot(c.vx, c.vy) || 1; c.vx /= m; c.vy /= m;
          img.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            if (over || c.caught) return;
            c.caught = true;
            caught++;
            WC.sound.meow();
            img.classList.add('gone');
            updateInfo();
            if (caught >= NEED) {
              over = true;
              api.scope.timeout(function () { api.success('Kediler yakalandı!'); }, 500);
            }
          });
          cats.push(c);
          area.appendChild(img);
        })(i);
      }

      area.addEventListener('pointermove', function (e) {
        var r = area.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.in = true;
      });
      area.addEventListener('pointerleave', function () { mouse.in = false; });

      var last = performance.now();
      api.scope.raf(function (now) {
        var dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (over) return false;
        var W = area.clientWidth, H = area.clientHeight;
        var speed = 95 + caught * 28;
        cats.forEach(function (c) {
          if (c.caught) return;
          c.turn -= dt;
          if (c.turn <= 0) {
            var a = Math.atan2(c.vy, c.vx) + R.range(-1.1, 1.1);
            c.vx = Math.cos(a); c.vy = Math.sin(a);
            c.turn = R.range(0.6, 1.8);
          }
          var boost = 1;
          if (mouse.in) {
            var dx = c.x + SIZE / 2 - mouse.x, dy = c.y + SIZE / 2 - mouse.y;
            var d = Math.hypot(dx, dy);
            if (d < 120) {
              var f = (1 - d / 120);
              c.vx += (dx / (d || 1)) * f * 2.2 * dt * 6;
              c.vy += (dy / (d || 1)) * f * 2.2 * dt * 6;
              boost = 1 + f * 0.9;
            }
          }
          var m = Math.hypot(c.vx, c.vy) || 1;
          c.vx /= m; c.vy /= m;
          c.x += c.vx * speed * boost * dt;
          c.y += c.vy * speed * boost * dt;
          if (c.x < 0) { c.x = 0; c.vx = Math.abs(c.vx); }
          if (c.y < 0) { c.y = 0; c.vy = Math.abs(c.vy); }
          if (c.x > W - SIZE) { c.x = W - SIZE; c.vx = -Math.abs(c.vx); }
          if (c.y > H - SIZE * 1.15) { c.y = H - SIZE * 1.15; c.vy = -Math.abs(c.vy); }
          c.el.style.transform = 'translate(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px) scaleX(' + (c.vx < 0 ? -1 : 1) + ')';
        });
        timeLeft -= dt;
        updateInfo();
        if (timeLeft <= 0) {
          over = true;
          api.fail('Süre doldu!');
          return false;
        }
      });

      updateInfo();
      root.appendChild(info);
      root.appendChild(area);
    }
  };

  /* ---------- Bölüm 20: Eye Test ---------- */
  WC.levels[20] = {
    title: 'Eye Test',
    mount: function (root, api) {
      api.setPrompt('Eye Test', 'Bu bir göz muayenesi değil; sadece dikkat oyunu.');
      var R = api.rand;
      var round = 0, ROUNDS = 3;
      var holder = h('div', { class: 'eye-holder' });
      var head = h('div', { class: 'eye-head' });
      root.appendChild(head);
      root.appendChild(holder);

      function mk(cols, rows, base, odd, opts) {
        holder.innerHTML = '';
        var grid = h('div', { class: 'eye-grid', style: { gridTemplateColumns: 'repeat(' + cols + ', 1fr)' } });
        var oddIdx = R.int(0, cols * rows - 1);
        for (var i = 0; i < cols * rows; i++) {
          (function (i) {
            var isOdd = i === oddIdx;
            var glyph = h('span', { class: 'eye-glyph', text: isOdd ? odd : base });
            if (opts && opts.rot) {
              var deg = isOdd ? opts.rot.odd : opts.rot.base;
              glyph.style.transform = 'rotate(' + deg + 'deg)';
            }
            var b = h('button', { class: 'eye-cell', type: 'button', 'aria-label': 'Karakter' }, glyph);
            b.addEventListener('click', function () {
              if (isOdd) {
                WC.sound.pop();
                next();
              } else {
                b.classList.add('wrong');
                api.scope.timeout(function () { b.classList.remove('wrong'); }, 350);
                api.mistake('Yanlış karakter');
              }
            });
            grid.appendChild(b);
          })(i);
        }
        holder.appendChild(grid);
      }

      var rounds = [
        { text: 'Click the letter <b>O</b> (all others are <b>Q</b>)', build: function () { mk(8, 6, 'Q', 'O'); } },
        { text: 'Click the number <b>5</b> (all others are <b>S</b>)', build: function () { mk(9, 6, 'S', '5'); } },
        { text: 'Click the arrow pointing a <b>different direction</b>', build: function () { mk(8, 6, '➤', '➤', { rot: { base: -90, odd: -90 + R.pick([-22, 22]) } }); } }
      ];

      function next() {
        if (round >= ROUNDS) { api.success('Gözlerin sağlam!'); return; }
        var r = rounds[round];
        head.innerHTML = '<span class="eye-round">Tur ' + (round + 1) + ' / ' + ROUNDS + '</span> ' + r.text;
        round++;
        r.build();
      }
      next();
    }
  };
})();
