(function () {
'use strict';
const { CHARS, CHAPTERS, START_T } = window;
const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.floor(Math.random() * a.length)];
const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/* ---------- STATE ---------- */
const KEY = 'lembayung_save_v1';
const fresh = () => ({
  v: 1, started: false, name: '', t: START_T, ch: 0, phase: 'wait', startAt: CHAPTERS[0].at, waitFrom: START_T,
  threads: {}, unread: {}, unlocked: ['mama', 'ayla'], posts: [], liked: {}, comments: {}, flags: {},
  cnt: { rep: {}, msgs: 0, post: 0 }, snap: { rep: {}, msgs: 0, post: 0 }, seen: { gram: 0, tok: 0, x: 0 },
  ended: false, notes: [], speed: 1, pend: [], lastReal: Date.now(), opened: {}
});
let st; try { st = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
if (!st || st.v !== 1) st = fresh();
const save = () => { st.lastReal = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

const ui = { app: null, th: null, locked: true, view: { chat: {}, gram: { tab: 'feed' }, x: { tab: 'feed' } }, typing: {}, busy: {}, sheet: null, lockN: [], aiErr: '', run: false };

/* ---------- WAKTU ---------- */
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const hm = t => { const m = Math.floor(t) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const day = t => Math.floor(t / 1440) + 1;
const dateStr = t => { const d = new Date(2026, 9, 26 + day(t) - 1); return DAYS[(day(t) - 1) % 7] + ', ' + d.getDate() + ' ' + MON[d.getMonth()]; };

/* ---------- ELEMEN ---------- */
const screen = $('#screen'), isl = $('#island'), sheet = $('#sheet'), lock = $('#lock'), bn = $('#bn');
const APPS = {
  chat: { n: 'Chat', ic: '💬', bg: 'linear-gradient(#5af575,#12b84b)' },
  gram: { n: 'Gram', ic: '📷', bg: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)' },
  x: { n: 'X', ic: '𝕏', bg: '#000' },
  tok: { n: 'Tok', ic: '♪', bg: 'linear-gradient(135deg,#00f2ea,#000 45%,#ff0050)' },
  notes: { n: 'Jurnal', ic: '📝', bg: 'linear-gradient(#ffe066,#ffb800)' },
  clock: { n: 'Jam', ic: '🕐', bg: '#111' },
  photos: { n: 'Foto', ic: '🌸', bg: 'linear-gradient(#fff,#ffd6e8)' },
  set: { n: 'Setelan', ic: '⚙️', bg: 'linear-gradient(#b0b4bb,#6e7480)' }
};
const icon = k => `<div class="ic" data-act="open" data-app="${k}" data-ic="${k}"><div class="ico" style="background:${APPS[k].bg}">${APPS[k].ic}<i class="bd"></i></div><span>${APPS[k].n}</span></div>`;
$('#grid').innerHTML = ['notes', 'clock', 'photos', 'set'].map(icon).join('');
$('#dock').innerHTML = ['chat', 'gram', 'x', 'tok'].map(icon).join('');
$('#apps').innerHTML = Object.keys(APPS).map(k => `<section class="app" id="app-${k}"></section>`).join('');

const nameOf = w => w === 'me' ? (st.name || 'Nara') : CHARS[w].name;
const handleOf = w => w === 'me' ? (st.name || 'nara').toLowerCase() : CHARS[w].handle;
const av = w => w === 'me'
  ? `<span class="av" style="background:#cfd8ff">🙂</span>`
  : `<span class="av" style="background:${CHARS[w].color}">${CHARS[w].emoji}</span>`;
const charsOf = a => st.unlocked.filter(w => CHARS[w].app === a);

/* ---------- PINTEREST (via /api/pin) ---------- */
let pc = {}; try { pc = JSON.parse(localStorage.getItem('lb_pins') || '{}'); } catch (e) {}
const pend = {};
async function pin(q, i) {
  let list = pc[q];
  if (!list) {
    pend[q] = pend[q] || fetch('/api/pin?q=' + encodeURIComponent(q)).then(r => r.json()).then(j => j.urls).catch(() => null);
    list = await pend[q];
    if (!list || !list.length) list = [0, 1, 2, 3].map(n => `https://picsum.photos/seed/${encodeURIComponent(q)}-${n}/600/800`);
    pc[q] = list; try { localStorage.setItem('lb_pins', JSON.stringify(pc)); } catch (e) {}
  }
  return list[i % list.length];
}
function hydrate(el) {
  $$('img.pin[data-q]', el).forEach(async im => {
    const u = await pin(im.dataset.q, +im.dataset.i || 0);
    im.onerror = () => { im.onerror = null; im.src = `https://picsum.photos/seed/${hash(im.dataset.q)}/600/800`; };
    im.src = u;
  });
}

/* ---------- SUARA & NOTIF ---------- */
let ac;
function ping() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; g.gain.value = .04; o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + .09); } catch (e) {} }
function banner(app, title, text, fn, who) {
  ping(); try { navigator.vibrate && navigator.vibrate(25); } catch (e) {}
  if (ui.locked) { ui.lockN.push({ app, title, text }); renderLock(); return; }
  if (ui.app === app && (!who || ui.th === who)) return;
  bn.innerHTML = `<div class="ico" style="background:${APPS[app].bg}">${APPS[app].ic}</div><div><b>${esc(title)}</b><p>${esc(text)}</p></div>`;
  bn.onclick = () => { bn.classList.remove('show'); fn && fn(); };
  bn.classList.add('show'); clearTimeout(ui.bnT); ui.bnT = setTimeout(() => bn.classList.remove('show'), 4500);
}

/* ---------- CHAT / POST ---------- */
function unlock(w) { if (!st.unlocked.includes(w)) st.unlocked.push(w); }
function push(who, from, text) {
  (st.threads[who] = st.threads[who] || []).push({ f: from, tx: text, t: st.t });
  if (from !== 'me') {
    const a = CHARS[who].app, viewing = ui.app === a && ui.th === who;
    if (!viewing) { st.unread[who] = (st.unread[who] || 0) + 1; banner(a, CHARS[who].name, text, () => { openApp(a); openThread(who); }, who); }
  }
  save(); badges(); refresh();
}
function addPost(p) {
  st.posts.push({ ...p, t: st.t, likes: p.likes != null ? p.likes : Math.floor(20 + Math.random() * 900) });
  unlock(p.who); save(); badges();
  const verb = { gram: 'membagikan foto baru', tok: 'mengunggah video baru', x: 'mengunggah cuitan' }[p.type];
  banner(p.type, nameOf(p.who) + ' ' + verb, p.cap, () => openApp(p.type));
}
async function runPend() {
  if (ui.run) return; ui.run = true;
  while (st.pend.length) {
    const a = st.pend[0];
    if (a.text) { ui.typing[a.from] = true; updThread(); }
    await sleep((a.d != null ? a.d : 3) * 1000);
    if (a.text) { ui.typing[a.from] = false; unlock(a.from); push(a.from, a.from, a.text); }
    else if (a.post) addPost(a.post);
    st.pend.shift(); save();
  }
  ui.run = false;
}

/* ---------- AI ---------- */
function buildSys(c, ch, mode, extra) {
  const modes = { dm: 'chat pribadi (DM)', comment: 'balasan komentar publik (cukup 1 pesan pendek)', tweet: 'balasan cuitan publik (cukup 1 pesan pendek)' };
  let ctx = '';
  if (mode === 'comment') ctx = `\nKonteks: pemain berkomentar di postingan ${extra.post.who === 'me' ? 'miliknya sendiri' : nameOf(extra.post.who)}: "${extra.post.cap}".`;
  if (mode === 'tweet') ctx = `\nKonteks: pemain mengunggah cuitan publik. Balas sebagai ${c.name} jika masuk akal.`;
  return `Kamu adalah ${c.name} dalam cerita interaktif AU "Lembayung 23:59" (bahasa Indonesia gaul sesuai karakter). Nama pemain: ${nameOf('me')}.
KARAKTER: ${c.persona}
WAKTU CERITA: Hari ke-${day(st.t)}, jam ${hm(st.t)}.
BAB SAAT INI: ${ch.title}. ${ch.brief}
MISI PEMAIN: ${ch.mission}${ctx}
ATURAN: balas sebagai ${c.name} lewat ${modes[mode]}. Beri 1-3 pesan pendek (maks 25 kata per pesan). Tanpa narasi/aksi, boleh emoji sesuai karakter. Jangan keluar karakter, jangan menyebut AI atau model. Rahasia yang tidak boleh dibongkar dulu: ${c.secret} Dorong cerita maju sesuai misi, tapi tetap natural dan responsif terhadap pemain.
${ch.flags ? `FLAG: jika pemain sudah jelas ${ch.flagHint}, isi "flag" dengan salah satu: ${ch.flags.join(', ')}. Jika belum jelas, kosongkan.` : 'FLAG: selalu kosong.'}
FORMAT: balas HANYA JSON valid tanpa teks lain: {"msgs":["pesan1","pesan2"],"flag":""}`;
}
function parse(raw) {
  raw = (raw || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
  if (a >= 0 && b > a) {
    try {
      const j = JSON.parse(raw.slice(a, b + 1)); let m = j.msgs || j.messages || j.msg;
      if (typeof m === 'string') m = [m];
      if (Array.isArray(m) && m.length) return { msgs: m.map(String).slice(0, 3), flag: j.flag || '' };
    } catch (e) {}
  }
  const lines = raw.split(/\n+/).map(s => s.trim()).filter(Boolean).slice(0, 3);
  return { msgs: lines.length ? lines : null, flag: '' };
}
async function ai(who, mode, extra = {}) {
  const c = CHARS[who], ch = CHAPTERS[Math.min(st.ch, CHAPTERS.length - 1)];
  let msgs = [{ role: 'system', content: buildSys(c, ch, mode, extra) }];
  if (mode === 'dm') msgs = msgs.concat((st.threads[who] || []).slice(-14).map(m => ({ role: m.f === 'me' ? 'user' : 'assistant', content: m.tx })));
  else msgs.push({ role: 'user', content: extra.text });
  try {
    const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: msgs }) });
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.error || r.status);
    const p = parse(j.text); if (!p.msgs) throw new Error('respons kosong');
    ui.aiErr = ''; return p;
  } catch (e) { ui.aiErr = e.message; console.warn('AI offline:', e.message); return { msgs: [pick(c.fb)], flag: '', offline: true }; }
}
async function sendMsg(who, text) {
  text = text.trim(); if (!text || ui.busy[who]) return;
  push(who, 'me', text); st.cnt.rep[who] = (st.cnt.rep[who] || 0) + 1; st.cnt.msgs++; save(); checkComplete();
  ui.busy[who] = true;
  const r = await ai(who, 'dm');
  for (const m of r.msgs) {
    ui.typing[who] = true; updThread();
    await sleep(Math.min(2800, 600 + m.length * 35));
    ui.typing[who] = false; push(who, who, m);
  }
  ui.busy[who] = false;
  if (r.flag) setFlag(r.flag);
  checkComplete();
}
function setFlag(f) { const ch = CHAPTERS[st.ch]; if (ch && (ch.flags || []).includes(f)) { st.flags[f] = true; save(); } }

