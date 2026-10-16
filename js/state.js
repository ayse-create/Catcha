/* Oyun durumu: ilerleme, hata sayısı, süre. localStorage kullanılamazsa bellekte çalışır. */
(function () {
  var WC = (window.WC = window.WC || { levels: {} });
  var KEY = 'wc_save_v1';
  var DRAW_KEY = 'wc_draw_v1';

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* yoksay */ }
  }

  var S = {
    level: 1,
    unlocked: 1,
    mistakes: 0,
    ms: 0,
    best: null,
    drawing: null,
    running: false,

    load: function () {
      var s = read(KEY);
      if (s) {
        S.level = s.level || 1;
        S.unlocked = s.unlocked || 1;
        S.mistakes = s.mistakes || 0;
        S.ms = s.ms || 0;
        S.best = s.best || null;
      }
      var d = read(DRAW_KEY);
      if (typeof d === 'string') S.drawing = d;
    },
    save: function () {
      write(KEY, { level: S.level, unlocked: S.unlocked, mistakes: S.mistakes, ms: S.ms, best: S.best });
    },
    unlock: function (n) {
      if (n > S.unlocked && n <= WC.TOTAL) S.unlocked = n;
      S.save();
    },
    setDrawing: function (url) {
      S.drawing = url;
      write(DRAW_KEY, url);
    },
    newRun: function () {
      S.level = 1;
      S.mistakes = 0;
      S.ms = 0;
      S.save();
    },
    finish: function () {
      var rec = { ms: S.ms, mistakes: S.mistakes };
      var isBest = !S.best || rec.mistakes < S.best.mistakes ||
        (rec.mistakes === S.best.mistakes && rec.ms < S.best.ms);
      if (isBest) S.best = rec;
      S.unlocked = WC.TOTAL;
      S.save();
      return isBest;
    },
    rank: function () {
      var m = S.mistakes;
      if (m <= 5) return { name: 'Efsanevi Kedi Fısıldayıcısı', emoji: '👑' };
      if (m <= 15) return { name: 'Usta Tekir', emoji: '😼' };
      if (m <= 30) return { name: 'Meraklı Yavru Kedi', emoji: '🐱' };
      return { name: 'Dikkatsiz Ama Azimli Kedi', emoji: '🙀' };
    },
    resetAll: function () {
      S.level = 1; S.unlocked = 1; S.mistakes = 0; S.ms = 0; S.best = null;
      S.save();
    }
  };

  WC.state = S;
})();
