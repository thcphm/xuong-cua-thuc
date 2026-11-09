/* Nút Ủng hộ tôi ở sảnh chính. */
(function () {
  'use strict';
  document.getElementById('donateBtn').addEventListener('click', function () {
    var overlay = document.createElement('div');
    overlay.className = 'gate';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Ủng hộ tôi');
    var card = document.createElement('div');
    card.className = 'gate-card donate-card';
    var title = document.createElement('h1');
    title.textContent = 'Ủng hộ tôi';
    var text = document.createElement('p');
    text.className = 'gate-sub';
    text.textContent = 'Nếu bạn thấy Xưởng hay, hãy ủng hộ tôi để tôi có động lực phát triển tiếp.';
    var img = document.createElement('img');
    img.src = 'assets/donate_qr.png';
    img.alt = 'Mã QR chuyển khoản ủng hộ';
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'gate-guest';
    close.textContent = 'Đóng';
    function shut() { overlay.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') shut(); }
    close.addEventListener('click', shut);
    overlay.addEventListener('pointerdown', function (e) { if (e.target === overlay) shut(); });
    document.addEventListener('keydown', onKey);
    card.append(title, text, img, close);
    overlay.append(card);
    document.body.append(overlay);
    close.focus();
  });
})();
