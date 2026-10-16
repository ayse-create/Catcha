/* Sürüş bölümleri: 14, 15, 22, 23, 24 (hepsi WC.Drive motorunu kullanır) */
(function () {
  var WC = window.WC;
  var UP = -Math.PI / 2;

  var HELP_BASE = '<b>↑ ↓ ← →</b> veya <b>WASD</b> ile sür · <b>Boşluk</b> el freni · <b>R</b> başa al. ' +
    'Arabanın tamamı alanın içinde, düz ve durmuş olmalı. <b>Aynalar dahil</b> hiçbir şey çizgiye değmemeli.';

  var COLORS = ['#4aa3e0', '#7bc47f', '#e3b341', '#c77dff', '#f28b82', '#9aa5b1', '#6dd3c8'];

  function dashedRoad(c, y, x0, x1) {
    c.strokeStyle = 'rgba(255, 214, 80, .75)';
    c.lineWidth = 3;
    c.setLineDash([26, 22]);
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
    c.setLineDash([]);
  }

  /* Üst kenarda dikey park alanı: hedef alanın yanlarında park etmiş arabalar */
  function verticalBays(cx, bw, R, opts) {
    opts = opts || {};
    var by = 40, bh = 110;
    var bay = {
      x: cx - bw / 2, y: by, w: bw, h: bh, a: UP, tol: 7,
      lines: [[cx - bw / 2, by, cx - bw / 2, by + bh], [cx + bw / 2, by, cx + bw / 2, by + bh]]
    };
    var parked = [
      { x: cx - bw, y: by + 55, a: UP, color: R.pick(COLORS) },
      { x: cx + bw, y: by + 55, a: UP, color: R.pick(COLORS) }
    ];
    var deco = [];
    // diğer yuvaların çizgileri (çarpışmaz, sadece görsel)
    for (var k = -4; k <= 4; k++) {
      var lx = cx + (k + 0.5) * bw;
      if (Math.abs(k + 0.5) < 0.6) continue;
      deco.push([lx, by, lx, by + bh]);
    }
    deco.push([cx - bw * 4.5, by + bh, cx + bw * 4.5, by + bh]);
    // uzak yuvalarda ek arabalar (süs)
    [-3, -2, 2, 3].forEach(function (k) {
      if (R.chance(0.65)) parked.push({ x: cx + k * bw, y: by + 55, a: UP, color: R.pick(COLORS) });
    });
    return { bay: bay, parked: parked, deco: deco, by: by, bh: bh };
  }

  /* Üst kenarda paralel park alanı */
  function parallelBay(bx, bwid, R) {
    var by = 14, bh = 60;
    var bay = {
      x: bx, y: by, w: bwid, h: bh, a: 0, tol: 8,
      lines: [[bx, by, bx, by + bh], [bx + bwid, by, bx + bwid, by + bh]]
    };
    var parked = [
      { x: bx - 8 - 39, y: by + 30, a: 0, color: R.pick(COLORS) },
      { x: bx + bwid + 8 + 39, y: by + 30, a: 0, color: R.pick(COLORS) }
    ];
    // süs arabalar
    var deco = [];
    return { bay: bay, parked: parked, deco: deco };
  }

  function mountDrive(root, api, cfg) {
    new WC.Drive(root, api, cfg);
  }

  /* ---------- Bölüm 14: Vertical Parking ---------- */
  WC.levels[14] = {
    title: 'Vertical Parking',
    wide: true,
    mount: function (root, api) {
      api.setPrompt('Park in the <span class="hl">marked space</span>', 'Dikey park. Aynan çizgiye bile değmesin.');
      var R = api.rand;
      var v = verticalBays(450, 72, R);
      mountDrive(root, api, {
        help: HELP_BASE,
        start: { x: 110, y: 440, a: 0 },
        bay: v.bay, parked: v.parked, deco: v.deco,
        paint: function (c, W, H) { dashedRoad(c, 345, 40, W - 40); },
        successText: 'Hatasız park!'
      });
    }
  };

  /* ---------- Bölüm 15: Vertical Parking in Traffic ---------- */
  WC.levels[15] = {
    title: 'Vertical Parking in Traffic',
    wide: true,
    mount: function (root, api) {
      api.setPrompt('Cross the traffic and <span class="hl">park</span>', 'Trafikteki boşluğu bekle, karşıdan karşıya geç, dikey park et. Çarparsan başa dönersin.');
      var R = api.rand;
      var v = verticalBays(450, 72, R);
      mountDrive(root, api, {
        help: HELP_BASE,
        start: { x: 110, y: 470, a: 0 },
        bay: v.bay, parked: v.parked, deco: v.deco,
        lanes: [
          { y: 230, dir: -1, speed: 80, count: 3 },
          { y: 290, dir: 1, speed: 80, count: 3 }
        ],
        paint: function (c, W, H) {
          dashedRoad(c, 260, 0, W);
          c.fillStyle = 'rgba(255,255,255,.05)';
          c.fillRect(0, 205, W, 110);
        },
        successText: 'Trafikte park tamam!'
      });
    }
  };

  /* ---------- Bölüm 22: Horizontal Parking ---------- */
  WC.levels[22] = {
    title: 'Horizontal Parking',
    wide: true,
    mount: function (root, api) {
      api.setPrompt('<span class="hl">Parallel park</span> between the cars', 'Yol kenarındaki boşluğa paralel park et. İleri geri gitmeyi unutma.');
      var R = api.rand;
      var p = parallelBay(340, 150, R);
      mountDrive(root, api, {
        help: HELP_BASE,
        start: { x: 130, y: 150, a: 0 },
        bay: p.bay, parked: p.parked, deco: p.deco,
        paint: function (c, W, H) { dashedRoad(c, 330, 40, W - 40); },
        successText: 'Paralel park tamam!'
      });
    }
  };

  /* ---------- Bölüm 23: Horizontal Parking in Traffic ---------- */
  WC.levels[23] = {
    title: 'Horizontal Parking in Traffic',
    wide: true,
    mount: function (root, api) {
      api.setPrompt('Cross the traffic, then <span class="hl">parallel park</span>', 'Önce trafikteki boşluğu bekle ve karşıya geç, sonra yol kenarına paralel park et.');
      var R = api.rand;
      var p = parallelBay(340, 150, R);
      mountDrive(root, api, {
        help: HELP_BASE,
        start: { x: 120, y: 480, a: UP },
        bay: p.bay, parked: p.parked, deco: p.deco,
        lanes: [
          { y: 300, dir: -1, speed: 85, count: 3 },
          { y: 360, dir: 1, speed: 85, count: 3 }
        ],
        paint: function (c, W, H) {
          dashedRoad(c, 330, 0, W);
          c.fillStyle = 'rgba(255,255,255,.05)';
          c.fillRect(0, 275, W, 110);
        },
        successText: 'Trafikte paralel park tamam!'
      });
    }
  };

  /* ---------- Bölüm 24: Final Traffic Course ---------- */
  WC.levels[24] = {
    title: 'Final Traffic Course',
    wide: true,
    mount: function (root, api) {
      api.setPrompt('<span class="hl">Final course:</span> gate, traffic, parking', 'Dar geçitten geç, trafikte boşluğu bekle, son park alanına hatasız gir.');
      var R = api.rand;
      var v = verticalBays(640, 72, R);
      mountDrive(root, api, {
        help: HELP_BASE + ' Başarırsan oyun biter.',
        start: { x: 100, y: 450, a: 0 },
        walls: [
          { x: 230, y: 12, w: 26, h: 388, kind: 'barrier' },
          { x: 230, y: 500, w: 26, h: 48, kind: 'barrier' }
        ],
        bay: v.bay, parked: v.parked, deco: v.deco,
        lanes: [
          { y: 215, dir: -1, speed: 90, count: 3, x0: 296 },
          { y: 275, dir: 1, speed: 90, count: 3, x0: 296 }
        ],
        paint: function (c, W, H) {
          dashedRoad(c, 245, 260, W);
          c.fillStyle = 'rgba(255,255,255,.05)';
          c.fillRect(256, 190, W - 256, 110);
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.font = '900 20px "Trebuchet MS", sans-serif';
          c.textAlign = 'center';
          c.fillText('GATE', 243, 440);
          c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(40, 460); c.lineTo(40, 440); c.moveTo(40, 450); c.lineTo(80, 450); c.stroke();
        },
        successText: 'Final parkuru tamam!'
      });
    }
  };
})();
