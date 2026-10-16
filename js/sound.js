/* Küçük WebAudio efektleri (dosya gerektirmez). Sessize alınabilir. */
(function () {
  var WC = (window.WC = window.WC || { levels: {} });
  var ctx = null;
  var muted = false;
  try { muted = localStorage.getItem('wc_muted') === '1'; } catch (e) { /* yoksay */ }

  function audio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; }
    return ctx;
  }

  function tone(freq, dur, type, vol, delay, slideTo) {
    if (muted) return;
    var a = audio();
    if (!a) return;
    try {
      if (a.state === 'suspended') a.resume();
      var t0 = a.currentTime + (delay || 0);
      var o = a.createOscillator();
      var g = a.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(a.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    } catch (e) { /* yoksay */ }
  }

  WC.sound = {
    click: function () { tone(520, 0.06, 'triangle', 0.05); },
    pop: function () { tone(700, 0.08, 'sine', 0.07, 0, 1000); },
    ok: function () { tone(523, 0.12, 'triangle', 0.08); tone(659, 0.12, 'triangle', 0.08, 0.1); tone(784, 0.2, 'triangle', 0.08, 0.2); },
    fail: function () { tone(220, 0.25, 'sawtooth', 0.06, 0, 110); },
    meow: function () { tone(520, 0.28, 'sine', 0.07, 0, 880); tone(880, 0.2, 'sine', 0.05, 0.22, 500); },
    isMuted: function () { return muted; },
    toggle: function () {
      muted = !muted;
      try { localStorage.setItem('wc_muted', muted ? '1' : '0'); } catch (e) { /* yoksay */ }
      return muted;
    }
  };
})();
