/* usage-tracker.js — Navratri 2026 dashboard usage beacon.
 * Add ONE line to index.html, just before </body> (after the main script):
 *   <script src="usage-tracker.js"></script>
 * It reuses WEB_APP_URL from the dashboard. Logs one "open" per page load,
 * one "engaged" if the page stays open and visible for 60 seconds.
 * Opt out on your own devices: open the dashboard once with ?notrack=1
 * Track a custom action anywhere: nvTrack('venue_mode') or nvTrack('panel', 'leaderboard')
 */
(function () {
  // Only needed if the dashboard keeps WEB_APP_URL inside a function/module:
  var FALLBACK_URL = '';
  var url = (typeof WEB_APP_URL !== 'undefined' && WEB_APP_URL) || FALLBACK_URL;
  var qs = new URLSearchParams(location.search);
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  if (qs.get('notrack') === '1') store.set('nv26_notrack', '1');
  if (qs.get('notrack') === '0') store.set('nv26_notrack', '');
  var off = !url || store.get('nv26_notrack') === '1';

  function rid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  var vid = store.get('nv26_vid') || rid(); store.set('nv26_vid', vid);
  var sid = rid();

  var src = qs.get('src');
  if (!src && document.referrer) {
    try { src = new URL(document.referrer).hostname.replace(/^www\./, ''); } catch (e) {}
  }
  src = src || 'direct';
  var dev = /iPad|Tablet/i.test(navigator.userAgent) ? 'tablet'
          : /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile'
          : (screen.width >= 1600 ? 'large screen' : 'desktop');

  function send(ev, detail) {
    if (off) return;
    var p = new URLSearchParams({ view: 'ping', ev: ev, vid: vid, sid: sid,
                                  src: src, dev: dev, d: detail || '', t: Date.now() });
    new Image().src = url + (url.indexOf('?') < 0 ? '?' : '&') + p.toString();
  }
  window.nvTrack = send;

  send('open', location.pathname);
  var shown = 0, timer = setInterval(function () {
    if (!document.hidden) shown += 5;
    if (shown >= 60) { send('engaged', '60s'); clearInterval(timer); }
  }, 5000);
})();
