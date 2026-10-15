/* SSAW customer reviews strip: shows real Google reviews from reviews.json at the end of machine pages.
   Shows nothing if reviews.json has no reviews. Text is rendered with textContent only (never edited). */
(function () {
  "use strict";
  var SCRIPT = document.currentScript;
  var SLUGS = { "agarbathi.html": "agarbathi", "dhoop.html": "dhoop", "cotton.html": "camphor", "cottonwick.html": "cottonwick",
    "sambrani.html": "sambrani", "dryer.html": "dryer", "plate.html": "plate", "paper-cup.html": "paper-cup", "blister.html": "blister" };
  var NAMES = { agarbathi: "agarbatti machine", dhoop: "dhoop machine", camphor: "camphor machine", cottonwick: "cotton wick machine",
    sambrani: "sambrani cup machine", dryer: "dryer machine", plate: "paper plate machine", "paper-cup": "paper cup machine", blister: "blister packing machine" };
  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var slug = SLUGS[file];
  if (!slug) return;

  var CSS = ".ssaw-rv{padding:8px 0 36px;font-family:Inter,system-ui,-apple-system,'Segoe UI',Arial,sans-serif;color:#2a2622}" +
    ".ssaw-rv *{box-sizing:border-box}.ssaw-rv-w{max-width:1240px;margin:0 auto;padding:0 28px}" +
    ".ssaw-rv h2{margin:0 0 4px;font-size:20px;font-weight:700;line-height:1.3}" +
    ".ssaw-rv-sub{margin:0 0 14px;font-size:13.5px;color:#7a7268}" +
    ".ssaw-rv-row{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:2px 2px 8px;scrollbar-width:none}" +
    ".ssaw-rv-row::-webkit-scrollbar{display:none}" +
    ".ssaw-rv-card{flex:0 0 82%;scroll-snap-align:start;background:#fff;border:1px solid #e8e2d8;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px}" +
    ".ssaw-rv-top{display:flex;align-items:center;gap:10px}" +
    ".ssaw-rv-av{flex:none;width:38px;height:38px;border-radius:50%;background:#fff3e6;color:#d9560b;font-weight:700;display:flex;align-items:center;justify-content:center}" +
    ".ssaw-rv-name{font-weight:600;font-size:14.5px;line-height:1.3;overflow-wrap:anywhere}" +
    ".ssaw-rv-date{font-size:12px;color:#7a7268}" +
    ".ssaw-rv-stars{color:#e8a100;letter-spacing:1px;font-size:15px;line-height:1}" +
    ".ssaw-rv-txt{margin:0;font-size:15px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-line;overflow-wrap:anywhere}" +
    ".ssaw-rv-card.open .ssaw-rv-txt{-webkit-line-clamp:unset;display:block}" +
    ".ssaw-rv-reply{display:none;margin:2px 0 0;padding:8px 10px;border-left:3px solid #f1dcc3;background:#faf7f2;font-size:13.5px;line-height:1.45;color:#2a2622;overflow-wrap:anywhere}" +
    ".ssaw-rv-reply b{display:block;font-size:12px;color:#7a7268;margin-bottom:2px}" +
    ".ssaw-rv-card.open .ssaw-rv-reply{display:block}" +
    ".ssaw-rv-more{align-self:flex-start;background:none;border:0;padding:8px 0;min-height:44px;color:#d9560b;font:600 14px inherit;font-family:inherit;cursor:pointer}" +
    ".ssaw-rv-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;font-size:12px;color:#7a7268}" +
    ".ssaw-rv-chip{background:#fff3e6;color:#b44508;border-radius:99px;padding:3px 9px;font-weight:600;font-size:11.5px}" +
    ".ssaw-rv-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:6px}" +
    ".ssaw-rv-dots{display:flex;gap:6px}.ssaw-rv-dots i{width:7px;height:7px;border-radius:50%;background:#e8e2d8;display:block}.ssaw-rv-dots i.on{background:#d9560b}" +
    ".ssaw-rv-btn,.ssaw-rv-nav button{min-height:44px;border:1px solid #e8e2d8;background:#fff;color:#2a2622;border-radius:10px;padding:0 16px;font:600 14px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}" +
    ".ssaw-rv-btn:hover,.ssaw-rv-nav button:hover{border-color:#d9560b;color:#d9560b}" +
    ".ssaw-rv-nav{display:none;gap:8px}.ssaw-rv a:focus-visible,.ssaw-rv button:focus-visible{outline:2px solid #d9560b;outline-offset:2px}" +
    "@media(min-width:640px){.ssaw-rv-card{flex-basis:calc(50% - 7px)}}" +
    "@media(min-width:1024px){.ssaw-rv-card{flex-basis:calc(33.333% - 10px)}.ssaw-rv-nav{display:flex}.ssaw-rv-dots{display:none}}" +
    "@media(max-width:600px){.ssaw-rv-w{padding:0 16px}}" +
    "@media(prefers-reduced-motion:reduce){.ssaw-rv-row{scroll-behavior:auto}}";

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function ts(d) { var t = Date.parse(d); return isNaN(t) ? 0 : t; }


  /* Adds star rating + reviews to this page's Product JSON-LD, using ONLY real reviews from reviews.json
     that are tagged for this machine. Nothing is added when there are none. */
  function addSchema(rv) {
    try {
      if (!rv.length) return;
      var node = document.getElementById("ssaw-product-ld"); if (!node) return;
      var p = JSON.parse(node.textContent), sum = 0;
      var items = rv.slice(0, 10).map(function (r) {
        sum += r.rating;
        var o = { "@type": "Review", "author": { "@type": "Person", "name": r.name.trim() },
          "reviewRating": { "@type": "Rating", "ratingValue": r.rating, "bestRating": 5, "worstRating": 1 },
          "reviewBody": r.text.trim() };
        if (/^\d{4}-\d{2}-\d{2}/.test(String(r.date))) o.datePublished = String(r.date).slice(0, 10);
        return o;
      });
      var all = rv.reduce(function (a, r) { return a + r.rating; }, 0);
      p.review = items;
      p.aggregateRating = { "@type": "AggregateRating", "ratingValue": Math.round(all / rv.length * 10) / 10,
        "reviewCount": rv.length, "bestRating": 5, "worstRating": 1 };
      node.textContent = JSON.stringify(p);
    } catch (e) { }
  }

  function build(data) {
    if (!data || !Array.isArray(data.reviews)) return;
    var list = data.reviews.filter(function (r) {
      return r && typeof r.text === "string" && r.text.trim() && typeof r.name === "string" && r.name.trim() && r.rating >= 1 && r.rating <= 5;
    });
    if (!list.length) return;
    function tagged(r) { return Array.isArray(r.machines) && r.machines.indexOf(slug) !== -1 ? 1 : 0; }
    list.sort(function (a, b) {
      return (tagged(b) - tagged(a)) || ((b.featured ? 1 : 0) - (a.featured ? 1 : 0)) || (ts(b.date) - ts(a.date));
    });
    addSchema(list.filter(tagged));
    list = list.slice(0, 6);

    var st = el("style"); st.textContent = CSS; document.head.appendChild(st);
    var sec = el("section", "ssaw-rv"); sec.setAttribute("role", "region"); sec.setAttribute("aria-label", "Customer reviews");
    var w = el("div", "ssaw-rv-w"); sec.appendChild(w);
    w.appendChild(el("h2", "", "What our customers say"));
    var s = data.summary || {};
    var sub = (s.rating && s.count) ? s.rating + " from " + s.count + " Google reviews" : "Reviews from Google";
    w.appendChild(el("p", "ssaw-rv-sub", sub));

    var row = el("div", "ssaw-rv-row"); row.setAttribute("tabindex", "0"); w.appendChild(row);
    list.forEach(function (r) {
      var c = el("article", "ssaw-rv-card");
      var top = el("div", "ssaw-rv-top");
      top.appendChild(el("div", "ssaw-rv-av", r.name.trim().charAt(0).toUpperCase()));
      var who = el("div"); who.appendChild(el("div", "ssaw-rv-name", r.name));
      if (r.date) who.appendChild(el("div", "ssaw-rv-date", String(r.date)));
      top.appendChild(who); c.appendChild(top);
      var stars = el("div", "ssaw-rv-stars", "\u2605\u2605\u2605\u2605\u2605".slice(0, r.rating) + "\u2606\u2606\u2606\u2606\u2606".slice(0, 5 - r.rating));
      stars.setAttribute("role", "img"); stars.setAttribute("aria-label", r.rating + " out of 5 stars"); c.appendChild(stars);
      var txt = el("p", "ssaw-rv-txt", r.text); c.appendChild(txt);
      var rep = null;
      if (r.ownerReply) { rep = el("div", "ssaw-rv-reply"); rep.appendChild(el("b", "", "Reply from Shri Shiva Agarbathi Works")); rep.appendChild(document.createTextNode(r.ownerReply)); c.appendChild(rep); }
      var more = el("button", "ssaw-rv-more", "Read more"); more.type = "button"; more.hidden = true;
      more.addEventListener("click", function () { var o = c.classList.toggle("open"); more.textContent = o ? "Show less" : "Read more"; more.setAttribute("aria-expanded", o ? "true" : "false"); });
      c.appendChild(more);
      var foot = el("div", "ssaw-rv-foot"); foot.appendChild(el("span", "", "Google review"));
      if (tagged(r)) foot.appendChild(el("span", "ssaw-rv-chip", "About this " + NAMES[slug]));
      c.appendChild(foot);
      c._more = more; c._txt = txt; c._rep = rep;
      row.appendChild(c);
    });

    var bar = el("div", "ssaw-rv-bar");
    var dots = el("div", "ssaw-rv-dots"); dots.setAttribute("aria-hidden", "true");
    var cards = row.children;
    for (var i = 0; i < cards.length; i++) dots.appendChild(el("i", i === 0 ? "on" : ""));
    var nav = el("div", "ssaw-rv-nav");
    var prev = el("button", "", "\u2039"), next = el("button", "", "\u203A");
    prev.type = next.type = "button"; prev.setAttribute("aria-label", "Previous reviews"); next.setAttribute("aria-label", "Next reviews");
    function step(d) { row.scrollBy({ left: d * (cards[0].offsetWidth + 14), behavior: "smooth" }); }
    prev.addEventListener("click", function () { step(-1); }); next.addEventListener("click", function () { step(1); });
    nav.appendChild(prev); nav.appendChild(next);
    bar.appendChild(dots); bar.appendChild(nav);
    if (s.mapsUrl && /^https:\/\//.test(s.mapsUrl)) {
      var a = el("a", "ssaw-rv-btn", "See all reviews on Google"); a.href = s.mapsUrl; a.target = "_blank"; a.rel = "noopener";
      bar.appendChild(a);
    }
    w.appendChild(bar);

    var foot = document.querySelector("footer") || document.querySelector('nav[aria-label="Related machines"]');
    if (foot && foot.parentNode) foot.parentNode.insertBefore(sec, foot); else document.body.appendChild(sec);

    // show "Read more" only where the text is actually cut off or there is an owner reply
    for (var k = 0; k < cards.length; k++) {
      var cd = cards[k];
      if (cd._txt.scrollHeight > cd._txt.clientHeight + 2 || cd._rep) cd._more.hidden = false;
    }
    row.addEventListener("scroll", function () {
      var idx = Math.round(row.scrollLeft / (cards[0].offsetWidth + 14));
      for (var j = 0; j < dots.children.length; j++) dots.children[j].className = j === idx ? "on" : "";
    }, { passive: true });
  }

  function load() {
    var url = SCRIPT && SCRIPT.src ? new URL("reviews.json", SCRIPT.src).href : "reviews.json";
    fetch(url, { cache: "default" }).then(function (r) { return r.ok ? r.json() : null; }).then(build).catch(function () { });
  }
  if ("requestIdleCallback" in window) requestIdleCallback(load, { timeout: 2500 });
  else setTimeout(load, 600);
})();
