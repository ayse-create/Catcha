/* Bölüm 21: Draw Yourself */
(function () {
  var WC = window.WC, U = WC.util, h = U.h;

  var SIZE = 400;

  function ellipsePts(cx, cy, rx, ry, n) {
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var a = i / n * Math.PI * 2 - Math.PI / 2;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return pts;
  }

  /* Kılavuz: kedi yüzü parçaları. Her parça bir çoklu çizgi (polyline) */
  var GUIDE = [
    { id: 'head', label: 'Baş', min: 0.62, lines: [ellipsePts(200, 235, 112, 84, 60)] },
    { id: 'ears', label: 'Kulaklar', min: 0.6, lines: [
      [[110, 205], [112, 92], [186, 156]],
      [[290, 205], [288, 92], [214, 156]]
    ] },
    { id: 'eyes', label: 'Gözler', min: 0.5, lines: [ellipsePts(158, 222, 15, 15, 16), ellipsePts(242, 222, 15, 15, 16)] },
    { id: 'nose', label: 'Burun', min: 0.5, lines: [[[186, 256], [214, 256], [200, 272], [186, 256]]] },
    { id: 'whiskers', label: 'Bıyıklar', min: 0.5, lines: [
      [[114, 258], [34, 240]], [[114, 274], [34, 286]],
      [[286, 258], [366, 240]], [[286, 274], [366, 286]]
    ] }
  ];

  function sample(lines, step) {
    var out = [];
    lines.forEach(function (ln) {
      for (var i = 0; i < ln.length - 1; i++) {
        var a = ln[i], b = ln[i + 1];
        var d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        var n = Math.max(1, Math.round(d / step));
        for (var k = 0; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
      }
    });
    return out;
  }

  WC.levels[21] = {
    title: 'Draw Yourself',
    mount: function (root, api) {
      api.setPrompt('Draw <span class="hl">yourself</span> (as a cat)', 'Noktalı kılavuzun üzerinden geç. Beş parçanın hepsi çizilince doğrulama açılır.');
      var R = api.rand;
      var guideCanvas = h('canvas', { class: 'draw-layer guide' });
      var inkCanvas = h('canvas', { class: 'draw-layer ink' });
      var stage = h('div', { class: 'draw-stage' }, guideCanvas, inkCanvas);
      var gctx = U.setupCanvas(guideCanvas, SIZE, SIZE);
      var ictx = U.setupCanvas(inkCanvas, SIZE, SIZE);

      var colors = ['#2b2d42', '#e5484d', '#2e7be0', '#2e9e5b'];
      var color = colors[0];
      var strokes = []; // { color, pts: [[x,y],...] }
      var drawing = null;

      var samples = GUIDE.map(function (g) { return sample(g.lines, 7); });

      function drawGuide() {
        gctx.clearRect(0, 0, SIZE, SIZE);
        gctx.fillStyle = '#fffdf9';
        gctx.fillRect(0, 0, SIZE, SIZE);
        gctx.setLineDash([2, 8]);
        gctx.lineCap = 'round';
        gctx.lineWidth = 3;
        gctx.strokeStyle = 'rgba(91,91,214,.55)';
        GUIDE.forEach(function (g) {
          g.lines.forEach(function (ln) {
            gctx.beginPath();
            ln.forEach(function (p, i) { if (i === 0) gctx.moveTo(p[0], p[1]); else gctx.lineTo(p[0], p[1]); });
            gctx.stroke();
          });
        });
        gctx.setLineDash([]);
      }

      function redraw() {
        ictx.clearRect(0, 0, SIZE, SIZE);
        ictx.lineCap = 'round';
        ictx.lineJoin = 'round';
        ictx.lineWidth = 5;
        strokes.forEach(function (s) {
          ictx.strokeStyle = s.color;
          ictx.fillStyle = s.color;
          if (s.pts.length === 1) {
            ictx.beginPath(); ictx.arc(s.pts[0][0], s.pts[0][1], 2.5, 0, 6.283); ictx.fill();
            return;
          }
          ictx.beginPath();
          s.pts.forEach(function (p, i) { if (i === 0) ictx.moveTo(p[0], p[1]); else ictx.lineTo(p[0], p[1]); });
          ictx.stroke();
        });
      }

      /* kaplama: her kılavuz noktası için 16px içinde çizim noktası var mı */
      var TOL = 16;
      function coverage() {
        var hash = {};
        var CELL = TOL;
        strokes.forEach(function (s) {
          for (var i = 0; i < s.pts.length; i++) {
            var p = s.pts[i];
            var a = p, b = i > 0 ? s.pts[i - 1] : p;
            var d = Math.hypot(a[0] - b[0], a[1] - b[1]);
            var n = Math.max(1, Math.ceil(d / 5));
            for (var k = 0; k <= n; k++) {
              var x = b[0] + (a[0] - b[0]) * k / n, y = b[1] + (a[1] - b[1]) * k / n;
              var key = Math.floor(x / CELL) + ',' + Math.floor(y / CELL);
              (hash[key] || (hash[key] = [])).push([x, y]);
            }
          }
        });
        return samples.map(function (pts) {
          var cov = 0;
          pts.forEach(function (q) {
            var cx = Math.floor(q[0] / CELL), cy = Math.floor(q[1] / CELL), hit = false;
            for (var dx = -1; dx <= 1 && !hit; dx++) {
              for (var dy = -1; dy <= 1 && !hit; dy++) {
                var arr = hash[(cx + dx) + ',' + (cy + dy)];
                if (!arr) continue;
                for (var j = 0; j < arr.length; j++) {
                  if (Math.hypot(arr[j][0] - q[0], arr[j][1] - q[1]) <= TOL) { hit = true; break; }
                }
              }
            }
            if (hit) cov++;
          });
          return cov / pts.length;
        });
      }

      var checklist = h('div', { class: 'draw-checklist' });
      var items = GUIDE.map(function (g) {
        var li = h('span', { class: 'draw-chip', text: '☐ ' + g.label });
        checklist.appendChild(li);
        return li;
      });
      var verify = h('button', { class: 'btn primary', text: 'Verify', disabled: true });
      var allDone = false;

      function updateChecklist() {
        var cov = coverage();
        var ok = 0;
        GUIDE.forEach(function (g, i) {
          var done = cov[i] >= g.min;
          if (done) ok++;
          items[i].className = 'draw-chip' + (done ? ' done' : '');
          items[i].textContent = (done ? '☑ ' : '☐ ') + g.label;
        });
        allDone = ok === GUIDE.length;
        verify.disabled = !allDone;
      }

      function pos(e) {
        var r = inkCanvas.getBoundingClientRect();
        return [(e.clientX - r.left) / r.width * SIZE, (e.clientY - r.top) / r.height * SIZE];
      }
      inkCanvas.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        try { inkCanvas.setPointerCapture(e.pointerId); } catch (er) { /* yoksay */ }
        drawing = { color: color, pts: [pos(e)] };
        strokes.push(drawing);
        redraw();
      });
      inkCanvas.addEventListener('pointermove', function (e) {
        if (!drawing) return;
        var p = pos(e), last = drawing.pts[drawing.pts.length - 1];
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) return;
        drawing.pts.push(p);
        redraw();
      });
      function end() {
        if (!drawing) return;
        drawing = null;
        updateChecklist();
      }
      inkCanvas.addEventListener('pointerup', end);
      inkCanvas.addEventListener('pointercancel', end);

      var swatches = h('div', { class: 'swatches' });
      colors.forEach(function (c, i) {
        var s = h('button', { class: 'swatch' + (i === 0 ? ' on' : ''), type: 'button', style: { background: c }, 'aria-label': 'Renk ' + (i + 1) });
        s.addEventListener('click', function () {
          color = c;
          Array.prototype.forEach.call(swatches.children, function (x) { x.classList.remove('on'); });
          s.classList.add('on');
        });
        swatches.appendChild(s);
      });
      var undo = h('button', { class: 'btn small', text: '↶ Geri al' });
      var clear = h('button', { class: 'btn small', text: 'Temizle' });
      undo.addEventListener('click', function () { strokes.pop(); redraw(); updateChecklist(); });
      clear.addEventListener('click', function () { strokes = []; redraw(); updateChecklist(); });

      verify.addEventListener('click', function () {
        if (!allDone) return;
        // beyaz zemin üzerine kaydet (kılavuz olmadan)
        var out = document.createElement('canvas');
        out.width = SIZE; out.height = SIZE;
        var c = out.getContext('2d');
        c.fillStyle = '#fffdf9'; c.fillRect(0, 0, SIZE, SIZE);
        c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 5;
        strokes.forEach(function (s) {
          c.strokeStyle = s.color; c.fillStyle = s.color;
          if (s.pts.length === 1) { c.beginPath(); c.arc(s.pts[0][0], s.pts[0][1], 2.5, 0, 6.283); c.fill(); return; }
          c.beginPath();
          s.pts.forEach(function (p, i) { if (i === 0) c.moveTo(p[0], p[1]); else c.lineTo(p[0], p[1]); });
          c.stroke();
        });
        try { WC.state.setDrawing(out.toDataURL('image/png')); } catch (e) { /* yoksay */ }
        WC.sound.meow();
        api.success('Güzel kedi!');
      });

      drawGuide();
      root.appendChild(stage);
      root.appendChild(checklist);
      root.appendChild(h('div', { class: 'actions' }, h('div', { class: 'draw-tools' }, swatches, undo, clear), verify));
    }
  };
})();