/* ---------- MISI ---------- */
function cond(c) {
  if (!c) return true;
  if (c.any) return c.any.some(cond);
  if (c.rep) return (st.cnt.rep[c.rep[0]] || 0) - (st.snap.rep[c.rep[0]] || 0) >= c.rep[1];
  if (c.msgs) return st.cnt.msgs - st.snap.msgs >= c.msgs;
  if (c.like) return !!st.liked[c.like];
  if (c.flag) return !!st.flags[c.flag];
  if (c.post) return st.cnt.post - st.snap.post >= 1;
  return false;
}
function activate() {
  const ch = CHAPTERS[st.ch]; st.phase = 'active'; st.snap = JSON.parse(JSON.stringify(st.cnt));
  const acts = typeof ch.start === 'function' ? ch.start(st) : ch.start;
  st.pend = acts.map(a => ({ ...a })); save(); runPend(); updIsland(); flashIsland();
}
function checkComplete() {
  if (!st.started || st.phase !== 'active') return;
  if (!cond(CHAPTERS[st.ch].done)) return;
  st.notes.push(CHAPTERS[st.ch].title); st.ch++;
  if (st.ch >= CHAPTERS.length) { st.ended = true; st.phase = 'done'; save(); updIsland(); setTimeout(showEnd, 1800); return; }
  const nx = CHAPTERS[st.ch];
  st.phase = 'wait'; st.waitFrom = st.t; st.startAt = Math.max(nx.at || 0, st.t + (nx.min != null ? nx.min : 6));
  save(); updIsland(); flashIsland(); if (ui.app === 'notes') render('notes');
}
function showEnd() {
  const ov = $('#intro'); ov.classList.remove('hide');
  const t = st.flags.rewind ? 'Hari yang Diulang' : 'Menit yang Dibiarkan';
  const s = st.flags.trust_kala ? 'Kamu mempercayai dirimu dari masa depan.' : 'Kamu mempercayai Ayla sampai akhir.';
  ov.innerHTML = `<div class="card glass"><h2>TAMAT</h2><p><b>Ending: ${t}</b></p><p>${s}</p><p class="sm">Jam Lembayung berdetak lagi. Kamu masih bisa ngobrol dengan semua karakter dan menjelajah feed.</p><button class="pri" data-act="endok">Lanjut main</button><button class="pri o" data-act="reset">Mulai ulang cerita</button></div>`;
}

