/* Bölüm 5–8: CAPTCHA'dan zekâ oyunlarına */
(function () {
  var WC = window.WC, U = WC.util, h = U.h, A = WC.art;

  /* ---------- Bölüm 5: Rotate the Image ---------- */
  WC.levels[5] = {
    title: 'Rotate the Image',
    mount: function (root, api) {
      api.setPrompt('Rotate the pieces to <span class="hl">restore the picture</span>', 'Her tıklama bir kareyi 90° döndürür.');
      var R = api.rand;
      var url = A.toURL(A.puzzleScene(Math.floor(R.next() * 1e9)));
      var N = 3;
      var rots = [], i;
      for (i = 0; i < N * N; i++) rots.push(R.int(0, 3));
      // en az 5 kare yanlış yönde olsun, tamamı çözülmüş başlamasın
      var wrongCount = rots.filter(function (r) { return r !== 0; }).length;
      for (i = 0; wrongCount < 5 && i < rots.length; i++) {
        if (rots[i] === 0) { rots[i] = R.int(1, 3); wrongCount++; }
      }
      var degs = rots.map(function (r) { return r * 90; });
      var grid = h('div', { class: 'rot-grid' });
      var inners = [];
      var solved = false;
      var status = h('span', { class: 'note' });

      function check() {
        var ok = degs.every(function (d) { return ((d / 90) % 4 + 4) % 4 === 0; });
        var left = degs.filter(function (d) { return ((d / 90) % 4 + 4) % 4 !== 0; }).length;
        status.textContent = left ? 'Yanlış yönde: ' + left + ' kare' : 'Tamam!';
        if (ok && !solved) {
          solved = true;
          grid.classList.add('done');
          WC.sound.meow();
          api.scope.timeout(function () { api.success(); }, 600);
        }
      }

      for (i = 0; i < N * N; i++) {
        (function (idx) {
          var r = Math.floor(idx / N), c = idx % N;
          var inner = h('div', { class: 'rot-inner', style: {
            backgroundImage: 'url("' + url + '")',
            backgroundSize: (N * 100) + '% ' + (N * 100) + '%',
            backgroundPosition: (c * 100 / (N - 1)) + '% ' + (r * 100 / (N - 1)) + '%',
            transform: 'rotate(' + degs[idx] + 'deg)'
          } });
          var tile = h('button', { class: 'rot-tile', type: 'button', 'aria-label': 'Kareyi döndür' }, inner);
          tile.addEventListener('click', function () {
            if (solved) return;
            degs[idx] += 90;
            inner.style.transform = 'rotate(' + degs[idx] + 'deg)';
            WC.sound.click();
            check();
          });
          inners.push(inner);
          grid.appendChild(tile);
        })(i);
      }
      root.appendChild(grid);
      root.appendChild(h('div', { class: 'actions' }, status));
      check();
    }
  };

  /* ---------- Bölüm 6: Cat Tic-Tac-Toe ---------- */
  var LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

  function winner(b) {
    for (var i = 0; i < LINES.length; i++) {
      var l = LINES[i];
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { who: b[l[0]], line: l };
    }
    return null;
  }
  function findMove(b, who) {
    for (var i = 0; i < LINES.length; i++) {
      var l = LINES[i], cnt = 0, empty = -1;
      for (var k = 0; k < 3; k++) {
        if (b[l[k]] === who) cnt++;
        else if (!b[l[k]]) empty = l[k];
      }
      if (cnt === 2 && empty >= 0) return empty;
    }
    return -1;
  }
  WC.ttt = { winner: winner, findMove: findMove };

  WC.levels[6] = {
    title: 'Cat Tic-Tac-Toe',
    mount: function (root, api) {
      api.setPrompt('<span class="hl">Win</span> at Tic-Tac-Toe', 'Berabere kalmak yetmez. Üçlüyü sen yapmalısın.');
      var R = api.rand;
      var board = [null, null, null, null, null, null, null, null, null];
      var busy = false, over = false;
      var status = h('div', { class: 'ttt-status', text: 'Sıra sende 🐱' });
      var cells = [];
      var grid = h('div', { class: 'ttt-grid' });
      var P = '🐱', O = '🐭';

      function render() {
        board.forEach(function (v, i) {
          cells[i].textContent = v === 'P' ? P : v === 'O' ? O : '';
          cells[i].disabled = !!v || over;
        });
      }
      function endCheck() {
        var w = winner(board);
        if (w) {
          over = true;
          w.line.forEach(function (i) { cells[i].classList.add('win'); });
          render();
          if (w.who === 'P') {
            status.textContent = 'Kazandın! 🎉';
            WC.sound.meow();
            api.scope.timeout(function () { api.success(); }, 700);
          } else {
            status.textContent = 'Fare kazandı…';
            api.scope.timeout(function () { api.fail('Fare kazandı. Tekrar dene.'); }, 500);
          }
          return true;
        }
        if (board.every(Boolean)) {
          over = true;
          render();
          status.textContent = 'Berabere. Bu yeterli değil!';
          api.toast('Beraberlik yetmez, yeniden başlıyor', 'bad');
          api.scope.timeout(reset, 1300);
          return true;
        }
        return false;
      }
      function reset() {
        board = [null, null, null, null, null, null, null, null, null];
        over = false; busy = false;
        cells.forEach(function (c) { c.classList.remove('win'); });
        status.textContent = 'Sıra sende 🐱';
        render();
      }
      function aiMove() {
        var m = -1;
        // fare zayıf oynar: bazen kazanma/engelleme fırsatını kaçırır
        if (R.chance(0.8)) m = findMove(board, 'O');
        if (m < 0 && R.chance(0.55)) m = findMove(board, 'P');
        if (m < 0) {
          var empties = [];
          board.forEach(function (v, i) { if (!v) empties.push(i); });
          if (board[4] === null && R.chance(0.35)) m = 4;
          else m = R.pick(empties);
        }
        board[m] = 'O';
        busy = false;
        status.textContent = 'Sıra sende 🐱';
        render();
        endCheck();
      }

      for (var i = 0; i < 9; i++) {
        (function (i) {
          var b = h('button', { class: 'ttt-cell', type: 'button', 'aria-label': 'Kare ' + (i + 1) });
          b.addEventListener('click', function () {
            if (busy || over || board[i]) return;
            board[i] = 'P';
            WC.sound.click();
            render();
            if (endCheck()) return;
            busy = true;
            status.textContent = 'Fare düşünüyor… 🐭';
            api.scope.timeout(aiMove, 550);
          });
          cells.push(b);
          grid.appendChild(b);
        })(i);
      }
      root.appendChild(status);
      root.appendChild(grid);
      render();
    }
  };

  /* ---------- Bölüm 7: Word Search ---------- */
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

  function buildWordGrid(R, size, words) {
    for (var attempt = 0; attempt < 200; attempt++) {
      var g = [];
      var r, c;
      for (r = 0; r < size; r++) { g.push([]); for (c = 0; c < size; c++) g[r].push(''); }
      var placed = [];
      var ok = true;
      for (var wi = 0; wi < words.length && ok; wi++) {
        var w = words[wi], done = false;
        for (var tries = 0; tries < 120 && !done; tries++) {
          var d = R.pick(DIRS);
          var rev = false;
          var sr = R.int(0, size - 1), sc = R.int(0, size - 1);
          var er = sr + d[1] * (w.length - 1), ec = sc + d[0] * (w.length - 1);
          if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
          var fits = true;
          for (var k = 0; k < w.length; k++) {
            var cur = g[sr + d[1] * k][sc + d[0] * k];
            if (cur && cur !== w.charAt(k)) { fits = false; break; }
          }
          if (!fits) continue;
          for (k = 0; k < w.length; k++) g[sr + d[1] * k][sc + d[0] * k] = w.charAt(k);
          placed.push({ word: w, r1: sr, c1: sc, r2: er, c2: ec });
          done = true;
        }
        if (!done) ok = false;
      }
      if (!ok) continue;
      var letters = 'ABCDEFGHIJKLMNOPRSTUVWY';
      for (r = 0; r < size; r++) for (c = 0; c < size; c++) if (!g[r][c]) g[r][c] = letters.charAt(Math.floor(R.next() * letters.length));
      return { grid: g, placed: placed };
    }
    return null;
  }
  WC.buildWordGrid = buildWordGrid;

  WC.levels[7] = {
    title: 'Word Search',
    mount: function (root, api) {
      var words = ['CATSTOPSIGN', 'THECAT'];
      api.setPrompt('Find <span class="hl">thecat</span> and <span class="hl">catstopsign</span>', 'Harfleri sürükleyerek işaretle. Kelimeler düz, dikey veya çapraz olabilir.');
      var R = api.rand, SIZE = 12;
      var data = buildWordGrid(R, SIZE, words);
      var found = {};
      var cells = [], grid = h('div', { class: 'ws-grid', style: { gridTemplateColumns: 'repeat(' + SIZE + ', 1fr)' } });
      var listEls = {};
      var i, r, c;
      for (r = 0; r < SIZE; r++) {
        for (c = 0; c < SIZE; c++) {
          var cell = h('div', { class: 'ws-cell', text: data.grid[r][c], dataset: { r: r, c: c } });
          cells.push(cell);
          grid.appendChild(cell);
        }
      }
      function cellAt(r, c) { return cells[r * SIZE + c]; }

      var list = h('div', { class: 'ws-list' });
      words.forEach(function (w) {
        var li = h('span', { class: 'ws-word', text: w.toLowerCase() });
        listEls[w] = li;
        list.appendChild(li);
      });

      var start = null, cur = null, dragging = false, pathCells = [];
      function clearSel() { cells.forEach(function (x) { x.classList.remove('sel'); }); pathCells = []; }
      function computePath(a, b) {
        var dr = b.r - a.r, dc = b.c - a.c;
        var steps = Math.max(Math.abs(dr), Math.abs(dc));
        if (steps === 0) return [a];
        if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
        var sr = Math.sign(dr), sc = Math.sign(dc), out = [];
        for (var k = 0; k <= steps; k++) out.push({ r: a.r + sr * k, c: a.c + sc * k });
        return out;
      }
      function hit(e) {
        var t = document.elementFromPoint(e.clientX, e.clientY);
        if (!t || !t.classList || !t.classList.contains('ws-cell')) return null;
        return { r: +t.dataset.r, c: +t.dataset.c };
      }
      function wordAt(path) {
        var s = path.map(function (p) { return data.grid[p.r][p.c]; }).join('');
        var rs = s.split('').reverse().join('');
        for (var k = 0; k < words.length; k++) {
          if (!found[words[k]] && (s === words[k] || rs === words[k])) return words[k];
        }
        return null;
      }

      grid.addEventListener('pointerdown', function (e) {
        var p = hit(e);
        if (!p) return;
        dragging = true; start = p; cur = p;
        try { grid.setPointerCapture(e.pointerId); } catch (er) { /* yoksay */ }
        clearSel();
        cellAt(p.r, p.c).classList.add('sel');
        pathCells = [p];
        e.preventDefault();
      });
      grid.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var p = hit(e);
        if (!p) return;
        var path = computePath(start, p);
        if (!path) return;
        cur = p;
        clearSel();
        path.forEach(function (q) { cellAt(q.r, q.c).classList.add('sel'); });
        pathCells = path;
      });
      function finish() {
        if (!dragging) return;
        dragging = false;
        var w = pathCells.length > 1 ? wordAt(pathCells) : null;
        if (w) {
          found[w] = true;
          pathCells.forEach(function (q) { cellAt(q.r, q.c).classList.add('found'); });
          listEls[w].classList.add('done');
          WC.sound.pop();
          if (words.every(function (x) { return found[x]; })) {
            WC.sound.meow();
            api.scope.timeout(function () { api.success('İki kelime de bulundu!'); }, 600);
          }
        } else if (pathCells.length > 2) {
          api.toast('Bu kelime değil', 'bad');
        }
        clearSel();
      }
      grid.addEventListener('pointerup', finish);
      grid.addEventListener('pointercancel', finish);

      root.appendChild(list);
      root.appendChild(grid);
    }
  };

  /* ---------- Bölüm 8: Cat License Plate ---------- */
  function plateText(R) {
    var digits = '23456789', letters = 'ABCDEFHJKLMNPRSTUVYZ';
    var d = function () { return digits.charAt(Math.floor(R.next() * digits.length)); };
    var l = function () { return letters.charAt(Math.floor(R.next() * letters.length)); };
    return d() + d() + ' ' + l() + l() + l() + ' ' + d() + d() + d();
  }

  function drawCar(canvas, plate, R) {
    var W = 420, H = 270;
    var ctx = U.setupCanvas(canvas, W, H);
    var bodyCol = R.pick(['#d9534f', '#3b82c4', '#f0b429', '#4fa36a', '#8b6fd0', '#e8e8ec']);
    // arka plan
    var gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#cfd8e3'); gr.addColorStop(1, '#a9b4c2');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#7d8794'; ctx.fillRect(0, 232, W, 38);
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(210, 238, 170, 11, 0, 0, 6.283); ctx.fill();

    function rr(x, y, w, h2, r, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h2, r); ctx.arcTo(x + w, y + h2, x, y + h2, r);
      ctx.arcTo(x, y + h2, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
    }
    // tekerler
    ctx.fillStyle = '#1b1b1f';
    ctx.beginPath(); ctx.ellipse(86, 226, 30, 14, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(334, 226, 30, 14, 0, 0, 6.283); ctx.fill();
    // kabin
    ctx.beginPath(); ctx.moveTo(92, 108); ctx.lineTo(122, 36); ctx.lineTo(298, 36); ctx.lineTo(328, 108); ctx.closePath();
    ctx.fillStyle = bodyCol; ctx.fill();
    ctx.beginPath(); ctx.moveTo(106, 104); ctx.lineTo(130, 48); ctx.lineTo(290, 48); ctx.lineTo(314, 104); ctx.closePath();
    var wg = ctx.createLinearGradient(0, 48, 0, 104);
    wg.addColorStop(0, '#32465e'); wg.addColorStop(1, '#16212e');
    ctx.fillStyle = wg; ctx.fill();
    // camdaki kedi çıkartması
    ctx.save();
    ctx.translate(210, 82);
    ctx.fillStyle = '#ffb066';
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-15, -6); ctx.lineTo(-12, -24); ctx.lineTo(-2, -13); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(15, -6); ctx.lineTo(12, -24); ctx.lineTo(2, -13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-6, -2, 2.2, 0, 6.283); ctx.arc(6, -2, 2.2, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#ff7d96'; ctx.beginPath(); ctx.moveTo(-2, 3); ctx.lineTo(2, 3); ctx.lineTo(0, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(-24, 1); ctx.moveTo(-10, 7); ctx.lineTo(-24, 9); ctx.moveTo(10, 4); ctx.lineTo(24, 1); ctx.moveTo(10, 7); ctx.lineTo(24, 9); ctx.stroke();
    ctx.restore();
    // gövde
    rr(46, 104, 328, 104, 24, bodyCol);
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(60, 110, 300, 6);
    // stop lambaları
    rr(56, 120, 54, 24, 8, '#c4202c', '#7a0f18');
    rr(310, 120, 54, 24, 8, '#c4202c', '#7a0f18');
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(62, 124, 20, 4); ctx.fillRect(316, 124, 20, 4);
    // tampon
    rr(40, 172, 340, 38, 14, '#c9ced6', '#8c939e');
    // tampon çıkartması
    ctx.fillStyle = '#fff'; rr(296, 150, 66, 16, 4, '#fff7d6', '#c9a227');
    ctx.fillStyle = '#7a4b00'; ctx.font = '700 9px Verdana, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('CAT MOM', 329, 158.5);
    // plaka
    var px = 118, py = 146, pw = 184, ph = 50;
    rr(px - 3, py - 3, pw + 6, ph + 6, 7, '#444');
    rr(px, py, pw, ph, 5, '#f7f7f2');
    ctx.fillStyle = '#2150b8'; ctx.fillRect(px, py, 22, ph);
    ctx.fillStyle = '#fff'; ctx.font = '800 11px Verdana, sans-serif'; ctx.fillText('TR', px + 11, py + ph - 10);
    ctx.fillStyle = '#ffd84d'; ctx.beginPath();
    for (var s = 0; s < 8; s++) { var a = s / 8 * 6.283; ctx.moveTo(px + 11 + Math.cos(a) * 7 + 1.4, py + 12 + Math.sin(a) * 7); ctx.arc(px + 11 + Math.cos(a) * 7, py + 12 + Math.sin(a) * 7, 1.4, 0, 6.283); }
    ctx.fill();

    // plaka karakterleri (hafif bulanık, düzensiz aralık)
    var chars = plate.split('');
    var supports = (typeof ctx.filter === 'string');
    ctx.save();
    ctx.beginPath(); ctx.rect(px + 22, py, pw - 22, ph); ctx.clip();
    if (supports) ctx.filter = 'blur(0.8px)';
    ctx.font = '800 29px "Courier New", monospace';
    ctx.fillStyle = '#16161a';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var x = px + 22 + 11;
    chars.forEach(function (ch) {
      if (ch === ' ') { x += 9 + R.range(-2, 3); return; }
      var jy = R.range(-2, 2), rot = R.range(-0.08, 0.08);
      ctx.save();
      ctx.translate(x, py + ph / 2 + jy);
      ctx.rotate(rot);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      x += 17.5 + R.range(-2.2, 2.6);
    });
    ctx.restore();
    // kir ve çizikler
    ctx.save();
    ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    for (var k = 0; k < 70; k++) {
      ctx.fillStyle = 'rgba(90,70,40,' + R.range(0.05, 0.16) + ')';
      ctx.beginPath(); ctx.arc(px + R.range(0, pw), py + R.range(0, ph), R.range(0.5, 1.6), 0, 6.283); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 0.8;
    for (k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(px + R.range(0, pw), py + R.range(0, ph)); ctx.lineTo(px + R.range(0, pw), py + R.range(0, ph)); ctx.stroke(); }
    var sheen = ctx.createLinearGradient(px, py, px + pw, py + ph);
    sheen.addColorStop(0, 'rgba(255,255,255,.28)'); sheen.addColorStop(0.5, 'rgba(255,255,255,0)'); sheen.addColorStop(1, 'rgba(0,0,0,.08)');
    ctx.fillStyle = sheen; ctx.fillRect(px, py, pw, ph);
    ctx.restore();
  }

  WC.levels[8] = {
    title: 'Cat License Plate',
    mount: function (root, api) {
      api.setPrompt('Type the <span class="hl">license plate</span>', 'Kedi çıkartmalı arabanın plakasını yaz. Boşluklar önemli değil.');
      var plate = plateText(api.rand);
      var canvas = h('canvas', { class: 'cap-canvas', 'aria-label': 'Kedi çıkartmalı bir arabanın arkası' });
      drawCar(canvas, plate, api.rand);
      var input = h('input', { class: 'text-input plain', type: 'text', maxlength: '14', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'PLAKA' });
      var verify = h('button', { class: 'btn primary', text: 'Verify' });
      function norm(s) { return s.toUpperCase().replace(/[^A-Z0-9]/g, ''); }
      function check() {
        if (norm(input.value) === norm(plate)) api.success();
        else api.fail('Plaka yanlış. Yeni araba geliyor.');
      }
      verify.addEventListener('click', check);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
      root.appendChild(canvas);
      root.appendChild(h('div', { class: 'stack' }, input));
      root.appendChild(h('div', { class: 'actions' }, h('span', { class: 'note', text: 'Harfler: O ve I yok. Rakamlar: 0 ve 1 yok.' }), verify));
    }
  };
})();
