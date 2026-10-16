/* levels.html için: bölüm kartlarını ve kilit durumunu çizer */
(function () {
  var WC = window.WC, U = WC.util, h = U.h, S = WC.state;
  S.load();

  function render() {
    var root = document.getElementById('level-list');
    root.innerHTML = '';
    WC.groups.forEach(function (g) {
      var wrap = h('section', { class: 'group' },
        h('h2', null, g.icon + ' Bölüm ' + g.from + '–' + g.to + ': ' + g.name));
      var grid = h('div', { class: 'level-grid' });
      for (var n = g.from; n <= g.to; n++) {
        (function (n) {
          var m = WC.meta[n - 1];
          var open = n <= S.unlocked;
          var card = h(open ? 'a' : 'div', {
            class: 'level-tile' + (open ? '' : ' locked'),
            href: open ? 'index.html?level=' + n : null
          },
            h('span', { class: 'num', text: String(n).padStart(2, '0') }),
            h('span', { class: 'ico', text: open ? m.icon : '🔒' }),
            h('strong', { text: m.title }),
            h('small', { text: m.desc }));
          grid.appendChild(card);
        })(n);
      }
      wrap.appendChild(grid);
      root.appendChild(wrap);
    });
  }

  document.getElementById('unlock-all').addEventListener('click', function () {
    S.unlocked = WC.TOTAL;
    S.save();
    render();
  });
  document.getElementById('reset-all').addEventListener('click', function () {
    if (window.confirm('Tüm ilerleme silinsin mi?')) {
      S.resetAll();
      render();
    }
  });
  render();
})();
