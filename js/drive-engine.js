/* Sürüş motoru: yukarıdan görünüm, basit araç fiziği, çarpışma ve park kontrolü.
   Bölüm 14, 15, 22, 23 ve 24 bu motoru farklı yerleşimlerle kullanır. */
(function () {
  var WC = window.WC, U = WC.util, h = U.h;

  var CAR = { L: 78, W: 36, WB: 50, RA: 12, MIR_L: 8, MIR_T: 5, MIR_FWD: 20 };
  var TRAFFIC = { L: 72, W: 34 };

  /* ---------- Geometri ---------- */
  function obb(cx, cy, l, w, th) {
    var c = Math.cos(th), s = Math.sin(th), hl = l / 2, hw = w / 2;
    var pts = [[hl, hw], [hl, -hw], [-hl, -hw], [-hl, hw]];
    return pts.map(function (p) { return [cx + p[0] * c - p[1] * s, cy + p[0] * s + p[1] * c]; });
  }
  function rectPoly(x, y, w, hh) {
    return [[x, y], [x + w, y], [x + w, y + hh], [x, y + hh]];
  }
  function segPoly(x1, y1, x2, y2, t) {
    var dx = x2 - x1, dy = y2 - y1;
    return obb((x1 + x2) / 2, (y1 + y2) / 2, Math.hypot(dx, dy), t, Math.atan2(dy, dx));
  }
  /* Ayırıcı eksen teoremi: iki dışbükey çokgen kesişiyor mu */
  function sat(A, B) {
    var polys = [A, B];
    for (var pi = 0; pi < 2; pi++) {
      var P = polys[pi];
      for (var i = 0; i < P.length; i++) {
        var p1 = P[i], p2 = P[(i + 1) % P.length];
        var ax = -(p2[1] - p1[1]), ay = p2[0] - p1[0];
        var min1 = Infinity, max1 = -Infinity, min2 = Infinity, max2 = -Infinity, k, d;
        for (k = 0; k < A.length; k++) { d = A[k][0] * ax + A[k][1] * ay; if (d < min1) min1 = d; if (d > max1) max1 = d; }
        for (k = 0; k < B.length; k++) { d = B[k][0] * ax + B[k][1] * ay; if (d < min2) min2 = d; if (d > max2) max2 = d; }
        if (max1 < min2 || max2 < min1) return false;
      }
    }
    return true;
  }

  /* Bir aracın gövdesi ve iki aynası (merkez tabanlı) */
  function carPolys(cx, cy, th, L, Wd) {
    var c = Math.cos(th), s = Math.sin(th);
    var fwd = L / 2 - CAR.MIR_FWD;
    var lat = Wd / 2 + CAR.MIR_T / 2 - 0.5;
    function m(side) {
      var mx = cx + fwd * c - side * lat * s;
      var my = cy + fwd * s + side * lat * c;
      return obb(mx, my, CAR.MIR_L, CAR.MIR_T, th);
    }
    return { body: obb(cx, cy, L, Wd, th), mirrors: [m(1), m(-1)] };
  }

  WC.driveMath = { obb: obb, sat: sat, carPolys: carPolys, segPoly: segPoly, CAR: CAR };

  /* ---------- Çizim ---------- */
  function rrect(c, x, y, w, hh, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + hh, r);
    c.arcTo(x + w, y + hh, x, y + hh, r);
    c.arcTo(x, y + hh, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function drawCarShape(c, cx, cy, th, L, Wd, color, opt) {
    opt = opt || {};
    c.save();
    c.translate(cx, cy);
    c.rotate(th);
    // gölge
    c.fillStyle = 'rgba(0,0,0,.22)';
    rrect(c, -L / 2 + 3, -Wd / 2 + 4, L, Wd, 9); c.fill();
    // aynalar
    var fwd = L / 2 - CAR.MIR_FWD, lat = Wd / 2 + CAR.MIR_T / 2 - 0.5;
    [1, -1].forEach(function (side, i) {
      c.fillStyle = (opt.mirrorHit && opt.mirrorHit[i]) ? '#ff2d2d' : '#23252d';
      rrect(c, fwd - CAR.MIR_L / 2, side * lat - CAR.MIR_T / 2, CAR.MIR_L, CAR.MIR_T, 1.5); c.fill();
    });
    // gövde
    c.fillStyle = color;
    rrect(c, -L / 2, -Wd / 2, L, Wd, 9); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.stroke();
    // camlar
    c.fillStyle = '#1d2a3a';
    rrect(c, L * 0.12, -Wd / 2 + 4, L * 0.17, Wd - 8, 3); c.fill();
    rrect(c, -L * 0.36, -Wd / 2 + 4.5, L * 0.12, Wd - 9, 3); c.fill();
    // tavan
    c.fillStyle = 'rgba(255,255,255,.2)';
    rrect(c, -L * 0.22, -Wd / 2 + 4, L * 0.33, Wd - 8, 4); c.fill();
    // farlar ve stoplar
    c.fillStyle = '#fff3b0';
    c.fillRect(L / 2 - 4, -Wd / 2 + 3, 3, 7); c.fillRect(L / 2 - 4, Wd / 2 - 10, 3, 7);
    c.fillStyle = '#d0202e';
    c.fillRect(-L / 2 + 1, -Wd / 2 + 3, 3, 7); c.fillRect(-L / 2 + 1, Wd / 2 - 10, 3, 7);
    if (opt.player) {
      // tavanda kedi yüzü
      c.fillStyle = '#ffb066';
      c.beginPath(); c.arc(-L * 0.06, 0, 6.5, 0, 6.283); c.fill();
      c.beginPath(); c.moveTo(-L * 0.06 - 6, -3); c.lineTo(-L * 0.06 - 4, -9.5); c.lineTo(-L * 0.06 - 0.5, -5); c.fill();
      c.beginPath(); c.moveTo(-L * 0.06 - 6, 3); c.lineTo(-L * 0.06 - 4, 9.5); c.lineTo(-L * 0.06 - 0.5, 5); c.fill();
      c.fillStyle = '#222';
      c.beginPath(); c.arc(-L * 0.06 + 2, -2.2, 1.1, 0, 6.283); c.arc(-L * 0.06 + 2, 2.2, 1.1, 0, 6.283); c.fill();
    }
    c.restore();
  }

  function drawWall(c, w) {
    if (w.kind === 'barrier') {
      c.fillStyle = '#ffd23f';
      c.fillRect(w.x, w.y, w.w, w.h);
      c.save();
      c.beginPath(); c.rect(w.x, w.y, w.w, w.h); c.clip();
      c.strokeStyle = '#2b2d42'; c.lineWidth = 6;
      var span = Math.max(w.w, w.h) + Math.min(w.w, w.h);
      for (var i = -span; i < span * 2; i += 18) {
        c.beginPath(); c.moveTo(w.x + i, w.y + w.h); c.lineTo(w.x + i + w.h, w.y); c.stroke();
      }
      c.restore();
      c.strokeStyle = '#2b2d42'; c.lineWidth = 2; c.strokeRect(w.x, w.y, w.w, w.h);
    } else {
      c.fillStyle = '#b7bbc7';
      c.fillRect(w.x, w.y, w.w, w.h);
      c.fillStyle = 'rgba(255,255,255,.35)';
      c.fillRect(w.x, w.y, w.w, Math.min(4, w.h));
      c.strokeStyle = '#8a8fa0'; c.lineWidth = 1.5; c.strokeRect(w.x, w.y, w.w, w.h);
    }
  }

  /* ---------- Ana sınıf ---------- */
  function Drive(root, api, cfg) {
    var W = cfg.w || 900, H = cfg.h || 560;
    var R = api.rand;

    var canvas = h('canvas', { class: 'drive-canvas', 'aria-label': 'Park alanı' });
    var ctx = U.setupCanvas(canvas, W, H);
    var bgCanvas = document.createElement('canvas');
    var bgctx = U.setupCanvas(bgCanvas, W, H);

    var chipIn = h('span', { class: 'chip', text: 'Alanın içinde' });
    var chipStraight = h('span', { class: 'chip', text: 'Düz' });
    var chipStop = h('span', { class: 'chip', text: 'Durdu' });
    var status = h('div', { class: 'drive-status' }, chipIn, chipStraight, chipStop);
    var help = h('div', { class: 'drive-help', html: cfg.help || '' });

    /* sabitler */
    var walls = [
      { x: 0, y: 0, w: W, h: 12, kind: 'curb' }, { x: 0, y: H - 12, w: W, h: 12, kind: 'curb' },
      { x: 0, y: 0, w: 12, h: H, kind: 'curb' }, { x: W - 12, y: 0, w: 12, h: H, kind: 'curb' }
    ].concat(cfg.walls || []);
    var obstacles = walls.map(function (w) { return rectPoly(w.x, w.y, w.w, w.h); });
    (cfg.parked || []).forEach(function (p) {
      var cp = carPolys(p.x, p.y, p.a, CAR.L, CAR.W);
      obstacles.push(cp.body, cp.mirrors[0], cp.mirrors[1]);
    });
    var bay = cfg.bay;
    var linePolys = (bay.lines || []).map(function (l) { return segPoly(l[0], l[1], l[2], l[3], 3); });

    /* trafik */
    var lanes = (cfg.lanes || []).map(function (ln, li) {
      var LR = U.makeRand(Math.floor(R.next() * 1e9) + li);
      var xs = ln.x0 != null ? ln.x0 : -160;
      var P = (W + 160) - xs, base = P / ln.count, cars = [];
      for (var i = 0; i < ln.count; i++) {
        cars.push({ off: i * base + LR.range(-base * 0.2, base * 0.2), color: LR.pick(['#e3b341', '#4aa3e0', '#7bc47f', '#c77dff', '#f28b82', '#9aa5b1']) });
      }
      return { y: ln.y, dir: ln.dir, speed: ln.speed, P: P, xs: xs, cars: cars };
    });
    var time = 0;
    function laneCarX(ln, c) {
      return (((c.off + ln.dir * ln.speed * time) % ln.P) + ln.P) % ln.P + ln.xs;
    }

    /* araç durumu */
    var car, invuln = 0, crashT = 0, flash = 0, hold = 0, done = false, mirrorHit = [false, false], crashMsg = '';
    var statusFlags = { inBay: false, straight: false, stopped: false };

    function resetCar() {
      var s = cfg.start;
      car = {
        rx: s.x - 27 * Math.cos(s.a), ry: s.y - 27 * Math.sin(s.a),
        th: s.a, v: 0, steer: 0
      };
      invuln = 1.0; hold = 0; mirrorHit = [false, false];
    }
    resetCar();

    function center() {
      return { x: car.rx + 27 * Math.cos(car.th), y: car.ry + 27 * Math.sin(car.th) };
    }

    /* girdi */
    var keys = { up: false, down: false, left: false, right: false, brake: false };
    var pad = { up: false, down: false, left: false, right: false };
    function keyMap(e, val) {
      var k = e.key;
      var used = true;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.up = val;
      else if (k === 'ArrowDown' || k === 's' || k === 'S') keys.down = val;
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = val;
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = val;
      else if (k === ' ' || k === 'Spacebar') keys.brake = val;
      else if ((k === 'r' || k === 'R') && val) { resetCar(); }
      else used = false;
      if (used) e.preventDefault();
    }
    api.scope.on(window, 'keydown', function (e) {
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      keyMap(e, true);
    });
    api.scope.on(window, 'keyup', function (e) { keyMap(e, false); });
    api.scope.on(window, 'blur', function () { keys.up = keys.down = keys.left = keys.right = keys.brake = false; });

    function padBtn(label, key, cls, aria) {
      var b = h('button', { class: 'pad-btn ' + (cls || ''), type: 'button', text: label, 'aria-label': aria });
      function on(e) { e.preventDefault(); pad[key] = true; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (er) { /* yoksay */ } }
      function off(e) { pad[key] = false; b.classList.remove('on'); }
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointercancel', off);
      b.addEventListener('lostpointercapture', off);
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      return b;
    }
    var padEl = h('div', { class: 'drive-pad' },
      h('div', { class: 'pad-group' }, padBtn('◀', 'left', '', 'Sola'), padBtn('▶', 'right', '', 'Sağa')),
      h('div', { class: 'pad-group' }, padBtn('▼ Geri', 'down', 'wide', 'Geri'), padBtn('▲ Gaz', 'up', 'wide gas', 'Gaz')));

    /* ---------- Fizik ---------- */
    function approach(v, target, rate, dt) {
      if (v < target) return Math.min(target, v + rate * dt);
      return Math.max(target, v - rate * dt);
    }

    function crash(msg) {
      crashT = 0.85; flash = 1; car.v = 0; crashMsg = msg;
      api.mistake(msg);
    }

    function step(dt) {
      var up = keys.up || pad.up, down = keys.down || pad.down;
      var left = keys.left || pad.left, right = keys.right || pad.right;
      var target = 0, rate = 150;
      if (keys.brake) { target = 0; rate = 420; }
      else if (up && !down) { target = 105; rate = car.v < -1 ? 330 : 165; }
      else if (down && !up) { target = -68; rate = car.v > 1 ? 330 : 140; }
      else { target = 0; rate = 120; }
      car.v = approach(car.v, target, rate, dt);
      if (Math.abs(car.v) < 0.8 && target === 0) car.v = 0;

      var st = (right ? 1 : 0) - (left ? 1 : 0);
      car.steer = approach(car.steer, st * 0.62, 2.8, dt);
      var dth = car.v / CAR.WB * Math.tan(car.steer);
      car.th += dth * dt;
      car.rx += car.v * Math.cos(car.th) * dt;
      car.ry += car.v * Math.sin(car.th) * dt;

      invuln = Math.max(0, invuln - dt);
      var c = center();
      var P = carPolys(c.x, c.y, car.th, CAR.L, CAR.W);
      mirrorHit = [false, false];

      if (invuln <= 0) {
        var i, j;
        for (i = 0; i < obstacles.length; i++) {
          var o = obstacles[i];
          if (sat(P.body, o)) { crash('Çarptın!'); return; }
          for (j = 0; j < 2; j++) if (sat(P.mirrors[j], o)) { mirrorHit[j] = true; crash('Aynan bir şeye çarptı!'); return; }
        }
        for (var li = 0; li < lanes.length; li++) {
          var ln = lanes[li], th2 = ln.dir > 0 ? 0 : Math.PI;
          for (var ci = 0; ci < ln.cars.length; ci++) {
            var tc = carPolys(laneCarX(ln, ln.cars[ci]), ln.y, th2, TRAFFIC.L, TRAFFIC.W);
            if (sat(P.body, tc.body) || sat(P.body, tc.mirrors[0]) || sat(P.body, tc.mirrors[1]) ||
                sat(P.mirrors[0], tc.body) || sat(P.mirrors[1], tc.body)) { crash('Trafiğe çarptın!'); return; }
          }
        }
        for (i = 0; i < linePolys.length; i++) {
          var lp = linePolys[i];
          for (j = 0; j < 2; j++) if (sat(P.mirrors[j], lp)) { mirrorHit[j] = true; crash('Aynan çizgiye değdi!'); return; }
          if (sat(P.body, lp)) { crash('Çizgiye değdin!'); return; }
        }
      }

      // park kontrolü
      var inside = P.body.every(function (p) {
        return p[0] >= bay.x - 1 && p[0] <= bay.x + bay.w + 1 && p[1] >= bay.y - 1 && p[1] <= bay.y + bay.h + 1;
      });
      var d = (((car.th - bay.a) % Math.PI) + Math.PI) % Math.PI;
      if (d > Math.PI / 2) d -= Math.PI;
      var tol = (bay.tol || 7) * Math.PI / 180;
      var straight = Math.abs(d) <= tol;
      var stopped = Math.abs(car.v) < 5;
      statusFlags.inBay = inside; statusFlags.straight = straight; statusFlags.stopped = stopped;
      if (inside && straight && stopped) {
        hold += dt;
        if (hold >= 0.9 && !done) {
          done = true;
          WC.sound.meow();
          api.success(cfg.successText || 'Mükemmel park!');
        }
      } else {
        hold = Math.max(0, hold - dt * 2);
      }
    }

    /* ---------- Çizim ---------- */
    function paintStatic() {
      var c = bgctx;
      c.fillStyle = '#3b3f4a'; c.fillRect(0, 0, W, H);
      var TR = U.makeRand(77);
      for (var i = 0; i < 700; i++) {
        c.fillStyle = 'rgba(255,255,255,' + TR.range(0.015, 0.05) + ')';
        c.fillRect(TR.range(0, W), TR.range(0, H), TR.range(1, 3), TR.range(1, 3));
      }
      if (cfg.paint) cfg.paint(c, W, H);
      // süs çizgileri
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2;
      (cfg.deco || []).forEach(function (l) { c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(l[2], l[3]); c.stroke(); });
      // hedef alan çizgileri
      c.strokeStyle = '#ffffff'; c.lineWidth = 3;
      (bay.lines || []).forEach(function (l) { c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(l[2], l[3]); c.stroke(); });
      walls.forEach(function (w) { drawWall(c, w); });
      (cfg.parked || []).forEach(function (p) { drawCarShape(c, p.x, p.y, p.a, CAR.L, CAR.W, p.color); });
    }
    paintStatic();

    function draw() {
      ctx.drawImage(bgCanvas, 0, 0, W, H);
      // hedef alan vurgusu
      ctx.fillStyle = 'rgba(91,91,214,' + (0.16 + 0.22 * Math.min(1, hold / 0.9)) + ')';
      ctx.fillRect(bay.x, bay.y, bay.w, bay.h);
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.font = '900 ' + Math.min(bay.w, bay.h) * 0.5 + 'px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('P', bay.x + bay.w / 2, bay.y + bay.h / 2);
      if (hold > 0) {
        ctx.fillStyle = '#2e9e5b';
        var bw = bay.w * Math.min(1, hold / 0.9);
        ctx.fillRect(bay.x, bay.y + bay.h - 5, bw, 5);
      }
      // trafik
      lanes.forEach(function (ln) {
        ln.cars.forEach(function (tc) {
          drawCarShape(ctx, laneCarX(ln, tc), ln.y, ln.dir > 0 ? 0 : Math.PI, TRAFFIC.L, TRAFFIC.W, tc.color);
        });
      });
      // oyuncu
      var c = center();
      drawCarShape(ctx, c.x, c.y, car.th, CAR.L, CAR.W, '#ff8a4c', { player: true, mirrorHit: mirrorHit });
      if (flash > 0) {
        ctx.fillStyle = 'rgba(229,72,77,' + (0.35 * flash) + ')';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '900 34px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(crashMsg, W / 2, H / 2);
      }
    }

    var statusTimer = 0;
    var last = performance.now();
    api.scope.raf(function (now) {
      var dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      time += dt;
      if (!done) {
        if (crashT > 0) {
          crashT -= dt;
          if (crashT <= 0) resetCar();
        } else {
          step(dt / 2); step(dt / 2);
        }
      }
      flash = Math.max(0, flash - dt * 1.4);
      draw();
      statusTimer += dt;
      if (statusTimer > 0.1) {
        statusTimer = 0;
        chipIn.className = 'chip' + (statusFlags.inBay ? ' ok' : '');
        chipStraight.className = 'chip' + (statusFlags.straight && statusFlags.inBay ? ' ok' : '');
        chipStop.className = 'chip' + (statusFlags.stopped && statusFlags.inBay ? ' ok' : '');
      }
    });

    root.appendChild(help);
    root.appendChild(canvas);
    root.appendChild(status);
    root.appendChild(padEl);

    /* Test kancası: otomatik testlerin araca erişmesi için */
    WC.lastDrive = {
      keys: keys,
      get car() { return car; },
      get center() { return center(); },
      get done() { return done; },
      get time() { return time; },
      get crashT() { return crashT; },
      get hold() { return hold; },
      get flags() { return statusFlags; },
      lanes: lanes,
      laneCarX: laneCarX,
      bay: bay
    };
  }

  WC.Drive = Drive;
})();
