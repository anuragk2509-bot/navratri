/* usage-tracker.js — Navratri 2026 dashboard usage beacon (v2)
 *
 * SETUP: paste your Apps Script /exec URL below (the same one the dashboard uses).
 * Include once in index.html, just before </body>:
 *   <script src="usage-tracker.js?v=2"></script>
 *
 * What counts as a visit:
 *   - every page load or refresh
 *   - coming back to an already-open tab after 30+ minutes away
 * Each browser/Chrome profile is one user; every visit is one row in "Usage Log".
 *
 * Check it works: open the dashboard with ?trackdebug=1 — a small badge confirms each logged visit.
 * Exclude your own device: open once with ?notrack=1 (undo with ?notrack=0).
 * Custom actions: nvTrack('venue_mode')
 */
(function () {
  var TRACK_URL = 'https://script.google.com/macros/s/AKfycbznidnEFfz1rEoDmekOrC_i8bl7PzlsL7uIhfycDaL9jPy50499omxzyMZ8KQB8FH0k/exec';
  var NEW_VISIT_AFTER_MIN = 30;

  var url = (TRACK_URL && TRACK_URL.indexOf('PASTE') !== 0) ? TRACK_URL
          : (typeof WEB_APP_URL !== 'undefined' && WEB_APP_URL) || '';
  var qs = new URLSearchParams(location.search);
  var debug = qs.get('trackdebug') === '1';
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  if (qs.get('notrack') === '1') store.set('nv26_notrack', '1');
  if (qs.get('notrack') === '0') store.set('nv26_notrack', '');
  var optedOut = store.get('nv26_notrack') === '1';

  function rid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  var vid = store.get('nv26_vid') || rid(); store.set('nv26_vid', vid);
  var sid = rid();

  var src = qs.get('src');
  if (!src && document.referrer) {
    try { var h = new URL(document.referrer).hostname.replace(/^www\./, ''); if (h !== location.hostname) src = h; } catch (e) {}
  }
  src = src || 'direct';
  var ua = navigator.userAgent;
  var dev = /iPad|Tablet/i.test(ua) ? 'tablet'
          : /Mobi|Android|iPhone/i.test(ua) ? 'mobile'
          : (screen.width >= 1600 ? 'large screen' : 'desktop');

  function badge(text, ok) {
    if (!debug) return;
    var b = document.getElementById('nvTrackBadge');
    if (!b) {
      b = document.createElement('div'); b.id = 'nvTrackBadge';
      b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;padding:8px 12px;border-radius:8px;font:600 13px sans-serif;color:#fff;max-width:90vw';
      document.body.appendChild(b);
    }
    b.style.background = ok ? '#2E8B57' : '#C2283A';
    b.textContent = text;
  }

  function send(ev, detail) {
    if (!url) { badge('Tracker: TRACK_URL is not set in usage-tracker.js', false); return; }
    if (optedOut) { badge('Tracker: this device is opted out (open with ?notrack=0 to undo)', false); return; }
    // Sent exactly the way the dashboard loads its data (a script tag), so if the
    // dashboard numbers load for someone, their visit gets logged too.
    var cb = 'nvTrackCb_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
    var s = document.createElement('script');
    var timer = setTimeout(function () { cleanup(); badge('Tracker: no reply from the web app for "' + ev + '"', false); }, 15000);
    function cleanup() { clearTimeout(timer); try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }
    window[cb] = function (r) {
      cleanup();
      if (r && r.ok) badge('Tracker: "' + ev + '" saved to row ' + r.row + ' ✓', true);
      else if (r && r.error) badge('Tracker error: ' + r.error, false);
      else badge('Tracker: web app answered without saving (ping lines not reached in doGet)', false);
    };
    s.onerror = function () { cleanup(); badge('Tracker: could not reach the web app', false); };
    s.src = url + (url.indexOf('?') < 0 ? '?' : '&') + new URLSearchParams({
      view: 'ping', ev: ev, vid: vid, sid: sid, src: src, dev: dev, d: detail || '', callback: cb, t: Date.now()
    }).toString();
    (document.head || document.documentElement).appendChild(s);
  }
  window.nvTrack = send;

  function startVisit() {
    sid = rid();
    send('open', location.pathname);
    var shown = 0, timer = setInterval(function () {
      if (!document.hidden) shown += 5;
      if (shown >= 60) { send('engaged', '60s'); clearInterval(timer); }
    }, 5000);
  }

  var hiddenAt = 0;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt >= NEW_VISIT_AFTER_MIN * 60000) startVisit();
    hiddenAt = 0;
  });

  if (document.body) startVisit(); else document.addEventListener('DOMContentLoaded', startVisit);
})();
