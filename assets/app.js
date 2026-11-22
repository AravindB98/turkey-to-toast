(function () {
  "use strict";

  var CATS = {
    all: "All deals",
    storewide: "Store-wide",
    tech: "Tech",
    laptops: "Laptops",
    gaming: "Gaming",
    coats: "Winter coats",
    student: "Student and under-30",
    boston: "Boston in-person",
    tickets: "Tickets and experiences"
  };

  var deals = (window.TT_DEALS || []).slice();
  var events = window.TT_EVENTS || [];
  var meta = window.TT_META || {};
  var state = { q: "", cat: "all", where: "all", season: "all", student: false, hideEnded: true, sort: "ending" };

  // Dates are treated as end-of-day US Eastern.
  function day(s) { return s ? new Date(s + "T00:00:00-05:00") : null; }
  function endOfDay(s) { return s ? new Date(s + "T23:59:59-05:00") : null; }
  // Whole calendar days between two instants, counted in US Eastern time.
  function etDate(t) { return day(t.toLocaleDateString("en-CA", { timeZone: "America/New_York" })); }
  function daysBetween(a, b) { return Math.round((etDate(b) - etDate(a)) / 86400000); }
  function fmt(s) {
    return day(s).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
  }

  function status(d, now) {
    var s = day(d.start), e = endOfDay(d.end);
    if (e && now > e) return { cls: "ended", label: "Ended", rank: 9e15 };
    if (s && now < s) {
      var n = daysBetween(now, s);
      return { cls: "upcoming", label: n <= 1 ? "Starts tomorrow" : "Starts in " + n + " days", rank: 5e15 + s.getTime() };
    }
    if (e) {
      var left = daysBetween(now, e);
      if (left <= 0) return { cls: "soon", label: "Ends today", rank: e.getTime() };
      if (left === 1) return { cls: "soon", label: "Ends tomorrow", rank: e.getTime() };
      if (left <= 3) return { cls: "soon", label: "Ends in " + left + " days", rank: e.getTime() };
      return { cls: "live", label: "Live · ends " + fmt(d.end), rank: e.getTime() };
    }
    return { cls: "live", label: "Live now", rank: 4e15 };
  }

  function host(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return "source"; }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Countdown and timeline
  function renderClock() {
    var now = new Date();
    var next = null;
    for (var i = 0; i < events.length; i++) {
      if (endOfDay(events[i].date) >= now) { next = events[i]; break; }
    }
    var box = document.getElementById("countdown");
    box.textContent = "";
    if (!next) { box.appendChild(el("span", null, "The season is over. See you next Thanksgiving.")); return; }
    var start = day(next.date);
    if (now >= start) {
      box.appendChild(el("strong", null, next.name));
      box.appendChild(el("span", null, "is today"));
    } else {
      var ms = start - now;
      var d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
      box.appendChild(el("span", null, next.name + " in"));
      box.appendChild(el("strong", null, d + "d " + pad(h) + "h " + pad(m) + "m " + pad(s) + "s"));
    }
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function renderTimeline() {
    var now = new Date(), ol = document.getElementById("timeline"), marked = false;
    ol.textContent = "";
    events.forEach(function (ev) {
      var li = el("li");
      var past = endOfDay(ev.date) < now;
      if (past) li.className = "past";
      else if (!marked) { li.className = "next"; marked = true; }
      li.appendChild(el("b", null, fmt(ev.date)));
      li.appendChild(document.createTextNode(ev.name));
      ol.appendChild(li);
    });
  }

  // Filters
  function renderCats() {
    var box = document.getElementById("cats");
    box.textContent = "";
    Object.keys(CATS).forEach(function (k) {
      var n = k === "all" ? deals.length : deals.filter(function (d) { return d.category === k || (k === "student" && d.student); }).length;
      var b = el("button", k === state.cat ? "on" : "", CATS[k]);
      b.appendChild(el("span", "n", String(n)));
      b.setAttribute("aria-pressed", k === state.cat);
      b.onclick = function () { state.cat = k; renderCats(); render(); };
      box.appendChild(b);
    });
  }

  function bindSeg(id, key) {
    var box = document.getElementById(id);
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      state[key] = b.dataset.v;
      Array.prototype.forEach.call(box.children, function (c) { c.classList.toggle("on", c === b); });
      render();
    });
  }

  function matches(d, now) {
    if (state.cat !== "all") {
      if (state.cat === "student") { if (!d.student && d.category !== "student") return false; }
      else if (d.category !== state.cat) return false;
    }
    if (state.where === "online" && d.where === "boston") return false;
    if (state.where === "boston" && d.where === "online") return false;
    if (state.season !== "all" && (d.season || []).indexOf(state.season) < 0) return false;
    if (state.student && !d.student) return false;
    if (state.hideEnded && status(d, now).cls === "ended") return false;
    if (state.q) {
      var hay = [d.title, d.deal, d.store, d.note, CATS[d.category]].join(" ").toLowerCase();
      var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }

  function render() {
    var now = new Date();
    var list = deals.filter(function (d) { return matches(d, now); });
    list.sort(function (a, b) {
      if (state.sort === "store") return a.store.localeCompare(b.store);
      if (state.sort === "category") return CATS[a.category].localeCompare(CATS[b.category]) || a.title.localeCompare(b.title);
      return status(a, now).rank - status(b, now).rank;
    });

    var grid = document.getElementById("grid");
    grid.textContent = "";
    list.forEach(function (d) {
      var st = status(d, now);
      var card = el("article", "card" + (st.cls === "ended" ? " ended" : ""));
      var m = el("div", "meta");
      m.appendChild(el("span", "cat", CATS[d.category]));
      m.appendChild(el("span", "badge " + st.cls, st.label));
      card.appendChild(m);
      card.appendChild(el("h3", null, d.title));
      card.appendChild(el("p", "price", d.deal));
      card.appendChild(el("p", "store", d.store + (d.start && d.end && d.start !== d.end ? " · " + fmt(d.start) + " to " + fmt(d.end) : d.start && d.start === d.end ? " · " + fmt(d.start) + " only" : "")));
      if (d.note) card.appendChild(el("p", "note", d.note));
      var tags = el("div", "tags");
      if (d.student) tags.appendChild(el("span", "tag stu", "Student pick"));
      tags.appendChild(el("span", "tag", d.where === "boston" ? "Boston" : d.where === "both" ? "Online + in store" : "Online"));
      card.appendChild(tags);
      var a = el("a", "go");
      a.href = d.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.appendChild(el("span", null, "View on " + (d.sourceLabel || host(d.url))));
      a.appendChild(el("span", null, "↗"));
      card.appendChild(a);
      grid.appendChild(card);
    });

    document.getElementById("count").textContent = list.length + " of " + deals.length + " deals shown";
    document.getElementById("empty").hidden = list.length > 0;
  }

  // Wire up
  var q = document.getElementById("q");
  q.addEventListener("input", function () { state.q = q.value.trim(); render(); });
  document.getElementById("student").addEventListener("change", function (e) { state.student = e.target.checked; render(); });
  document.getElementById("hideEnded").addEventListener("change", function (e) { state.hideEnded = e.target.checked; render(); });
  document.getElementById("sort").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
  bindSeg("where", "where");
  bindSeg("season", "season");

  if (meta.lastUpdated) document.getElementById("updated").textContent = fmt(meta.lastUpdated) + ", " + meta.lastUpdated.slice(0, 4);
  renderCats();
  renderTimeline();
  renderClock();
  render();
  setInterval(renderClock, 1000);
  // Re-check statuses every 10 minutes so badges flip without a reload.
  setInterval(function () { renderTimeline(); render(); }, 600000);
})();
