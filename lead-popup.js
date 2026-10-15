/* SSAW lead popup
   REQUIRED mode (default): shows on every page straight away and cannot be closed until the visitor
   submits a mobile number. After a number is saved it is not shown again in that browser.
   Set REQUIRED = false for the old behaviour (closable, once per visitor, after 15-20 seconds).
   Saves name + mobile + machine to the same Google Sheet as contactseller.html.
   Add before </body>:  <script src="lead-popup.js" defer></script>            */
(function () {
  "use strict";

  var ENDPOINT = "https://script.google.com/macros/s/AKfycbzVDEV4lvmLzBthfeYvd8ek4C0ynbKqZzfMATrLqMxHepgZ8l545ZxTGpSBCuI-_Yy0GA/exec";
  var AW_CONV = "AW-18501526181/ttRqCIPB8JcdEKXFm_ZE"; // Google Ads form-lead label
  var FORCE_REQUIRED_FOR_ALL = false;          // true = popup cannot be closed for any visitor (old behaviour)
  var DELAY_ORGANIC = 10000;                  // ms before the closable popup shows for organic / direct visitors
  function adsVisitor() {                     // true for visitors who arrived from a Google ad (remembered for the session)
    var q = location.search, fromAd = /[?&](gclid|gbraid|wbraid)=/i.test(q) || /[?&]utm_source=google/i.test(q) || /[?&]utm_medium=(cpc|ppc)/i.test(q);
    try { if (fromAd) sessionStorage.setItem("ssaw_ads", "1"); return sessionStorage.getItem("ssaw_ads") === "1"; } catch (e) { return fromAd; }
  }
  var REQUIRED = FORCE_REQUIRED_FOR_ALL || adsVisitor();   // ads visitors must enter a number; others can close it
  var SHOW_DELAY = 600;                       // ms after the page loads (REQUIRED mode)
  var MIN_DELAY = DELAY_ORGANIC, MAX_DELAY = DELAY_ORGANIC;
  var MAX_WAIT = 8000;                        // never keep the visitor waiting longer than this on submit
  var KEY = "ssaw_lead_popup_done";           // remembered in the visitor's browser

  var MACHINES = [
    "Agarbatti Making Machine",
    "Dhoopbatti Making Machine",
    "Camphor Making Machine",
    "Long Cotton Wick Making Machine",
    "Sambrani Cup Making Machine",
    "Dryer Machine With Heater for Agarbatti",
    "Vibro Shifter Filtering Machine",
    "Blister Pouch Sealing Packing Machine",
    "Paper Plate Making Machine",
    "Areca Plate Making Machine",
    "Paper Cup Making Machine",
    "Machine spare parts",
    "Other machine / not sure"
  ];

  /* once only: if this visitor has already seen it (or enquired), never show again */
  function seen() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(KEY, "1"); } catch (e) { } }
  if (seen()) return;

  /* ---------- styles ---------- */
  var css = [
    "#lp-ov{position:fixed;inset:0;z-index:3000;background:rgba(43,33,27,.78);display:none;align-items:center;justify-content:center;padding:16px;font-family:'Inter',system-ui,-apple-system,'Segoe UI',Arial,sans-serif;color:#2a2622;font-size:15px;line-height:1.5}",
    "#lp-ov.on{display:flex}",
    "#lp-ov *{box-sizing:border-box}",
    "#lp-ov [hidden]{display:none!important}",
    ".lp-m{position:relative;background:#fff;border-radius:14px;width:100%;max-width:440px;max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow-y:auto;box-shadow:0 24px 70px rgba(0,0,0,.45);animation:lp-pop .25s ease-out}",
    "@keyframes lp-pop{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}",
    ".lp-x{position:absolute;top:10px;right:12px;background:none;border:0;font-size:30px;line-height:1;color:#7a7268;cursor:pointer;padding:4px 8px;z-index:2;font-family:inherit}",
    ".lp-x:hover{color:#d9560b}",
    ".lp-v{display:none;padding:22px}.lp-v.on{display:block}",
    ".lp-head{background:#fff3e6;margin:-22px -22px 18px;padding:20px 50px 16px 22px;border-bottom:1px solid #f1dcc3;border-radius:14px 14px 0 0}",
    ".lp-head h2{margin:0;font-size:21px;font-weight:800;line-height:1.25}",
    ".lp-head h2 span{color:#d9560b}",
    ".lp-head p{margin:4px 0 0;font-size:13px;color:#7a7268}",
    ".lp-f{margin-bottom:14px;min-width:0}",
    ".lp-f label{display:block;font-size:12.5px;font-weight:600;margin-bottom:5px}",
    ".lp-f label em{color:#d9560b;font-style:normal}",
    ".lp-f input,.lp-f select{width:100%;font-family:inherit;font-size:16px;color:#2a2622;background:#fff;border:1px solid #e8e2d8;border-radius:8px;padding:11px 12px;margin:0;-webkit-appearance:none;appearance:none}",
    ".lp-f select{background-image:linear-gradient(45deg,transparent 50%,#7a7268 50%),linear-gradient(135deg,#7a7268 50%,transparent 50%);background-position:calc(100% - 17px) 50%,calc(100% - 12px) 50%;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:32px}",
    ".lp-f input:focus,.lp-f select:focus{outline:0;border-color:#d9560b;box-shadow:0 0 0 3px rgba(217,86,11,.13)}",
    ".lp-f .bad{border-color:#c0392b!important}",
    ".lp-ph{display:flex;align-items:stretch}",
    ".lp-cc{display:flex;align-items:center;gap:7px;padding:0 12px;background:#faf7f2;border:1px solid #e8e2d8;border-right:0;border-radius:8px 0 0 8px;font-size:15px;font-weight:600;white-space:nowrap}",
    ".lp-cc svg{width:24px;height:16px;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.12);flex:none}",
    ".lp-ph input{border-radius:0 8px 8px 0}",
    ".lp-hp{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important}",
    ".lp-msg{display:none;margin:0 0 12px;padding:9px 12px;border-radius:8px;background:#fdecea;border:1px solid #f5c6c0;color:#a5281b;font-size:13px}",
    ".lp-msg.on{display:block}",
    ".lp-btn{display:flex;width:100%;align-items:center;justify-content:center;gap:8px;border-radius:8px;font-family:inherit;font-weight:700;font-size:15.5px;padding:14px 16px;border:1px solid #d9560b;background:#d9560b;color:#fff;cursor:pointer;text-decoration:none;transition:background .15s}",
    ".lp-btn:hover{background:#b44508;border-color:#b44508;color:#fff}",
    ".lp-btn.alt{background:#fff;color:#d9560b;font-weight:600}",
    ".lp-btn.alt:hover{background:#fff3e6;color:#b44508}",
    ".lp-fine{margin:12px 0 0;text-align:center;font-size:12px;color:#7a7268}",
    ".lp-trust{display:flex;justify-content:center;flex-wrap:wrap;gap:4px 16px;margin-top:14px;padding-top:12px;border-top:1px solid #e8e2d8;font-size:12px;color:#7a7268}",
    ".lp-trust b{color:#1b7a3a;margin-right:5px}",
    ".lp-c{text-align:center;padding:40px 22px 28px}",
    ".lp-c h3{margin:16px 0 4px;font-size:20px;font-weight:700}",
    ".lp-c p{margin:0;color:#7a7268;font-size:14px}",
    ".lp-spin{width:48px;height:48px;border:4px solid #f1dcc3;border-top-color:#d9560b;border-radius:50%;margin:0 auto;animation:lp-sp .8s linear infinite}",
    "@keyframes lp-sp{to{transform:rotate(360deg)}}",
    ".lp-tick{width:48px;height:48px;border-radius:50%;background:#1b7a3a;color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;margin:0 auto}",
    ".lp-tick.bad{background:#c0392b}",
    ".lp-acts{display:grid;gap:10px;margin-top:22px}",
    "@media (max-width:600px){#lp-ov{align-items:flex-end;padding:0}.lp-m{max-width:none;border-radius:18px 18px 0 0;max-height:96vh;max-height:96dvh}.lp-head{border-radius:18px 18px 0 0}}"
  ].join("\n");

  /* ---------- markup ---------- */
  var opts = '<option value="">Select a machine</option>' + MACHINES.map(function (m) {
    return '<option value="' + m + '">' + m + "</option>";
  }).join("");

  var html =
    '<div class="lp-m" role="dialog" aria-modal="true" aria-labelledby="lp-ttl">' +
      '<button type="button" class="lp-x" id="lp-close" aria-label="Close">&times;</button>' +

      '<section class="lp-v on" id="lp-form-v">' +
        '<div class="lp-head"><h2 id="lp-ttl">Get <span>Best Price</span></h2><p>Share your details and our team will call you.</p></div>' +
        '<form id="lp-form" novalidate>' +
          '<div class="lp-f"><label for="lp-name">Your name <em>*</em></label><input id="lp-name" type="text" autocomplete="name" maxlength="80" placeholder="Enter your name"></div>' +
          '<div class="lp-f"><label for="lp-phone">Mobile number <em>*</em></label><div class="lp-ph">' +
            '<div class="lp-cc"><svg viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="5.34" fill="#FF9933"/><rect y="5.33" width="24" height="5.34" fill="#fff"/><rect y="10.66" width="24" height="5.34" fill="#138808"/><circle cx="12" cy="8" r="2" fill="none" stroke="#000080" stroke-width=".6"/><circle cx="12" cy="8" r=".4" fill="#000080"/></svg>+91</div>' +
            '<input id="lp-phone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="10-digit mobile number"></div></div>' +
          '<div class="lp-f"><label for="lp-machine">Required machine <em>*</em></label><select id="lp-machine">' + opts + '</select></div>' +
          '<input class="lp-hp" id="lp-hp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<div class="lp-msg" id="lp-msg" role="alert"></div>' +
          '<button type="submit" class="lp-btn">Get Best Price</button>' +
          '<p class="lp-fine">By submitting, you agree to be contacted by SSAW on call or WhatsApp.</p>' +
          '<p class="lp-fine">One call from our team, no repeated calls. Your number is never shared or sold.</p>' +
          (REQUIRED ? '<p class="lp-fine">Prefer to talk now? <a href="tel:+919342426468" style="color:#d9560b;font-weight:700;text-decoration:none">Call +91-9342426468</a></p>' : '') +
          '<div class="lp-trust"><span><b>&#10003;</b>Reply within 2 hours</span><span><b>&#10003;</b>Delivery across India</span></div>' +
        '</form>' +
      '</section>' +

      '<section class="lp-v lp-c" id="lp-save-v"><div class="lp-spin"></div><h3>Saving your enquiry</h3><p>Please do not close this window...</p></section>' +

      '<section class="lp-v lp-c" id="lp-done-v"><div class="lp-tick">&#10003;</div><h3>Thank you!</h3><p id="lp-dp"></p>' +
        '<div class="lp-acts"><button type="button" class="lp-btn" id="lp-cont">Continue browsing</button>' +
        '<a class="lp-btn alt" href="tel:+919342426468">Call +91-9342426468</a></div></section>' +

      '<section class="lp-v lp-c" id="lp-err-v"><div class="lp-tick bad">!</div><h3>Could not submit</h3><p>Please check your internet connection and try again.</p>' +
        '<div class="lp-acts"><button type="button" class="lp-btn" id="lp-retry">Try again</button>' +
        '<a class="lp-btn alt" href="tel:+919342426468">Call +91-9342426468</a></div></section>' +
    '</div>';

  var ov, $ = function (id) { return document.getElementById(id); };
  var busy = false, last = null, built = false;

  function build() {
    if (built) return; built = true;
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    ov = document.createElement("div"); ov.id = "lp-ov"; ov.innerHTML = html; document.body.appendChild(ov);

    if (REQUIRED) $("lp-close").style.display = "none";
    $("lp-close").addEventListener("click", close);
    $("lp-cont").addEventListener("click", close);
    ov.addEventListener("mousedown", function (e) { if (e.target === ov && !REQUIRED) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov.classList.contains("on") && !REQUIRED) close(); });

    $("lp-phone").addEventListener("input", function () {
      var v = this.value.replace(/\D/g, "");
      if (v.length > 10 && v.slice(0, 2) === "91") v = v.slice(2);
      if (v.length > 10 && v.charAt(0) === "0") v = v.slice(1);
      this.value = v.slice(0, 10);
    });
    ["lp-name", "lp-phone", "lp-machine"].forEach(function (id) {
      $(id).addEventListener("input", function () { this.classList.remove("bad"); $("lp-msg").classList.remove("on"); });
    });

    $("lp-form").addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy) return;
      var name = $("lp-name").value.trim();
      var phone = $("lp-phone").value.replace(/\D/g, "");
      var machine = $("lp-machine").value;
      if (name.length < 2) return fail("lp-name", "Please enter your name.");
      if (!/^[6-9]\d{9}$/.test(phone)) return fail("lp-phone", "Please enter a valid 10-digit mobile number.");
      if (!machine) return fail("lp-machine", "Please select the machine you need.");
      run({ name: name, phone: phone, machineName: machine, bot: $("lp-hp").value });
    });
    $("lp-retry").addEventListener("click", function () { if (last) run(last); });
  }

  function fail(id, text) {
    $("lp-msg").textContent = text; $("lp-msg").classList.add("on");
    $(id).classList.add("bad");
    try { $(id).focus(); } catch (e) { }
  }

  function view(id) {
    ["lp-form-v", "lp-save-v", "lp-done-v", "lp-err-v"].forEach(function (v) { $(v).classList.toggle("on", v === id); });
    $("lp-close").hidden = REQUIRED || (id === "lp-save-v");
    ov.querySelector(".lp-m").scrollTop = 0;
  }

  function open() {
    build();
    if (!REQUIRED) markSeen();        // closable mode: counts as shown. Required mode: only after a number is saved
    ov.classList.add("on");
    document.documentElement.style.overflow = "hidden";
    view("lp-form-v");
    setTimeout(function () { try { $("lp-name").focus(); } catch (e) { } }, 120);
  }

  function close() {
    if (busy) return;
    ov.classList.remove("on");
    document.documentElement.style.overflow = "";
  }

  /* same sheet + same fields as contactseller.html */
  function send(d) {
    if (d.bot) return Promise.resolve("ok");           // spam bot: pretend success, send nothing
    if (navigator.onLine === false) return Promise.resolve("fail");
    var body = new URLSearchParams();
    body.append("name", d.name);
    body.append("phone", d.phone);
    body.append("address1", "N/A");
    body.append("address2", "N/A");
    body.append("pinCode", "N/A");
    body.append("state", "N/A");
    body.append("machineName", d.machineName);
    body.append("machinePrice", "Quote on Call");
    var req = fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: body, keepalive: true })
      .then(function () { return "ok"; }, function () { return "fail"; });
    var cap = new Promise(function (r) { setTimeout(function () { r("ok"); }, MAX_WAIT); });
    return Promise.race([req, cap]);
  }

  function run(d) {
    busy = true; last = d;
    view("lp-save-v");
    send(d).then(function (res) {
      busy = false;
      if (res === "ok") {
        $("lp-dp").textContent = "Thank you, " + d.name.split(" ")[0] + ". Our team will contact you within 2 hours.";
        try { if (window.gtag && !d.bot) {
          if (AW_CONV.indexOf("YOUR_") === -1) gtag("event", "conversion", { send_to: AW_CONV, value: 1.0, currency: "INR" });
          gtag("event", "generate_lead", { method: "popup" });
        } } catch (e) { }
        markSeen();                   // number saved: never show again in this browser
        view("lp-done-v");
        last = null;
      } else {
        view("lp-err-v");
      }
    });
  }

  /* ---------- when to show ---------- */
  if (REQUIRED) {
    // straight away (a split second after the page loads)
    setTimeout(open, SHOW_DELAY);
  } else {
    // 15-20 s of the visitor actually looking at the page
    var delay = MIN_DELAY + Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1));
    var elapsed = 0, tick = 500, shown = false;
    var timer = setInterval(function () {
      if (document.hidden) return;                    // tab in background: don't count
      elapsed += tick;
      if (elapsed >= delay && !shown) {
        shown = true; clearInterval(timer);
        open();
      }
    }, tick);
  }
})();