/* ---------- DYNAMIC ISLAND ---------- */
function setIsl(s) { isl.dataset.s = s; }
function flashIsland() { if (!st.started) return; setIsl('full'); clearTimeout(ui.islT); ui.islT = setTimeout(() => { if (isl.dataset.s === 'full') setIsl('compact'); }, 4800); }
function updIsland() {
  if (!st.started) return;
  if (isl.dataset.s === 'idle') setIsl('compact');
  const N = CHAPTERS.length; let ch, m, h, comp, pr;
  if (st.ended) { ch = 'Tamat'; m = 'Cerita selesai 🎉'; h = 'Kamu bebas ngobrol terus.'; comp = '✅ Cerita selesai'; pr = 100; }
  else if (st.phase === 'active') { const c = CHAPTERS[st.ch]; ch = `Bab ${st.ch + 1}/${N} · ${c.title}`; m = c.mission; h = c.hint; comp = '🎯 ' + c.mission; pr = (st.ch / N) * 100; }
  else { const left = Math.max(0, Math.ceil(st.startAt - st.t)); ch = `Bab ${st.ch + 1}/${N} berikutnya`; m = `Menunggu sampai ${hm(st.startAt)} (Hari ${day(st.startAt)})`; h = `Sisa ±${Math.floor(left / 60)} jam ${left % 60} menit waktu game. Bisa dipercepat.`; comp = '⏳ Menunggu ' + hm(st.startAt); pr = Math.min(100, ((st.t - st.waitFrom) / Math.max(1, st.startAt - st.waitFrom)) * 100); }
  $('#if-ch').textContent = ch; $('#if-m').textContent = m; $('#if-h').textContent = h; $('#if-bar').style.width = pr + '%';
  $('#ic-t').textContent = comp; $('#ic-tm').textContent = hm(st.t);
  $('#jumpBtn').style.display = st.phase === 'wait' && !st.ended ? '' : 'none';
}

