/* Bölüm listesi: başlık, kısa açıklama, grup */
(function () {
  var WC = (window.WC = window.WC || { levels: {} });

  WC.groups = [
    { from: 1, to: 4, name: "Klasik CAPTCHA", icon: "🐈" },
    { from: 5, to: 8, name: "CAPTCHA'dan zekâ oyunlarına", icon: "🧩" },
    { from: 9, to: 12, name: "Görsel algı ve refleks", icon: "🐾" },
    { from: 13, to: 16, name: "CAPTCHA kâbusu", icon: "💀" },
    { from: 17, to: 20, name: "Algı sınavı", icon: "🔍" },
    { from: 21, to: 24, name: "Final aşamaları", icon: "🎨" }
  ];

  WC.meta = [
    { n: 1, title: "I'm not a cat", desc: "Onay kutusu", icon: "☑️" },
    { n: 2, title: "Find the cat", desc: "Tek görselde kedi bulma", icon: "🔎" },
    { n: 3, title: "Moving Letters", desc: "Hareketli CAPTCHA metni", icon: "🔤" },
    { n: 4, title: "Select the cat pictures", desc: "Çoklu görsel seçimi", icon: "🖼️" },
    { n: 5, title: "Rotate the Image", desc: "Görsel parçalarını döndürme", icon: "🔄" },
    { n: 6, title: "Cat Tic-Tac-Toe", desc: "XOX strateji oyunu", icon: "❌" },
    { n: 7, title: "Word Search", desc: "Gizli kelimeleri bulma", icon: "🔠" },
    { n: 8, title: "Cat License Plate", desc: "Plaka okuma", icon: "🚗" },
    { n: 9, title: "Tiny Cat Pieces", desc: "Görseli küçük bölgelere ayırma", icon: "🧱" },
    { n: 10, title: "Cat Whack-a-Mole", desc: "Beş kedi yakalama", icon: "🔨" },
    { n: 11, title: "Real Cat or Not?", desc: "Gerçek kediyi nesneden ayırma", icon: "🗿" },
    { n: 12, title: "WITHOUT", desc: "Kedisiz kareleri seçme", icon: "🚫" },
    { n: 13, title: "Find the Correct Checkbox", desc: "Doğru kutuyu bulma", icon: "✅" },
    { n: 14, title: "Vertical Parking", desc: "Dikey park", icon: "🅿️" },
    { n: 15, title: "Vertical Parking in Traffic", desc: "Trafikte dikey park", icon: "🚦" },
    { n: 16, title: "Chaotic Text", desc: "Bozulmuş metni çözme", icon: "🌀" },
    { n: 17, title: "Find the 93% Circle", desc: "Doluluk oranını ayırt etme", icon: "🥧" },
    { n: 18, title: "Endless Cat Squares", desc: "Bitmeyen görsel ızgarası", icon: "♾️" },
    { n: 19, title: "Catch the Escaping Cats", desc: "Kaçan kedileri yakalama", icon: "🏃" },
    { n: 20, title: "Eye Test", desc: "Görsel ayrıntı testi", icon: "👁️" },
    { n: 21, title: "Draw Yourself", desc: "Çizim görevi", icon: "✏️" },
    { n: 22, title: "Horizontal Parking", desc: "Paralel park", icon: "↔️" },
    { n: 23, title: "Horizontal Parking in Traffic", desc: "Trafikte paralel park", icon: "🚕" },
    { n: 24, title: "Final Traffic Course", desc: "Final sürüş parkuru", icon: "🏁" }
  ];

  WC.TOTAL = 24;
})();
