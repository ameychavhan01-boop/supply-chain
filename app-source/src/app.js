(function () {
"use strict";
var D = window.SC_CHAINS, ROLES = window.SC_ROLES, CL = window.SC_CHAIN_LIST, CO = window.SC_COUNTRIES,
    SPOTS = window.SC_SPOTS, ROUTES = window.SC_ROUTES, FACTS = window.SC_FACTS;
var NS = "http://www.w3.org/2000/svg";
function $(s, el) { return (el || document).querySelector(s); }
function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

/* ---------------- Country names ---------------- */
var CNAME = { ZZ: "Sea route", BE: "Belgium", DE: "Germany", JP: "Japan", CN: "China", UA: "Ukraine", TW: "Taiwan", KR: "South Korea", US: "USA", IN: "India", NL: "Netherlands", GB: "UK", SA: "Saudi Arabia", RU: "Russia", AU: "Australia", AE: "UAE", MY: "Malaysia", TH: "Thailand", VN: "Vietnam" };
function flag(cc) { if (!cc || cc === "ZZ") return "🌊"; if (cc.length !== 2) return "🏳️"; try { return String.fromCodePoint.apply(null, cc.toUpperCase().split("").map(function (c) { return 127397 + c.charCodeAt(0); })); } catch (e) { return ""; } }

/* ---------------- Index data ---------------- */
var NODE = {}, NODE_CHAINS = {};
Object.keys(D).forEach(function (cid) {
  var ch = D[cid]; ch.byId = {}; ch.down = {};
  if (ch.roles) { Object.keys(ch.roles).forEach(function (k) { ROLES[cid + "_" + k] = ch.roles[k]; }); ch.nodes.forEach(function (n) { if (n.r.indexOf(cid + "_") !== 0) n.r = cid + "_" + n.r; }); }
  ch.nodes.forEach(function (n) { n.chain = cid; ch.byId[n.id] = n; if (!NODE[n.id]) NODE[n.id] = n; (NODE_CHAINS[n.id] = NODE_CHAINS[n.id] || []).push(cid); ch.down[n.id] = []; });
  ch.nodes.forEach(function (n) { (n.needs || []).forEach(function (p) { if (ch.down[p]) ch.down[p].push(n.id); }); });
  ch.lvIndex = {}; ch.levels.forEach(function (l, i) { ch.lvIndex[l.id] = i; });
});

/* ---------------- Storage ---------------- */
var KEY = "sc_v1";
function defaults() { return { stars: { chains: [], companies: [] }, folders: [], notes: [], risks: [], set: { theme: "midnight", mode: "dark", bg: "#0B1020", accent: "#F5B83D", sound: true, view: "tree" }, lastBackup: 0, installed: Date.now(), lastUpdateAck: Date.now(), backupSnooze: 0 }; }
var ST;
try { ST = JSON.parse(localStorage.getItem(KEY)) || defaults(); } catch (e) { ST = defaults(); }
(function fill(d, s) { for (var k in d) { if (s[k] === undefined) s[k] = d[k]; else if (d[k] && typeof d[k] === "object" && !Array.isArray(d[k])) fill(d[k], s[k]); } })(defaults(), ST);
function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }

/* ---------------- Icons ---------------- */
var P = {
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10.3 5V5a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  tree: '<rect x="9" y="3" width="6" height="4" rx="1"/><rect x="3" y="17" width="6" height="4" rx="1"/><rect x="15" y="17" width="6" height="4" rx="1"/><path d="M12 7v5M6 17v-3h12v3"/>',
  spider: '<circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="12" r="6.5" opacity=".5"/><circle cx="12" cy="12" r="10" opacity=".35"/><path d="M12 2v7.5M12 14.5V22M2 12h7.5M14.5 12H22"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  compare: '<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  bolt2: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  cable: '<path d="M4 20c0-6 4-6 8-8s8-2 8-8"/><circle cx="4" cy="20" r="1.5"/><circle cx="20" cy="4" r="1.5"/>',
  factory: '<path d="M3 21V10l6 3V10l6 3V6l6 3v12z"/><path d="M7 17h2M12 17h2M17 17h2"/>',
  gem: '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 18 3-18"/>',
  pill: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M9.5 8l5 8"/>',
  car: '<path d="M5 16l1.5-5a2 2 0 0 1 2-1.5h7a2 2 0 0 1 2 1.5L19 16"/><rect x="3" y="15" width="18" height="4" rx="1.5"/><circle cx="7" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M22 10v4M7 10v4M11 10v4"/>',
  leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19l7-7"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11L21 7H6.2"/>',
  thread: '<circle cx="12" cy="12" r="8"/><path d="M6 8c4 1 8 1 12 0M5 12c4 1 10 1 14 0M6 16c4 1 8 1 12 0"/>',
  cube: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
  rock: '<path d="M3 18l3-8 5-4 6 2 4 6-2 4z"/>',
  box: '<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  down: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
  up: '<path d="M12 20V8M7 13l5-5 5 5M5 4h14"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
  routes: '<path d="M4 18c4-10 12-10 16 0"/><path d="M17 15l3 3 1-4"/>',
  note: '<path d="M5 3h10l4 4v14H5z"/><path d="M14 3v5h5M8 13h8M8 17h6"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>'
};
function icon(n, extra) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (extra || "") + '>' + (P[n] || "") + "</svg>"; }
function starIcon(on) { return '<svg viewBox="0 0 24 24" fill="' + (on ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">' + P.star + "</svg>"; }

/* ---------------- Time (12-hour) ---------------- */
function fmtTime(ts) {
  var d = new Date(ts), h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
  var mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
  return d.getDate() + " " + mon + " " + d.getFullYear() + ", " + h + ":" + (m < 10 ? "0" : "") + m + " " + ap;
}

/* ---------------- Sound ---------------- */
var AC = null;
function beep(freq, dur, type, vol) {
  if (!ST.set.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    var o = AC.createOscillator(), g = AC.createGain(); o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.06, AC.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + (dur || 0.08));
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + (dur || 0.08) + 0.02);
  } catch (e) {}
}
function tapSound() { beep(880, 0.05, "sine", 0.03); }
function dominoSound(i) { beep(220 - Math.min(i, 20) * 5, 0.12, "triangle", 0.09); }

/* ---------------- Toast / modal / side ---------------- */
var toastT;
function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 2200); }
function openModal(title, html, wide) {
  var m = $("#modal"); $("h2", m).innerHTML = title; $(".bd", m).innerHTML = html; m.classList.toggle("wide", !!wide);
  m.classList.add("on"); $("#veil").classList.add("on"); return $(".bd", m);
}
function closeModal() { $("#modal").classList.remove("on"); $("#veil").classList.remove("on"); }
$("#mClose").innerHTML = icon("x"); $("#mClose").onclick = closeModal; $("#veil").onclick = closeModal;
var side = $("#side");
function openSide(hd, bd) { $(".hd", side).innerHTML = hd; $(".bd", side).innerHTML = bd; $(".bd", side).scrollTop = 0; side.classList.add("open"); document.body.classList.add("sideOpen"); }
function closeSide() { side.classList.remove("open"); document.body.classList.remove("sideOpen"); }

/* ---------------- Themes ---------------- */
var THEMES = {
  midnight: { name: "Midnight Gold", dark: "#0B1020", light: "#F6F3EA", accent: "#F5B83D" },
  ocean: { name: "Ocean", dark: "#04171C", light: "#EEF7F8", accent: "#22D3EE" },
  sunrise: { name: "Sunrise", dark: "#1A0F0A", light: "#FFF6EE", accent: "#FB7A3C" },
  forest: { name: "Forest", dark: "#08140D", light: "#F1F7F1", accent: "#4ADE80" },
  royal: { name: "Royal", dark: "#120B22", light: "#F5F1FC", accent: "#C084FC" }
};
function lum(hex) { var h = hex.replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); var r = parseInt(h.substr(0, 2), 16) / 255, g = parseInt(h.substr(2, 2), 16) / 255, b = parseInt(h.substr(4, 2), 16) / 255; return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function applyTheme() {
  var s = ST.set, bg, acc, light;
  if (s.theme === "custom") { bg = s.bg; acc = s.accent; light = lum(bg) > 0.55; }
  else { var t = THEMES[s.theme] || THEMES.midnight; light = s.mode === "light"; bg = light ? t.light : t.dark; acc = t.accent; }
  document.documentElement.classList.toggle("light", light);
  var r = document.documentElement.style; r.setProperty("--bg", bg); r.setProperty("--accent", acc); r.setProperty("--accent-ink", lum(acc) > 0.5 ? "#111111" : "#FFFFFF");
  var mt = $('meta[name="theme-color"]'); if (mt) mt.setAttribute("content", bg);
}
applyTheme();

/* ---------------- Tabs & routing ---------------- */
var TABS = [["world", "World map", "globe"], ["chains", "All chains", "link"], ["saved", "Saved", "star"], ["settings", "Settings", "gear"]];
var curTab = "world";
$("#tabs").innerHTML = TABS.map(function (t) { return '<button data-t="' + t[0] + '">' + icon(t[2]) + t[1] + "</button>"; }).join("");
$$("#tabs button").forEach(function (b) { b.onclick = function () { tapSound(); showTab(b.dataset.t); }; });
function showTab(t, keepChain) {
  curTab = t; closeSide();
  $$("#tabs button").forEach(function (b) { b.classList.toggle("on", b.dataset.t === t); });
  ["world", "chains", "chainView", "saved", "settings"].forEach(function (s) { $("#" + s).classList.add("hide"); });
  if (t === "chains" && CV.chain && keepChain !== false) { $("#chainView").classList.remove("hide"); setTimeout(CV.resize, 30); }
  else { $("#" + t).classList.remove("hide"); }
  if (t === "chains" && (!CV.chain || keepChain === false)) renderChains();
  if (t === "saved") renderSaved();
  if (t === "settings") renderSettings();
  if (t === "world") setTimeout(W.resize, 30);
}

/* ================= SEARCH ================= */
var sInp = $("#search"), sRes = $("#results");
$("#searchWrap").insertAdjacentHTML("afterbegin", icon("search"));
function searchAll(q) {
  q = q.trim().toLowerCase(); if (!q) return [];
  var out = [];
  CL.forEach(function (c) { if (c.name.toLowerCase().indexOf(q) >= 0) out.push({ t: "chain", id: c.id, label: c.name, sub: c.ready ? "Chain" : "Chain · coming next" }); });
  Object.keys(NODE).forEach(function (id) { var n = NODE[id]; var hay = (n.n + " " + (n.x || "") + " " + (n.nse || "") + " " + (CNAME[n.c] || "")).toLowerCase(); if (hay.indexOf(q) >= 0) out.push({ t: "node", id: id, label: flag(n.c) + " " + n.n, sub: n.nse ? "NSE: " + n.nse : ROLES[n.r].name }); });
  W.list.forEach(function (w) { var cc = w.a2, c = CO[cc]; var hay = (w.n + " " + (CNAME[cc] || "") + " " + (c ? c.exports.join(" ") : "")).toLowerCase(); if (hay.indexOf(q) >= 0) out.push({ t: "country", id: cc, label: flag(cc) + " " + ((c && c.name) || w.n), sub: "Country" }); });
  SPOTS.forEach(function (s) { if ((s.name + " " + s.note).toLowerCase().indexOf(q) >= 0) out.push({ t: "spot", id: s.id, label: "🌊 " + s.name, sub: "Sea chokepoint" }); });
  /* product words */
  Object.keys(NODE).forEach(function (id) { var n = NODE[id]; if (out.some(function (o) { return o.id === id; })) return; if ((n.d + " " + n.w).toLowerCase().indexOf(q) >= 0 && q.length > 3) out.push({ t: "node", id: id, label: flag(n.c) + " " + n.n, sub: "mentions “" + q + "”" }); });
  return out.slice(0, 24);
}
var sItems = [];
sInp.addEventListener("input", function () {
  sItems = searchAll(sInp.value);
  if (!sInp.value.trim()) { sRes.classList.add("hide"); return; }
  sRes.innerHTML = sItems.length ? sItems.map(function (r, i) { return '<div class="r' + (i === 0 ? " on" : "") + '" data-i="' + i + '">' + esc(r.label) + "<small>" + esc(r.sub) + "</small></div>"; }).join("") : '<div class="r muted">No match</div>';
  sRes.classList.remove("hide");
  $$(".r[data-i]", sRes).forEach(function (d) { d.onclick = function () { pickSearch(sItems[+d.dataset.i]); }; });
});
sInp.addEventListener("keydown", function (e) { if (e.key === "Enter" && sItems[0]) pickSearch(sItems[0]); if (e.key === "Escape") { sInp.value = ""; sRes.classList.add("hide"); } });
document.addEventListener("pointerdown", function (e) { if (!$("#searchWrap").contains(e.target)) sRes.classList.add("hide"); });
function pickSearch(r) {
  sRes.classList.add("hide"); sInp.value = ""; sInp.blur(); tapSound();
  if (r.t === "chain") openChain(r.id);
  else if (r.t === "node") openChain(NODE[r.id].chain, r.id);
  else if (r.t === "country") { showTab("world"); setTimeout(function () { W.zoomCountry(r.id); }, 80); }
  else if (r.t === "spot") { showTab("world"); setTimeout(function () { W.openSpot(r.id); }, 80); }
}