/* ---------- JAM GAME ---------- */
function wall() {
  const h = Math.floor((st.t % 1440) / 60); let g;
  if (h < 6) g = 'linear-gradient(160deg,#0b1026,#1d1a4a 55%,#3a2a6b)';
  else if (h < 9) g = 'linear-gradient(160deg,#ffb199,#ff9ab8 40%,#8f94fb)';
  else if (h < 17) g = 'linear-gradient(160deg,#4facfe,#7fd6ff 55%,#b6f0ff)';
  else if (h < 20) g = 'linear-gradient(160deg,#ff7e5f,#c471ed 55%,#3b2a7a)';
  else g = 'linear-gradient(160deg,#2b1f5c,#141235 60%,#0b0d1c)';
  screen.style.setProperty('--wg', g);
}
function clocks() {
  $('#st-time').textContent = hm(st.t); $('#lk-time').textContent = hm(st.t); $('#lk-date').textContent = dateStr(st.t);
  $('#w-t').textContent = hm(st.t); $('#w-d').textContent = dateStr(st.t) + ' · Lembayung';
  $('#w-m').textContent = st.started ? (st.ended ? 'Cerita selesai' : (st.phase === 'active' ? '🎯 ' + CHAPTERS[st.ch].mission : '⏳ Menunggu ' + hm(st.startAt))) : '';
}
function glitch() { screen.classList.add('glitch'); setTimeout(() => screen.classList.remove('glitch'), 2600); }
let lastMin = -1, lastTick = Date.now();
function onMinute(prev) {
  clocks(); wall(); updIsland();
  if (ui.app === 'clock') render('clock');
  if (prev >= 0 && Math.floor(st.t) % 1440 === 1439) glitch();
  if (st.started && st.phase === 'wait' && !st.ended && st.t >= st.startAt) activate();
  if (Math.floor(st.t) % 5 === 0) save();
}
setInterval(() => {
  const n = Date.now(), dt = (n - lastTick) / 1000; lastTick = n;
  if (!st.started) return;
  st.t += dt * st.speed;
  const mi = Math.floor(st.t);
  if (mi !== lastMin) { const p = lastMin; lastMin = mi; onMinute(p); }
}, 500);

/* ---------- BADGE ---------- */
function unreadApp(a) {
  let n = Object.keys(CHARS).filter(w => CHARS[w].app === a).reduce((s, w) => s + (st.unread[w] || 0), 0);
  if (st.seen[a] != null) n += st.posts.filter(p => p.type === a && p.who !== 'me').length - st.seen[a];
  return Math.max(0, n);
}
function badges() {
  ['chat', 'gram', 'x', 'tok'].forEach(k => $$(`[data-ic="${k}"] .bd`).forEach(b => { const n = unreadApp(k); b.textContent = n; b.classList.toggle('on', n > 0); }));
}
function markSeen(a) { st.seen[a] = st.posts.filter(p => p.type === a && p.who !== 'me').length; badges(); }

