/* Tüm görseller kodla üretilir (SVG). Harici dosya yok; sahneler tohuma (seed) göre değişir. */
(function () {
  var WC = (window.WC = window.WC || { levels: {} });
  var U = WC.util;
  var uid = 0;

  function toURL(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function svgDoc(w, h, inner) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h +
      '" width="' + w + '" height="' + h + '">' + inner + '</svg>';
  }
  function attrs(a) {
    var s = '';
    for (var k in a) s += ' ' + k + '="' + a[k] + '"';
    return s;
  }
  function el(tag, a, inner) {
    return '<' + tag + attrs(a) + (inner != null ? '>' + inner + '</' + tag + '>' : '/>');
  }
  function ell(cx, cy, rx, ry, fill, extra) {
    var a = { cx: cx, cy: cy, rx: rx, ry: ry, fill: fill };
    if (extra) for (var k in extra) a[k] = extra[k];
    return el('ellipse', a);
  }
  function circ(cx, cy, r, fill, extra) {
    var a = { cx: cx, cy: cy, r: r, fill: fill };
    if (extra) for (var k in extra) a[k] = extra[k];
    return el('circle', a);
  }
  function rect(x, y, w, h, fill, extra) {
    var a = { x: x, y: y, width: w, height: h, fill: fill };
    if (extra) for (var k in extra) a[k] = extra[k];
    return el('rect', a);
  }
  function path(d, fill, extra) {
    var a = { d: d, fill: fill };
    if (extra) for (var k in extra) a[k] = extra[k];
    return el('path', a);
  }
  function line(x1, y1, x2, y2, stroke, w, extra) {
    var a = { x1: x1, y1: y1, x2: x2, y2: y2, stroke: stroke, 'stroke-width': w || 1, 'stroke-linecap': 'round' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return el('line', a);
  }
  function grp(transform, inner) {
    return '<g transform="' + transform + '">' + inner + '</g>';
  }

  var FURS = [
    { fur: '#e8a15a', dark: '#c97a2e', belly: '#fff1de', eye: '#4caf50', stripe: true },
    { fur: '#8d8d95', dark: '#5f5f68', belly: '#e9e9ef', eye: '#ffc107', stripe: true },
    { fur: '#2f2f36', dark: '#1a1a20', belly: '#3a3a42', eye: '#ffd54a', stripe: false, black: true },
    { fur: '#f4f0ea', dark: '#cfc7bb', belly: '#ffffff', eye: '#4aa3e0', stripe: false },
    { fur: '#c9a27a', dark: '#7b5a3a', belly: '#f3e2cc', eye: '#7bc043', stripe: true },
    { fur: '#e9c08a', dark: '#a8683a', belly: '#ffffff', eye: '#3aa0a0', stripe: false }
  ];

  /* ---------- Kedi ---------- */
  /* Yerel koordinat: taban (0,0), yükseklik ≈ 126, genişlik ≈ ±46 (bıyıklar), kuyruk +68 */
  function cat(o) {
    var s = o.s || 1, x = o.x || 0, y = o.y || 0, rot = o.rot || 0, flip = o.flip ? -1 : 1;
    var style = o.style || 'real';
    var F = o.fur || FURS[0];
    var id = 'cg' + (++uid);
    var fur = F.fur, dark = F.dark, belly = F.belly, eye = F.eye;
    var stroke = 'rgba(40,25,15,.55)', sw = 1.6, defs = '';
    var earIn = '#ffb0b8', noseC = '#ff8aa0';

    if (style === 'statue') {
      defs = '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d0d0d0"/><stop offset="1" stop-color="#858585"/></linearGradient>';
      fur = 'url(#' + id + ')'; dark = '#7a7a7a'; belly = '#b9b9b9'; stroke = '#555'; earIn = '#8d8d8d'; noseC = '#6d6d6d';
    } else if (style === 'plush') {
      fur = o.plush || '#ffb3d1'; dark = '#ff8fbd'; belly = '#ffe3ef'; stroke = '#c0568a'; earIn = '#ff7fb0'; noseC = '#a8326a';
    } else if (style === 'ceramic') {
      fur = '#fbfbff'; dark = '#dfe6ff'; belly = '#ffffff'; stroke = '#3f55a5'; earIn = '#c8d4ff'; noseC = '#3f55a5';
    }

    var g = '';
    // kuyruk
    g += el('path', { d: 'M 22 -10 C 64 -4 70 -46 50 -72', fill: 'none', stroke: (style === 'real' ? dark : dark), 'stroke-width': 11, 'stroke-linecap': 'round' });
    if (style === 'real' && F.stripe) {
      g += el('path', { d: 'M 52 -30 L 62 -28 M 60 -48 L 68 -42 M 54 -62 L 62 -58', stroke: 'rgba(0,0,0,.28)', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' });
    }
    // kulaklar (kafanın arkasında)
    g += path('M -27 -98 L -25 -127 L -5 -105 Z', fur, { stroke: stroke, 'stroke-width': sw, 'stroke-linejoin': 'round' });
    g += path('M 27 -98 L 25 -127 L 5 -105 Z', fur, { stroke: stroke, 'stroke-width': sw, 'stroke-linejoin': 'round' });
    g += path('M -23 -102 L -22.5 -118 L -11 -106 Z', earIn);
    g += path('M 23 -102 L 22.5 -118 L 11 -106 Z', earIn);
    // gövde
    g += ell(0, -36, 34, 38, fur, { stroke: stroke, 'stroke-width': sw });
    g += ell(0, -28, 18, 26, belly, { opacity: style === 'real' ? 0.9 : 1 });
    if (style === 'real' && F.stripe) {
      g += el('path', { d: 'M -33 -46 Q -22 -44 -18 -40 M -34 -32 Q -22 -31 -17 -28 M 33 -46 Q 22 -44 18 -40 M 34 -32 Q 22 -31 17 -28', stroke: 'rgba(0,0,0,.25)', 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' });
    }
    // patiler
    g += ell(-15, -3, 12, 8, belly, { stroke: stroke, 'stroke-width': sw });
    g += ell(15, -3, 12, 8, belly, { stroke: stroke, 'stroke-width': sw });
    // kafa
    g += ell(0, -84, 29, 25, fur, { stroke: stroke, 'stroke-width': sw });
    if (style === 'real' && F.stripe) {
      g += el('path', { d: 'M -7 -108 L -7 -98 M 0 -109 L 0 -97 M 7 -108 L 7 -98 M -27 -84 L -19 -83 M 27 -84 L 19 -83', stroke: 'rgba(0,0,0,.3)', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' });
    }
    // gözler
    if (style === 'real') {
      g += ell(-11, -85, 6.5, 7, eye, { stroke: 'rgba(0,0,0,.35)', 'stroke-width': 1 });
      g += ell(11, -85, 6.5, 7, eye, { stroke: 'rgba(0,0,0,.35)', 'stroke-width': 1 });
      g += ell(-11, -85, 2.2, 6, '#111');
      g += ell(11, -85, 2.2, 6, '#111');
      g += circ(-9, -88, 1.7, '#fff');
      g += circ(13, -88, 1.7, '#fff');
    } else if (style === 'statue') {
      g += ell(-11, -85, 5.5, 5.5, '#6a6a6a');
      g += ell(11, -85, 5.5, 5.5, '#6a6a6a');
    } else if (style === 'plush') {
      g += circ(-11, -85, 5.5, '#222');
      g += circ(11, -85, 5.5, '#222');
      g += circ(-12.5, -87, 1.6, '#fff');
      g += circ(9.5, -87, 1.6, '#fff');
    } else {
      g += el('path', { d: 'M -17 -85 Q -11 -91 -5 -85 M 5 -85 Q 11 -91 17 -85', stroke: '#3f55a5', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' });
    }
    // burun, ağız
    g += path('M -4.5 -78 L 4.5 -78 L 0 -73 Z', noseC);
    g += el('path', { d: 'M 0 -73 L 0 -70 M 0 -70 Q -5 -65 -10 -68 M 0 -70 Q 5 -65 10 -68', stroke: (style === 'plush' ? '#a8326a' : 'rgba(40,25,15,.8)'), 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round' });
    // bıyıklar
    if (style !== 'plush') {
      var wc = style === 'real' ? 'rgba(60,45,35,.65)' : 'rgba(60,60,60,.5)';
      g += line(-16, -75, -46, -81, wc, 1.1) + line(-16, -72, -48, -72, wc, 1.1) + line(-16, -69, -46, -63, wc, 1.1);
      g += line(16, -75, 46, -81, wc, 1.1) + line(16, -72, 48, -72, wc, 1.1) + line(16, -69, 46, -63, wc, 1.1);
    } else {
      g += el('ellipse', { cx: 0, cy: -84, rx: 25, ry: 21, fill: 'none', stroke: '#c0568a', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' });
      g += el('ellipse', { cx: 0, cy: -36, rx: 30, ry: 34, fill: 'none', stroke: '#c0568a', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' });
      g += circ(-22, -50, 7, dark, { opacity: 0.8 });
      g += rect(26, -22, 9, 13, '#fff', { stroke: '#c0568a', 'stroke-width': 1, transform: 'rotate(12 30 -16)' });
      g += circ(-26, -78, 4, '#ff9ec7', { opacity: 0.8 });
      g += circ(26, -78, 4, '#ff9ec7', { opacity: 0.8 });
    }
    if (style === 'statue') {
      g += el('path', { d: 'M 10 -106 L 14 -97 L 8 -90 M -20 -50 L -14 -40 L -20 -30', stroke: '#555', 'stroke-width': 1.3, fill: 'none' });
      g += rect(-44, 0, 88, 22, '#a9a9a9', { stroke: '#666', 'stroke-width': 1.5 });
      g += rect(-44, 0, 88, 5, '#c4c4c4');
      g += rect(-14, 9, 28, 7, '#8a8a8a');
    }
    if (style === 'ceramic') {
      g += el('path', { d: 'M -22 -64 Q 0 -54 22 -64', stroke: '#e6b800', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' });
      g += circ(0, -55, 4.2, '#f5cf2a', { stroke: '#a88400', 'stroke-width': 0.8 });
      g += el('path', { d: 'M -26 -30 Q -10 -22 0 -30 Q 10 -38 26 -30 M -22 -16 Q -8 -8 0 -16 Q 8 -24 22 -16', stroke: '#6f86d6', 'stroke-width': 2, fill: 'none' });
      g += ell(-14, -96, 9, 4, '#fff', { opacity: 0.7, transform: 'rotate(-30 -14 -96)' });
      g += rect(-44, -2, 88, 6, '#e6b800');
    }
    var t = 'translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + (flip * s) + ' ' + s + ')';
    return '<defs>' + defs + '</defs>' + grp(t, g);
  }

  /* ---------- Kedi olmayan hayvanlar ve nesneler ---------- */
  function dog(o) {
    var s = o.s || 1, x = o.x || 0, y = o.y || 0, flip = o.flip ? -1 : 1;
    var col = o.col || '#b9814f', dk = '#8a5a30';
    var g = '';
    g += el('path', { d: 'M 30 -40 Q 56 -50 50 -76', fill: 'none', stroke: col, 'stroke-width': 9, 'stroke-linecap': 'round' });
    g += ell(0, -34, 38, 32, col, { stroke: 'rgba(40,25,15,.5)', 'stroke-width': 1.6 });
    g += ell(0, -26, 20, 22, '#f3e0c6');
    g += ell(-16, -3, 12, 8, '#f3e0c6', { stroke: 'rgba(40,25,15,.5)', 'stroke-width': 1.5 });
    g += ell(16, -3, 12, 8, '#f3e0c6', { stroke: 'rgba(40,25,15,.5)', 'stroke-width': 1.5 });
    g += ell(-30, -80, 11, 23, dk, { transform: 'rotate(14 -30 -80)', stroke: 'rgba(40,25,15,.5)', 'stroke-width': 1.4 });
    g += ell(30, -80, 11, 23, dk, { transform: 'rotate(-14 30 -80)', stroke: 'rgba(40,25,15,.5)', 'stroke-width': 1.4 });
    g += ell(0, -82, 28, 25, col, { stroke: 'rgba(40,25,15,.5)', 'stroke-width': 1.6 });
    g += ell(0, -72, 16, 12, '#f3e0c6');
    g += ell(0, -77, 6.5, 4.8, '#222');
    g += el('path', { d: 'M 0 -73 L 0 -68 M 0 -68 Q -6 -62 -11 -66 M 0 -68 Q 6 -62 11 -66', stroke: '#3a2415', 'stroke-width': 1.5, fill: 'none' });
    g += ell(0, -61, 5, 6, '#ff7a93');
    g += circ(-11, -90, 4.6, '#222') + circ(11, -90, 4.6, '#222') + circ(-9.6, -91.5, 1.4, '#fff') + circ(12.4, -91.5, 1.4, '#fff');
    g += rect(-20, -60 + 0, 40, 5, '#e63946', { rx: 2, transform: 'translate(0 -4)' });
    return grp('translate(' + x + ' ' + y + ') scale(' + (flip * s) + ' ' + s + ')', g);
  }

  function rabbit(o) {
    var s = o.s || 1, x = o.x || 0, y = o.y || 0, flip = o.flip ? -1 : 1;
    var col = o.col || '#f2eee8';
    var g = '';
    g += circ(32, -20, 10, '#fff', { stroke: 'rgba(0,0,0,.2)' });
    g += ell(0, -32, 33, 32, col, { stroke: 'rgba(40,25,15,.4)', 'stroke-width': 1.5 });
    g += ell(-14, -3, 11, 7, col, { stroke: 'rgba(40,25,15,.4)', 'stroke-width': 1.4 });
    g += ell(14, -3, 11, 7, col, { stroke: 'rgba(40,25,15,.4)', 'stroke-width': 1.4 });
    g += ell(-12, -122, 8, 26, col, { stroke: 'rgba(40,25,15,.4)', 'stroke-width': 1.5, transform: 'rotate(-6 -12 -122)' });
    g += ell(12, -122, 8, 26, col, { stroke: 'rgba(40,25,15,.4)', 'stroke-width': 1.5, transform: 'rotate(6 12 -122)' });
    g += ell(-12, -120, 3.6, 19, '#ffb7c5', { transform: 'rotate(-6 -12 -120)' });
    g += ell(12, -120, 3.6, 19, '#ffb7c5', { transform: 'rotate(6 12 -120)' });
    g += circ(0, -80, 26, col, { stroke: 'rgba(40,25,15,.4)', 'stroke-width': 1.5 });
    g += circ(-10, -84, 3.8, '#222') + circ(10, -84, 3.8, '#222');
    g += path('M -3.5 -77 L 3.5 -77 L 0 -73 Z', '#ff8aa0');
    g += rect(-3.6, -71, 3.4, 6, '#fff', { stroke: 'rgba(0,0,0,.3)', 'stroke-width': 0.8 }) + rect(0.2, -71, 3.4, 6, '#fff', { stroke: 'rgba(0,0,0,.3)', 'stroke-width': 0.8 });
    return grp('translate(' + x + ' ' + y + ') scale(' + (flip * s) + ' ' + s + ')', g);
  }

  function bird(o) {
    var s = o.s || 1, x = o.x || 0, y = o.y || 0, flip = o.flip ? -1 : 1;
    var col = o.col || '#4f9be8';
    var g = '';
    g += line(-6, -14, -8, 0, '#d88a2b', 3) + line(6, -14, 8, 0, '#d88a2b', 3);
    g += path('M -24 -40 L -52 -52 L -50 -30 Z', '#2f6fb8');
    g += ell(0, -40, 30, 26, col, { stroke: 'rgba(0,0,0,.25)', 'stroke-width': 1.5 });
    g += ell(0, -30, 18, 15, '#dff0ff');
    g += circ(18, -64, 15, col, { stroke: 'rgba(0,0,0,.25)', 'stroke-width': 1.5 });
    g += path('M 30 -66 L 46 -61 L 30 -57 Z', '#f5a623');
    g += circ(21, -68, 3.2, '#111') + circ(22, -69, 1, '#fff');
    g += ell(-6, -40, 16, 10, '#2f6fb8', { transform: 'rotate(-20 -6 -40)' });
    return grp('translate(' + x + ' ' + y + ') scale(' + (flip * s) + ' ' + s + ')', g);
  }

  function fishbowl(o) {
    var s = o.s || 1, x = o.x || 0, y = o.y || 0;
    var g = '';
    g += circ(0, -48, 40, 'rgba(170,215,255,.45)', { stroke: '#7fb5e8', 'stroke-width': 3 });
    g += ell(0, -50, 17, 10, '#ff8a3d') + path('M 16 -50 L 30 -60 L 30 -40 Z', '#ff8a3d');
    g += circ(-8, -53, 2.6, '#111');
    g += path('M -36 -42 Q 0 -34 36 -42', 'none', { stroke: '#7fb5e8', 'stroke-width': 1.5 });
    g += rect(-22, -8, 44, 8, '#d9b38c', { rx: 3 });
    return grp('translate(' + x + ' ' + y + ') scale(' + s + ')', g);
  }

  var OBJECTS = ['plant', 'mug', 'books', 'box', 'lamp', 'ball', 'cactus', 'clock'];
  function obj(type, x, y, s, extra) {
    s = s || 1;
    var g = '';
    switch (type) {
      case 'plant':
        g += path('M -16 -30 L 16 -30 L 12 0 L -12 0 Z', '#b9694a');
        g += ell(-14, -46, 8, 20, '#4cae5b', { transform: 'rotate(-30 -14 -46)' }) + ell(14, -46, 8, 20, '#3f9a4e', { transform: 'rotate(30 14 -46)' });
        g += ell(0, -52, 8, 24, '#58bd68') + ell(-5, -42, 6, 16, '#46a655', { transform: 'rotate(-14 -5 -42)' });
        break;
      case 'mug':
        g += rect(-14, -26, 28, 26, extra || '#e86a6a', { rx: 4 });
        g += el('path', { d: 'M 14 -20 Q 28 -20 28 -12 Q 28 -4 14 -6', fill: 'none', stroke: extra || '#e86a6a', 'stroke-width': 4 });
        g += ell(0, -26, 14, 3.5, '#5a3524');
        break;
      case 'books':
        g += rect(-24, -12, 48, 12, '#3d6fd1') + rect(-20, -24, 42, 12, '#e8b53f') + rect(-26, -36, 46, 12, '#d6545f');
        g += rect(-24, -9, 44, 2, 'rgba(255,255,255,.5)');
        break;
      case 'box':
        g += rect(-24, -28, 48, 28, '#c89862', { stroke: '#9c7242', 'stroke-width': 1.5 });
        g += rect(-5, -28, 10, 28, '#b9854f') + rect(-24, -28, 48, 6, '#d8aa74');
        break;
      case 'lamp':
        g += path('M -16 -58 L 16 -58 L 24 -30 L -24 -30 Z', '#f7d774', { stroke: '#caa23c', 'stroke-width': 1.2 });
        g += rect(-2.5, -30, 5, 26, '#7a7a82') + ell(0, -3, 14, 4, '#7a7a82');
        break;
      case 'ball':
        g += circ(0, -16, 16, extra || '#4cc3a3', { stroke: 'rgba(0,0,0,.2)' });
        g += el('path', { d: 'M -14 -22 Q 0 -10 14 -22 M -12 -8 Q 0 -20 12 -8', fill: 'none', stroke: 'rgba(255,255,255,.7)', 'stroke-width': 2 });
        break;
      case 'cactus':
        g += path('M -12 -22 L 12 -22 L 9 0 L -9 0 Z', '#c9784f');
        g += rect(-8, -62, 16, 42, '#4a9a5c', { rx: 8 }) + rect(-22, -50, 8, 20, '#4a9a5c', { rx: 4 }) + rect(14, -44, 8, 18, '#4a9a5c', { rx: 4 });
        g += rect(-22, -34, 20, 6, '#4a9a5c', { rx: 3 }) + rect(2, -30, 20, 6, '#4a9a5c', { rx: 3 });
        break;
      case 'clock':
        g += circ(0, -24, 22, '#fff', { stroke: '#6a4a3a', 'stroke-width': 4 });
        g += line(0, -24, 0, -38, '#333', 2.4) + line(0, -24, 10, -20, '#333', 2.4) + circ(0, -24, 2, '#c33');
        break;
    }
    return grp('translate(' + x + ' ' + y + ') scale(' + s + ')', g);
  }

  /* ---------- Arka planlar ---------- */
  function bg(R, variant, W, H) {
    var id = 'bg' + (++uid), s = '', i;
    if (variant === 'room') {
      var wall = R.pick(['#fde7c9', '#d6ecf5', '#f1dcf0', '#dcefd3', '#f6e1d6']);
      var floor = R.pick(['#c89a6b', '#b58863', '#d1a47a']);
      var fy = H * 0.7;
      s += rect(0, 0, W, H, wall) + rect(0, fy, W, H - fy, floor);
      for (i = 1; i < 6; i++) s += line(0, fy + (H - fy) * i / 6, W, fy + (H - fy) * i / 6, 'rgba(0,0,0,.08)', 1.5);
      s += rect(0, fy - 7, W, 9, 'rgba(0,0,0,.12)');
      var wx = R.range(W * 0.08, W * 0.5), ww = W * 0.3, wy = H * 0.1, wh = H * 0.36;
      s += rect(wx, wy, ww, wh, '#bfe6ff', { stroke: '#fff', 'stroke-width': Math.max(4, W / 40) });
      s += line(wx + ww / 2, wy, wx + ww / 2, wy + wh, '#fff', Math.max(3, W / 60)) + line(wx, wy + wh / 2, wx + ww, wy + wh / 2, '#fff', Math.max(3, W / 60));
      s += rect(W * 0.72, H * 0.14, W * 0.16, H * 0.2, '#fff', { stroke: '#8b6b4a', 'stroke-width': Math.max(3, W / 60) }) + circ(W * 0.8, H * 0.24, W * 0.035, '#f0a4a4');
    } else if (variant === 'garden') {
      s += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4f2"/><stop offset="1" stop-color="#d7f0ff"/></linearGradient></defs>';
      s += rect(0, 0, W, H, 'url(#' + id + ')');
      s += circ(R.range(W * 0.15, W * 0.85), H * 0.16, W * 0.07, '#ffe27a');
      s += ell(R.range(W * 0.2, W * 0.5), H * 0.2, W * 0.12, H * 0.05, '#fff', { opacity: 0.9 });
      s += ell(R.range(W * 0.5, W * 0.9), H * 0.3, W * 0.1, H * 0.04, '#fff', { opacity: 0.9 });
      s += ell(W * 0.3, H * 0.75, W * 0.7, H * 0.25, '#7ac36a') + rect(0, H * 0.72, W, H * 0.28, '#6bb35c');
      for (i = 0; i < 9; i++) {
        var fx = R.range(8, W - 8), fy2 = R.range(H * 0.78, H * 0.97);
        s += circ(fx, fy2, W * 0.012, R.pick(['#ff7aa5', '#ffd34d', '#fff', '#c28bff']));
      }
    } else if (variant === 'sofa') {
      var wl = R.pick(['#efe3d3', '#dfe9f3', '#f3e4ea']);
      var sf = R.pick(['#6c8fd1', '#c4685f', '#7aa57a', '#8d6fb0']);
      s += rect(0, 0, W, H, wl) + rect(0, H * 0.78, W, H * 0.22, '#b88d62');
      s += rect(W * 0.04, H * 0.3, W * 0.92, H * 0.38, sf, { rx: W * 0.05 });
      s += rect(0, H * 0.5, W, H * 0.28, sf, { rx: W * 0.04, opacity: 0.95 });
      s += rect(W * 0.08, H * 0.62, W * 0.84, H * 0.14, 'rgba(255,255,255,.12)', { rx: 8 });
      s += rect(W * 0.1, H * 0.34, W * 0.2, H * 0.2, 'rgba(255,255,255,.25)', { rx: 10 }) + rect(W * 0.7, H * 0.34, W * 0.2, H * 0.2, 'rgba(255,255,255,.18)', { rx: 10 });
    } else if (variant === 'night') {
      s += rect(0, 0, W, H, '#1d2540');
      s += circ(W * 0.8, H * 0.18, W * 0.07, '#fff6c9');
      for (i = 0; i < 14; i++) s += circ(R.range(0, W), R.range(0, H * 0.5), R.range(0.8, 1.8), '#fff', { opacity: R.range(0.5, 1) });
      s += path('M 0 ' + H * 0.75 + ' L ' + W * 0.2 + ' ' + H * 0.6 + ' L ' + W * 0.4 + ' ' + H * 0.75 + ' L ' + W * 0.6 + ' ' + H * 0.62 + ' L ' + W * 0.85 + ' ' + H * 0.75 + ' L ' + W + ' ' + H * 0.66 + ' L ' + W + ' ' + H + ' L 0 ' + H + ' Z', '#2c3558');
      s += rect(0, H * 0.82, W, H * 0.18, '#3a4468');
    } else if (variant === 'museum') {
      s += rect(0, 0, W, H, '#e8e4dc') + rect(0, H * 0.78, W, H * 0.22, '#c9c3b8');
      s += rect(W * 0.1, H * 0.12, W * 0.22, H * 0.26, '#fff', { stroke: '#a28c5f', 'stroke-width': 4 });
      s += rect(W * 0.7, H * 0.16, W * 0.2, H * 0.2, '#f0e0c0', { stroke: '#a28c5f', 'stroke-width': 4 });
    } else if (variant === 'kids') {
      s += rect(0, 0, W, H, '#ffe4ef') + rect(0, H * 0.76, W, H * 0.24, '#ffd0e3');
      for (i = 0; i < 10; i++) s += circ(R.range(0, W), R.range(0, H * 0.7), 4, '#fff', { opacity: 0.8 });
      s += rect(W * 0.05, H * 0.62, W * 0.9, H * 0.18, '#ffb3d1', { rx: 10 });
    } else if (variant === 'shelf') {
      s += rect(0, 0, W, H, '#cfe3e0') + rect(0, H * 0.78, W, H * 0.22, '#9c7a55');
      s += rect(W * 0.04, H * 0.76, W * 0.92, H * 0.06, '#7d5a38');
    }
    return s;
  }

  /* ---------- Kare görseller (Bölüm 4, 12, 18) ---------- */
  function pickFur(R, variant) {
    var F = R.pick(FURS);
    if (F.black && (variant === 'night' || variant === 'sofa')) F = FURS[1];
    return F;
  }

  function decoys(R, W, H, count) {
    var s = '', i;
    var kinds = ['dog', 'rabbit', 'bird', 'fish', 'obj', 'obj'];
    for (i = 0; i < count; i++) {
      var k = R.pick(kinds);
      var x = R.range(W * 0.25, W * 0.8), y = R.range(H * 0.72, H * 0.95);
      var sc = R.range(0.75, 1.0);
      if (k === 'dog') s += dog({ x: x, y: y, s: sc, flip: R.chance(0.5), col: R.pick(['#b9814f', '#8a6a4a', '#d9b27a', '#4a4a4f']) });
      else if (k === 'rabbit') s += rabbit({ x: x, y: y, s: sc, flip: R.chance(0.5) });
      else if (k === 'bird') s += bird({ x: x, y: y, s: sc, flip: R.chance(0.5), col: R.pick(['#4f9be8', '#e8604f', '#f2c14e', '#5ac18e']) });
      else if (k === 'fish') s += fishbowl({ x: x, y: y, s: sc });
      else s += obj(R.pick(OBJECTS), x, y, R.range(0.9, 1.5), R.pick(['#e86a6a', '#4cc3a3', '#6a8fe8']));
    }
    return s;
  }

  /* kind: 'cat' | 'edge' | 'small' | 'none' */
  function tile(seed, kind) {
    var R = U.makeRand(seed), W = 200, H = 200;
    var variant = R.pick(['room', 'garden', 'sofa', 'night']);
    var inner = bg(R, variant, W, H);
    var F = pickFur(R, variant);
    if (kind === 'cat') {
      inner += cat({ x: R.range(85, 115), y: R.range(172, 188), s: R.range(0.88, 1.05), fur: F, flip: R.chance(0.5) });
      if (R.chance(0.6)) inner += obj(R.pick(OBJECTS), R.pick([22, 178]), 190, 0.8, '#6a8fe8');
    } else if (kind === 'edge') {
      var side = R.pick(['r', 'l', 'b']);
      if (side === 'r') inner += cat({ x: 208, y: R.range(170, 188), s: 1.0, fur: F, flip: true });
      else if (side === 'l') inner += cat({ x: -8, y: R.range(170, 188), s: 1.0, fur: F });
      else inner += cat({ x: R.range(70, 130), y: 262, s: 1.05, fur: F });
      inner += decoys(R, W, H, 1);
    } else if (kind === 'small') {
      inner += decoys(R, W, H, 1);
      inner += cat({ x: R.range(36, 164), y: R.range(128, 160), s: R.range(0.3, 0.4), fur: F, flip: R.chance(0.5) });
    } else {
      inner += decoys(R, W, H, R.int(1, 2));
    }
    return svgDoc(W, H, inner);
  }

  /* ---------- Bölüm 11: gerçek kedi mi, taklit mi? ---------- */
  function realityTile(seed, type) {
    var R = U.makeRand(seed), W = 200, H = 200, inner = '', F;
    if (type === 'real') {
      var v = R.pick(['room', 'sofa', 'garden']);
      F = pickFur(R, v);
      inner = bg(R, v, W, H) + cat({ x: R.range(90, 110), y: 184, s: R.range(0.95, 1.1), fur: F, flip: R.chance(0.5) });
    } else if (type === 'statue') {
      inner = bg(R, 'museum', W, H) + cat({ x: 100, y: 168, s: 0.95, fur: FURS[1], style: 'statue', flip: R.chance(0.5) });
    } else if (type === 'plush') {
      inner = bg(R, 'kids', W, H) + cat({ x: 100, y: 184, s: 1.0, fur: FURS[0], style: 'plush', plush: R.pick(['#ffb3d1', '#b8d4ff', '#ffe08a', '#c9b3ff']) });
    } else if (type === 'ceramic') {
      inner = bg(R, 'shelf', W, H) + cat({ x: 100, y: 170, s: 0.95, fur: FURS[3], style: 'ceramic', flip: R.chance(0.5) });
    } else {
      var v2 = R.pick(['garden', 'room']);
      inner = bg(R, v2, W, H);
      inner += R.chance(0.5) ? dog({ x: 100, y: 184, s: 1.05, flip: R.chance(0.5) }) : rabbit({ x: 100, y: 184, s: 1.0, flip: R.chance(0.5) });
    }
    return svgDoc(W, H, inner);
  }

  /* ---------- Bölüm 2: kalabalık odada küçük kedi ---------- */
  function hiddenCatScene(seed) {
    var R = U.makeRand(seed), W = 900, H = 560, i;
    var inner = bg(R, 'room', W, H);
    var F = R.pick(FURS);
    var cs = R.range(0.5, 0.6);
    var cx = R.range(120, 780), cy = R.range(H * 0.74, H * 0.94);
    // arka plan dağınıklığı
    var items = [];
    for (i = 0; i < 34; i++) {
      var ty = R.range(H * 0.62, H * 0.97);
      items.push({ y: ty, x: R.range(30, W - 30), t: R.pick(OBJECTS.concat(['dog', 'rabbit', 'bird', 'fish', 'plant', 'books'])), s: R.range(0.9, 1.5) * (0.7 + ty / H * 0.5) });
    }
    items.sort(function (a, b) { return a.y - b.y; });
    var catDrawn = false;
    for (i = 0; i < items.length; i++) {
      if (!catDrawn && items[i].y > cy) { inner += cat({ x: cx, y: cy, s: cs, fur: F, flip: R.chance(0.5) }); catDrawn = true; }
      var it = items[i];
      if (it.t === 'dog') inner += dog({ x: it.x, y: it.y, s: it.s * 0.55, flip: R.chance(0.5), col: R.pick(['#b9814f', '#8a6a4a', '#4a4a4f']) });
      else if (it.t === 'rabbit') inner += rabbit({ x: it.x, y: it.y, s: it.s * 0.55, flip: R.chance(0.5) });
      else if (it.t === 'bird') inner += bird({ x: it.x, y: it.y, s: it.s * 0.55, col: R.pick(['#4f9be8', '#e8604f', '#5ac18e']) });
      else if (it.t === 'fish') inner += fishbowl({ x: it.x, y: it.y, s: it.s * 0.6 });
      else inner += obj(it.t, it.x, it.y, it.s, R.pick(['#e86a6a', '#4cc3a3', '#6a8fe8']));
    }
    if (!catDrawn) inner += cat({ x: cx, y: cy, s: cs, fur: F });
    // kedinin yanına yarı örtücü bir bitki
    inner += obj('plant', cx + R.pick([-26, 26]), cy + 4, 1.1);
    return { svg: svgDoc(W, H, inner), w: W, h: H, cat: { x: cx, y: cy - 52 * cs, r: 64 * cs } };
  }

  /* ---------- Bölüm 5: yönü belli olan resim ---------- */
  function puzzleScene(seed) {
    var R = U.makeRand(seed), W = 600, H = 600, i, id = 'ps' + (++uid);
    var F = R.pick(FURS.filter(function (f) { return !f.black; }));
    var s = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb7f0"/><stop offset="1" stop-color="#d9f1ff"/></linearGradient></defs>';
    s += rect(0, 0, W, H, 'url(#' + id + ')');
    s += circ(100, 90, 52, '#ffd84d') + circ(100, 90, 66, 'rgba(255,216,77,.25)');
    s += ell(330, 80, 80, 26, '#fff', { opacity: 0.95 }) + ell(380, 100, 60, 20, '#fff', { opacity: 0.95 });
    s += ell(470, 190, 70, 22, '#fff', { opacity: 0.9 });
    s += path('M 0 330 Q 150 250 320 320 Q 470 380 600 300 L 600 600 L 0 600 Z', '#7ac36a');
    s += path('M 0 420 Q 200 360 380 430 Q 500 470 600 410 L 600 600 L 0 600 Z', '#62ad55');
    // ev
    s += rect(430, 250, 120, 90, '#f2c8a0') + path('M 420 255 L 490 190 L 560 255 Z', '#c0504d') + rect(475, 290, 28, 50, '#7a4a2a') + rect(445, 270, 22, 22, '#bfe6ff');
    // ağaç
    s += rect(60, 270, 18, 80, '#8b5a2b') + circ(69, 250, 50, '#3f9a4e') + circ(40, 275, 30, '#4cae5b') + circ(98, 270, 32, '#4cae5b');
    // kedi
    s += cat({ x: 290, y: 520, s: 2.3, fur: F });
    // fiyonk
    s += path('M 260 372 L 290 384 L 260 396 Z', '#e63946') + path('M 320 372 L 290 384 L 320 396 Z', '#e63946') + circ(290, 384, 7, '#b0232f');
    // çiçekler
    for (i = 0; i < 12; i++) {
      var fx = R.range(20, 580), fy = R.range(500, 585);
      s += line(fx, fy, fx, fy + 18, '#3f8a43', 3) + circ(fx, fy, 8, R.pick(['#ff7aa5', '#ffd34d', '#ffffff', '#c28bff'])) + circ(fx, fy, 3, '#f2a900');
    }
    return svgDoc(W, H, s);
  }

  /* ---------- Bölüm 9: büyük kedi sahnesi ---------- */
  function bigCatScene(seed) {
    var R = U.makeRand(seed), W = 640, H = 640, i;
    var F = R.pick(FURS.filter(function (f) { return !f.black; }));
    var cs = 2.0;
    var cx = R.range(190, 450), cy = R.range(330, 590);
    var flip = R.chance(0.5);
    var base = bg(R, 'garden', W, H);
    // kedi arkasında birkaç çiçek/nesne (kedi sonra çizilir)
    for (i = 0; i < 5; i++) base += obj(R.pick(['plant', 'cactus', 'ball', 'box', 'mug']), R.range(40, 600), R.range(520, 620), R.range(1.2, 2), '#e86a6a');
    var catG = cat({ x: cx, y: cy, s: cs, fur: F, flip: flip });
    var full = svgDoc(W, H, base + catG);
    var only = svgDoc(W, H, catG);
    return { svg: full, catOnly: only, w: W, h: H, cat: { x: cx, y: cy, s: cs, flip: flip } };
  }

  /* Bir SVG'nin alfa maskesini grid×grid hücre başına kaplama oranı olarak hesapla */
  function maskFromSVG(svg, grid, fallback) {
    return new Promise(function (resolve) {
      var done = false;
      function fb() {
        if (done) return;
        done = true;
        resolve(fallback ? fallback() : null);
      }
      try {
        var img = new Image();
        img.onload = function () {
          try {
            var N = 256, cv = document.createElement('canvas');
            cv.width = N; cv.height = N;
            var c = cv.getContext('2d');
            c.drawImage(img, 0, 0, N, N);
            var data = c.getImageData(0, 0, N, N).data;
            var cell = N / grid, out = [], r, q, y, x;
            for (r = 0; r < grid; r++) {
              out.push([]);
              for (q = 0; q < grid; q++) {
                var cnt = 0, tot = 0;
                for (y = Math.floor(r * cell); y < Math.floor((r + 1) * cell); y++) {
                  for (x = Math.floor(q * cell); x < Math.floor((q + 1) * cell); x++) {
                    tot++;
                    if (data[(y * N + x) * 4 + 3] > 40) cnt++;
                  }
                }
                out[r].push(cnt / tot);
              }
            }
            if (!done) { done = true; resolve(out); }
          } catch (e) { fb(); }
        };
        img.onerror = fb;
        img.src = toURL(svg);
      } catch (e) { fb(); }
      setTimeout(fb, 3000);
    });
  }

  /* Kedi kafası ikonu (Bölüm 10, 19 vb.) */
  function catHead(seed, fur) {
    var R = U.makeRand(seed || 1);
    var F = fur || R.pick(FURS.filter(function (f) { return !f.black; }));
    return svgDoc(100, 70, '<svg viewBox="-46 -132 92 70" width="100" height="70">' + cat({ x: 0, y: 0, s: 1, fur: F }) + '</svg>');
  }
  function catFull(seed, fur, flip) {
    var R = U.makeRand(seed || 1);
    var F = fur || R.pick(FURS.filter(function (f) { return !f.black; }));
    return svgDoc(130, 150, '<svg viewBox="-50 -132 130 142" width="130" height="150">' + cat({ x: 0, y: 0, s: 1, fur: F, flip: flip }) + '</svg>');
  }

  WC.art = {
    toURL: toURL, svgDoc: svgDoc, cat: cat, dog: dog, rabbit: rabbit, bird: bird,
    FURS: FURS, tile: tile, realityTile: realityTile, hiddenCatScene: hiddenCatScene,
    puzzleScene: puzzleScene, bigCatScene: bigCatScene, maskFromSVG: maskFromSVG,
    catHead: catHead, catFull: catFull
  };
})();