/* ================= WORLD MAP ================= */
var W = (function () {
  var WD = window.SC_WORLD, svg = $("#worldSvg"), MW = WD.W, MH = WD.H, SS = WD.S, Y0 = WD.Y0;
  function ym(lat) { return 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * Math.PI / 180)); }
  function pr(lon, lat) { lat = Math.max(-89, Math.min(89, lat)); return [(lon + 180) * MW / 360, SS * (Y0 - ym(lat))]; }
  function inv(x, y) { var m = Y0 - y / SS; return [x * 360 / MW - 180, (Math.atan(Math.exp(m / 1.25)) - Math.PI / 4) / 0.4 * 180 / Math.PI]; }
  var SHORT = { CD: "DR Congo", CG: "Congo", KR: "South Korea", KP: "North Korea", CF: "C. African Rep.", AE: "UAE", BA: "Bosnia & Herz.", DO: "Dominican Rep.", TT: "Trinidad & Tobago", TF: "Fr. S. Antarctic Lands" };
  var LONG = { CD: "DR Congo (Democratic Republic of the Congo)", CG: "Republic of the Congo", KR: "South Korea", KP: "North Korea", AE: "United Arab Emirates", US: "United States" };
  var WC = {}; WD.countries.forEach(function (c) { WC[c.a2] = c; if (LONG[c.a2]) c.n = LONG[c.a2]; if (!CNAME[c.a2]) CNAME[c.a2] = SHORT[c.a2] || c.n; });
  var CAP = {}; WD.caps.forEach(function (c) { CAP[c.a3] = c; });
  var GDPR = {}; (window.SC_GDP ? window.SC_GDP.list : []).forEach(function (r, i) { GDPR[r[0]] = { rank: i + 1, v: r[1] }; });
  var NOTES = window.SC_PLACE_NOTES || {};
  var vb = { x: 0, y: 0, w: MW, h: MH }, home = null, riskMode = false, showRoutes = true, selected = null, power = false, lastBucket = null;

  svg.innerHTML = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M1 1L9 5L1 9z" fill="context-stroke"/></marker></defs>';
  var gSea = el("g", {}, svg), gGrat = el("g", { "class": "grat" }, svg), gC = el("g", {}, svg), gR = el("g", {}, svg), gDep = el("g", {}, svg),
      gSeaL = el("g", {}, svg), gCap = el("g", {}, svg), gL = el("g", {}, svg), gS = el("g", {}, svg), gRisk = el("g", {}, svg);
  el("rect", { x: -MW, y: -MH, width: MW * 3, height: MH * 3, "class": "sea" }, gSea);
  /* graticule every 30° */
  for (var lo = -150; lo <= 150; lo += 30) { var a = pr(lo, 84), b = pr(lo, -58); el("path", { d: "M" + a[0] + " " + a[1] + "V" + b[1] }, gGrat); }
  [-30, 0, 30, 60].forEach(function (la) { var y = pr(0, la)[1]; el("path", { d: "M0 " + y + "H" + MW, "class": la === 0 ? "eq" : "" }, gGrat); });

  /* countries */
  WD.countries.forEach(function (c) {
    var cls = "ctry m" + (c.mc || 1) + (GDPR[c.a2] ? " top" : "") + (CO[c.a2] ? " pw-" + CO[c.a2].cat : "");
    el("path", { d: c.d, "class": cls, "data-cc": c.a2 }, gC);
  });
  /* labels */
  var LBL = [];
  WD.countries.forEach(function (c) {
    if (c.a2.length !== 2) return;
    var sz = c.lr <= 2 ? "l1" : c.lr <= 3 ? "l2" : c.lr <= 4 ? "l3" : "l4";
    var t = el("text", { x: c.lx, y: c.ly, "text-anchor": "middle", "dominant-baseline": "central", "class": "cl " + sz }, gL);
    t.textContent = SHORT[c.a2] || c.n;
    var txt = SHORT[c.a2] || c.n, fs = { l1: 11.5, l2: 10.5, l3: 9.5, l4: 9 }[sz], up = c.lr <= 3;
    LBL.push({ e: t, ml: c.ml, cc: c.a2, x: c.lx, y: c.ly, wf: txt.length * fs * (up ? 0.72 : 0.56) + 4, hf: fs + 2, pri: c.lr * 1000 - (c.ar || 0) });
  });
  LBL.sort(function (a, b) { return a.pri - b.pri; });
  var CAPL = [];
  WD.caps.forEach(function (c) {
    var g = el("g", { "class": "cap" }, gCap);
    var d = el("text", { x: c.x, y: c.y, "text-anchor": "middle", "dominant-baseline": "central", "class": "capDot" }, g); d.textContent = "●";
    var t = el("text", { x: c.x, y: c.y, dx: 0, "class": "capTxt" }, g); t.textContent = c.n;
    var cc = null; WD.countries.forEach(function (k) { if (k.a3 === c.a3) cc = k; });
    CAPL.push({ e: g, ml: cc ? cc.ml : 5, x: c.x, y: c.y, wf: 8 + c.n.length * 5.4, hf: 12 });
  });
  var SEAL = [];
  (WD.seas || []).forEach(function (s) {
    var t = el("text", { x: s.x, y: s.y, "text-anchor": "middle", "dominant-baseline": "central", "class": "seaTxt r" + s.r }, gSeaL); t.textContent = s.n;
    SEAL.push({ e: t, r: s.r });
  });

  var RC = { tech: "#A78BFA", energy: "#FBBF24", materials: "#2DD4BF", factory: "#FB923C" };
  function curve(a, b, bend) {
    var dx = b[0] - a[0], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    var cy = my - Math.abs(dx) * (bend || 0.22) - 6;
    return "M" + a[0] + " " + a[1] + " Q" + mx + " " + cy + " " + b[0] + " " + b[1];
  }
  var CTR_FIX = { US: [-98, 39], CA: [-100, 56], RU: [60, 58], FR: [2.5, 46.6], NO: [9, 61], CL: [-71, -30] };
  function ctr(cc) { if (CTR_FIX[cc]) return pr(CTR_FIX[cc][0], CTR_FIX[cc][1]); var c = WC[cc]; return c ? [c.lx, c.ly] : null; }
  ROUTES.forEach(function (r) {
    var a = ctr(r.from), b = ctr(r.to); if (!a || !b) return;
    var p = el("path", { d: curve(a, b, 0.22), "class": "route", stroke: RC[r.cat], "marker-end": "url(#ah)", pathLength: 100 }, gR);
    el("title", {}, p).textContent = r.label;
  });
  /* scaled point items (spots, risks) */
  var PTS = [];
  function ptItem(parent, x, y, attrs) { var g = el("g", attrs, parent); PTS.push({ g: g, x: x, y: y }); return g; }
  SPOTS.forEach(function (s) {
    var c = pr(s.lon, s.lat), g = ptItem(gS, c[0], c[1], { "class": "spot choke", "data-spot": s.id });
    el("circle", { r: 13, "class": "hit" }, g);
    el("path", { d: "M0 -7L7 0L0 7L-7 0Z", "class": "h" }, g); el("path", { d: "M0 -5L5 0L0 5L-5 0Z", "class": "c" }, g);
    var t = el("text", { x: 9, y: 4, "class": "spotTxt" }, g); t.textContent = s.name;
  });
  function drawRisks() {
    gRisk.innerHTML = ""; PTS = PTS.filter(function (p) { return !!p.g.parentNode; });
    ST.risks.forEach(function (r) { var c = pr(r.lon, r.lat), g = ptItem(gRisk, c[0], c[1], { "class": "spot risk", "data-risk": r.id }); el("circle", { r: 12, "class": "hit" }, g); el("circle", { r: 8, "class": "h" }, g); el("circle", { r: 5, "class": "c" }, g); var t = el("text", { x: 9, y: 4, "class": "spotTxt", style: "fill:#FF6B81" }, g); t.textContent = r.title; });
    placePts();
  }
  var K = 1;
  function placePts() { PTS.forEach(function (p) { p.g.setAttribute("transform", "translate(" + p.x + "," + p.y + ") scale(" + K + ")"); }); }
  function labelVis() {
    var wz = Math.log(MW / vb.w) / Math.LN2 + 2.3, bucket = Math.round(wz * 4);
    if (bucket === lastBucket) return; lastBucket = bucket;
    LBL.forEach(function (l) { l.e.classList.toggle("hd", l.ml > wz + 0.35); });
    var capOn = wz >= 3.9; CAPL.forEach(function (c) { c.e.classList.toggle("hd", !capOn || c.ml > wz + 0.2); });
    svg.classList.toggle("far", wz < 3.1);
    /* hide labels that would overlap (bigger countries win) */
    var placed = [];
    function tryPlace(b) { for (var i = 0; i < placed.length; i++) { var p = placed[i]; if (b[0] < p[2] && b[2] > p[0] && b[1] < p[3] && b[3] > p[1]) return false; } placed.push(b); return true; }
    LBL.forEach(function (l) { if (l.e.classList.contains("hd")) return; var hw = l.wf * K / 2, hh = l.hf * K / 2; if (!tryPlace([l.x - hw, l.y - hh, l.x + hw, l.y + hh])) l.e.classList.add("hd"); });
    CAPL.forEach(function (c) { if (c.e.classList.contains("hd")) return; if (!tryPlace([c.x - 4 * K, c.y - 6 * K, c.x + c.wf * K, c.y + 6 * K])) c.e.classList.add("hd"); });
    SEAL.forEach(function (s) { var need = s.r === 0 ? 0 : s.r === 1 ? 2.9 : s.r === 2 ? 3.7 : 4.5; s.e.classList.toggle("hd", wz < need || (s.r === 0 && wz > 5.2)); });
  }
  function setVB(v) {
    if (v.w !== vb.w) lastBucket = lastBucket; vb = v; svg.setAttribute("viewBox", v.x + " " + v.y + " " + v.w + " " + v.h);
    var px = svg.clientWidth || 1000; K = v.w / px; svg.style.setProperty("--k", K); placePts(); labelVis();
  }
  drawRisks();
  function fitHome() {
    var W_ = svg.clientWidth || 1000, H_ = svg.clientHeight || 600, ar = W_ / H_;
    var h = MH * 1.02, w = h * ar; if (w < MW * 1.02) { w = MW * 1.02; h = w / ar; }
    home = { x: (MW - w) / 2, y: (MH - h) / 2 - 4, w: w, h: h };
    return home;
  }
  function animVB(to, ms, done) {
    var from = { x: vb.x, y: vb.y, w: vb.w, h: vb.h }, t0 = performance.now();
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    (function step(now) { var t = Math.min(1, (now - t0) / ms), e = ease(t);
      /* zoom in log space so it feels smooth */
      var lw = Math.exp(Math.log(from.w) + (Math.log(to.w) - Math.log(from.w)) * e), f = (from.w === to.w) ? e : (from.w - lw) / (from.w - to.w);
      setVB({ x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f, w: lw, h: lw * to.h / to.w });
      if (t < 1) requestAnimationFrame(step); else if (done) done(); })(t0);
  }
  function resize() { var h = fitHome(); lastBucket = null; if (!selected) setVB(h); else setVB(vb); }
  function clampW(w) { return Math.max(6, Math.min(MW * 1.6, w)); }
  /* --- pan & pinch --- */
  var pts = {}, drag = null, moved = false, downT = null;
  function svgPt(cx, cy) { var r = svg.getBoundingClientRect(); return [vb.x + (cx - r.left) / r.width * vb.w, vb.y + (cy - r.top) / r.height * vb.h]; }
  svg.addEventListener("pointerdown", function (e) { if (e.isPrimary) { pts = {}; downT = e.target; } try { svg.setPointerCapture(e.pointerId); } catch (x) {} pts[e.pointerId] = [e.clientX, e.clientY]; moved = false; drag = { vb: { x: vb.x, y: vb.y, w: vb.w, h: vb.h }, p: Object.assign({}, pts) }; });
  svg.addEventListener("pointermove", function (e) {
    if (!pts[e.pointerId] || !drag) return; pts[e.pointerId] = [e.clientX, e.clientY];
    var ids = Object.keys(pts), r = svg.getBoundingClientRect();
    if (ids.length === 1) {
      var s = drag.p[ids[0]]; if (!s) return; var dx = e.clientX - s[0], dy = e.clientY - s[1]; if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (moved) setVB({ x: drag.vb.x - dx / r.width * drag.vb.w, y: drag.vb.y - dy / r.height * drag.vb.h, w: drag.vb.w, h: drag.vb.h });
    } else if (ids.length >= 2) {
      moved = true; var a0 = drag.p[ids[0]], b0 = drag.p[ids[1]], a1 = pts[ids[0]], b1 = pts[ids[1]]; if (!a0 || !b0) return;
      var d0 = Math.hypot(a0[0] - b0[0], a0[1] - b0[1]), d1 = Math.hypot(a1[0] - b1[0], a1[1] - b1[1]); var k = d0 / Math.max(1, d1);
      var m0x = (a0[0] + b0[0]) / 2, m0y = (a0[1] + b0[1]) / 2, m1x = (a1[0] + b1[0]) / 2, m1y = (a1[1] + b1[1]) / 2;
      var w = clampW(drag.vb.w * k), h = w * drag.vb.h / drag.vb.w;
      var fx = drag.vb.x + (m0x - r.left) / r.width * drag.vb.w, fy = drag.vb.y + (m0y - r.top) / r.height * drag.vb.h;
      setVB({ x: fx - (m1x - r.left) / r.width * w, y: fy - (m1y - r.top) / r.height * h, w: w, h: h });
    }
  });
  function up(e) {
    delete pts[e.pointerId]; if (Object.keys(pts).length) { drag = { vb: { x: vb.x, y: vb.y, w: vb.w, h: vb.h }, p: Object.assign({}, pts) }; return; }
    drag = null; if (moved) return;
    var t = downT || e.target;
    var risk = t.closest && t.closest("[data-risk]"); if (risk) return openRisk(risk.dataset.risk);
    var spot = t.closest && t.closest("[data-spot]"); if (spot && !riskMode) return openSpot(spot.dataset.spot);
    var cc = t.getAttribute && t.getAttribute("data-cc");
    if (riskMode) { var q = svgPt(e.clientX, e.clientY), ll = inv(q[0], q[1]); return addRisk(ll[0], ll[1]); }
    if (cc) return zoomCountry(cc);
    if (side.classList.contains("open")) { clearSel(); closeSide(); }
  }
  svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", function (e) { delete pts[e.pointerId]; drag = null; });
  svg.addEventListener("wheel", function (e) { e.preventDefault(); var k = e.deltaY > 0 ? 1.12 : 0.89, q = svgPt(e.clientX, e.clientY); var w = clampW(vb.w * k), h = w * vb.h / vb.w; setVB({ x: q[0] - (q[0] - vb.x) * w / vb.w, y: q[1] - (q[1] - vb.y) * h / vb.h, w: w, h: h }); }, { passive: false });
  function zoomBy(k) { var cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2, w = clampW(vb.w / k), h = w * vb.h / vb.w; animVB({ x: cx - w / 2, y: cy - h / 2, w: w, h: h }, 350); }

  function clearSel() { $$(".ctry", gC).forEach(function (p) { p.classList.remove("dim", "sel"); }); gDep.innerHTML = ""; gR.style.opacity = showRoutes ? 1 : 0; selected = null; }
  function goHome() { clearSel(); closeSide(); animVB(fitHome(), 900); }
  function focusBox(b, cb) {
    var r = svg.getBoundingClientRect(), panelW = Math.min(420, r.width * 0.92), visW = Math.max(200, r.width - panelW - 40), ar = r.width / r.height;
    var bw = (b[2] - b[0]) * 1.5, bh = (b[3] - b[1]) * 1.5; bw = Math.max(bw, 14); bh = Math.max(bh, 10);
    var w = Math.max(bw * r.width / visW, bh * ar), h = w / ar;
    var cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, upp = w / r.width, centerPx = (r.width - panelW) / 2;
    animVB({ x: cx - centerPx * upp, y: cy - h / 2, w: w, h: h }, 1000, cb);
  }
  function zoomCountry(cc) {
    var c = WC[cc]; if (!c) return;
    tapSound(); selected = cc;
    $$(".ctry", gC).forEach(function (p) { p.classList.toggle("dim", p.dataset.cc !== cc); p.classList.toggle("sel", p.dataset.cc === cc); });
    gR.style.opacity = 0.12; gDep.innerHTML = "";
    focusBox(c.zb || c.bb, function () { drawDeps(cc); });
    countryPanel(cc);
  }
  function drawDeps(cc) {
    gDep.innerHTML = ""; if (!CO[cc] || selected !== cc) return; var a = ctr(cc);
    (CO[cc].dependents || []).forEach(function (d, i) { var b = ctr(d); if (!b) return; el("path", { d: curve(a, b, 0.18), "class": "depArrow", "marker-end": "url(#ah)", pathLength: 300, style: "animation-delay:" + (i * 0.18) + "s" }, gDep); });
  }
  /* all companies (from every chain) based in a country */
  function companiesIn(cc) {
    var out = [];
    Object.keys(D).forEach(function (cid) { D[cid].nodes.forEach(function (n) { if (n.c === cc) out.push({ cid: cid, n: n }); }); });
    return out;
  }
  function chainsWith(list) { var s = []; list.forEach(function (x) { if (s.indexOf(x.cid) < 0) s.push(x.cid); }); return s; }
  function companyButtons(list) {
    var by = {}; list.forEach(function (x) { (by[x.cid] = by[x.cid] || []).push(x.n); });
    return Object.keys(by).map(function (cid) {
      return '<div class="muted small" style="margin:10px 0 4px">' + esc(D[cid].name) + "</div>" + by[cid].map(function (n) { return '<button class="cobtn" data-node="' + cid + ":" + n.id + '">' + esc(n.n) + (n.nse ? ' <span class="pill a">NSE</span>' : "") + "</button>"; }).join("");
    }).join("");
  }
  function whatIfFor(cc, list) {
    var chs = chainsWith(list), name = (CO[cc] && CO[cc].name) || CNAME[cc] || cc;
    function go(cid) { closeModal(); openChain(cid); setTimeout(function () { CV.askSeverity({ country: cc }); }, 350); }
    if (chs.length === 1) return go(chs[0]);
    openModal("What if " + esc(name) + " stops exports?", '<p class="muted">Which chain do you want to test?</p><div class="sev">' + chs.map(function (cid) { var n = list.filter(function (x) { return x.cid === cid; }).length; return '<button data-wc="' + cid + '">' + esc(D[cid].name) + "<small>" + n + " compan" + (n === 1 ? "y" : "ies") + " from " + esc(name) + "</small></button>"; }).join("") + "</div>");
    $$("[data-wc]", $("#modal")).forEach(function (b) { b.onclick = function () { go(b.dataset.wc); }; });
  }
  function wireNodes() { $$("[data-node]", side).forEach(function (b) { b.onclick = function () { var p = b.dataset.node.split(":"); openChain(p[0], p[1]); }; }); }
  function gdpText(v) { return v >= 1000 ? "$" + (v / 1000).toFixed(2) + " trillion" : "$" + Math.round(v) + " billion"; }
  function countryPanel(cc) {
    var w = WC[cc], c = CO[cc], g = GDPR[cc], cap = CAP[w.a3], list = companiesIn(cc), G = window.SC_GDP;
    var name = (c && c.name) || w.n;
    var hd = '<div style="font-size:36px;line-height:1">' + flag(cc) + '</div><div class="t"><h2>' + esc(name) + '</h2><div class="muted small">' + (g ? "No. " + g.rank + " economy in the world" : esc(w.cont)) + (c ? " · " + catName(c.cat) : "") + '</div></div><button class="iconbtn" id="wHome" title="Back to world">' + icon("globe") + "</button>";
    var bd = '<div class="kv">' +
      (cap ? '<div class="k">Capital</div><div>' + esc(cap.n) + "</div>" : "") +
      '<div class="k">Continent</div><div>' + esc(w.cont) + "</div>" +
      (g ? '<div class="k">GDP 2026</div><div><span class="tapnum" id="wGdp">' + gdpText(g.v) + '</span> <span class="ap">IMF estimate</span></div><div class="k">World rank</div><div>No. ' + g.rank + " of 191</div>" : '<div class="k">GDP rank</div><div class="muted">Outside top 100</div>') +
      "</div>" +
      (NOTES[cc] ? "<h3>Why it matters</h3><p>" + esc(NOTES[cc]) + "</p>" : "") +
      (c ? '<h3>What it exports</h3><ul>' + c.exports.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
        '<h3>What it imports + from where</h3><div class="kv">' + c.imports.map(function (x) { return '<div class="k">' + esc(x[0]) + "</div><div>" + esc(x[1]) + "</div>"; }).join("") + "</div>" +
        '<h3>Who depends on it</h3><div>' + (c.dependents || []).map(function (d) { return '<button class="cobtn" data-cc="' + d + '">' + flag(d) + " " + esc((CO[d] && CO[d].name) || CNAME[d] || d) + "</button>"; }).join("") + "</div>" : "") +
      "<h3>Its companies in the app (" + list.length + ")</h3>" + (list.length ? companyButtons(list) : '<span class="muted small">None yet — will come with more chains.</span>') +
      (list.length ? '<div class="sep"></div><button class="btn red" id="wWhatIf">' + icon("bolt") + "What if " + esc(name) + " stops exports?</button>" : "");
    openSide(hd, bd);
    $("#wHome").onclick = goHome;
    $$("[data-cc]", side).forEach(function (b) { b.onclick = function () { zoomCountry(b.dataset.cc); }; });
    wireNodes();
    var gb = $("#wGdp"); if (gb) gb.onclick = function () { openModal("Where this number comes from", '<p style="font-size:18px;font-weight:700">' + esc(name) + " GDP 2026: " + gdpText(g.v) + "</p><p class=\"muted\">As of: " + esc(G.date) + "</p><p>Source: " + esc(G.src) + '</p><a class="srcLink" href="' + esc(G.url) + '" target="_blank" rel="noopener">Open source ↗</a><p class="small muted" style="margin-top:14px"><span class="ap">approx</span> IMF numbers are projections in US dollars and change twice a year.</p>'); };
    var wb = $("#wWhatIf"); if (wb) wb.onclick = function () { whatIfFor(cc, list); };
  }
  function openSpot(id) {
    var s = SPOTS.filter(function (x) { return x.id === id; })[0]; if (!s) return; tapSound();
    selected = "spot"; var c = pr(s.lon, s.lat); gR.style.opacity = 0.35;
    $$(".ctry", gC).forEach(function (p) { p.classList.remove("dim", "sel"); });
    focusBox([c[0] - 9, c[1] - 6, c[0] + 9, c[1] + 6]);
    var nodes = (s.nodes || []).map(function (k) { var p = k.split(":"); return D[p[0]] && D[p[0]].byId[p[1]] ? { cid: p[0], n: D[p[0]].byId[p[1]] } : null; }).filter(Boolean);
    openSide('<div style="font-size:30px;line-height:1">🌊</div><div class="t"><h2>' + esc(s.name) + '</h2><div class="muted small">Sea chokepoint</div></div><button class="iconbtn" id="wHome">' + icon("globe") + "</button>",
      "<p>" + esc(s.note) + "</p>" + (nodes.length ? "<h3>Open in chain</h3>" + companyButtons(nodes) +
      '<div class="sep"></div><button class="btn red" id="wWhatIf">' + icon("bolt") + "What if " + esc(s.name) + " closes?</button>" : ""));
    $("#wHome").onclick = goHome; wireNodes();
    var wb = $("#wWhatIf"); if (wb) wb.onclick = function () { var x = nodes[0]; openChain(x.cid, x.n.id); setTimeout(function () { CV.askSeverity({ node: x.n.id }); }, 500); };
  }
  function addRisk(lon, lat) {
    openModal("Mark a risk spot", '<p class="muted">Example: “Strike at port”, “War zone”, “Flood”.</p><input class="inp" id="rkT" placeholder="Title" style="width:100%"><div style="height:10px"></div><textarea id="rkN" placeholder="Note (optional)"></textarea><div class="row" style="margin-top:14px"><button class="btn acc" id="rkS">' + icon("check") + "Save spot</button></div>");
    setTimeout(function () { $("#rkT").focus(); }, 200);
    $("#rkS").onclick = function () { var t = $("#rkT").value.trim() || "Risk"; ST.risks.push({ id: "r" + Date.now(), lon: lon, lat: lat, title: t, note: $("#rkN").value.trim(), ts: Date.now() }); save(); drawRisks(); closeModal(); toast("Risk spot saved"); };
  }
  function openRisk(id) {
    var r = ST.risks.filter(function (x) { return x.id === id; })[0]; if (!r) return;
    openModal(esc(r.title), '<div class="muted small">' + fmtTime(r.ts) + "</div><p>" + esc(r.note || "No note.") + '</p><button class="btn red" id="rkD">' + icon("trash") + "Delete spot</button>");
    $("#rkD").onclick = function () { ST.risks = ST.risks.filter(function (x) { return x.id !== id; }); save(); drawRisks(); closeModal(); };
  }
  function catName(c) { return { tech: "Technology power", energy: "Energy power", materials: "Materials power", factory: "Factory power", mix: "Mixed economy" }[c] || ""; }
  /* overlays */
  var fi = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5) % FACTS.length;
  $("#fact").innerHTML = '<div class="k">Did you know?</div><p>' + esc(FACTS[fi]) + "</p>";
  function legend() {
    var h = power ? [["tech", "#7C5CFF", "Technology power"], ["energy", "#F59E0B", "Energy power"], ["materials", "#14B8A6", "Materials power"], ["factory", "#EF6A3A", "Factory power"], ["mix", "#E9B43C", "Mixed"]].map(function (x) { return '<div class="i"><span class="d" style="background:' + x[1] + '"></span>' + x[2] + "</div>"; }).join("")
      : '<div class="i"><span class="capDotL">●</span>Capital city</div><div class="i"><span class="chokeL"></span>Sea chokepoint</div>' + [["#FBBF24", "Energy route"], ["#A78BFA", "Tech route"], ["#2DD4BF", "Materials route"], ["#FB923C", "Factory goods"]].map(function (x) { return '<div class="i"><span class="ln" style="background:' + x[0] + '"></span>' + x[1] + "</div>"; }).join("");
    $("#legend").innerHTML = h + '<div class="i muted small" style="margin-top:6px">Tap any country · pinch to zoom</div>';
  }
  legend();
  $("#worldTools").innerHTML = '<button class="btn ghost" id="tRoutes">' + icon("routes") + 'Trade routes</button><button class="btn ghost" id="tPow">' + icon("star") + 'Top 10 powers</button><button class="btn ghost" id="tRisk">' + icon("pin") + 'Mark risk spot</button><button class="btn ghost" id="tIn">' + icon("plus") + '</button><button class="btn ghost" id="tOut">' + icon("minus") + '</button><button class="btn ghost" id="tHome">' + icon("fit") + "Full world</button>";
  $("#tRoutes").classList.add("on");
  $("#tRoutes").onclick = function () { showRoutes = !showRoutes; this.classList.toggle("on", showRoutes); gR.style.opacity = showRoutes ? 1 : 0; };
  $("#tPow").onclick = function () { power = !power; this.classList.toggle("on", power); svg.classList.toggle("power", power); legend(); };
  $("#tRisk").onclick = function () { riskMode = !riskMode; this.classList.toggle("on", riskMode); $("#riskHint").classList.toggle("hide", !riskMode); };
  $("#tIn").onclick = function () { zoomBy(1.6); }; $("#tOut").onclick = function () { zoomBy(1 / 1.6); };
  $("#tHome").onclick = goHome;
  window.addEventListener("resize", resize);
  setTimeout(resize, 30);
  return { resize: resize, zoomCountry: zoomCountry, openSpot: openSpot, goHome: goHome, has: function (cc) { return !!WC[cc]; }, list: WD.countries };
})();