/* ---------- RENDER APPS ---------- */
const LIGHT = ['chat', 'gram', 'notes', 'clock', 'photos', 'set'];
function theme() { const dk = ui.app && LIGHT.includes(ui.app); $('#status').classList.toggle('dk', !!dk); $('#hb').classList.toggle('dk', !!dk); }
function rowHTML(w) {
  const th = st.threads[w] || [], l = th[th.length - 1], u = st.unread[w] || 0;
  return `<div class="row" data-act="thread" data-who="${w}">${av(w)}<div class="rw"><b>${CHARS[w].name}</b><p>${l ? esc((l.f === 'me' ? 'Kamu: ' : '') + l.tx) : 'Belum ada pesan'}</p></div><div class="rm"><small>${l ? hm(l.t) : ''}</small>${u ? `<i class="bd">${u}</i>` : ''}</div></div>`;
}
const dmList = a => `<div class="list">${charsOf(a).map(rowHTML).join('') || '<p class="empty">Belum ada DM.</p>'}</div>`;
function threadBody(w) {
  const th = st.threads[w] || [];
  return th.map(m => `<div class="bub ${m.f === 'me' ? 'me' : 'them'}">${esc(m.tx)}<small>${hm(m.t)}</small></div>`).join('') + (ui.typing[w] ? '<div class="bub them typ"><i></i><i></i><i></i></div>' : '');
}
function threadFrame(a, w) {
  const c = CHARS[w];
  return `<div class="thf th-${a}"><header class="th-h"><button data-act="back">‹</button>${av(w)}<div><b>${c.name}</b><small id="thst">${ui.typing[w] ? 'mengetik…' : c.status}</small></div></header><div class="th-b" id="thb">${threadBody(w)}</div><form class="th-f" data-form="send" data-who="${w}"><input id="msgin" autocomplete="off" placeholder="Ketik pesan…"><button>➤</button></form></div>`;
}
function scrollEnd() { const b = $('#thb'); if (b) b.scrollTop = b.scrollHeight; }
function updThread() {
  const w = ui.th; if (!w || !ui.app) return; const b = $('#thb'); if (!b) return;
  b.innerHTML = threadBody(w); scrollEnd(); const s = $('#thst'); if (s) s.textContent = ui.typing[w] ? 'mengetik…' : CHARS[w].status;
}
function refresh() {
  const a = ui.app; if (!a) return; const v = ui.view[a];
  if (v && v.who) { updThread(); return; }
  if (a === 'chat' || ((a === 'gram' || a === 'x') && v.tab === 'dm')) render(a);
}
function openThread(w) {
  const a = CHARS[w].app; ui.view[a].who = w; ui.th = w; st.unread[w] = 0; badges(); render(a);
}
const likeCount = p => p.likes + (st.liked[p.id] ? 1 : 0);
const cmtCount = p => (st.comments[p.id] || []).length;
const feed = t => st.posts.filter(p => p.type === t).slice().reverse();

