/* Bölüm 13 ve 16 (14 ve 15 sürüş bölümleri drive-levels.js içinde) */
(function () {
  var WC = window.WC, U = WC.util, h = U.h;

  /* ---------- Bölüm 13: Find the Correct Checkbox ---------- */
  var DECOYS = [
    "I'm not a robot", "I'm not a dog", "I'm not a bird", "I'm not a cot", "I'm not a cut",
    "I am not a cat", "I'm not a rat", "I'm not a bat", "I'm a cat", "I'm not a car",
    "I'm not a fish", "I'm not a cow", "I'm not a hat", "I'm not a human", "I'm not a cap",
    "I'm not a mat", "I'm not a fox", "I'm not a pig", "I'm not a cab", "I'm not a can",
    "Not a cat, I'm", "I'm not a duck"
  ];
  var CORRECT = "I'm not a cat";

  WC.levels[13] = {
    title: 'Find the Correct Checkbox',
    mount: function (root, api) {
      api.setPrompt('Check the box that says exactly <span class="hl">"I\'m not a cat"</span>', 'Kutular çok benziyor. Aşağı kaydır; yanlış tıklarsan liste karışır.');
      var R = api.rand;
      var list = h('div', { class: 'cb-list', role: 'group' });
      var checked = null;
      var verify = h('button', { class: 'btn primary', text: 'Verify' });
      var note = h('span', { class: 'note', text: 'Listede ' + (DECOYS.length + 1) + ' kutu var.' });

      function build() {
        list.innerHTML = '';
        checked = null;
        var labels = R.shuffle(DECOYS.concat([CORRECT]));
        labels.forEach(function (label) {
          var box = h('span', { class: 'cb-box small' }, h('span', { class: 'cb-mark', text: '✓' }));
          var row = h('button', { class: 'cb-row', type: 'button', role: 'checkbox', 'aria-checked': 'false' }, box, h('span', { class: 'cb-label small', text: label }));
          row.addEventListener('click', function () {
            WC.sound.click();
            if (label === CORRECT) {
              Array.prototype.forEach.call(list.children, function (c) { c.classList.remove('checked'); c.setAttribute('aria-checked', 'false'); });
              row.classList.add('checked');
              row.setAttribute('aria-checked', 'true');
              checked = label;
            } else {
              row.classList.add('checked');
              api.mistake('Bu doğru kutu değil. Liste karıştı!');
              api.scope.timeout(build, 350);
            }
          });
          list.appendChild(row);
        });
      }
      build();

      verify.addEventListener('click', function () {
        if (checked === CORRECT) api.success();
        else api.toast('Önce "I\'m not a cat" kutusunu işaretle', 'bad');
      });

      root.appendChild(list);
      root.appendChild(h('div', { class: 'actions' }, note, verify));
    }
  };

  /* ---------- Bölüm 16: Chaotic Text ---------- */
  WC.levels[16] = {
    title: 'Chaotic Text',
    mount: function (root, api) {
      api.setPrompt('Type the <span class="hl">chaotic letters</span>', 'Bu sefer her şey aynı anda oynuyor. Harfler yine de okunabilir.');
      var text = WC.randomText(api.rand, 6);
      var canvas = h('canvas', { class: 'cap-canvas', 'aria-label': 'Kaotik harfler' });
      var input = h('input', { class: 'text-input', type: 'text', maxlength: '6', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: '· · · · · ·' });
      var verify = h('button', { class: 'btn primary', text: 'Verify' });
      WC.textCaptcha(canvas, text, 'chaotic', api.scope, api.rand);

      function check() {
        if (input.value.trim().toUpperCase() === text) api.success();
        else api.fail('Yanlış harfler. Yeni karmaşa geliyor.');
      }
      verify.addEventListener('click', check);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
      root.appendChild(canvas);
      root.appendChild(h('div', { class: 'stack' }, input));
      root.appendChild(h('div', { class: 'actions' }, h('span', { class: 'note', text: '6 karakter. O, I, 0, 1 gibi benzerler kullanılmıyor.' }), verify));
      api.scope.timeout(function () { try { input.focus(); } catch (e) { /* yoksay */ } }, 100);
    }
  };
})();
