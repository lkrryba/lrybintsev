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
 * The account is lrybintsev.goatcounter.com. The gc.zgo.at script tag at the
 * bottom of each page records the visits; this file only reads the total back
 * out and displays it.
 *
 * One setting this depends on: "Allow adding visitor counts on your website"
 * must be ticked in the GoatCounter site settings. It defaults to off, and
 * while it's off the endpoint below returns 403 and the counter stays hidden.
 */
(function () {
  var SITE_CODE = 'lrybintsev';

  // Don't show the counter until it's a number worth showing. Below this the
  // footer just omits it. Lower or raise it whenever you like.
  var MIN_VISITS = 1000;

  var el = document.querySelector('[data-visit-count]');
  if (!el) return;

  // "TOTAL" is GoatCounter's magic path for the whole site rather than one page.
  var url = 'https://' + SITE_CODE + '.goatcounter.com/counter/TOTAL.json';

  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('counter unavailable: ' + res.status);
      return res.json();
    })
    .then(function (data) {
      // GoatCounter returns the count pre-formatted with thousands separators,
      // as a string: "0", "1,234". Note "0" is truthy, so it has to be parsed
      // rather than just checked for emptiness.
      var count = data && data.count;
      if (!count) return;

      var n = parseInt(String(count).replace(/[^0-9]/g, ''), 10);
      if (!n || n < MIN_VISITS) return;

      el.querySelector('[data-visit-count-value]').textContent = count;
      el.hidden = false;
    })
    .catch(function () {
      // Counter is decoration. If it fails, leave it hidden and say nothing.
    });
})();