function rChat(el) {
  el.classList.remove('dark'); const v = ui.view.chat;
  if (v.who) { el.innerHTML = threadFrame('chat', v.who); scrollEnd(); return; }
  el.innerHTML = `<div class="hdr"><h1>Chat</h1></div><div class="list">${charsOf('chat').map(rowHTML).join('') || '<p class="empty">Belum ada obrolan.</p>'}</div>`;
}
function rGram(el) {
  el.classList.remove('dark'); const v = ui.view.gram;
  if (v.who) { el.innerHTML = threadFrame('gram', v.who); scrollEnd(); return; }
  if (v.tab === 'feed') markSeen('gram');
  const dmU = Object.keys(CHARS).filter(w => CHARS[w].app === 'gram').reduce((s, w) => s + (st.unread[w] || 0), 0);
  const posts = feed('gram').map(p => `<article class="gp"><div class="gp-h">${av(p.who)}<b>${esc(nameOf(p.who))}</b></div><img class="pin" data-q="${esc(p.q || 'aesthetic')}" data-i="${hash(p.id)}" alt=""><div class="gp-a"><button data-act="like" data-id="${p.id}" class="${st.liked[p.id] ? 'on' : ''}">${st.liked[p.id] ? '♥' : '♡'}</button><button data-act="cmt" data-id="${p.id}">💬</button></div><p><b>${likeCount(p)} suka</b></p><p><b>${esc(handleOf(p.who))}</b> ${esc(p.cap)}</p><div class="ts">${dateStr(p.t)} · ${hm(p.t)}</div></article>`).join('') || '<p class="empty">Belum ada postingan.</p>';
  el.innerHTML = `<div class="hdr gh"><h1>Gram</h1></div><div class="scroll">${v.tab === 'feed' ? posts : dmList('gram')}</div><nav class="nav"><button data-act="tab" data-t="feed" class="${v.tab === 'feed' ? 'on' : ''}">🏠</button><button data-act="tab" data-t="dm" class="${v.tab === 'dm' ? 'on' : ''}">✉️${dmU ? ` <i class="bd on" style="top:-4px;right:-10px">${dmU}</i>` : ''}</button></nav>`;
}
function rX(el) {
  el.classList.add('dark'); const v = ui.view.x;
  if (v.who) { el.innerHTML = threadFrame('x', v.who); scrollEnd(); return; }
  if (v.tab === 'feed') markSeen('x');
  const dmU = Object.keys(CHARS).filter(w => CHARS[w].app === 'x').reduce((s, w) => s + (st.unread[w] || 0), 0);
  const posts = feed('x').map(p => `<article class="xp">${av(p.who)}<div><b>${esc(nameOf(p.who))}</b> <small>@${esc(handleOf(p.who))} · ${hm(p.t)}</small><p>${esc(p.cap)}</p>${p.q ? `<img class="pin" data-q="${esc(p.q)}" data-i="${hash(p.id)}" alt="">` : ''}<div class="xa"><button data-act="cmt" data-id="${p.id}">💬 ${cmtCount(p)}</button><button data-act="like" data-id="${p.id}" class="${st.liked[p.id] ? 'on' : ''}">${st.liked[p.id] ? '♥' : '♡'} ${likeCount(p)}</button></div></div></article>`).join('') || '<p class="empty">Belum ada cuitan.</p>';
  el.innerHTML = `<div class="hdr xh"><h1>𝕏</h1></div><div class="scroll">${v.tab === 'feed' ? posts : dmList('x')}</div><button class="fab" data-act="compose">✎</button><nav class="nav"><button data-act="tab" data-t="feed" class="${v.tab === 'feed' ? 'on' : ''}">🏠</button><button data-act="tab" data-t="dm" class="${v.tab === 'dm' ? 'on' : ''}">✉️${dmU ? ` <i class="bd on" style="top:-4px;right:-10px">${dmU}</i>` : ''}</button></nav>`;
}
const tokLike = p => `${st.liked[p.id] ? '♥' : '♡'}<small>${likeCount(p)}</small>`;
function rTok(el) {
  el.classList.add('dark'); markSeen('tok');
  const ps = feed('tok');
  el.innerHTML = `<div class="tk-top">Untuk Kamu</div><div class="tkw" id="tkw">${ps.map(p => `<section class="tk"><img class="pin" data-q="${esc(p.q || 'aesthetic')}" data-i="${hash(p.id)}" alt=""><div class="tk-g"></div><div class="tk-side"><button data-act="like" data-id="${p.id}" class="${st.liked[p.id] ? 'on' : ''}">${tokLike(p)}</button><button data-act="cmt" data-id="${p.id}">💬<small>${cmtCount(p)}</small></button></div><div class="tk-c"><b>@${esc(handleOf(p.who))}</b><p>${esc(p.cap)}</p></div></section>`).join('') || '<p class="empty" style="margin-top:200px">Belum ada video. Tunggu kejadian berikutnya…</p>'}</div>`;
  const w = $('#tkw'); $$('.tk', w).forEach(e => e.style.height = w.clientHeight + 'px');
}
function rNotes(el) {
  el.classList.remove('dark'); const N = CHAPTERS.length;
  const cur = st.ended ? 'Cerita selesai 🎉' : (st.phase === 'active' ? `<b>Bab ${st.ch + 1}: ${CHAPTERS[st.ch].title}</b>${CHAPTERS[st.ch].mission}<br><small>${CHAPTERS[st.ch].hint}</small>` : `<b>Menunggu…</b>Bab berikutnya pukul ${hm(st.startAt)} (Hari ${day(st.startAt)})`);
  el.innerHTML = `<div class="hdr"><h1>Jurnal</h1></div><div class="scroll pad"><div class="card2">${cur}</div><div class="card2"><b>Selesai (${st.notes.length}/${N})</b>${st.notes.map(n => `<span class="chip">✓ ${esc(n)}</span>`).join('') || 'Belum ada.'}</div><div class="card2"><b>Karakter</b>${st.unlocked.map(w => `<p style="margin:6px 0">${CHARS[w].emoji} <b style="display:inline">${CHARS[w].name}</b> — @${CHARS[w].handle}</p>`).join('')}</div></div>`;
}
function rClock(el) {
  el.classList.remove('dark');
  el.innerHTML = `<div class="hdr"><h1>Jam</h1></div><div class="scroll pad"><div class="bigclock"><b>${hm(st.t)}</b><p>${dateStr(st.t)} · Hari ke-${day(st.t)}</p></div>
  <button class="btn" data-act="plus1">Tunggu 1 jam</button><button class="btn g" data-act="plus3">Tunggu 3 jam</button>${st.phase === 'wait' && !st.ended ? '<button class="btn g" data-act="jump">Lompat ke kejadian berikutnya ⏩</button>' : ''}
  <p style="margin:14px 0 6px;color:#8e8e93;font-size:13px">Kecepatan waktu (menit game per detik)</p><div class="seg">${[1, 2, 5, 10].map(n => `<button data-act="speed" data-s="${n}" class="${st.speed === n ? 'on' : ''}">${n}x</button>`).join('')}</div></div>`;
}
function rPhotos(el) {
  el.classList.remove('dark'); const ps = st.posts.filter(p => p.q);
  el.innerHTML = `<div class="hdr"><h1>Foto</h1></div><div class="scroll"><div class="ph">${ps.map(p => `<img class="pin" data-q="${esc(p.q)}" data-i="${hash(p.id)}" alt="" style="aspect-ratio:1">`).join('')}</div>${ps.length ? '' : '<p class="empty">Belum ada foto.</p>'}</div>`;
}
function rSet(el) {
  el.classList.remove('dark');
  el.innerHTML = `<div class="hdr"><h1>Setelan</h1></div><div class="scroll pad"><div class="card2"><b>Pemain</b>${esc(nameOf('me'))}</div><div class="card2"><b>Status AI</b><span id="aist">${ui.aiErr ? 'Terakhir error: ' + esc(ui.aiErr) : 'Belum dites / lancar'}</span></div><button class="btn" data-act="testai">Tes koneksi AI (Groq)</button><button class="btn g" data-act="speed" data-s="1">Reset kecepatan 1x</button><button class="btn r" data-act="reset">Hapus save & mulai ulang</button></div>`;
}
const RENDER = { chat: rChat, gram: rGram, x: rX, tok: rTok, notes: rNotes, clock: rClock, photos: rPhotos, set: rSet };
function render(k) { const el = $('#app-' + k); RENDER[k](el); hydrate(el); theme(); }
function openApp(k) {
  $$('.app').forEach(a => a.classList.remove('open'));
  ui.app = k; ui.th = ui.view[k] && ui.view[k].who || null; render(k); $('#app-' + k).classList.add('open'); theme();
}
function closeApp() {
  if (ui.app && ui.view[ui.app]) delete ui.view[ui.app].who;
  ui.app = null; ui.th = null; $$('.app').forEach(a => a.classList.remove('open')); closeSheet(); theme(); badges();
}

