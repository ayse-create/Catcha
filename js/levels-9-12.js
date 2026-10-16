/* Bölüm 9–12: görsel algı ve refleks */
(function () {
  var WC = window.WC, U = WC.util, h = U.h, A = WC.art;

  /* ---------- Bölüm 9: Tiny Cat Pieces ---------- */
  var COARSE = 4, FINE = 8;

  /* Canvas okunamazsa kedi elipslerinden tahmini kaplama */
  function approxMask(scene) {
    var c = scene.cat, s = c.s, out = [], r, q;
    var parts = [
      { x: 0, y: -36, rx: 34, ry: 38 },
      { x: 0, y: -84, rx: 29, ry: 25 },
      { x: -15, y: -3, rx: 13, ry: 9 },
      { x: 15, y: -3, rx: 13, ry: 9 },
      { x: -17, y: -113, rx: 10, ry: 14 },
      { x: 17, y: -113, rx: 10, ry: 14 }
    ];
    var cell = scene.w / FINE;
    for (r = 0; r < FINE; r++) {
      out.push([]);
      for (q = 0; q < FINE; q++) {
        var hits = 0, tot = 0;
        for (var sy = 0; sy < 4; sy++) for (var sx = 0; sx < 4; sx++) {
          var px = q * cell + (sx + 0.5) * cell / 4, py = r * cell + (sy + 0.5) * cell / 4;
          var lx = (px - c.x) / s * (c.flip ? -1 : 1), ly = (py - c.y) / s;
          tot++;
          for (var k = 0; k < parts.length; k++) {
            var p = parts[k];
            if (Math.pow((lx - p.x) / p.rx, 2) + Math.pow((ly - p.y) / p.ry, 2) <= 1) { hits++; break; }
          }
        }
        out[r].push(hits / tot);
      }
    }
    return out;
  }

  WC.levels[9] = {
    title: 'Tiny Cat Pieces',
    mount: function (root, api) {
      api.setPrompt('Select every <span class="hl">tiny piece</span> with a cat in it', 'Büyük bir kareye tıkla: küçük parçalara ayrılır. Kedinin bir bıyığı bile görünse o parça sayılır.');
      var scene = A.bigCatScene(Math.floor(api.rand.next() * 1e9));
      var url = A.toURL(scene.svg);
      var split = [], sel = {}, mask = null, i;
      for (i = 0; i < COARSE * COARSE; i++) split.push(false);

      var stage = h('div', { class: 'tp-stage', style: { backgroundImage: 'url("' + url + '")' } });
      var overlay = h('div', { class: 'tp-grid' });
      stage.appendChild(overlay);
      var counter = h('span', { class: 'note', text: 'Seçilen parça: 0' });
      var verify = h('button', { class: 'btn primary', text: 'Verify', disabled: true });

      function count() { return Object.keys(sel).length; }

      function render() {
        overlay.innerHTML = '';
        for (var cr = 0; cr < COARSE; cr++) {
          for (var cc = 0; cc < COARSE; cc++) {
            (function (cr, cc) {
              var idx = cr * COARSE + cc;
              if (!split[idx]) {
                var b = h('button', { class: 'tp-cell', type: 'button', 'aria-label': 'Bölgeyi ayır' });
                b.addEventListener('click', function () {
                  split[idx] = true;
                  WC.sound.pop();
                  render();
                });
                overlay.appendChild(b);
              } else {
                var box = h('div', { class: 'tp-cell split' });
                for (var sr = 0; sr < 2; sr++) {
                  for (var sc = 0; sc < 2; sc++) {
                    (function (sr, sc) {
                      var fr = cr * 2 + sr, fc = cc * 2 + sc, key = fr + ',' + fc;
                      var sb = h('button', { class: 'tp-sub' + (sel[key] ? ' sel' : ''), type: 'button', 'aria-label': 'Küçük parça' });
                      sb.addEventListener('click', function () {
                        if (sel[key]) delete sel[key]; else sel[key] = true;
                        sb.classList.toggle('sel', !!sel[key]);
                        counter.textContent = 'Seçilen parça: ' + count();
                        WC.sound.click();
                      });
                      box.appendChild(sb);
                    })(sr, sc);
                  }
                }
                overlay.appendChild(box);
              }
            })(cr, cc);
          }
        }
      }

      verify.addEventListener('click', function () {
        if (!mask) return;
        var missing = 0, extra = 0;
        for (var r = 0; r < FINE; r++) {
          for (var c = 0; c < FINE; c++) {
            var cov = mask[r][c], on = !!sel[r + ',' + c];
            if (cov >= 0.1 && !on) missing++;
            if (cov < 0.02 && on) extra++;
          }
        }
        if (missing === 0 && extra <= 1) api.success();
        else api.fail(missing ? 'Kedi parçalarını kaçırdın (' + missing + ')' : 'Kedisiz parçalar seçtin');
      });

      A.maskFromSVG(scene.catOnly, FINE, function () { return approxMask(scene); }).then(function (m) {
        if (api.scope.disposed) return;
        mask = m || approxMask(scene);
        verify.disabled = false;
      });

      render();
      root.appendChild(stage);
      root.appendChild(h('div', { class: 'actions' }, counter, verify));
    }
  };

  /* ---------- Bölüm 10: Cat Whack-a-Mole ---------- */
  WC.levels[10] = {
    title: 'Cat Whack-a-Mole',
    mount: function (root, api) {
      api.setPrompt('Catch <span class="hl">5 cats</span>', 'Kediler deliklerden fırlar ve hemen kaybolur. Boş deliğe tıklarsan bir an donarsın.');
      var R = api.rand;
      var NEED = 5, caught = 0, visible = 1400, last = -1, active = -1, frozen = false, over = false;
      var holes = [], hideTimer = null;
      var grid = h('div', { class: 'mole-grid' });
      var counter = h('div', { class: 'mole-count' });
      var banner = h('div', { class: 'mole-banner', text: '' });

      function updateCounter() {
        var s = '';
        for (var i = 0; i < NEED; i++) s += i < caught ? '🐱' : '▫️';
        counter.textContent = s + '  ' + caught + ' / ' + NEED;
      }

      function hide(idx) {
        if (idx < 0) return;
        holes[idx].classList.remove('up');
        if (active === idx) active = -1;
      }

      function spawn() {
        if (over) return;
        var idx;
        do { idx = R.int(0, 8); } while (idx === last);
        last = idx; active = idx;
        holes[idx].classList.add('up');
        hideTimer = api.scope.timeout(function () {
          hide(idx);
          api.scope.timeout(spawn, R.int(250, 650));
        }, visible);
      }

      function bonk(e, i) {
        if (over || frozen) return;
        if (active === i) {
          clearTimeout(hideTimer);
          holes[i].classList.add('hit');
          WC.sound.meow();
          var idx = i;
          hide(idx);
          api.scope.timeout(function () { holes[idx].classList.remove('hit'); }, 300);
          caught++;
          visible = Math.max(620, visible - 170);
          updateCounter();
          if (caught >= NEED) {
            over = true;
            api.scope.timeout(function () { api.success('5 kedi yakalandı!'); }, 450);
          } else {
            api.scope.timeout(spawn, R.int(300, 600));
          }
        } else {
          frozen = true;
          grid.classList.add('frozen');
          banner.textContent = 'Boş delik! Donuyorsun…';
          WC.sound.fail();
          api.scope.timeout(function () {
            frozen = false;
            grid.classList.remove('frozen');
            banner.textContent = '';
          }, 1100);
        }
      }

      for (var i = 0; i < 9; i++) {
        (function (i) {
          var cat = h('img', { class: 'mole-cat', src: A.toURL(A.catHead(i + 11)), alt: 'Kedi', draggable: 'false' });
          var hole = h('button', { class: 'hole', type: 'button', 'aria-label': 'Delik ' + (i + 1) }, h('div', { class: 'hole-in' }, cat), h('div', { class: 'hole-rim' }));
          hole.addEventListener('pointerdown', function (e) { e.preventDefault(); bonk(e, i); });
          holes.push(hole);
          grid.appendChild(hole);
        })(i);
      }
      updateCounter();
      root.appendChild(counter);
      root.appendChild(grid);
      root.appendChild(banner);
      api.scope.timeout(spawn, 700);
    }
  };

  /* ---------- Bölüm 11: Real Cat or Not? ---------- */
  WC.levels[11] = {
    title: 'Real Cat or Not?',
    mount: function (root, api) {
      api.setPrompt('Select only <span class="hl">REAL cats</span>', 'Heykel, peluş ve biblo sayılmaz. Köpek de değil.');
      var R = api.rand;
      var realN = R.int(3, 4);
      var types = [];
      var i;
      for (i = 0; i < realN; i++) types.push('real');
      var others = ['statue', 'plush', 'ceramic', 'dog', 'statue', 'plush'];
      types = R.shuffle(types.concat(others.slice(0, 9 - realN)));
      var grid = h('div', { class: 'img-grid g3' });
      var tiles = [];
      types.forEach(function (t) {
        var seed = Math.floor(R.next() * 1e9);
        var img = h('img', { src: A.toURL(A.realityTile(seed, t)), alt: '', draggable: 'false' });
        var b = h('button', { class: 'tile', type: 'button' }, img, h('span', { class: 'check', text: '✓' }));
        b.addEventListener('click', function () { b.classList.toggle('sel'); WC.sound.click(); });
        tiles.push({ el: b, type: t });
        grid.appendChild(b);
      });
      var verify = h('button', { class: 'btn primary', text: 'Verify' });
      verify.addEventListener('click', function () {
        var bad = 0;
        tiles.forEach(function (t) {
          var isReal = t.type === 'real';
          var sel = t.el.classList.contains('sel');
          if (isReal !== sel) { bad++; t.el.classList.add('wrong'); }
        });
        if (!bad) api.success();
        else api.fail('Gerçek kediyle taklidi karıştırdın');
      });
      root.appendChild(grid);
      root.appendChild(h('div', { class: 'actions' }, h('span', { class: 'note', text: 'Yalnızca canlı kediler.' }), verify));
    }
  };

  /* ---------- Bölüm 12: WITHOUT ---------- */
  WC.levels[12] = {
    title: 'WITHOUT',
    mount: function (root, api) {
      api.setPrompt('Select all squares <span class="without">WITHOUT</span> cats', 'Bu sefer kedisiz kareleri seçiyorsun. Alışkanlığına dikkat.');
      var g = WC.buildTileGrid(root, api, { cols: 3, rows: 3 });
      var verify = h('button', { class: 'btn primary', text: 'Verify' });
      verify.addEventListener('click', function () {
        var bad = 0;
        g.tiles.forEach(function (t) {
          var noCat = t.kind === 'none';
          var sel = t.el.classList.contains('sel');
          if (noCat !== sel) { bad++; t.el.classList.add('wrong'); }
        });
        if (!bad) api.success();
        else api.fail('Kedisiz kareleri seçmen gerekiyordu');
      });
      root.appendChild(g.grid);
      root.appendChild(h('div', { class: 'actions' }, h('span', { class: 'note', text: 'Kedi içeren kareleri seçme.' }), verify));
    }
  };
})();
