/* Navratri 2026 add-on: Spotlight tab + flash, Feedback tab, nomination link.
 * Self-contained: adds its own styles and elements, and never touches the
 * existing dashboard code. If the add-on's web app is unreachable, it simply
 * shows nothing and the rest of the dashboard keeps working.
 *
 * In index.html, just before </body>:
 *   <script>window.ENGAGE_CONFIG = { url: "PASTE_ENGAGE_EXEC_URL" };</script>
 *   <script src="engage.js"></script>
 * Venue screen: open the dashboard with ?venue=1 to cycle through spotlights.
 */
(function () {
  "use strict";
  var CFG = window.ENGAGE_CONFIG || {};
  if (!CFG.url || CFG.url.indexOf("PASTE_") === 0) return;
  var POLL_MS = (CFG.pollSeconds || 45) * 1000;
  var SHOW_MS = (CFG.spotlightSeconds || 15) * 1000;
  var VENUE = /[?&]venue=1/.test(location.search);
  var CYCLE_MS = (CFG.venueCycleSeconds || 40) * 1000;
  var SITE = CFG.siteUrl || location.origin + location.pathname;

  /* ---------- styles ---------- */
  var css = "" +
  ".eg-wrap{--eg-n:#1B1446;--eg-m:#F2A007;--eg-k:#C8102E;--eg-g:#D6337F;--eg-i:#FFF6E0;--eg-mu:#C4B8DE;--eg-t:#3a2d78}" +
  ".eg-over{position:fixed;inset:0;z-index:9999;background:rgba(10,6,30,.82);display:none;align-items:center;justify-content:center;padding:16px}" +
  ".eg-over.eg-open{display:flex}" +
  ".eg-card{position:relative;width:min(92vw,560px);max-height:94vh;overflow:auto;background:var(--eg-n);border-radius:20px;border:6px dotted var(--eg-m);padding:18px;text-align:center;color:var(--eg-i)}" +
  ".eg-venue .eg-card{width:min(80vw,900px)}" +
  ".eg-tag{font:italic 600 18px Georgia,serif;color:var(--eg-m);margin-bottom:10px}" +
  ".eg-card img{width:100%;max-height:58vh;object-fit:cover;border-radius:12px;background:#241a5c}" +
  ".eg-card h2{font:700 30px/1.2 Georgia,serif;color:var(--eg-m);margin:14px 0 6px}" +
  ".eg-venue .eg-card h2{font-size:48px}" +
  ".eg-card p{margin:0;font-size:19px}.eg-venue .eg-card p{font-size:28px}" +
  ".eg-acts{display:flex;justify-content:center;gap:10px;margin-top:16px;flex-wrap:wrap}" +
  ".eg-acts button{border:1px solid var(--eg-m);background:none;color:var(--eg-m);border-radius:999px;padding:9px 14px;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer}" +
  ".eg-x{position:absolute;top:8px;right:12px;background:none;border:0;color:var(--eg-i);font-size:28px;cursor:pointer}" +
  ".eg-timer{height:4px;background:var(--eg-m);border-radius:2px;margin-top:14px;transform-origin:left}" +
  ".eg-tabpane{max-width:1100px;margin:0 auto;padding:8px 0 40px}" +
  ".eg-spgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}" +
  ".eg-sp{display:flex;flex-direction:column;text-align:left;padding:0;border:1px solid rgba(242,160,7,.3);border-radius:14px;overflow:hidden;background:rgba(255,255,255,.05);color:var(--eg-i);font-family:inherit;cursor:pointer}" +
  ".eg-sp img{width:100%;aspect-ratio:4/5;object-fit:cover;background:#241a5c;display:block}" +
  ".eg-spname{display:block;padding:10px 12px 2px;font:700 16px/1.3 Georgia,serif;color:var(--eg-m)}" +
  ".eg-spmsg{display:block;padding:0 12px 12px;font-size:14px;line-height:1.4}" +
  ".eg-nomcta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin:0 0 18px;padding:16px 18px;border-radius:14px;background:rgba(242,160,7,.12);border:1px solid rgba(242,160,7,.45);color:var(--eg-i)}" +
  ".eg-nomcta strong{display:block;font:italic 600 20px/1.25 Georgia,serif;color:var(--eg-m)}" +
  ".eg-nomcta span{display:block;color:var(--eg-mu);font-size:14px;margin-top:2px}" +
  ".eg-fbhead{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin:8px 0 18px}" +
  ".eg-fbhead h2{font:italic 600 26px/1.2 Georgia,serif;color:var(--eg-m);margin:0}" +
  ".eg-fbhead p{margin:4px 0 0;color:var(--eg-mu);font-size:14px}" +
  ".eg-write{display:inline-block;background:var(--eg-m);color:var(--eg-n);border-radius:999px;padding:12px 18px;font-weight:700;text-decoration:none}" +
  ".eg-fbgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}" +
  ".eg-fb{background:rgba(255,255,255,.05);border:1px solid rgba(242,160,7,.25);border-radius:14px;padding:16px;color:var(--eg-i)}" +
  ".eg-stars{color:var(--eg-m);letter-spacing:2px;font-size:16px}" +
  ".eg-fb q{display:block;margin:8px 0 0;font-size:16px;line-height:1.45}" +
  ".eg-fb q.eg-better{color:var(--eg-mu);font-size:15px}" +
  ".eg-fb .eg-lbl{display:block;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--eg-mu);margin-top:10px}" +
  ".eg-fb .eg-who{margin-top:12px;color:var(--eg-mu);font-size:14px}" +
  ".eg-empty{color:var(--eg-mu);padding:24px 0}" +
  ".eg-wrap a:focus-visible,.eg-wrap button:focus-visible{outline:2px solid var(--eg-m);outline-offset:2px}" +
  ".eg-card.eg-in{animation:eg-pop .5s ease-out}" +
  "@keyframes eg-pop{from{transform:scale(.85);opacity:0}to{transform:none;opacity:1}}" +
  "@media (prefers-reduced-motion:reduce){.eg-card.eg-in{animation:none}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
    function wa(text) { window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener"); }
  var seen = {};
  try { seen = JSON.parse(localStorage.getItem("eg-seen") || "{}"); } catch (e) { seen = {}; }
  function markSeen(id) { seen[id] = 1; try { localStorage.setItem("eg-seen", JSON.stringify(seen)); } catch (e) {} }

  var n = 0;
  function jsonp(url, cb) {
    var name = "__egcb" + (++n) + "_" + Date.now(), s = document.createElement("script"), done = false;
    var t = setTimeout(function () { finish(new Error("timeout")); }, 15000);
    function finish(err, data) { if (done) return; done = true; clearTimeout(t); try { delete window[name]; } catch (e) { window[name] = undefined; } s.remove(); cb(err, data); }
    window[name] = function (d) { finish(null, d); };
    s.onerror = function () { finish(new Error("network")); };
    s.src = url + (url.indexOf("?") > -1 ? "&" : "?") + "view=engage&callback=" + name;
    document.body.appendChild(s);
  }

  /* ---------- elements ---------- */
  var wrap = el("div", "eg-wrap" + (VENUE ? " eg-venue" : ""));
  document.body.appendChild(wrap);


  var over = el("div", "eg-over");
  over.setAttribute("role", "dialog"); over.setAttribute("aria-modal", "true"); over.setAttribute("aria-label", "Spotlight");
  wrap.appendChild(over);
  over.addEventListener("click", function (e) { if (e.target === over) closeSpot(); });
  document.addEventListener("keydown", function (e) {
    if (!over.classList.contains("eg-open")) return;
    if (e.key === "Escape") closeSpot();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });


  /* ---------- spotlight ---------- */
  var spots = [], cur = 0, hideT = null, lastFocus = null;

  function showSpot(i, auto) {
    if (!spots.length) return;
    cur = (i + spots.length) % spots.length;
    var s = spots[cur];
    markSeen(s.id);
    if (!over.classList.contains("eg-open")) lastFocus = document.activeElement;
    over.innerHTML = "";
    var card = el("div", "eg-card eg-in",
      '<button class="eg-x" type="button" aria-label="Close">&times;</button>' +
      '<div class="eg-tag">Spotlight of the night</div>' +
      '<img alt="' + esc(s.name) + '" src="' + esc(s.img) + '">' +
      "<h2>" + esc(s.name) + "</h2><p>" + esc(s.message) + "</p>" +
      (VENUE ? "" : '<div class="eg-acts">' +
        (spots.length > 1 ? '<button type="button" data-a="prev">Previous</button>' : "") +
        '<button type="button" data-a="share">Share this</button>' +
        (spots.length > 1 ? '<button type="button" data-a="next">Next</button>' : "") + "</div>") +
      (auto ? '<div class="eg-timer"></div>' : ""));
    over.appendChild(card);
    over.classList.add("eg-open");
    card.querySelector(".eg-x").onclick = closeSpot;
    var img = card.querySelector("img");
    img.onerror = function () { img.style.display = "none"; };
    card.querySelectorAll("[data-a]").forEach(function (b) {
      b.onclick = function () {
        var a = b.getAttribute("data-a");
        if (a === "prev") step(-1); else if (a === "next") step(1);
        else wa("\u2728 " + s.name + " is in the spotlight at Sensorium Navratri Utsav 2026: \"" + s.message + "\"\nSee it on the dashboard: " + SITE);
      };
    });
    clearTimeout(hideT);
    if (auto) {
      var bar = card.querySelector(".eg-timer");
      if (bar && bar.animate && !matchMedia("(prefers-reduced-motion: reduce)").matches)
        bar.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: SHOW_MS, fill: "forwards" });
      hideT = setTimeout(closeSpot, SHOW_MS);
    } else {
      card.querySelector(".eg-x").focus();
    }
  }
  function step(d) { showSpot(cur + d, false); }
  function closeSpot() {
    clearTimeout(hideT); over.classList.remove("eg-open"); over.innerHTML = "";
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  function updateSpots(list) {
    spots = (list || []).filter(function (s) { return s && s.id && s.img; });
    if (!spots.length || over.classList.contains("eg-open")) return;
    var fresh = -1;
    for (var i = 0; i < spots.length; i++) if (!seen[spots[i].id]) { fresh = i; break; }
    if (fresh > -1) {
      for (var j = fresh + 1; j < spots.length; j++) markSeen(spots[j].id); // older ones don't queue up
      showSpot(fresh, true);
    }
  }

  if (VENUE) {
    var vi = 0;
    setInterval(function () {
      if (!spots.length || over.classList.contains("eg-open")) return;
      showSpot(vi++ % spots.length, true);
    }, CYCLE_MS);
  }

  /* ---------- extra tabs (Spotlight, Feedback) ---------- */
  // Adds tabs next to the existing ones without changing their code.
  // If the tab bar can't be found, the sections are shown at the bottom instead.
  var ctx = null, ours = [];
  function initTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-tab][aria-controls]"));
    var panes = Array.prototype.slice.call(document.querySelectorAll(".pane"));
    if (!tabs.length || !panes.length) return null;
    var activeBtn = tabs.filter(function (b) { return b.getAttribute("aria-selected") === "true"; })[0];
    var other = tabs.filter(function (b) { return b !== activeBtn; })[0];
    var activeCls = activeBtn && other ? Array.prototype.filter.call(activeBtn.classList, function (c) { return !other.classList.contains(c); }) : [];
    var c = { tabs: tabs, panes: panes, activeCls: activeCls, afterBtn: tabs[tabs.length - 1], afterPane: panes[panes.length - 1] };
    tabs.forEach(function (b) { b.addEventListener("click", leaveOurs); });
    // If the dashboard switches tabs by itself (e.g. Venue TV mode), step aside.
    if (window.MutationObserver) {
      var mo = new MutationObserver(function (muts) {
        if (!ours.some(function (o) { return !o.pane.hidden; })) return;
        for (var i = 0; i < muts.length; i++) {
          var t = muts[i].target;
          if (!t.hidden && getComputedStyle(t).display !== "none") { leaveOurs(); break; }
        }
      });
      panes.forEach(function (p) { mo.observe(p, { attributes: true, attributeFilter: ["hidden", "style", "class"] }); });
    }
    return c;
  }
  function select(btn, on) {
    btn.setAttribute("aria-selected", on ? "true" : "false");
    ctx.activeCls.forEach(function (c) { btn.classList.toggle(c, on); });
  }
  function leaveOurs() { ours.forEach(function (o) { o.pane.hidden = true; select(o.btn, false); }); }
  function addTab(key, label, paneClass) {
    var pane = el("div", "eg-wrap " + paneClass);
    pane.id = "pane-eg-" + key;
    if (!ctx) { document.body.appendChild(pane); return pane; }
    var btn = ctx.afterBtn.cloneNode(false);
    btn.id = "tab-eg-" + key;
    btn.setAttribute("data-tab", "eg-" + key);
    btn.setAttribute("aria-controls", pane.id);
    btn.textContent = label;
    ctx.afterBtn.parentNode.insertBefore(btn, ctx.afterBtn.nextSibling);
    ctx.afterBtn = btn;
    pane.classList.add("pane");
    pane.setAttribute("role", "tabpanel");
    pane.setAttribute("aria-labelledby", btn.id);
    pane.hidden = true;
    ctx.afterPane.parentNode.insertBefore(pane, ctx.afterPane.nextSibling);
    ctx.afterPane = pane;
    var me = { btn: btn, pane: pane };
    ours.push(me);
    select(btn, false);
    btn.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      Array.prototype.forEach.call(document.querySelectorAll(".pane"), function (p) { p.hidden = p !== pane; });
      ctx.tabs.forEach(function (b) { select(b, false); });
      ours.forEach(function (o) { select(o.btn, o === me); });
      pane.hidden = false;
    });
    return pane;
  }
  ctx = initTabs();
  var spPane = addTab("spotlight", "Spotlight", "eg-tabpane");
  var fbPane = addTab("feedback", "Feedback", "eg-tabpane");

  /* ---------- Spotlight tab ---------- */
  var lastSpotKey = null;
  function renderSpotTab() {
    var key = spots.map(function (s) { return s.id; }).join(",");
    if (key === lastSpotKey) return;   // unchanged: don't rebuild (avoids image flicker)
    lastSpotKey = key;
    var html = '<div class="eg-fbhead"><div><h2>Stars of Sensorium</h2><p>Moments of appreciation from the venue. Tap a photo to see it full size.</p></div></div>';
    if (!spots.length) {
      html += '<div class="eg-empty">Spotlights from the venue will appear here once the festival begins.</div>';
    } else {
      html += '<div class="eg-spgrid">' + spots.map(function (s, i) {
        return '<button type="button" class="eg-sp" data-i="' + i + '"><img alt="" loading="lazy" src="' + esc(s.img) + '">' +
          '<span class="eg-spname">' + esc(s.name) + '</span><span class="eg-spmsg">' + esc(s.message) + "</span></button>";
      }).join("") + "</div>";
    }
    spPane.innerHTML = html;
    Array.prototype.forEach.call(spPane.querySelectorAll(".eg-sp"), function (b) {
      b.onclick = function () { showSpot(+b.getAttribute("data-i"), false); };
      var im = b.querySelector("img"); im.onerror = function () { im.style.visibility = "hidden"; };
    });
  }

  /* ---------- Feedback tab ---------- */
  function findHub() {
    if (CFG.hubUrl) return CFG.hubUrl;
    var a = document.querySelector('#joinCard a[href*="forms"], a[href*="forms.gle"], a[href*="docs.google.com/forms"]');
    return a ? a.href : "";
  }
  function stars(n) { n = Math.round(n || 0); var s = ""; for (var i = 0; i < 5; i++) s += i < n ? "\u2605" : "\u2606"; return s; }
  function renderFeedback(list, count) {
    var url = findHub();
    var html = '<div class="eg-fbhead"><div><h2>What families are saying</h2><p>' +
      (count ? count + (count === 1 ? " family has" : " families have") + " shared written feedback so far. Here are some favourites." : "Be the first to share how the night went.") +
      "</p></div>" +
      (url ? '<a class="eg-write" href="' + esc(url) + '" target="_blank" rel="noopener">Write your feedback</a>' : "") + "</div>";
    if (!list || !list.length) {
      html += '<div class="eg-empty">Feedback will appear here once the organisers pick their favourites. Share yours on the Navratri Hub: choose "Rate tonight" and fill in what you loved and what could be better.</div>';
    } else {
      html += '<div class="eg-fbgrid">' + list.map(function (f) {
        return '<article class="eg-fb">' +
          (f.rating ? '<div class="eg-stars" aria-label="' + f.rating + ' out of 5">' + stars(f.rating) + "</div>" : "") +
          (f.loved ? '<span class="eg-lbl">Loved</span><q>' + esc(f.loved) + "</q>" : "") +
          (f.better ? '<span class="eg-lbl">Could be better</span><q class="eg-better">' + esc(f.better) + "</q>" : "") +
          '<div class="eg-who">\u2014 ' + esc(f.family) + "</div></article>";
      }).join("") + "</div>";
    }
    fbPane.innerHTML = html;
  }

  /* ---------- nomination form link at the top of the Nominations tab ---------- */
  function renderNominationLink(url) {
    url = CFG.nominationUrl || url;
    var pane = document.getElementById("pane-nominations");
    var box = document.getElementById("eg-nomcta");
    if (!pane || !url) { if (box) box.remove(); return; }
    if (!box) {
      box = el("div", "eg-wrap eg-nomcta");
      box.id = "eg-nomcta";
      pane.insertBefore(box, pane.firstChild);
    }
    box.innerHTML = '<div><strong>Want to take part?</strong><span>Nominate your family for any event in under a minute.</span></div>' +
      '<a class="eg-write" href="' + esc(url) + '" target="_blank" rel="noopener">Open the nomination form</a>';
  }

  renderSpotTab();
  renderFeedback([], 0);
  renderNominationLink("");

  /* ---------- poll ---------- */
  function load() {
    jsonp(CFG.url, function (err, d) {
      if (err || !d || !d.ok) return; // stay quiet; the main dashboard is unaffected
      updateSpots(d.spotlights); renderSpotTab(); renderFeedback(d.feedback, d.feedbackCount); renderNominationLink(d.nominationUrl);
    });
  }
  load();
  setInterval(load, POLL_MS);
})();