/* ---------- SHEET (komentar & cuit) ---------- */
function closeSheet() { sheet.classList.remove('open'); ui.sheet = null; }
function openSheet(id) {
  ui.sheet = id; const cs = st.comments[id] || [];
  sheet.innerHTML = `<div class="sh-h"><b>Komentar</b><button data-act="sheetx">✕</button></div><div class="sh-b">${cs.map(c => `<div class="cm">${av(c.who)}<div><b>${esc(nameOf(c.who))}</b><p>${esc(c.tx)}</p></div></div>`).join('') || '<p class="empty">Belum ada komentar.</p>'}${ui.cTyping === id ? '<p class="empty">…</p>' : ''}</div><form class="th-f" data-form="comment" data-id="${id}"><input id="cin" placeholder="Tulis komentar…" autocomplete="off"><button>➤</button></form>`;
  sheet.classList.add('open'); const b = $('.sh-b', sheet); b.scrollTop = b.scrollHeight;
}
function openCompose() {
  ui.sheet = 'compose';
  sheet.innerHTML = `<div class="sh-h"><button data-act="sheetx">Batal</button><b>Cuitan baru</b><span></span></div><form class="th-f" data-form="tweet" style="flex:1;flex-direction:column;align-items:stretch;padding-bottom:20px"><textarea id="tin" placeholder="Apa yang terjadi di Lembayung?" maxlength="200"></textarea><button style="width:100%;border-radius:18px;padding:12px;height:auto;background:#1d9bf0">Posting</button></form>`;
  sheet.classList.add('open'); setTimeout(() => { const t = $('#tin'); t && t.focus(); }, 380);
}
async function doComment(id, text) {
  const p = st.posts.find(x => x.id === id); if (!p || !text.trim()) return;
  (st.comments[id] = st.comments[id] || []).push({ who: 'me', tx: text.trim() }); save();
  let who = p.who !== 'me' ? p.who : pick(st.unlocked.filter(w => ['ayla', 'kala', 'bima'].includes(w)));
  if (!who) who = 'ayla';
  ui.cTyping = id; openSheet(id);
  const r = await ai(who, p.who === 'me' ? 'tweet' : 'comment', { text, post: p });
  (st.comments[id] = st.comments[id] || []).push({ who, tx: r.msgs[0] }); ui.cTyping = null; save();
  if (ui.sheet === id) openSheet(id);
  if (r.flag) setFlag(r.flag);
  if (ui.app && ui.view[ui.app] && !ui.view[ui.app].who && ui.app !== 'tok') render(ui.app);
}
function doTweet(text) {
  text = text.trim(); if (!text) return;
  const id = 'me' + Date.now();
  st.posts.push({ id, who: 'me', type: 'x', q: null, cap: text, t: st.t, likes: 0 }); st.cnt.post++; save();
  closeSheet(); render('x'); checkComplete();
  setTimeout(async () => {
    const who = pick(st.unlocked.filter(w => ['ayla', 'kala', 'bima'].includes(w)));
    const r = await ai(who, 'tweet', { text });
    (st.comments[id] = st.comments[id] || []).push({ who, tx: r.msgs[0] }); save();
    banner('x', nameOf(who) + ' membalas cuitanmu', r.msgs[0], () => openApp('x'));
    if (ui.app === 'x' && !ui.view.x.who) render('x');
  }, 5000 + Math.random() * 5000);
}