/* ================= ALL CHAINS ================= */
function renderChains() {
  var groups = {}; CL.forEach(function (c) { (groups[c.group] = groups[c.group] || []).push(c); });
  var h = '<div class="row" style="justify-content:space-between;margin-top:8px"><div><h1>All chains</h1><div class="muted">Tap a chain to see who makes what, who depends on whom.</div></div><button class="btn" id="cmpBtn">' + icon("compare") + "Compare</button></div>";
  Object.keys(groups).forEach(function (g) {
    h += "<h2>" + esc(g) + '</h2><div class="chainGrid">' + groups[g].map(function (c) {
      var ch = D[c.id], st = ST.stars.chains.indexOf(c.id) >= 0;
      return '<div class="chainCard' + (c.ready ? "" : " lock") + '" data-c="' + c.id + '"><div class="ic">' + icon(c.icon) + '</div><div class="nm">' + esc(c.name) + '</div><div class="muted small">' + (c.ready ? ch.nodes.length + " companies · " + ch.levels.length + " levels" : "Coming next — ask Claude to add") + "</div>" +
        (c.ready ? '<button class="iconbtn star" data-star="' + c.id + '" style="color:' + (st ? "var(--accent)" : "inherit") + '">' + starIcon(st) + "</button>" : "") + "</div>";
    }).join("") + "</div>";
  });
  $("#chainsList").innerHTML = h;
  $$(".chainCard", $("#chainsList")).forEach(function (c) { c.onclick = function (e) { if (e.target.closest("[data-star]")) return; var info = CL.filter(function (x) { return x.id === c.dataset.c; })[0]; if (!info.ready) { toast(info.name + " — coming next"); return; } openChain(c.dataset.c); }; });
  $$("[data-star]", $("#chainsList")).forEach(function (b) { b.onclick = function () { toggleStar("chains", b.dataset.star); renderChains(); }; });
  $("#cmpBtn").onclick = function () { openCompare(); };
}
function toggleStar(kind, id) {
  var a = ST.stars[kind], i = a.indexOf(id);
  if (i >= 0) { a.splice(i, 1); ST.folders.forEach(function (f) { f.items = f.items.filter(function (x) { return !(x.k === kind && x.id === id); }); }); toast("Removed from Saved"); }
  else { a.push(id); toast("Saved ★"); }
  save(); tapSound();
}

