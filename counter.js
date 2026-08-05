/*
 * counter.js
 * ----------
 * Fills in the footer visit counter on every page.
 *
 * A static site can't count its own visitors, so the number comes from
 * GoatCounter's public counter endpoint. GoatCounter is free for personal use,
 * cookie-free, and doesn't collect personal data, so it needs no consent
 * banner.
 *
 * SETUP (one-off, ~2 minutes):
 *   1. Sign up at https://www.goatcounter.com — pick a site code, e.g. "lrybintsev".
 *   2. In Settings, tick "Allow adding visitor counts to your website".
 *      Without this the endpoint below returns 403 and the counter stays hidden.
 *   3. Put your code in SITE_CODE below.
 *   4. In index.html and cv-reviews.html, swap YOUR-CODE in the gc.zgo.at
 *      script tag for the same code. That tag is what records the visits;
 *      this file only displays the total.
 *
 * Until SITE_CODE is filled in, the counter hides itself rather than showing a
 * broken or made-up number.
 */
(function () {
  var SITE_CODE = 'YOUR-CODE';

  var el = document.querySelector('[data-visit-count]');
  if (!el || SITE_CODE === 'YOUR-CODE') return;

  // "TOTAL" is GoatCounter's magic path for the whole site rather than one page.
  var url = 'https://' + SITE_CODE + '.goatcounter.com/counter/TOTAL.json';

  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('counter unavailable: ' + res.status);
      return res.json();
    })
    .then(function (data) {
      // GoatCounter returns the count pre-formatted with thousands separators.
      var count = data && data.count;
      if (!count) return;
      el.querySelector('[data-visit-count-value]').textContent = count;
      el.hidden = false;
    })
    .catch(function () {
      // Counter is decoration. If it fails, leave it hidden and say nothing.
    });
})();