/* ---------- LOCK ---------- */
function renderLock() {
  $('#lk-n').innerHTML = ui.lockN.slice(-4).map(n => `<div class="n glass"><b>${APPS[n.app].ic} ${esc(n.title)}</b>${esc(n.text)}</div>`).join('');
}
function doUnlock() { if (!ui.locked) return; ui.locked = false; lock.classList.add('up'); ui.lockN = []; }

/* ---------- EVENTS ---------- */
const ACT = {
  unlock: () => doUnlock(),
  open: t => openApp(t.dataset.app),
  home: () => closeApp(),
  thread: t => openThread(t.dataset.who),
  back: () => { const a = ui.app; delete ui.view[a].who; ui.th = null; render(a); },
  tab: t => { ui.view[ui.app].tab = t.dataset.t; render(ui.app); },
  like: t => {
    const id = t.dataset.id, p = st.posts.find(x => x.id === id); if (!p) return;
    st.liked[id] = !st.liked[id]; t.classList.toggle('on', !!st.liked[id]); save();
    if (ui.app === 'tok') t.innerHTML = tokLike(p);
    else if (ui.app === 'gram') { t.textContent = st.liked[id] ? '♥' : '♡'; const b = t.closest('.gp').querySelector('p b'); if (b) b.textContent = likeCount(p) + ' suka'; }
    else t.textContent = (st.liked[id] ? '♥ ' : '♡ ') + likeCount(p);
    checkComplete();
  },
  cmt: t => openSheet(t.dataset.id),
  sheetx: () => closeSheet(),
  compose: () => openCompose(),
  isl: () => setIsl(isl.dataset.s === 'full' ? 'compact' : 'full'),
  plus1: () => { st.t += 60; onMinute(lastMin); save(); },
  plus3: () => { st.t += 180; onMinute(lastMin); save(); },
  jump: () => { if (st.phase === 'wait') { st.t = Math.max(st.t, st.startAt); onMinute(lastMin); save(); } },
  speed: t => { st.speed = +t.dataset.s; save(); if (ui.app) render(ui.app); },
  reset: () => { if (confirm('Hapus semua progres dan mulai ulang?')) { localStorage.removeItem(KEY); location.reload(); } },
  endok: () => { $('#intro').classList.add('hide'); },
  testai: async () => {
    const s = $('#aist'); if (s) s.textContent = 'Menguji…';
    try { const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'Balas satu kata: siap' }] }) }); const j = await r.json(); if (!r.ok || j.error) throw new Error(j.error || r.status); ui.aiErr = ''; if (s) s.textContent = 'Terhubung ✅ → ' + j.text.slice(0, 60); }
    catch (e) { ui.aiErr = e.message; if (s) s.textContent = 'Gagal ❌ ' + e.message; }
  }
};
screen.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (!e.target.closest('#island') && isl.dataset.s === 'full') setIsl('compact');
  if (!t) return;
  const f = ACT[t.dataset.act]; if (f) f(t, e);
});
screen.addEventListener('submit', e => {
  e.preventDefault(); const f = e.target, k = f.dataset.form;
  if (k === 'send') { const i = $('#msgin'); const v = i.value; i.value = ''; sendMsg(f.dataset.who, v); }
  else if (k === 'comment') { const i = $('#cin'); const v = i.value; i.value = ''; doComment(f.dataset.id, v); }
  else if (k === 'tweet') doTweet($('#tin').value);
  else if (k === 'intro') {
    st.name = ($('#nameIn').value || '').trim() || 'Nara'; st.started = true; st.t = START_T; st.waitFrom = START_T; save();
    $('#intro').classList.add('hide'); lastMin = -1; clocks(); updIsland(); flashIsland();
  }
});

/* ---------- INIT ---------- */
function init() {
  wall(); clocks(); renderLock(); badges();
  if (st.started) {
    const away = Math.min((Date.now() - st.lastReal) / 1000, 900); st.t += away * st.speed;
    $('#intro').classList.add('hide'); updIsland(); setIsl('compact');
    if (st.pend && st.pend.length) runPend();
    if (st.ended) { /* sudah tamat, tetap bebas bermain */ }
  }
}
window.addEventListener('beforeunload', save);
init();
})();