/* ================= CHAIN VIEW ================= */
var CV = (function () {
  var svg = $("#chainSvg"), scene = $("#scene"), wrap = $("#canvasWrap");
  var st = { chain: null, view: ST.set.view || "tree", sel: null, pos: {}, bounds: null, t: { x: 0, y: 0, k: 1 }, wi: null };
  var NW = 210, NH = 80, GX = 26, PER = 9;
  var api = { chain: null };

  function layoutTree(ch) {
    var pos = {}, labels = [], y = 0, rowW = PER * NW + (PER - 1) * GX;
    ch.levels.forEach(function (lv, li) {
      var ns = ch.nodes.filter(function (n) { return n.lv === lv.id; }), rows = [];
      for (var i = 0; i < ns.length; i += PER) rows.push(ns.slice(i, i + PER));
      var top = y;
      rows.forEach(function (r) { var w = r.length * NW + (r.length - 1) * GX, x0 = -w / 2; r.forEach(function (n, i) { pos[n.id] = { x: x0 + i * (NW + GX), y: y, w: NW, h: NH }; }); y += NH + 26; });
      labels.push({ lv: lv, x: -rowW / 2 - 30, y: top, h: y - top - 26 });
      y += 70;
    });
    return { pos: pos, labels: labels, bounds: { x: -rowW / 2 - 330, y: -40, w: rowW + 380, h: y } };
  }
  var CW = 72;
  function layoutSpider(ch) {
    var pos = {}, rings = [], R0 = 200, DR = 125, Rprev = 0;
    ch.levels.forEach(function (lv, li) {
      var ns = ch.nodes.filter(function (n) { return n.lv === lv.id; });
      var R = Math.max(li ? Rprev + DR : R0, ns.length * 150 / (2 * Math.PI)); Rprev = R;
      var step = 2 * Math.PI / ns.length, off = -Math.PI / 2 + step / 2 + (li % 2) * step * 0.3;
      ns.forEach(function (n, i) { var a = off + i * step; pos[n.id] = { x: Math.cos(a) * R - CW / 2, y: Math.sin(a) * R - CW / 2, w: CW, h: CW }; });
      rings.push({ lv: lv, R: R });
    });
    var M = Rprev + 130;
    return { pos: pos, rings: rings, bounds: { x: -M, y: -M, w: 2 * M, h: 2 * M } };
  }
  function wrapName(s) {
    if (s.length <= 23) return [s];
    var w = s.split(" "), a = "", b = ""; for (var i = 0; i < w.length; i++) { if ((a + " " + w[i]).trim().length <= 23 && !b) a = (a + " " + w[i]).trim(); else b = (b + " " + w[i]).trim(); }
    if (b.length > 25) b = b.slice(0, 24) + "…"; return [a, b];
  }
  function render() {
    var ch = st.chain; scene.innerHTML = ""; scene.classList.remove("dim");
    var L = st.view === "tree" ? layoutTree(ch) : layoutSpider(ch); st.pos = L.pos; st.bounds = L.bounds;
    var gBg = el("g", {}, scene), gLink = el("g", {}, scene), gNode = el("g", {}, scene);
    if (st.view === "tree") {
      L.labels.forEach(function (lb) {
        el("rect", { x: lb.x - 280, y: lb.y - 14, width: (PER * NW + (PER - 1) * GX) + 340, height: lb.h + 28, rx: 22, "class": "lvlBand" }, gBg);
        var g = el("g", { transform: "translate(" + (lb.x - 260) + "," + (lb.y + lb.h / 2 - 22) + ")" }, gBg);
        var fo = el("foreignObject", { x: 0, y: 0, width: 44, height: 44 }, g); fo.innerHTML = '<div xmlns="http://www.w3.org/1999/xhtml" style="width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--accent) 18%,transparent);color:var(--accent)">' + icon(lb.lv.icon, ' width="26" height="26"') + "</div>";
        var t = el("text", { x: 56, y: 28, "class": "lvlLabel" }, g); t.textContent = lb.lv.name;
      });
    } else {
      el("circle", { cx: 0, cy: 0, r: 110, fill: "color-mix(in srgb,var(--accent) 14%,transparent)", stroke: "var(--accent)", "stroke-width": 3 }, gBg);
      var ht = el("text", { x: 0, y: -6, "text-anchor": "middle", "class": "hubTxt" }, gBg); ht.textContent = ch.short || ch.name;
      var ht2 = el("text", { x: 0, y: 22, "text-anchor": "middle", "class": "lvlLabel" }, gBg); ht2.textContent = "Supply chain";
      L.rings.forEach(function (r) {
        el("circle", { cx: 0, cy: 0, r: r.R, fill: "none", stroke: "color-mix(in srgb,var(--text) 16%,transparent)", "stroke-width": 3, "stroke-dasharray": "10 10" }, gBg);
      });
    }
    /* links */
    ch.nodes.forEach(function (n) {
      (n.needs || []).forEach(function (pid) {
        var a = st.pos[pid], b = st.pos[n.id]; if (!a || !b) return; var d;
        if (st.view === "tree") {
          if (Math.abs(a.y - b.y) < 5) { var ax = a.x + a.w / 2, bx = b.x + b.w / 2; d = "M" + ax + " " + a.y + " C" + ax + " " + (a.y - 60) + " " + bx + " " + (b.y - 60) + " " + bx + " " + b.y; }
          else { var x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, my = (y1 + y2) / 2; d = "M" + x1 + " " + y1 + " C" + x1 + " " + my + " " + x2 + " " + my + " " + x2 + " " + y2; }
        } else {
          var p1 = [a.x + a.w / 2, a.y + a.h / 2], p2 = [b.x + b.w / 2, b.y + b.h / 2], mx = (p1[0] + p2[0]) / 2 * 0.82, my2 = (p1[1] + p2[1]) / 2 * 0.82;
          d = "M" + p1[0] + " " + p1[1] + " Q" + mx + " " + my2 + " " + p2[0] + " " + p2[1];
        }
        el("path", { d: d, "class": "link", "data-a": pid, "data-b": n.id }, gLink);
      });
    });
    /* nodes */
    ch.nodes.forEach(function (n) {
      var p = st.pos[n.id], weak = ch.weak.indexOf(n.id) >= 0, starred = ST.stars.companies.indexOf(n.id) >= 0;
      var g = el("g", { "class": "node" + (weak ? " weakN" : ""), "data-id": n.id, transform: "translate(" + p.x + "," + p.y + ")" }, gNode);
      var f = el("g", { "class": "fall" }, g);
      if (st.view === "spider") {
        var r0 = CW / 2;
        if (weak) el("circle", { cx: r0, cy: r0, r: r0 + 9, "class": "wring" }, f);
        el("circle", { cx: r0, cy: r0, r: r0, "class": "box", style: "stroke:" + ROLES[n.r].color + ";stroke-width:5" }, f);
        var fl = el("text", { x: r0, y: r0 + 10, "text-anchor": "middle", style: "font-size:28px" }, f); fl.textContent = flag(n.c);
        var short = n.n.replace(/\s*\(.*\)\s*/g, " ").trim(), ws = short.split(" "), l1 = "", l2 = "";
        ws.forEach(function (w) { if ((l1 + " " + w).trim().length <= 15 && !l2) l1 = (l1 + " " + w).trim(); else l2 = (l2 + " " + w).trim(); });
        if (l2.length > 16) l2 = l2.slice(0, 15) + "…";
        [l1, l2].forEach(function (ln, i) { if (!ln) return; var t = el("text", { x: r0, y: CW + 22 + i * 18, "text-anchor": "middle", "class": "nm", style: "font-size:16px" }, f); t.textContent = ln; });
        if (n.nse) { var nt = el("text", { x: r0, y: CW + 22 + (l2 ? 2 : 1) * 18, "text-anchor": "middle", "class": "sub", style: "font-size:13px;fill:var(--accent)" }, f); nt.textContent = "NSE " + n.nse; }
        if (starred) { var s2 = el("text", { x: CW + 2, y: 8, fill: "var(--accent)", style: "font-size:18px" }, f); s2.textContent = "★"; }
        return;
      }
      if (weak) el("rect", { x: -6, y: -6, width: NW + 12, height: NH + 12, rx: 18, "class": "wring" }, f);
      el("rect", { x: 0, y: 0, width: NW, height: NH, rx: 14, "class": "box" }, f);
      el("rect", { x: 0, y: 10, width: 5, height: NH - 20, rx: 2.5, fill: ROLES[n.r].color }, f);
      var lines = wrapName(n.n), ty = lines.length > 1 ? 20 : 24;
      lines.forEach(function (ln, i) { var t = el("text", { x: 16, y: ty + i * 16, "class": "nm", style: lines.length > 1 ? "font-size:13px" : "" }, f); t.textContent = ln; });
      var sy = lines.length > 1 ? 54 : 46;
      var sub = el("text", { x: 16, y: sy, "class": "sub" }, f); sub.textContent = flag(n.c) + " " + (CNAME[n.c] || n.c) + (n.nse ? "  ·  NSE " + n.nse : "");
      var bw = n.l ? 52 : 70, bx = NW - bw - 10;
      el("rect", { x: bx, y: NH - 22, width: bw, height: 15, rx: 7.5, fill: n.l ? "rgba(34,197,94,.18)" : "rgba(148,163,184,.2)" }, f);
      var bt = el("text", { x: bx + bw / 2, y: NH - 11, "text-anchor": "middle", "class": "badge", fill: n.l ? "#22C55E" : "#94A3B8" }, f); bt.textContent = n.l ? "LISTED" : "UNLISTED";
      if (n.s) { var full = NW - bw - 36; el("rect", { x: 16, y: NH - 18, width: full, height: 6, rx: 3, "class": "bar0" }, f); el("rect", { x: 16, y: NH - 18, width: Math.max(4, full * Math.min(100, n.s.v) / 100), height: 6, rx: 3, "class": "bar1" }, f); }
      if (weak) { el("rect", { x: NW - 92, y: -20, width: 86, height: 17, rx: 8.5, fill: "var(--weak)" }, f); var wt = el("text", { x: NW - 49, y: -8, "text-anchor": "middle", "class": "badge", fill: "#fff" }, f); wt.textContent = "WEAK POINT"; }
      if (starred) { var s = el("text", { x: NW - 10, y: 18, "text-anchor": "end", fill: "var(--accent)", style: "font-size:13px" }, f); s.textContent = "★"; }
    });
    if (st.view === "spider") {
      var gTop = el("g", {}, scene);
      L.rings.forEach(function (r, i) {
        var a = -Math.PI / 2 - 0.0, x = 0, y = -r.R;
        var w = r.lv.name.length * 10.5 + 34;
        el("rect", { x: x - w / 2, y: y - 17, width: w, height: 34, rx: 17, fill: "var(--panel-solid)", stroke: "color-mix(in srgb,var(--accent) 60%,transparent)", "stroke-width": 2 }, gTop);
        var t = el("text", { x: x, y: y + 6, "text-anchor": "middle", "class": "lvlLabel", style: "font-size:17px;fill:var(--accent)" }, gTop); t.textContent = r.lv.name;
      });
    }
    drawMini();
  }
  /* ---- transform ---- */
  function apply() { scene.setAttribute("transform", "translate(" + st.t.x + "," + st.t.y + ") scale(" + st.t.k + ")"); updMini(); }
  function fit(anim) {
    var b = st.bounds, W_ = wrap.clientWidth, H_ = wrap.clientHeight - 100; if (!W_ || !H_) return;
    var k = Math.min(W_ / b.w, H_ / b.h) * 0.96, to = { k: k, x: W_ / 2 - (b.x + b.w / 2) * k, y: (H_ / 2) - (b.y + b.h / 2) * k + 10 };
    if (anim) animT(to); else { st.t = to; apply(); }
  }
  function animT(to, ms) {
    var from = { x: st.t.x, y: st.t.y, k: st.t.k }, t0 = performance.now(); ms = ms || 650;
    (function step(now) { var t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3); st.t = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, k: from.k + (to.k - from.k) * e }; apply(); if (t < 1) requestAnimationFrame(step); })(t0);
  }
  function centerOn(id, k) {
    var p = st.pos[id]; if (!p) return; var W_ = wrap.clientWidth - (side.classList.contains("open") ? 420 : 0), H_ = wrap.clientHeight; k = k || Math.max(st.t.k, 0.9);
    animT({ k: k, x: W_ / 2 - (p.x + p.w / 2) * k, y: H_ / 2 - (p.y + p.h / 2) * k });
  }
  function zoomBy(f, cx, cy) {
    var W_ = wrap.clientWidth, H_ = wrap.clientHeight; cx = cx == null ? W_ / 2 : cx; cy = cy == null ? H_ / 2 : cy;
    var k = Math.max(0.05, Math.min(3, st.t.k * f)); st.t = { k: k, x: cx - (cx - st.t.x) * k / st.t.k, y: cy - (cy - st.t.y) * k / st.t.k }; apply();
  }
  /* ---- gestures ---- */
  var pts = {}, g0 = null, moved = false;
  var downT2 = null;
  wrap.addEventListener("pointerdown", function (e) { if (e.target.closest && e.target.closest("#mini")) return; if (e.isPrimary) { pts = {}; downT2 = e.target; } try { wrap.setPointerCapture(e.pointerId); } catch (x) {} pts[e.pointerId] = [e.clientX, e.clientY]; moved = false; g0 = { t: Object.assign({}, st.t), p: Object.assign({}, pts) }; });
  wrap.addEventListener("pointermove", function (e) {
    if (!pts[e.pointerId] || !g0) return; pts[e.pointerId] = [e.clientX, e.clientY];
    var ids = Object.keys(pts), r = wrap.getBoundingClientRect();
    if (ids.length === 1) { var s = g0.p[ids[0]]; if (!s) return; var dx = e.clientX - s[0], dy = e.clientY - s[1]; if (Math.abs(dx) + Math.abs(dy) > 6) moved = true; if (moved) { st.t = { k: g0.t.k, x: g0.t.x + dx, y: g0.t.y + dy }; apply(); } }
    else { moved = true; var a0 = g0.p[ids[0]], b0 = g0.p[ids[1]], a1 = pts[ids[0]], b1 = pts[ids[1]]; if (!a0 || !b0) return;
      var k = Math.max(0.05, Math.min(3, g0.t.k * Math.hypot(a1[0] - b1[0], a1[1] - b1[1]) / Math.hypot(a0[0] - b0[0], a0[1] - b0[1])));
      var m0 = [(a0[0] + b0[0]) / 2 - r.left, (a0[1] + b0[1]) / 2 - r.top], m1 = [(a1[0] + b1[0]) / 2 - r.left, (a1[1] + b1[1]) / 2 - r.top];
      var wx = (m0[0] - g0.t.x) / g0.t.k, wy = (m0[1] - g0.t.y) / g0.t.k; st.t = { k: k, x: m1[0] - wx * k, y: m1[1] - wy * k }; apply(); }
  });
  wrap.addEventListener("pointerup", function (e) {
    delete pts[e.pointerId]; if (Object.keys(pts).length) { g0 = { t: Object.assign({}, st.t), p: Object.assign({}, pts) }; return; }
    g0 = null; if (moved) return;
    var tg = downT2 || e.target, nodeEl = tg.closest && tg.closest(".node");
    if (nodeEl) { var id = nodeEl.dataset.id; if (st.wiPick) { st.wiPick = false; $("#wiBanner").classList.add("hide"); askSeverity({ node: id }); } else select(id); }
    else if (!st.wi) { clearSel(); closeSide(); }
  });
  wrap.addEventListener("pointercancel", function (e) { delete pts[e.pointerId]; g0 = null; });
  wrap.addEventListener("wheel", function (e) { e.preventDefault(); var r = wrap.getBoundingClientRect(); zoomBy(e.deltaY > 0 ? 0.9 : 1.11, e.clientX - r.left, e.clientY - r.top); }, { passive: false });

  /* ---- minimap ---- */
  var mini = $("#mini"), miniSvg, miniVp;
  function drawMini() {
    var b = st.bounds; mini.innerHTML = ""; miniSvg = el("svg", { viewBox: b.x + " " + b.y + " " + b.w + " " + b.h, preserveAspectRatio: "xMidYMid meet" }, mini);
    st.chain.nodes.forEach(function (n) { var p = st.pos[n.id]; el("rect", { x: p.x, y: p.y, width: p.w, height: p.h, rx: st.view === "spider" ? p.w / 2 : 12, fill: ROLES[n.r].color, opacity: 0.85 }, miniSvg); });
    miniVp = el("rect", { "class": "vp", rx: 20 }, miniSvg);
    mini.onpointerdown = function (e) { e.stopPropagation(); var r = miniSvg.getBoundingClientRect(), sc = Math.max(b.w / r.width, b.h / r.height), ox = (r.width - b.w / sc) / 2, oy = (r.height - b.h / sc) / 2;
      var wx = b.x + (e.clientX - r.left - ox) * sc, wy = b.y + (e.clientY - r.top - oy) * sc; animT({ k: st.t.k, x: wrap.clientWidth / 2 - wx * st.t.k, y: wrap.clientHeight / 2 - wy * st.t.k }, 400); };
    updMini();
  }
  function updMini() { if (!miniVp) return; var k = st.t.k; miniVp.setAttribute("x", -st.t.x / k); miniVp.setAttribute("y", -st.t.y / k); miniVp.setAttribute("width", wrap.clientWidth / k); miniVp.setAttribute("height", wrap.clientHeight / k); miniVp.setAttribute("stroke-width", 3 / k * 6); }

  /* ---- selection ---- */
  function clearSel() { st.sel = null; scene.classList.remove("dim"); $$(".node", scene).forEach(function (n) { n.classList.remove("hl", "sel"); }); $$(".link", scene).forEach(function (l) { l.classList.remove("hl"); }); }
  function select(id, noPanel) {
    if (st.wi) return companyPanel(id);
    clearSel(); st.sel = id; tapSound(); scene.classList.add("dim");
    var ch = st.chain, keep = {}; keep[id] = 1;
    (ch.byId[id].needs || []).forEach(function (p) { keep[p] = 1; }); (ch.down[id] || []).forEach(function (c) { keep[c] = 1; });
    $$(".node", scene).forEach(function (n) { if (keep[n.dataset.id]) n.classList.add("hl"); if (n.dataset.id === id) n.classList.add("sel"); });
    $$(".link", scene).forEach(function (l) { if (l.dataset.a === id || l.dataset.b === id) l.classList.add("hl"); });
    if (!noPanel) companyPanel(id);
  }

  /* ---- company panel ---- */
  function srcBtn(obj, label) { return '<span class="tapnum" data-src=\'' + esc(JSON.stringify({ t: label, s: obj.src, u: obj.url, d: obj.date || obj.y || "", ap: obj.ap })) + "'>" + esc(label) + "</span>" + (obj.ap ? '<span class="ap">approx</span>' : ""); }
  function companyPanel(id) {
    var ch = st.chain, n = ch.byId[id] || NODE[id], weak = ch.weak.indexOf(id) >= 0, starred = ST.stars.companies.indexOf(id) >= 0;
    var hd = '<div style="font-size:34px;line-height:1">' + flag(n.c) + '</div><div class="t"><h2>' + esc(n.n) + '</h2><div class="row" style="margin-top:6px;gap:6px"><span class="pill" style="color:' + ROLES[n.r].color + '">' + ROLES[n.r].name + "</span>" + (n.l ? '<span class="pill g">Listed</span>' : '<span class="pill">Unlisted</span>') + (weak ? '<span class="pill r">Weak point</span>' : "") + '</div></div><button class="iconbtn" id="cpStar" style="color:' + (starred ? "var(--accent)" : "inherit") + '">' + starIcon(starred) + '</button><button class="iconbtn" id="cpX">' + icon("x") + "</button>";
    var needs = (n.needs || []).map(function (p) { return ch.byId[p]; }).filter(Boolean), downs = (ch.down[id] || []).map(function (c) { return ch.byId[c]; });
    var notes = ST.notes.filter(function (x) { return x.ref === id; }).sort(function (a, b) { return b.ts - a.ts; });
    var bd = "<h3>What it does</h3><p>" + esc(n.d) + "</p><h3>Why it gets affected</h3><p>" + esc(n.w) + "</p>" +
      '<h3>Stock</h3><div class="row"><span class="pill ' + (n.nse ? "a" : "") + '">' + esc(n.x || "Not listed") + "</span></div>" +
      '<h3>Numbers</h3><div class="kv">' +
      '<div class="k">Market share</div><div>' + (n.s ? srcBtn(n.s, n.s.t) : '<span class="muted">—</span>') + "</div>" +
      '<div class="k">Revenue</div><div>' + (n.rev ? srcBtn({ src: n.rev.src, url: n.rev.url, y: n.rev.y, ap: n.rev.ap }, n.rev.t + " (" + n.rev.y + ")") : '<span class="muted">—</span>') + "</div>" +
      '<div class="k">Market cap</div><div>' + esc(n.mc || "—") + (n.mc && ["Mega", "Large", "Mid", "Small"].indexOf(n.mc) >= 0 ? ' <span class="ap">size band</span>' : "") + "</div>" +
      '<div class="k">Main customers</div><div>' + esc(n.cu || "—") + "</div>" +
      '<div class="k">Main suppliers</div><div>' + esc(n.su || "—") + "</div></div>" +
      "<h3>Depends on (" + needs.length + ")</h3><div>" + (needs.length ? needs.map(function (x) { return '<button class="cobtn" data-go="' + x.id + '">' + flag(x.c) + " " + esc(x.n) + "</button>"; }).join("") : '<span class="muted small">Starting point of the chain</span>') + "</div>" +
      "<h3>Supplies to (" + downs.length + ")</h3><div>" + (downs.length ? downs.map(function (x) { return '<button class="cobtn" data-go="' + x.id + '">' + flag(x.c) + " " + esc(x.n) + "</button>"; }).join("") : '<span class="muted small">End of the chain</span>') + "</div>" +
      "<h3>Part of these chains</h3><div>" + NODE_CHAINS[id].map(function (c) { return c === ch.id ? '<span class="pill a">' + esc(D[c].name) + " (here)</span>" : '<button class="cobtn" data-och="' + c + '">' + esc(D[c].name) + " ↗</button>"; }).join(" ") + "</div>" + (ch.linkNote ? '<p class="small muted" style="margin-top:10px">' + esc(ch.linkNote) + "</p>" : "") +
      '<div class="sep"></div><div class="row"><button class="btn red" id="cpWI">' + icon("bolt") + 'What if it stops?</button><button class="btn" id="cpFold">' + icon("folder") + 'Add to folder</button><button class="btn" id="cpCmp">' + icon("compare") + "Compare</button></div>" +
      '<h3>My notes</h3><textarea id="cpNote" placeholder="Write a note…"></textarea><div class="row" style="margin-top:8px"><button class="btn acc" id="cpAdd">' + icon("plus") + "Add note</button></div>" +
      notes.map(function (x) { return '<div class="note"><div class="meta">' + fmtTime(x.ts) + '<button data-del="' + x.id + '">Delete</button></div>' + esc(x.text).replace(/\n/g, "<br>") + "</div>"; }).join("");
    openSide(hd, bd);
    $("#cpX").onclick = function () { closeSide(); clearSel(); };
    $("#cpStar").onclick = function () { toggleStar("companies", id); render(); if (st.sel) select(id, true); companyPanel(id); };
    $$("[data-go]", side).forEach(function (b) { b.onclick = function () { select(b.dataset.go); centerOn(b.dataset.go); }; });
    $$("[data-src]", side).forEach(function (b) { b.onclick = function () { showSource(JSON.parse(b.dataset.src)); }; });
    $("#cpWI").onclick = function () { askSeverity({ node: id }); };
    $$("[data-och]", side).forEach(function (b) { b.onclick = function () { openChain(b.dataset.och, id); }; });
    $("#cpFold").onclick = function () { folderPicker("companies", id); };
    $("#cpCmp").onclick = function () { openCompare("n:" + id); };
    $("#cpAdd").onclick = function () { var t = $("#cpNote").value.trim(); if (!t) return; ST.notes.push({ id: "n" + Date.now(), ref: id, text: t, ts: Date.now() }); save(); toast("Note saved"); companyPanel(id); };
    $$("[data-del]", side).forEach(function (b) { b.onclick = function () { ST.notes = ST.notes.filter(function (x) { return x.id !== b.dataset.del; }); save(); companyPanel(id); }; });
  }
  function showSource(o) {
    openModal("Where this number comes from", '<p style="font-size:18px;font-weight:700">' + esc(o.t) + "</p>" + (o.d ? '<p class="muted">As of: ' + esc(o.d) + "</p>" : "") + "<p>Source: " + esc(o.s) + "</p>" + (o.u ? '<a class="srcLink" href="' + esc(o.u) + '" target="_blank" rel="noopener">Open source ↗</a>' : "") + (o.ap ? '<p class="small muted" style="margin-top:14px"><span class="ap">approx</span> This number is approximate or not fully confirmed. It will be checked in the monthly update with Claude.</p>' : ""));
  }

  /* ---- WHAT IF ---- */
  var SEV = { small: { v: 0.35, n: "Small problem", d: "Slower supply for a few weeks" }, medium: { v: 0.65, n: "Medium problem", d: "Big cut in supply for months" }, full: { v: 1, n: "Full stop", d: "Supply stops completely" } };
  function askSeverity(o) {
    var label = o.country ? ((CO[o.country] && CO[o.country].name) || CNAME[o.country]) + " stops exports" : (st.chain.byId[o.node] || NODE[o.node]).n + (st.chain.byId[o.node] && st.chain.byId[o.node].lv === "route" ? " closes" : " stops");
    openModal("What if " + esc(label) + "?", '<p class="muted">How bad is the problem?</p><div class="sev">' + Object.keys(SEV).map(function (k) { return '<button data-sev="' + k + '">' + SEV[k].n + "<small>" + SEV[k].d + "</small></button>"; }).join("") + "</div>");
    $$("[data-sev]", $("#modal")).forEach(function (b) { b.onclick = function () { closeModal(); closeSide(); runWhatIf(o, b.dataset.sev, label); }; });
  }
  function resetWI() {
    st.wi = null; $("#wiBanner").classList.add("hide");
    $$(".node", scene).forEach(function (n) { n.classList.remove("down", "shake", "gain", "src"); }); $$(".link", scene).forEach(function (l) { l.classList.remove("hit"); });
    (st.timers || []).forEach(clearTimeout); st.timers = [];
  }
  function runWhatIf(o, sevKey, label) {
    resetWI(); clearSel();
    var ch = st.chain, sev = SEV[sevKey].v, srcs = o.country ? ch.nodes.filter(function (n) { return n.c === o.country; }).map(function (n) { return n.id; }) : [o.node];
    if (!srcs.length) { toast("No companies from there in this chain yet"); return; }
    var imp = {}, ord = {}, via = {}, q = [];
    srcs.forEach(function (s) { imp[s] = sev; ord[s] = 0; q.push(s); });
    while (q.length) {
      var u = q.shift(), un = ch.byId[u];
      (ch.down[u] || []).forEach(function (v) {
        var vn = ch.byId[v]; var k = (vn.needs || []).filter(function (p) { var pn = ch.byId[p]; return pn && pn.lv === un.lv && !(srcs.indexOf(p) >= 0 && o.country); }).length || 1;
        if (o.country) { var all = (vn.needs || []).filter(function (p) { return ch.byId[p] && ch.byId[p].lv === un.lv; }); var hitAll = all.filter(function (p) { return imp[p] >= 0.15; }).length; k = Math.max(1, all.length - hitAll + 1) / Math.max(1, hitAll) ; k = Math.max(1, k); }
        var f = 0.92 / Math.sqrt(k), val = imp[u] * f;
        if (val > (imp[v] || 0) + 0.01) { imp[v] = Math.min(1, val); ord[v] = ord[u] + 1; (via[v] = via[v] || []).indexOf(u) < 0 && via[v].push(u); q.push(v); }
        else if (val >= 0.15) { (via[v] = via[v] || []).indexOf(u) < 0 && via[v].push(u); }
      });
    }
    var hit = Object.keys(imp).filter(function (id) { return srcs.indexOf(id) < 0 && imp[id] >= 0.15; }).sort(function (a, b) { return ord[a] - ord[b] || imp[b] - imp[a]; });
    var gains = []; srcs.forEach(function (s) { (ch.byId[s].alt || []).forEach(function (a) { if (ch.byId[a] && !(imp[a] >= 0.15) && srcs.indexOf(a) < 0 && gains.indexOf(a) < 0) gains.push(a); }); });
    st.wi = { srcs: srcs, imp: imp, hit: hit, gains: gains, via: via, label: label, sev: sevKey };
    fit(true);
    var b = $("#wiBanner"); b.innerHTML = icon("bolt", ' width="18" height="18"') + " What if: " + esc(label) + " (" + SEV[sevKey].n + ') <button class="btn" id="wiSum" style="height:30px">Summary</button><button class="btn" id="wiReset" style="height:30px">Reset</button>'; b.classList.remove("hide");
    $("#wiReset").onclick = function () { resetWI(); fit(true); }; $("#wiSum").onclick = function () { summary(); };
    st.timers = [];
    setTimeout(function () {
      srcs.forEach(function (s) { var n = $('.node[data-id="' + s + '"]', scene); if (n) n.classList.add("src", "down"); }); dominoSound(0);
      var last = 0;
      hit.forEach(function (id, i) {
        var d = 500 + ord[id] * 420 + i * 45; last = Math.max(last, d);
        st.timers.push(setTimeout(function () {
          var n = $('.node[data-id="' + id + '"]', scene); if (n) n.classList.add(imp[id] >= 0.45 ? "down" : "shake"); dominoSound(i + 1);
          (via[id] || []).forEach(function (u) { $$('.link[data-a="' + u + '"][data-b="' + id + '"]', scene).forEach(function (l) { l.classList.add("hit"); }); });
        }, d));
      });
      st.timers.push(setTimeout(function () { gains.forEach(function (g) { var n = $('.node[data-id="' + g + '"]', scene); if (n) n.classList.add("gain"); }); beep(660, 0.15, "sine", 0.05); }, last + 500));
      st.timers.push(setTimeout(summary, last + 1300));
    }, 650);
  }
  function summary() {
    var w = st.wi; if (!w) return; var ch = st.chain;
    var losers = w.hit.slice().sort(function (a, b) { return w.imp[b] - w.imp[a]; }).slice(0, 12);
    function reason(id) { var n = ch.byId[id], v = (w.via[id] || []).map(function (u) { return ch.byId[u].n; }).slice(0, 2); var big = w.imp[id] >= 0.45; return (big ? "Big hit — " : "Small hit — ") + "needs " + v.join(" & ") + (big ? "" : ", but has other suppliers"); }
    var nseIds = w.srcs.concat(w.hit).concat(w.gains).filter(function (id) { return ch.byId[id].nse; });
    var html = '<div class="sumGrid"><div class="col"><h3 style="color:#F87171">Who loses most</h3>' + (losers.length ? losers.map(function (id) { return '<div class="it"><b>' + flag(ch.byId[id].c) + " " + esc(ch.byId[id].n) + " " + (w.imp[id] >= 0.45 ? '<span class="pill r">Big</span>' : '<span class="pill" style="color:#F59E0B">Small</span>') + "</b><span>" + esc(reason(id)) + "</span></div>"; }).join("") : '<div class="it muted">Nobody else is badly hit — there are other suppliers.</div>') + "</div>" +
      '<div class="col"><h3 style="color:#22C55E">Who gains (replacements)</h3>' + (w.gains.length ? w.gains.map(function (id) { return '<div class="it"><b>' + flag(ch.byId[id].c) + " " + esc(ch.byId[id].n) + "</b><span>Can supply instead — gets new orders</span></div>"; }).join("") : '<div class="it muted">No easy replacement. That is why this is a weak point.</div>') + "</div>" +
      '<div class="col"><h3 style="color:var(--accent)">NSE stocks to watch</h3>' + (nseIds.length ? nseIds.map(function (id) { var n = ch.byId[id], g = w.gains.indexOf(id) >= 0; return '<div class="it"><b>' + esc(n.nse) + " " + (g ? '<span class="pill g">May gain</span>' : '<span class="pill r">May fall</span>') + "</b><span>" + esc(n.n) + "</span></div>"; }).join("") : '<div class="it muted">No NSE stock directly in this path.</div>') + "</div></div>" +
      '<p class="small muted" style="margin-top:14px">This is a simple model to train your thinking — real markets also depend on stockpiles, prices and news. Not investment advice.</p>' +
      '<div class="row"><button class="btn acc" id="sumCopy">' + icon("copy") + 'Copy summary</button></div>';
    openModal("What if " + esc(w.label) + "?", html, true);
    $("#sumCopy").onclick = function () {
      var t = "WHAT IF " + w.label.toUpperCase() + " (" + SEV[w.sev].n + ")\nLoses most:\n" + losers.map(function (id) { return "• " + ch.byId[id].n + " — " + reason(id); }).join("\n") + "\nGains:\n" + (w.gains.map(function (id) { return "• " + ch.byId[id].n; }).join("\n") || "• None") + "\nNSE to watch: " + (nseIds.map(function (id) { return ch.byId[id].nse; }).join(", ") || "—");
      copyText(t);
    };
  }

  /* ---- toolbar ---- */
  function bar() {
    var ch = st.chain, starred = ST.stars.chains.indexOf(ch.id) >= 0;
    $("#chainBar").innerHTML = '<button class="iconbtn" id="cbBack">' + icon("back") + '</button><span class="title">' + esc(ch.name) + '</span><button class="iconbtn" id="cbStar" style="color:' + (starred ? "var(--accent)" : "inherit") + '">' + starIcon(starred) + "</button>" +
      '<div class="seg" style="margin-left:8px"><button data-v="tree" class="' + (st.view === "tree" ? "on" : "") + '">Top-down</button><button data-v="spider" class="' + (st.view === "spider" ? "on" : "") + '">Spider web</button></div>' +
      '<span style="flex:1"></span><button class="btn red" id="cbWI">' + icon("bolt") + 'What if?</button><button class="btn" id="cbHist">' + icon("clock") + 'History</button><button class="btn" id="cbKP">' + icon("list") + 'Key points</button><button class="btn" id="cbExp">' + icon("share") + "Export</button>";
    $("#cbBack").onclick = function () { resetWI(); closeSide(); api.chain = st.chain = null; showTab("chains", false); location.hash = "chains"; };
    $("#cbStar").onclick = function () { toggleStar("chains", ch.id); bar(); };
    $$("[data-v]", $("#chainBar")).forEach(function (b) { b.onclick = function () { st.view = ST.set.view = b.dataset.v; save(); resetWI(); closeSide(); render(); bar(); fit(true); tapSound(); }; });
    $("#cbWI").onclick = function () { if (st.wi) { resetWI(); fit(true); return; } st.wiPick = true; var b = $("#wiBanner"); b.innerHTML = icon("bolt", ' width="18" height="18"') + ' Tap any company to make it fail <button class="btn" id="wiCancel" style="height:30px">Cancel</button>'; b.classList.remove("hide"); $("#wiCancel").onclick = function () { st.wiPick = false; b.classList.add("hide"); }; };
    $("#cbHist").onclick = history;
    $("#cbKP").onclick = function () { var t = ch.keyPoints.join("\n"); openModal("Key points — copy to Apple Notes", '<pre class="kp">' + esc(t) + '</pre><div class="row" style="margin-top:14px"><button class="btn acc" id="kpCopy">' + icon("copy") + "Copy</button></div>"); $("#kpCopy").onclick = function () { copyText(t); }; };
    $("#cbExp").onclick = exportImage;
  }
  function history() {
    var ch = st.chain;
    openModal("History — " + esc(ch.name), '<div class="tl">' + ch.history.map(function (h) {
      return '<div class="ev"><div class="dt">' + esc(h.date) + '</div><div class="tt">' + esc(h.title) + "</div><p>" + esc(h.what) + "</p>" + (h.moves || []).map(function (m) { return '<span class="mv ' + (m.p < 0 ? "dn" : "up") + '">' + (m.p < 0 ? "▼ " : "▲ ") + esc(m.n) + " " + (m.p > 0 ? "+" : "") + m.p + "% <span style='font-weight:500'>" + esc(m.t) + "</span></span>"; }).join("") + (h.url ? '<div style="margin-top:6px"><a class="srcLink" href="' + esc(h.url) + '" target="_blank" rel="noopener">Source: ' + esc(h.src) + " ↗</a></div>" : "") + "</div>";
    }).join("") + "</div>", true);
  }
  /* ---- export 16:9 ---- */
  var STYLE_PROPS = ["fill", "stroke", "stroke-width", "opacity", "font-size", "font-weight", "stroke-dasharray", "fill-opacity", "stroke-opacity", "transform"];
  function exportImage() {
    toast("Making image…");
    var clone = scene.cloneNode(true), src = [scene].concat($$("*", scene)), dst = [clone].concat($$("*", clone));
    src.forEach(function (s, i) { var cs = getComputedStyle(s), d = dst[i]; if (d.tagName === "foreignObject") { d.parentNode && d.parentNode.removeChild(d); return; } ["fill", "stroke", "stroke-width", "opacity", "font-size", "font-weight", "stroke-dasharray"].forEach(function (p) { var v = cs.getPropertyValue(p); if (v) d.style.setProperty(p, v); }); if (s.classList && s.classList.contains("fall")) { var tr = cs.getPropertyValue("transform"); if (tr && tr !== "none") d.setAttribute("transform", tr.replace("matrix", "matrix")); } d.removeAttribute("class"); });
    var b = st.bounds, Wd = 1920, Hd = 1080, top = 150, k = Math.min(Wd / b.w, (Hd - top - 30) / b.h) * 0.96;
    clone.setAttribute("transform", "translate(" + (Wd / 2 - (b.x + b.w / 2) * k) + "," + (top + (Hd - top) / 2 - (b.y + b.h / 2) * k) + ") scale(" + k + ")");
    var cs = getComputedStyle(document.documentElement), bg = cs.getPropertyValue("--bg").trim(), tx = cs.getPropertyValue("--text").trim() || "#fff", acc = cs.getPropertyValue("--accent").trim();
    var title = st.chain.name + (st.wi ? " — What if " + st.wi.label + "?" : " supply chain");
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + Wd + '" height="' + Hd + '" viewBox="0 0 ' + Wd + " " + Hd + '"><rect width="100%" height="100%" fill="' + bg + '"/>' +
      '<rect x="' + (Wd / 2 - 150) + '" y="26" width="300" height="40" rx="20" fill="#0A0A0A" stroke="rgba(255,255,255,.2)"/><text x="' + Wd / 2 + '" y="52" text-anchor="middle" fill="#fff" font-family="-apple-system,Helvetica,Arial" font-size="15" font-weight="700" letter-spacing="5">JSR ENTERPRISES</text>' +
      '<text x="60" y="122" fill="' + tx + '" font-family="-apple-system,Helvetica,Arial" font-size="34" font-weight="800">' + esc(title) + '</text><rect x="60" y="138" width="120" height="5" rx="2.5" fill="' + acc + '"/>' +
      '<g font-family="-apple-system,Helvetica,Arial">' + new XMLSerializer().serializeToString(clone).replace(/^<g[^>]*xmlns="[^"]*"/, function (m) { return m; }) + "</g></svg>";
    var img = new Image(), url = URL.createObjectURL(new Blob([s], { type: "image/svg+xml;charset=utf-8" }));
    img.onload = function () {
      var c = document.createElement("canvas"); c.width = Wd; c.height = Hd; var x = c.getContext("2d"); x.drawImage(img, 0, 0); URL.revokeObjectURL(url);
      c.toBlob(function (blob) { shareOrDownload(blob, "supply-chain-" + st.chain.id + ".png", "image/png"); }, "image/png");
    };
    img.onerror = function () { toast("Could not make image"); };
    img.src = url;
  }

  function open(cid, nodeId) {
    var ch = D[cid]; if (!ch) return; resetWI(); closeSide();
    api.chain = st.chain = ch; showTab("chains");
    if (!$("#chainView").classList.contains("hide")) {}
    $("#chains").classList.add("hide"); $("#chainView").classList.remove("hide");
    render(); bar();
    var usedR = []; ch.nodes.forEach(function (n) { if (usedR.indexOf(n.r) < 0) usedR.push(n.r); });
    $("#roleLegend").innerHTML = usedR.map(function (r) { return '<div class="i"><span class="d" style="background:' + ROLES[r].color + '"></span>' + ROLES[r].name + "</div>"; }).join("") + '<div class="i"><span class="d" style="background:var(--weak)"></span>Weak point</div><div class="i"><span class="d" style="background:var(--accent)"></span>Market share bar</div>';
    $("#roleLegend").classList.add("hide");
    $("#zoomBtns").innerHTML = '<button class="iconbtn" id="zLeg" title="Legend">' + icon("info") + '</button><button class="iconbtn" id="zIn">' + icon("plus") + '</button><button class="iconbtn" id="zOut">' + icon("minus") + '</button><button class="iconbtn" id="zFit">' + icon("fit") + "</button>";
    $("#zLeg").onclick = function () { $("#roleLegend").classList.toggle("hide"); }; $("#zIn").onclick = function () { zoomBy(1.25); }; $("#zOut").onclick = function () { zoomBy(0.8); }; $("#zFit").onclick = function () { fit(true); };
    setTimeout(function () { fit(false); if (nodeId) setTimeout(function () { select(nodeId); centerOn(nodeId, 1); }, 120); }, 40);
    location.hash = "chain=" + cid + (nodeId ? "&node=" + nodeId : "");
  }
  api.open = open; api.resize = function () { if (st.chain) { fit(false); } }; api.askSeverity = askSeverity;
  window.addEventListener("resize", function () { if (st.chain && !$("#chainView").classList.contains("hide")) fit(false); });
  return api;
})();
function openChain(cid, nodeId) { CV.open(cid, nodeId); }

