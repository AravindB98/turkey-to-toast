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
  var TZ = "America/New_York";
  var OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
  var params = new URLSearchParams(location.search);
  var FEED_URLS = ["https://raw.githubusercontent.com/AravindB98/turkey-to-toast/main/assets/live-feed.json", "assets/live-feed.json"];

  // Official store search pages, used when someone searches for anything.
  var STORES = [
    ["Amazon", "https://www.amazon.com/s?k="],
    ["Walmart", "https://www.walmart.com/search?q="],
    ["Target", "https://www.target.com/s?searchTerm="],
    ["Best Buy", "https://www.bestbuy.com/site/searchpage.jsp?st="],
    ["Costco", "https://www.costco.com/CatalogSearch?dept=All&keyword="],
    ["eBay", "https://www.ebay.com/sch/i.html?_nkw="],
    ["Newegg", "https://www.newegg.com/p/pl?d="],
    ["B&H Photo", "https://www.bhphotovideo.com/c/search?q="],
    ["Apple", "https://www.apple.com/us/search/", true],
    ["Macy's", "https://www.macys.com/shop/search?keyword="],
    ["Kohl's", "https://www.kohls.com/search.jsp?search="],
    ["Nordstrom", "https://www.nordstrom.com/sr?keyword="],
    ["Home Depot", "https://www.homedepot.com/s/", true],
    ["REI", "https://www.rei.com/search?q="]
  ];
  var COMPARE = [
    ["Google Shopping (every store's price)", "https://www.google.com/search?tbm=shop&q="],
    ["Slickdeals", "https://slickdeals.net/newsearch.php?searcharea=deals&q="],
    ["Amazon price history (camelcamelcamel)", "https://camelcamelcamel.com/search?sq="],
    ["In stores near you (Google Maps)", "https://www.google.com/maps/search/", true, " store"]
  ];

  /* ---------- Calendar math (all dates are "YYYY-MM-DD" strings in US Eastern) ---------- */

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(y, m, d) { var t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCFullYear() + "-" + pad(t.getUTCMonth() + 1) + "-" + pad(t.getUTCDate()); }
  function parts(s) { var p = s.split("-"); return { y: +p[0], m: +p[1], d: +p[2] }; }
  function addDays(s, n) { var p = parts(s); return ymd(p.y, p.m, p.d + n); }
  function dow(s) { var p = parts(s); return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay(); }
  function diffDays(a, b) { var A = parts(a), B = parts(b); return Math.round((Date.UTC(B.y, B.m - 1, B.d) - Date.UTC(A.y, A.m - 1, A.d)) / 86400000); }
  function todayET(now) { return now.toLocaleDateString("en-CA", { timeZone: TZ }); }
  // Midnight Eastern for a date string, as a real instant (handles EST and EDT).
  function instant(s) {
    var guess = new Date(s + "T00:00:00Z");
    var et = new Date(guess.toLocaleString("en-US", { timeZone: TZ }));
    var utc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
    return new Date(guess.getTime() + (utc - et));
  }
  function fmt(s, withYear) {
    var p = parts(s);
    return new Date(Date.UTC(p.y, p.m - 1, p.d, 12)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: withYear ? "numeric" : undefined, timeZone: "UTC" });
  }

  function thanksgiving(y) { var first = ymd(y, 11, 1); return addDays(first, ((4 - dow(first) + 7) % 7) + 21); }
  function seasonOpens(y) { var t = parts(thanksgiving(y)); return ymd(y, 10, t.d); }
  function seasonCloses(y) { return ymd(y + 1, 1, 1); }

  function eventsFor(y) {
    var t = thanksgiving(y);
    var dec1 = ymd(y, 12, 1);
    var greenMonday = addDays(dec1, ((1 - dow(dec1) + 7) % 7) + 7);
    var xmas = ymd(y, 12, 25);
    var superSat = addDays(xmas, -(((dow(xmas) - 6 + 7) % 7) || 7));
    return [
      { name: "Season opens", date: seasonOpens(y) },
      { name: "Thanksgiving", date: t },
      { name: "Black Friday", date: addDays(t, 1) },
      { name: "Small Business Saturday", date: addDays(t, 2) },
      { name: "Cyber Monday", date: addDays(t, 4) },
      { name: "Giving Tuesday", date: addDays(t, 5) },
      { name: "Green Monday", date: greenMonday },
      { name: "Super Saturday", date: superSat },
      { name: "Christmas", date: xmas },
      { name: "After-Christmas sales", date: ymd(y, 12, 26) },
      { name: "New Year's Day", date: seasonCloses(y) }
    ];
  }

  // Which season is on, or the next one if we're between seasons.
  function seasonState(today) {
    var y = parts(today).y;
    if (today === seasonCloses(y - 1)) return { open: true, year: y - 1 };
    if (today >= seasonOpens(y)) return { open: true, year: y };
    return { open: false, year: y };
  }

  /* ---------- State ---------- */

  function now() { return params.get("date") ? instant(params.get("date")) : new Date(); }
  var today = todayET(now());
  var season = seasonState(today);
  var viewYear = params.get("season") ? +params.get("season") : season.year;
  var archive = params.has("season") && viewYear !== season.year;
  var showDeals = season.open || archive;
  var allSeasons = window.TT_SEASONS || {};
  var deals = (allSeasons[viewYear] || []).slice();
  var events = eventsFor(viewYear);
  var meta = window.TT_META || {};
  var brandMap = window.TT_STORE_BRANDS || {};
  var state = { q: "", cat: "all", where: "all", season: "all", student: false, hideEnded: !archive, sort: "ending" };

  /* ---------- Helpers ---------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function host(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return "source"; } }
  function $(id) { return document.getElementById(id); }

  function status(d) {
    if (archive) return { cls: "ended", label: viewYear + " season", rank: 0 };
    if (d.end && today > d.end) return { cls: "ended", label: "Ended", rank: 9e9 };
    if (d.start && today < d.start) {
      var n = diffDays(today, d.start);
      return { cls: "upcoming", label: n === 1 ? "Starts tomorrow" : "Starts in " + n + " days", rank: 5e9 + n };
    }
    if (d.end) {
      var left = diffDays(today, d.end);
      if (left === 0) return { cls: "soon", label: "Ends today", rank: left };
      if (left === 1) return { cls: "soon", label: "Ends tomorrow", rank: left };
      if (left <= 3) return { cls: "soon", label: "Ends in " + left + " days", rank: left };
      return { cls: "live", label: "Live · ends " + fmt(d.end), rank: left };
    }
    return { cls: "live", label: "Live now", rank: 4e9 };
  }

  /* ---------- Hero countdown + calendar strip ---------- */

  function renderClock() {
    var t = now(), box = $("countdown");
    box.textContent = "";
    var target, label;
    if (!season.open) {
      target = seasonOpens(season.year);
      label = "Tracker reopens " + fmt(target, true) + " in";
    } else {
      var td = todayET(t), list = eventsFor(season.year), next = null;
      for (var i = 0; i < list.length; i++) if (list[i].date >= td) { next = list[i]; break; }
      if (!next) return;
      if (next.date === td) { box.appendChild(el("strong", null, next.name)); box.appendChild(el("span", null, "is today")); return; }
      target = next.date; label = next.name + " in";
    }
    var ms = Math.max(0, instant(target) - t);
    var d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
    box.appendChild(el("span", null, label));
    box.appendChild(el("strong", null, d + "d " + pad(h) + "h " + pad(m) + "m " + pad(s) + "s"));
  }

  function renderTimeline() {
    var ol = $("timeline"), marked = false;
    ol.textContent = "";
    events.forEach(function (ev) {
      var li = el("li");
      if (ev.date < today) li.className = "past";
      else if (!marked) { li.className = "next"; marked = true; }
      li.appendChild(el("b", null, fmt(ev.date)));
      li.appendChild(document.createTextNode(ev.name));
      ol.appendChild(li);
    });
  }

  function renderSeasonBanner() {
    var y = season.year;
    $("eyebrow").textContent = "Holiday deals tracker · " + viewYear + " season · Online + Boston";
    var box = $("seasonNote");
    box.textContent = "";
    if (archive) {
      box.hidden = false;
      box.appendChild(el("strong", null, "Archive: the " + viewYear + " season. "));
      box.appendChild(document.createTextNode("These deals have ended. "));
      var a = el("a", null, "Back to the current tracker");
      a.href = location.pathname;
      box.appendChild(a);
    } else if (!season.open) {
      box.hidden = false;
      box.appendChild(el("strong", null, "The tracker is between seasons. "));
      box.appendChild(document.createTextNode("It runs every year from a month before Thanksgiving through New Year's Day, and reopens " + fmt(seasonOpens(y), true) + ". "));
      if (allSeasons[y - 1]) {
        var b = el("a", null, "Browse the " + (y - 1) + " season");
        b.href = "?season=" + (y - 1);
        box.appendChild(b);
      }
    } else if (!deals.length) {
      box.hidden = false;
      box.appendChild(el("strong", null, "The " + viewYear + " season is open. "));
      box.appendChild(document.createTextNode("Deals are being added now, so check back soon."));
    } else {
      box.hidden = true;
    }
  }

  /* ---------- Filters + grid ---------- */

  function renderCats() {
    var box = $("cats");
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
    var box = $(id);
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      state[key] = b.dataset.v;
      Array.prototype.forEach.call(box.children, function (c) { c.classList.toggle("on", c === b); });
      render();
    });
  }

  function matches(d) {
    if (state.cat !== "all") {
      if (state.cat === "student") { if (!d.student && d.category !== "student") return false; }
      else if (d.category !== state.cat) return false;
    }
    if (state.where === "online" && d.where === "boston") return false;
    if (state.where === "boston" && d.where === "online") return false;
    if (state.season !== "all" && (d.season || []).indexOf(state.season) < 0) return false;
    if (state.student && !d.student) return false;
    if (state.hideEnded && status(d).cls === "ended") return false;
    if (state.q) {
      var hay = [d.title, d.deal, d.store, d.note, CATS[d.category]].join(" ").toLowerCase();
      var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }

  function dealLink(d, cls, text) {
    var a = el("a", cls, text);
    a.href = d.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  function render() {
    var list = deals.filter(matches);
    list.sort(function (a, b) {
      if (state.sort === "store") return a.store.localeCompare(b.store);
      if (state.sort === "category") return CATS[a.category].localeCompare(CATS[b.category]) || a.title.localeCompare(b.title);
      return status(a).rank - status(b).rank;
    });
    var grid = $("grid");
    grid.textContent = "";
    list.forEach(function (d) {
      var st = status(d);
      var card = el("article", "card" + (st.cls === "ended" ? " ended" : ""));
      var m = el("div", "meta");
      m.appendChild(el("span", "cat", CATS[d.category]));
      m.appendChild(el("span", "badge " + st.cls, st.label));
      card.appendChild(m);
      card.appendChild(el("h3", null, d.title));
      card.appendChild(el("p", "price", d.deal));
      var when = d.start && d.end ? (d.start === d.end ? " · " + fmt(d.start) + " only" : " · " + fmt(d.start) + " to " + fmt(d.end)) : "";
      card.appendChild(el("p", "store", d.store + when));
      if (d.note) card.appendChild(el("p", "note", d.note));
      var tags = el("div", "tags");
      if (d.student) tags.appendChild(el("span", "tag stu", "Student pick"));
      tags.appendChild(el("span", "tag", d.where === "boston" ? "Boston" : d.where === "both" ? "Online + in store" : "Online"));
      card.appendChild(tags);
      if (d.offers && d.offers.length > 1) {
        var same = el("div", "same");
        same.appendChild(el("span", "same-label", "Same price at"));
        d.offers.forEach(function (o) {
          var oa = el("a", "same-link", o.store + " ↗");
          oa.href = o.url; oa.target = "_blank"; oa.rel = "noopener noreferrer";
          same.appendChild(oa);
        });
        card.appendChild(same);
      }
      var a = dealLink(d, "go");
      a.appendChild(el("span", null, "View on " + (d.sourceLabel || host(d.url))));
      a.appendChild(el("span", null, "↗"));
      card.appendChild(a);
      grid.appendChild(card);
    });
    $("count").textContent = list.length + " of " + deals.length + " deals shown";
    $("empty").hidden = list.length > 0 || !deals.length || !!state.q;
    renderEverywhere(list.length);
    renderFeed();
  }

  /* ---------- Search every store ---------- */

  function storeLink(name, base, pathStyle, suffix, q) {
    var term = q + (suffix || "");
    var a = el("a", "store-link", name + " ↗");
    a.href = base + (pathStyle ? encodeURIComponent(term) : encodeURIComponent(term).replace(/%20/g, "+"));
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  function renderEverywhere(found) {
    var box = $("everywhere");
    box.textContent = "";
    if (!state.q) { box.hidden = true; return; }
    box.hidden = false;
    var feedHits = feedMatches().length;
    var head = el("h3", null, found || feedHits
      ? "Check \u201c" + state.q + "\u201d at every store"
      : "No tracked deal for \u201c" + state.q + "\u201d yet. Search it at every store:");
    box.appendChild(head);
    var row = el("div", "store-row");
    STORES.forEach(function (s) { row.appendChild(storeLink(s[0], s[1], s[2], s[3], state.q)); });
    box.appendChild(row);
    box.appendChild(el("p", "store-sub", "Compare prices across sites"));
    var row2 = el("div", "store-row");
    COMPARE.forEach(function (s) { row2.appendChild(storeLink(s[0], s[1], s[2], s[3], state.q)); });
    box.appendChild(row2);
    if (feedHits) box.appendChild(el("p", "store-sub", feedHits + " matching live deal" + (feedHits > 1 ? "s" : "") + " in \u201cLive from deal sites\u201d below."));
  }

  /* ---------- Live feed from deal sites ---------- */

  var feed = null, feedShown = 12;
  function ago(iso) {
    var s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + "m " + pad(s % 60) + "s ago";
    if (s < 86400) return Math.floor(s / 3600) + "h " + pad(Math.floor(s / 60) % 60) + "m ago";
    return Math.floor(s / 86400) + "d ago";
  }
  function feedMatches() {
    if (!feed) return [];
    if (!state.q) return feed.items;
    var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    return feed.items.filter(function (it) {
      var hay = (it.title + " " + it.category + " " + it.source).toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) >= 0; });
    });
  }
  function renderFeed() {
    var sec = $("feed");
    if (!feed || archive || !season.open) { sec.hidden = true; return; }
    sec.hidden = false;
    var items = feedMatches(), list = $("feedList");
    list.textContent = "";
    items.slice(0, feedShown).forEach(function (it) {
      var li = el("li", "feed-item");
      var a = el("a", "feed-title", it.title);
      a.href = it.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      li.appendChild(a);
      var m = el("div", "feed-sub");
      m.appendChild(el("span", "feed-time", ago(it.published)));
      m.dataset.ts = it.published;
      if (it.category) m.appendChild(el("span", null, it.category));
      if (it.offers && it.offers.length > 1) {
        m.appendChild(el("span", "same-label", "Same price on"));
        it.offers.forEach(function (o) { var oa = el("a", "same-link", o.source + " ↗"); oa.href = o.url; oa.target = "_blank"; oa.rel = "noopener noreferrer"; m.appendChild(oa); });
      } else {
        m.appendChild(el("span", "feed-src", "via " + it.source));
      }
      li.appendChild(m);
      list.appendChild(li);
    });
    if (!items.length) list.appendChild(el("li", "feed-empty", "No live deal-site posts match \u201c" + state.q + "\u201d right now."));
    $("feedMore").hidden = items.length <= feedShown;
    tickFeed();
  }
  function tickFeed() {
    if (!feed) return;
    $("feedMeta").textContent = "Pulled from " + feed.sources.join(" and ") + " · refreshed " + ago(feed.updated) + " · checking for new posts every minute";
    Array.prototype.forEach.call(document.querySelectorAll(".feed-sub"), function (m) {
      m.firstChild.textContent = ago(m.dataset.ts);
    });
  }
  function loadFeed(i) {
    i = i || 0;
    if (i >= FEED_URLS.length) return;
    fetch(FEED_URLS[i] + "?t=" + Math.floor(Date.now() / 60000), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        if (!data || !data.items) throw new Error("bad feed");
        if (!feed || data.updated !== feed.updated) { feed = data; render(); }
      })
      .catch(function () { loadFeed(i + 1); });
  }

  /* ---------- Deals near me ---------- */

  // In-person deals that are still running, grouped by the store brand to look for nearby.
  function inPersonDeals() {
    var byBrand = {}, fixed = [];
    deals.forEach(function (d) {
      if (d.where === "online" || status(d).cls === "ended") return;
      if (d.place) { fixed.push(d); return; }
      var brands = d.brands || brandMap[d.store];
      if (!brands) return;
      brands.forEach(function (b) { (byBrand[b.toLowerCase()] = byBrand[b.toLowerCase()] || { name: b, deals: [] }).deals.push(d); });
    });
    return { byBrand: byBrand, fixed: fixed };
  }

  function miles(a, b) {
    var R = 3958.8, r = Math.PI / 180;
    var dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function setNearStatus(text, isError) {
    var s = $("nearStatus");
    s.textContent = text;
    s.classList.toggle("err", !!isError);
  }

  function overpassQuery(brands, pos, meters) {
    var re = brands.map(function (b) { return b.replace(/[.*+?^${}()|[\]\\"]/g, "\\$&"); }).join("|");
    var around = "(around:" + meters + "," + pos.lat.toFixed(5) + "," + pos.lng.toFixed(5) + ")";
    return "[out:json][timeout:25];(" +
      'nwr["brand"~"^(' + re + ')$",i]' + around + ";" +
      'nwr["shop"]["name"~"^(' + re + ')$",i]' + around + ";" +
      ");out center tags 150;";
  }

  function fetchStores(query, i) {
    i = i || 0;
    return fetch(OVERPASS[i], { method: "POST", body: "data=" + encodeURIComponent(query), headers: { "Content-Type": "application/x-www-form-urlencoded" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .catch(function (e) { if (i + 1 < OVERPASS.length) return fetchStores(query, i + 1); throw e; });
  }

  function address(tags) {
    var line = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
    return [line, tags["addr:city"]].filter(Boolean).join(", ");
  }

  function findNearby(pos, label) {
    var radiusMi = +$("radius").value;
    var groups = inPersonDeals();
    var brands = Object.keys(groups.byBrand).map(function (k) { return groups.byBrand[k].name; });
    if (!brands.length && !groups.fixed.length) { setNearStatus("No in-person deals are running right now."); return; }
    setNearStatus("Looking for stores within " + radiusMi + " miles of " + label + "…");
    $("nearList").textContent = "";

    var fixedHits = groups.fixed.map(function (d) {
      return { name: d.place.name, address: d.place.address || "", lat: d.place.lat, lng: d.place.lng, deals: [d] };
    });

    var lookup = brands.length ? fetchStores(overpassQuery(brands, pos, Math.round(radiusMi * 1609.34))) : Promise.resolve({ elements: [] });
    lookup.then(function (data) {
      var seen = {}, stores = [];
      (data.elements || []).forEach(function (e) {
        var t = e.tags || {};
        var lat = e.lat != null ? e.lat : e.center && e.center.lat;
        var lng = e.lon != null ? e.lon : e.center && e.center.lon;
        if (lat == null) return;
        var g = groups.byBrand[(t.brand || "").toLowerCase()] || groups.byBrand[(t.name || "").toLowerCase()];
        if (!g) return;
        var key = g.name + "|" + lat.toFixed(3) + "|" + lng.toFixed(3);
        if (seen[key]) return;
        seen[key] = true;
        stores.push({ name: t.name || g.name, address: address(t), lat: lat, lng: lng, deals: g.deals });
      });
      showNearby(stores.concat(fixedHits), pos, radiusMi, label);
    }).catch(function () {
      showNearby(fixedHits, pos, radiusMi, label);
      setNearStatus("The store map service didn't answer, so only fixed venues are shown. Try again in a minute.", true);
    });
  }

  function showNearby(stores, pos, radiusMi, label) {
    stores.forEach(function (s) { s.dist = miles(pos, s); });
    stores = stores.filter(function (s) { return s.dist <= radiusMi; }).sort(function (a, b) { return a.dist - b.dist; }).slice(0, 12);
    var list = $("nearList");
    list.textContent = "";
    if (!stores.length) { setNearStatus("No stores with live deals within " + radiusMi + " miles of " + label + ". Try a wider radius."); return; }
    setNearStatus(stores.length + " store" + (stores.length > 1 ? "s" : "") + " with live deals near " + label + ", closest first.");
    stores.forEach(function (s) {
      var li = el("li", "near-item");
      var head = el("div", "near-head");
      var name = el("div");
      name.appendChild(el("strong", null, s.name));
      if (s.address) name.appendChild(el("span", "near-addr", s.address));
      head.appendChild(name);
      head.appendChild(el("span", "near-dist", (s.dist < 0.1 ? "< 0.1" : s.dist.toFixed(1)) + " mi"));
      li.appendChild(head);
      var chips = el("div", "near-deals");
      s.deals.forEach(function (d) {
        var soon = d.start && today < d.start ? " · starts " + fmt(d.start) : "";
        chips.appendChild(dealLink(d, "near-deal", d.title + " · " + d.deal + soon));
      });
      li.appendChild(chips);
      var dir = el("a", "near-dir", "Directions ↗");
      dir.href = "https://www.google.com/maps/dir/?api=1&destination=" + s.lat + "," + s.lng;
      dir.target = "_blank";
      dir.rel = "noopener noreferrer";
      li.appendChild(dir);
      list.appendChild(li);
    });
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) { setNearStatus("This browser can't share location. Type a city or ZIP instead.", true); return; }
    setNearStatus("Asking your browser for your location…");
    navigator.geolocation.getCurrentPosition(function (p) {
      findNearby({ lat: p.coords.latitude, lng: p.coords.longitude }, "you");
    }, function (err) {
      setNearStatus(err.code === 1 ? "Location access was blocked. Allow it in your browser, or type a city or ZIP." : "Couldn't get your location. Type a city or ZIP instead.", true);
    }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
  }

  function searchPlace(q) {
    if (!q) return;
    setNearStatus("Finding " + q + "…");
    fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=" + encodeURIComponent(q), { headers: { "Accept": "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.length) { setNearStatus("Couldn't find " + q + ". Try a ZIP code.", true); return; }
        findNearby({ lat: +res[0].lat, lng: +res[0].lon }, q);
      })
      .catch(function () { setNearStatus("Place search isn't answering right now. Try again shortly.", true); });
  }

  /* ---------- Wire up ---------- */

  var q = $("q");
  q.addEventListener("input", function () { state.q = q.value.trim(); render(); });
  $("student").addEventListener("change", function (e) { state.student = e.target.checked; render(); });
  $("hideEnded").checked = state.hideEnded;
  $("hideEnded").addEventListener("change", function (e) { state.hideEnded = e.target.checked; render(); });
  $("sort").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
  bindSeg("where", "where");
  bindSeg("season", "season");
  $("locate").addEventListener("click", useMyLocation);
  $("placeForm").addEventListener("submit", function (e) { e.preventDefault(); searchPlace($("place").value.trim()); });

  if (meta.lastUpdated) $("updated").textContent = fmt(meta.lastUpdated, true);
  renderSeasonBanner();
  $("dealsArea").hidden = !showDeals || !deals.length;
  $("near").hidden = !season.open || archive || !deals.length;
  renderCats();
  renderTimeline();
  renderClock();
  render();
  $("feedMore").addEventListener("click", function () { feedShown += 24; renderFeed(); });
  loadFeed();
  setInterval(function () { renderClock(); tickFeed(); }, 1000);
  setInterval(loadFeed, 60000);
  // Re-check dates every 10 minutes so badges and the season flip without a reload.
  setInterval(function () {
    var t = todayET(now());
    if (t !== today) location.reload();
  }, 600000);

  // Exposed for tests.
  window.TT_CAL = { thanksgiving: thanksgiving, seasonOpens: seasonOpens, eventsFor: eventsFor, seasonState: seasonState };
})();
