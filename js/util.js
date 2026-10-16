/* Küçük yardımcılar: rastgele sayı, DOM üretici, zamanlayıcı kapsamı */
(function () {
  var WC = (window.WC = window.WC || { levels: {} });

  function makeRand(seed) {
    var a = (seed >>> 0) || 1;
    function next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return {
      next: next,
      range: function (lo, hi) { return lo + next() * (hi - lo); },
      int: function (lo, hi) { return Math.floor(lo + next() * (hi - lo + 1)); },
      pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
      chance: function (p) { return next() < p; },
      shuffle: function (arr) {
        var r = arr.slice();
        for (var i = r.length - 1; i > 0; i--) {
          var j = Math.floor(next() * (i + 1));
          var t = r[i]; r[i] = r[j]; r[j] = t;
        }
        return r;
      }
    };
  }

  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    if (c.nodeType) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  /* Her bölüm için ayrı bir kapsam: bölüm kapanınca zamanlayıcılar ve dinleyiciler temizlenir */
  function scope() {
    var timers = [], intervals = [], rafs = [], listeners = [], disposed = false;
    return {
      get disposed() { return disposed; },
      timeout: function (fn, ms) {
        var id = setTimeout(function () { if (!disposed) fn(); }, ms);
        timers.push(id);
        return id;
      },
      interval: function (fn, ms) {
        var id = setInterval(function () { if (!disposed) fn(); }, ms);
        intervals.push(id);
        return id;
      },
      raf: function (fn) {
        var rec = { id: 0 };
        var loop = function (t) {
          if (disposed) return;
          var r = fn(t);
          if (r !== false) rec.id = requestAnimationFrame(loop);
        };
        rec.id = requestAnimationFrame(loop);
        rafs.push(rec);
        return rec;
      },
      on: function (target, ev, fn, opts) {
        target.addEventListener(ev, fn, opts);
        listeners.push([target, ev, fn, opts]);
      },
      dispose: function () {
        disposed = true;
        timers.forEach(clearTimeout);
        intervals.forEach(clearInterval);
        rafs.forEach(function (r) { cancelAnimationFrame(r.id); });
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        timers = []; intervals = []; rafs = []; listeners = [];
      }
    };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }

  function formatTime(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* Canvas'ı yüksek çözünürlüklü ekranlar için hazırla; mantıksal boyut w×h kalır */
  function setupCanvas(canvas, w, h) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  WC.util = {
    makeRand: makeRand, h: h, scope: scope, clamp: clamp, lerp: lerp,
    dist: dist, formatTime: formatTime, setupCanvas: setupCanvas
  };
})();