/* ================= helpers: copy / share / folders ================= */
function copyText(t) {
  function fb() { var ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast("Copied — paste in Apple Notes"); } catch (e) { toast("Copy failed"); } ta.remove(); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast("Copied — paste in Apple Notes"); }, fb); else fb();
}
function shareOrDownload(blob, name, type) {
  var file; try { file = new File([blob], name, { type: type }); } catch (e) {}
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(function () {}); return; }
  var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); toast("Saved " + name);
}
function folderPicker(kind, id) {
  if (ST.stars[kind].indexOf(id) < 0) { ST.stars[kind].push(id); save(); }
  function draw() {
    var html = '<p class="muted">Tap a folder to add or remove. Item is also in Saved ★.</p>' + (ST.folders.length ? ST.folders.map(function (f) { var on = f.items.some(function (x) { return x.k === kind && x.id === id; }); return '<div class="savedItem" data-f="' + f.id + '">' + icon("folder", ' width="22" height="22"') + '<div class="grow"><b>' + esc(f.name) + '</b></div><span class="pill ' + (on ? "g" : "") + '">' + (on ? "✓ In folder" : "Add") + "</span></div>"; }).join("") : '<div class="empty">No folders yet.</div>') +
      '<div class="row" style="margin-top:12px"><input class="inp" id="fNew" placeholder="New folder name (e.g. Watchlist)" style="flex:1"><button class="btn acc" id="fAdd">' + icon("plus") + "Create</button></div>";
    var bd = openModal("Add to folder", html);
    $$("[data-f]", bd).forEach(function (r) { r.onclick = function () { var f = ST.folders.filter(function (x) { return x.id === r.dataset.f; })[0], i = -1; f.items.forEach(function (x, j) { if (x.k === kind && x.id === id) i = j; }); if (i >= 0) f.items.splice(i, 1); else f.items.push({ k: kind, id: id }); save(); draw(); }; });
    $("#fAdd").onclick = function () { var nm = $("#fNew").value.trim(); if (!nm) return; ST.folders.push({ id: "f" + Date.now(), name: nm, items: [{ k: kind, id: id }] }); save(); draw(); };
  }
  draw();
}

/* ================= COMPARE ================= */
function openCompare(pre) {
  var opts = '<optgroup label="Chains">' + CL.filter(function (c) { return c.ready; }).map(function (c) { return '<option value="c:' + c.id + '">' + esc(c.name) + "</option>"; }).join("") + '</optgroup><optgroup label="Companies">' + Object.keys(NODE).sort(function (a, b) { return NODE[a].n.localeCompare(NODE[b].n); }).map(function (id) { return '<option value="n:' + id + '">' + esc(NODE[id].n) + "</option>"; }).join("") + "</optgroup>";
  var bd = openModal("Compare", '<div class="row"><select id="cmA" style="flex:1">' + opts + '</select><span class="muted">vs</span><select id="cmB" style="flex:1">' + opts + '</select></div><div id="cmOut" style="margin-top:16px"></div>', true);
  var a = $("#cmA"), b = $("#cmB"); a.value = pre || "n:tsmc"; b.value = pre === "n:samsung" ? "n:tsmc" : (pre && pre !== "n:samsung" ? "n:samsung" : "n:samsung");
  if (pre && pre.indexOf("c:") === 0) b.value = "n:tsmc";
  function rowsFor(v) {
    var t = v.split(":")[0], id = v.split(":")[1];
    if (t === "c") { var ch = D[id], ctry = {}; ch.nodes.forEach(function (n) { ctry[n.c] = 1; }); return { Name: ch.name, Type: "Chain", Companies: ch.nodes.length, Levels: ch.levels.length, "Weak points": ch.weak.map(function (w) { return ch.byId[w].n; }).join(", "), Countries: Object.keys(ctry).map(function (c) { return flag(c); }).join(" "), "NSE stocks": ch.nodes.filter(function (n) { return n.nse; }).map(function (n) { return n.nse; }).join(", "), "History events": ch.history.length }; }
    var n = NODE[id], ch2 = D[n.chain];
    return { Name: n.n, Type: ROLES[n.r].name, Country: flag(n.c) + " " + (CNAME[n.c] || n.c), Listed: n.l ? "Yes" : "No", Stock: n.x || "—", "Market share": n.s ? n.s.t + (n.s.ap ? " (approx)" : "") : "—", Revenue: n.rev ? n.rev.t + " (" + n.rev.y + ")" + (n.rev.ap ? " approx" : "") : "—", "Market cap": n.mc || "—", "Weak point": ch2.weak.indexOf(id) >= 0 ? "Yes ⚠️" : "No", "Depends on": (n.needs || []).length + " companies", "Supplies to": (ch2.down[id] || []).length + " companies", Customers: n.cu || "—", Suppliers: n.su || "—" };
  }
  function draw() {
    var A = rowsFor(a.value), B = rowsFor(b.value), keys = Object.keys(A).concat(Object.keys(B).filter(function (k) { return !(k in A); }));
    $("#cmOut").innerHTML = '<div class="cmp"><div class="h"></div><div class="h">' + esc(A.Name) + '</div><div class="h">' + esc(B.Name) + "</div>" + keys.filter(function (k) { return k !== "Name"; }).map(function (k) { return '<div class="k">' + esc(k) + "</div><div>" + esc(A[k] == null ? "—" : A[k]) + "</div><div>" + esc(B[k] == null ? "—" : B[k]) + "</div>"; }).join("") + "</div>";
  }
  a.onchange = draw; b.onchange = draw; draw();
}

/* ================= SAVED ================= */
var savedSeg = "companies", savedFolder = "all", noteQ = "";
function renderSaved() {
  var inF = function (k, id) { if (savedFolder === "all") return true; var f = ST.folders.filter(function (x) { return x.id === savedFolder; })[0]; return f && f.items.some(function (x) { return x.k === k && x.id === id; }); };
  var h = '<h1>Saved</h1><div class="row" style="margin:10px 0"><div class="seg"><button data-s="chains" class="' + (savedSeg === "chains" ? "on" : "") + '">Starred chains</button><button data-s="companies" class="' + (savedSeg === "companies" ? "on" : "") + '">Starred companies</button><button data-s="notes" class="' + (savedSeg === "notes" ? "on" : "") + '">All my notes</button></div></div>';
  if (savedSeg !== "notes") {
    h += '<div class="folderBar"><button class="btn ' + (savedFolder === "all" ? "acc" : "") + '" data-fd="all">All</button>' + ST.folders.map(function (f) { return '<button class="btn ' + (savedFolder === f.id ? "acc" : "") + '" data-fd="' + f.id + '">' + icon("folder") + esc(f.name) + " (" + f.items.filter(function (x) { return x.k === savedSeg; }).length + ")</button>"; }).join("") + '<button class="btn" id="fdNew">' + icon("plus") + "New folder</button>" + (savedFolder !== "all" ? '<button class="btn" id="fdDel">' + icon("trash") + "Delete folder</button>" : "") + "</div>";
  }
  if (savedSeg === "chains") {
    var cs = ST.stars.chains.filter(function (id) { return D[id] && inF("chains", id); });
    h += cs.length ? cs.map(function (id) { return '<div class="savedItem" data-oc="' + id + '">' + icon("link", ' width="22" height="22"') + '<div class="grow"><b>' + esc(D[id].name) + '</b><div class="muted small">' + D[id].nodes.length + ' companies</div></div><button class="iconbtn" data-fold="chains:' + id + '">' + icon("folder") + "</button></div>"; }).join("") : '<div class="empty">No starred chains yet. Tap ☆ on a chain.</div>';
  } else if (savedSeg === "companies") {
    var ns = ST.stars.companies.filter(function (id) { return NODE[id] && inF("companies", id); });
    h += ns.length ? ns.map(function (id) { var n = NODE[id]; return '<div class="savedItem" data-on="' + id + '"><div style="font-size:26px">' + flag(n.c) + '</div><div class="grow"><b>' + esc(n.n) + '</b><div class="muted small">' + esc(ROLES[n.r].name) + (n.nse ? " · NSE " + esc(n.nse) : "") + '</div></div><button class="iconbtn" data-fold="companies:' + id + '">' + icon("folder") + "</button></div>"; }).join("") : '<div class="empty">No starred companies yet. Open a company and tap ☆.</div>';
  } else {
    h += '<input class="inp" id="nq" placeholder="Search my notes" style="width:100%;margin-bottom:12px" value="' + esc(noteQ) + '">';
    var list = ST.notes.filter(function (x) { var n = NODE[x.ref]; return !noteQ || (x.text + " " + (n ? n.n : "")).toLowerCase().indexOf(noteQ.toLowerCase()) >= 0; }).sort(function (a, b) { return b.ts - a.ts; });
    h += list.length ? list.map(function (x) { var n = NODE[x.ref]; return '<div class="savedItem" data-on="' + x.ref + '" style="align-items:flex-start">' + icon("note", ' width="22" height="22"') + '<div class="grow"><b>' + esc(n ? n.n : "Note") + '</b><div class="muted small">' + fmtTime(x.ts) + '</div><div style="margin-top:6px">' + esc(x.text).replace(/\n/g, "<br>") + "</div></div></div>"; }).join("") : '<div class="empty">No notes found.</div>';
  }
  var body = $("#savedBody"); body.innerHTML = h;
  $$("[data-s]", body).forEach(function (b) { b.onclick = function () { savedSeg = b.dataset.s; renderSaved(); }; });
  $$("[data-fd]", body).forEach(function (b) { b.onclick = function () { savedFolder = b.dataset.fd; renderSaved(); }; });
  var fn = $("#fdNew"); if (fn) fn.onclick = function () { openModal("New folder", '<input class="inp" id="fNm" placeholder="Folder name" style="width:100%"><div class="row" style="margin-top:12px"><button class="btn acc" id="fOk">Create</button></div>'); $("#fOk").onclick = function () { var nm = $("#fNm").value.trim(); if (!nm) return; ST.folders.push({ id: "f" + Date.now(), name: nm, items: [] }); save(); closeModal(); renderSaved(); }; };
  var fdl = $("#fdDel"); if (fdl) fdl.onclick = function () { ST.folders = ST.folders.filter(function (f) { return f.id !== savedFolder; }); savedFolder = "all"; save(); renderSaved(); toast("Folder deleted (items stay starred)"); };
  $$("[data-oc]", body).forEach(function (d) { d.onclick = function (e) { if (e.target.closest("[data-fold]")) return; openChain(d.dataset.oc); }; });
  $$("[data-on]", body).forEach(function (d) { d.onclick = function (e) { if (e.target.closest("[data-fold]")) return; openChain(NODE[d.dataset.on].chain, d.dataset.on); }; });
  $$("[data-fold]", body).forEach(function (b) { b.onclick = function () { var p = b.dataset.fold.split(":"); folderPicker(p[0], p[1]); }; });
  var nq = $("#nq"); if (nq) { nq.oninput = function () { noteQ = nq.value; var pos = nq.selectionStart; renderSaved(); var n2 = $("#nq"); n2.focus(); n2.setSelectionRange(pos, pos); }; }
}

/* ================= SETTINGS ================= */
var UPDATE_MSG = "Please update my Supply Chain app (GitHub repo: supply-chain). Refresh market caps, revenues and market shares with sources, add new history events, and keep my design the same. Current data version: " + window.SC_DATA_VERSION + ".";
function renderSettings() {
  var s = ST.set;
  var h = '<h1>Settings</h1><h2>Colour theme</h2><div class="swatches">' + Object.keys(THEMES).map(function (k) { var t = THEMES[k]; return '<button class="sw ' + (s.theme === k ? "on" : "") + '" data-th="' + k + '"><div class="pv" style="background:' + (s.mode === "light" ? t.light : t.dark) + '"><i style="background:' + t.accent + '"></i></div><b>' + t.name + "</b></button>"; }).join("") +
    '<button class="sw ' + (s.theme === "custom" ? "on" : "") + '" data-th="custom"><div class="pv" style="background:' + s.bg + '"><i style="background:' + s.accent + '"></i></div><b>Custom</b></button></div>' +
    '<div class="card" style="margin-top:14px"><div class="setRow"><div><b>Mode</b><div class="muted small">Dark or light</div></div><div class="seg"><button data-md="dark" class="' + (s.mode === "dark" ? "on" : "") + '">Dark</button><button data-md="light" class="' + (s.mode === "light" ? "on" : "") + '">Light</button></div></div>' +
    '<div class="setRow"><div><b>Custom background colour</b><div class="muted small">Used when theme is Custom</div></div><input type="color" id="cBg" value="' + s.bg + '"></div>' +
    '<div class="setRow"><div><b>Custom main accent colour</b><div class="muted small">Buttons, highlights, bars</div></div><input type="color" id="cAc" value="' + s.accent + '"></div>' +
    '<div class="setRow"><div><b>Sound effects</b><div class="muted small">Taps and domino falls</div></div><button class="toggle ' + (s.sound ? "on" : "") + '" id="tSnd"></button></div></div>' +
    '<h2>Backup</h2><div class="card"><div class="setRow"><div><b>Back up now</b><div class="muted small">Saves notes, stars, folders and risk spots as a file. Reminder every Sunday 2:00 PM.<br>Last backup: ' + (ST.lastBackup ? fmtTime(ST.lastBackup) : "never") + '</div></div><button class="btn acc" id="bkNow">' + icon("down") + 'Back up</button></div>' +
    '<div class="setRow"><div><b>Restore from backup</b><div class="muted small">Pick a backup file from Files</div></div><label class="btn">' + icon("up") + 'Restore<input type="file" id="bkFile" accept=".json,application/json" class="hide"></label></div></div>' +
    '<h2>Data updates</h2><div class="card"><div class="setRow"><div><b>Data version</b><div class="muted small">' + esc(window.SC_DATA_VERSION) + " · Monthly reminder to refresh numbers with Claude</div></div><span class=\"pill a\">" + Math.max(0, 30 - Math.floor((Date.now() - ST.lastUpdateAck) / 864e5)) + ' days left</span></div>' +
    '<div class="setRow"><div><b>Message for Claude</b><div class="muted small">' + esc(UPDATE_MSG) + '</div></div><button class="btn" id="cpMsg">' + icon("copy") + "Copy</button></div></div>" +
    '<h2>Reset</h2><div class="card"><div class="setRow"><div><b>Reset to default</b><div class="muted small">Theme, colours, sound and view go back to default. Your notes stay.</div></div><button class="btn" id="rsSet">Reset</button></div>' +
    '<div class="setRow"><div><b>Erase my data</b><div class="muted small">Deletes notes, stars, folders and risk spots</div></div><button class="btn red" id="rsAll">Erase</button></div></div>' +
    '<p class="muted small" style="margin:24px 0">Supply Chain · JSR Enterprises · Works offline. World map shapes are simplified. Numbers marked “approx” are estimates — tap any number to see its source. Not investment advice.</p>';
  var b = $("#settingsBody"); b.innerHTML = h;
  $$("[data-th]", b).forEach(function (x) { x.onclick = function () { s.theme = x.dataset.th; save(); applyTheme(); renderSettings(); }; });
  $$("[data-md]", b).forEach(function (x) { x.onclick = function () { s.mode = x.dataset.md; if (s.theme === "custom") s.theme = "midnight"; save(); applyTheme(); renderSettings(); }; });
  $("#cBg").oninput = function () { s.bg = this.value; s.theme = "custom"; save(); applyTheme(); }; $("#cBg").onchange = renderSettings;
  $("#cAc").oninput = function () { s.accent = this.value; s.theme = "custom"; save(); applyTheme(); }; $("#cAc").onchange = renderSettings;
  $("#tSnd").onclick = function () { s.sound = !s.sound; save(); renderSettings(); tapSound(); };
  $("#bkNow").onclick = backupNow;
  $("#bkFile").onchange = function () { var f = this.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { try { var d = JSON.parse(r.result); if (!d.stars) throw 0; var keepSet = ST.set; ST = d; ST.set = d.set || keepSet; save(); applyTheme(); renderSettings(); toast("Backup restored"); } catch (e) { toast("Not a valid backup file"); } }; r.readAsText(f); };
  $("#cpMsg").onclick = function () { copyText(UPDATE_MSG); };
  $("#rsSet").onclick = function () { ST.set = defaults().set; save(); applyTheme(); renderSettings(); toast("Settings reset"); };
  $("#rsAll").onclick = function () { openModal("Erase all my data?", '<p>This deletes all notes, stars, folders and risk spots. Make a backup first if you want to keep them.</p><div class="row"><button class="btn red" id="rsYes">Yes, erase</button><button class="btn" id="rsNo">Cancel</button></div>'); $("#rsNo").onclick = closeModal; $("#rsYes").onclick = function () { var keep = ST.set; ST = defaults(); ST.set = keep; save(); closeModal(); renderSettings(); toast("Data erased"); }; };
}
function backupNow() {
  ST.lastBackup = Date.now(); save();
  var d = new Date(), name = "supply-chain-backup-" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + ".json";
  shareOrDownload(new Blob([JSON.stringify(ST, null, 1)], { type: "application/json" }), name, "application/json");
  $("#banner").classList.add("hide");
  if (curTab === "settings") renderSettings();
}

/* ================= Reminders: weekly backup (Sun 2 PM) + monthly update ================= */
function lastSunday2pm() { var d = new Date(); d.setHours(14, 0, 0, 0); var diff = d.getDay(); d.setDate(d.getDate() - diff); if (d.getTime() > Date.now()) d.setDate(d.getDate() - 7); return d.getTime(); }
function checkReminders() {
  var bn = $("#banner"), ls = lastSunday2pm();
  if (ST.lastBackup < ls && ST.installed < ls && Date.now() > (ST.backupSnooze || 0)) {
    bn.innerHTML = '<div class="card row" style="justify-content:space-between;box-shadow:var(--shadow)"><div class="row">' + icon("down", ' width="22" height="22"') + '<div><b>Weekly backup</b><div class="muted small">Sunday 2:00 PM — save your notes & stars to Files</div></div></div><div class="row"><button class="btn acc" id="bnB">Back up now</button><button class="btn" id="bnL">Later</button></div></div>';
    bn.classList.remove("hide"); $("#bnB").onclick = backupNow; $("#bnL").onclick = function () { ST.backupSnooze = Date.now() + 3 * 3600e3; save(); bn.classList.add("hide"); };
  } else if (Date.now() - ST.lastUpdateAck > 30 * 864e5) {
    bn.innerHTML = '<div class="card row" style="justify-content:space-between;box-shadow:var(--shadow)"><div class="row">' + icon("info", ' width="22" height="22"') + '<div><b>Monthly update</b><div class="muted small">Time to refresh market cap & revenue numbers with Claude</div></div></div><div class="row"><button class="btn acc" id="bnC">Copy message</button><button class="btn" id="bnD">Done</button></div></div>';
    bn.classList.remove("hide"); $("#bnC").onclick = function () { copyText(UPDATE_MSG); }; $("#bnD").onclick = function () { ST.lastUpdateAck = Date.now(); save(); bn.classList.add("hide"); };
  } else bn.classList.add("hide");
}
checkReminders(); setInterval(checkReminders, 10 * 60e3);

/* ================= Start ================= */
function route() {
  var h = location.hash.replace(/^#/, ""), q = {}; h.split("&").forEach(function (p) { var kv = p.split("="); q[kv[0]] = decodeURIComponent(kv[1] || ""); });
  if (q.chain && D[q.chain]) { openChain(q.chain, q.node || null); return; }
  if (h === "chains" || h === "saved" || h === "settings") { showTab(h); return; }
  showTab("world");
}
route();
if ("serviceWorker" in navigator && location.protocol === "https:") { try { navigator.serviceWorker.register("sw.js"); } catch (e) {} }
})();
