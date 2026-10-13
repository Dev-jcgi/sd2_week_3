/* Web interactiva · Semana 3 · Procesamiento del Backlog */
(function () {
  const D = window.DS2;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const ss = { get(k, d) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const SHAPES = [
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><path d="M12 3l10 18H2z"/></svg>',
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><path d="M12 2l10 10-10 10L2 12z"/></svg>',
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><circle cx="12" cy="12" r="10"/></svg>',
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>'
  ];
  const MOMENT = { apertura: 'Apertura', cierre: 'Cierre', juego: 'Juego' };
  const teamLabel = (id) => (D.TEAMS.find((t) => t.id === id) || { label: id }).label;
  let store = null;

  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2400); }

  /* ---------- Tema ---------- */
  function applyTheme(t) { if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
  applyTheme(ls.get('ds2theme', null));
  $('#themeBtn').onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const next = cur === 'dark' ? 'light' : 'dark'; applyTheme(next); ls.set('ds2theme', next);
  };

  /* ---------- Puntuación ---------- */
  const gradable = (st) => st.type === 'mcq' || st.type === 'classify' || st.type === 'order';
  const maxPoints = (st) => (gradable(st) ? 1000 : 100);
  function score(st, value, elapsedFrac) {
    if (!gradable(st)) return { correct: null, points: 100, frac: null };
    if (st.type === 'mcq') {
      const ok = value === st.correct;
      const speed = elapsedFrac == null ? 1 : Math.max(0, 1 - elapsedFrac);
      return { correct: ok, points: ok ? Math.round(500 + 500 * speed) : 0, frac: ok ? 1 : 0 };
    }
    if (st.type === 'classify') {
      const hit = st.items.filter((it, i) => value[i] === it.cat).length;
      const frac = hit / st.items.length;
      return { correct: frac === 1, points: Math.round(1000 * frac), frac };
    }
    const hit = value.filter((orig, pos) => orig === pos).length;
    const frac = hit / value.length;
    return { correct: frac === 1, points: Math.round(1000 * frac), frac };
  }
  function seededOrder(n, seed) {
    let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    if (arr.every((v, i) => v === i)) arr.push(arr.shift());
    return arr;
  }

  /* ---------- Mini burndown ---------- */
  function miniChart(vals) {
    const W = 320, H = 120, l = 26, b = 10, t = 8, r = 6, n = vals.length;
    const x = (i) => l + (W - l - r) * i / (n - 1), y = (v) => t + (H - t - b) * (1 - v / 24);
    const ideal = vals.map((_, i) => `${i ? 'L' : 'M'}${x(i)} ${y(24 - 2.4 * i)}`).join(' ');
    const real = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ');
    return `<svg class="mini" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Burndown"><line x1="${l}" x2="${W - r}" y1="${y(0)}" y2="${y(0)}" stroke="var(--line)"/><text x="4" y="${y(24) + 4}" font-size="11" fill="var(--muted)">24</text><text x="10" y="${y(0) + 4}" font-size="11" fill="var(--muted)">0</text><path d="${ideal}" fill="none" stroke="var(--muted)" stroke-dasharray="6 5" stroke-width="2"/><path d="${real}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/></svg>`;
  }

  /* ---------- Entrada de respuesta (jugador y práctica) ----------
     Construye la UI de un paso y llama onSubmit(value) una sola vez. */
  function buildInput(el, st, seed, onSubmit) {
    const chart = st.chart ? `<div class="panel" style="padding:10px;margin-bottom:14px">${miniChart(st.chart)}</div>` : '';
    if (st.type === 'mcq' || st.type === 'poll') {
      const two = st.options.length === 2;
      el.innerHTML = chart + `<div class="opts">${st.options.map((o, i) => `<button class="opt o${i % 4}" data-i="${i}">${SHAPES[i % 4]}<span>${esc(o)}</span></button>`).join('')}</div>`;
      if (two) el.querySelector('.opts').style.gridTemplateColumns = 'repeat(2,minmax(0,1fr))';
      el.querySelectorAll('.opt').forEach((b) => b.onclick = () => { el.querySelectorAll('.opt').forEach((x) => { x.disabled = true; if (x !== b) x.classList.add('dim'); }); onSubmit(+b.dataset.i); });
      return;
    }
    if (st.type === 'poker') {
      el.innerHTML = `<div class="cards">${st.options.map((o, i) => `<button class="pcard" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
      el.querySelectorAll('.pcard').forEach((b) => b.onclick = () => { b.classList.add('sel'); el.querySelectorAll('.pcard').forEach((x) => x.disabled = true); onSubmit(+b.dataset.i); });
      return;
    }
    if (st.type === 'classify') {
      const val = st.items.map(() => null);
      el.innerHTML = st.items.map((it, i) => `<div class="citem"><p>${esc(it.text)}</p><div class="seg" data-i="${i}">${st.categories.map((c, j) => `<button data-j="${j}" aria-pressed="false">${esc(c)}</button>`).join('')}</div></div>`).join('') + `<button class="btn block" id="sendBtn" disabled>Enviar clasificación</button>`;
      el.querySelectorAll('.seg').forEach((sg) => sg.querySelectorAll('button').forEach((b) => b.onclick = () => {
        val[+sg.dataset.i] = +b.dataset.j; sg.querySelectorAll('button').forEach((x) => { x.classList.toggle('sel', x === b); x.setAttribute('aria-pressed', x === b); });
        el.querySelector('#sendBtn').disabled = val.some((v) => v == null);
      }));
      el.querySelector('#sendBtn').onclick = (e) => { e.target.disabled = true; el.querySelectorAll('.seg button').forEach((x) => x.disabled = true); onSubmit(val.slice()); };
      return;
    }
    if (st.type === 'order') {
      const ord = seededOrder(st.items.length, seed);
      const draw = () => {
        el.querySelector('#olist').innerHTML = ord.map((orig, pos) => `<div class="oitem"><span class="n">${pos + 1}</span><span class="t">${esc(st.items[orig])}</span><button data-p="${pos}" data-d="-1" aria-label="Subir" ${pos === 0 ? 'disabled' : ''}>↑</button><button data-p="${pos}" data-d="1" aria-label="Bajar" ${pos === ord.length - 1 ? 'disabled' : ''}>↓</button></div>`).join('');
        el.querySelectorAll('#olist button').forEach((b) => b.onclick = () => { const p = +b.dataset.p, q = p + +b.dataset.d; [ord[p], ord[q]] = [ord[q], ord[p]]; draw(); const nb = el.querySelector(`#olist button[data-p="${q}"][data-d="${b.dataset.d}"]`) || el.querySelector(`#olist button[data-p="${q}"]`); if (nb) nb.focus(); });
      };
      el.innerHTML = `<p class="muted small" style="margin-top:0">Primero arriba, después abajo. Usa ↑ y ↓.</p><div id="olist"></div><button class="btn block" id="sendBtn">Enviar orden</button>`;
      draw();
      el.querySelector('#sendBtn').onclick = (e) => { e.target.disabled = true; el.querySelectorAll('#olist button').forEach((x) => x.disabled = true); onSubmit(ord.slice()); };
    }
  }

  /* Retroalimentación de un paso ya respondido */
  function feedbackHTML(st, value, res, extra) {
    let detail = '';
    if (st.type === 'mcq') detail = value === st.correct ? '' : `<p style="margin:8px 0 0">Respuesta correcta: <b>${esc(st.options[st.correct])}</b></p>`;
    if (st.type === 'classify') detail = '<div style="margin-top:10px">' + st.items.map((it, i) => `<div class="small" style="margin:4px 0">${value[i] === it.cat ? '<span style="color:var(--green)">✓</span>' : '<span style="color:var(--red)">✗</span>'} ${esc(it.text)} → <b>${esc(st.categories[it.cat])}</b></div>`).join('') + '</div>';
    if (st.type === 'order') detail = '<ol style="margin:10px 0 0;padding-left:22px">' + st.items.map((t) => `<li class="small">${esc(t)}</li>`).join('') + '</ol>';
    const cls = res.correct === null ? '' : res.correct ? 'good' : (res.frac > 0 ? '' : 'bad');
    const head = res.correct === null ? '¡Voto registrado!' : res.correct ? '¡Correcto!' : res.frac > 0 ? `Parcial: ${Math.round(res.frac * 100)} %` : 'No esta vez';
    return `<div class="feedback ${cls}"><b class="big">${head}</b> <span class="mono" style="color:var(--yellow);margin-left:8px">+${res.points} pts</span>${detail}${extra || ''}</div>`;
  }

  /* ---------- Router ---------- */
  const VIEWS = ['inicio', 'sala', 'practica', 'jugar', 'ranking', 'resumen', 'docente'];
  function route() {
    let v = (location.hash || '#inicio').slice(1);
    if (!VIEWS.includes(v)) v = 'inicio';
    if (v === 'sala' && !ss.get('ds2session', null)) v = 'inicio';
    if (v === 'jugar' && !practice.act) v = 'practica';
    VIEWS.forEach((x) => $('#v-' + x).classList.toggle('on', x === v));
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === v));
    if (v === 'sala') startPlayer();
    if (v === 'docente') startHost();
    if (v === 'practica') renderPracticeList();
    if (v === 'ranking') renderRanking();
    if (v === 'resumen') renderResumen();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------- Unirse ---------- */
  const teamOptions = () => D.TEAMS.map((t) => `<option value="${t.id}">${esc(t.label)}</option>`).join('');
  $('#jTeam').innerHTML = teamOptions(); $('#pTeam').innerHTML = teamOptions();
  const profile = ls.get('ds2profile', { name: '', team: 'A' });
  $('#jName').value = profile.name; $('#jTeam').value = profile.team;
  $('#pName').value = profile.name; $('#pTeam').value = profile.team;
  const saveProfile = (name, team) => { profile.name = name; profile.team = team; ls.set('ds2profile', profile); };
  ['pName', 'pTeam'].forEach((id) => $('#' + id).addEventListener('change', () => saveProfile($('#pName').value.trim(), $('#pTeam').value)));
  try { const q = new URLSearchParams(location.search).get('sala'); if (q) $('#jCode').value = q.toUpperCase(); } catch (e) {}

  $('#joinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = $('#jCode').value.trim().toUpperCase(), name = $('#jName').value.trim(), team = $('#jTeam').value;
    $('#joinErr').textContent = '';
    if (!/^[A-Z]{5}$/.test(code)) { $('#joinErr').textContent = 'El código tiene 5 letras. Míralo en el proyector.'; return; }
    if (!name) { $('#joinErr').textContent = 'Escribe tu nombre para aparecer en el ranking.'; return; }
    const room = await store.get('rooms/' + code);
    if (!room || room.phase === 'end') { $('#joinErr').textContent = store.mode === 'local' ? 'No existe esa sala en este navegador. En modo local, crea la sala en otra pestaña del mismo navegador.' : 'No existe una sala abierta con ese código. Revisa las letras.'; return; }
    saveProfile(name, team);
    const prev = await store.get(`rooms/${code}/players/${store.uid}`);
    await store.set(`rooms/${code}/players/${store.uid}`, { name, team, score: prev ? prev.score || 0 : 0, joinedAt: prev ? prev.joinedAt : Date.now() }, true);
    ss.set('ds2session', { code, name, team });
    location.hash = '#sala';
  });

  /* ---------- Jugador ---------- */
  const player = { unsub: [], code: null, room: null, me: null, players: [], key: null, seenAt: {}, answered: ss.get('ds2answered', {}) };
  function stopPlayer() { player.unsub.forEach((u) => u && u()); player.unsub = []; player.code = null; }
  function startPlayer() {
    const s = ss.get('ds2session', null); if (!s) return;
    if (player.code === s.code) return;
    stopPlayer(); player.code = s.code; player.key = null;
    player.unsub.push(store.watchDoc('rooms/' + s.code, (r) => { player.room = r; renderPlayer(); }));
    player.unsub.push(store.watchCol(`rooms/${s.code}/players`, (list) => { player.players = list; player.me = list.find((p) => p.id === store.uid) || null; renderPlayer(); }));
  }
  const stepKey = (r) => r ? `${r.activityId}|${r.stepIndex}` : '';
  function renderPlayer() {
    const el = $('#playerStage'), r = player.room, s = ss.get('ds2session', {});
    const ansKey = `${player.code}|${stepKey(r)}`;
    const answered = player.answered[ansKey];
    const key = !r ? 'none' : `${r.phase}|${stepKey(r)}|${answered ? 'a' : 'n'}`;
    if (r && r.phase === 'question' && !player.seenAt[ansKey]) player.seenAt[ansKey] = Date.now();
    if (key !== player.key) {
      player.key = key;
      const head = `<div class="qhead"><span>Sala <b style="color:var(--yellow)">${esc(player.code)}</b> · ${esc(s.name)} · ${esc(teamLabel(s.team))}</span><span id="pScore"></span></div>`;
      if (!r || r.phase === 'end') {
        el.innerHTML = head + `<div class="panel center" style="margin-top:30px"><h2>La sala terminó</h2><p class="muted">Gracias por jugar. Puedes seguir en la práctica.</p><a class="btn" href="#practica">Ir a la práctica</a> <button class="btn ghost" id="leave">Salir</button></div>`;
      } else if (r.phase === 'lobby' || !r.activityId) {
        el.innerHTML = head + `<div class="panel center" style="margin-top:30px;padding:40px 20px"><p class="eyebrow">Estás dentro</p><h2>Espera la siguiente dinámica</h2><p class="muted">Mira el proyector: cuando el docente la lance, aparecerá aquí.</p><button class="btn ghost sm" id="leave" style="margin-top:12px">Salir de la sala</button></div>`;
      } else if (r.phase === 'scores') {
        el.innerHTML = head + `<div class="panel center" style="margin-top:30px;padding:36px 20px"><p class="eyebrow">Ranking</p><h2 id="pRank">…</h2><p class="muted">Mira el proyector para ver el podio.</p></div>`;
      } else {
        const a = D.activity(r.activityId), st = a.steps[r.stepIndex];
        const top = head + `<p class="eyebrow" style="margin-top:22px">${esc(a.title)} · paso ${r.stepIndex + 1} de ${a.steps.length}</p><div class="prompt">${esc(st.prompt)}</div>`;
        if (r.phase === 'question' && !answered) {
          el.innerHTML = top + `<div class="timer"><i id="pTimer"></i></div><div id="pInput" style="margin-top:16px"></div>`;
          buildInput($('#pInput'), st, store.uid + ansKey, (value) => submitAnswer(r, a, st, value, ansKey));
        } else if (r.phase === 'question') {
          el.innerHTML = top + `<div class="feedback"><b class="big">Respuesta enviada</b><p class="muted" style="margin:6px 0 0">Espera a que el docente revele los resultados.</p></div>`;
        } else {
          el.innerHTML = top + (answered ? feedbackHTML(st, answered.value, answered) : `<div class="feedback bad"><b class="big">Sin respuesta</b><p class="muted" style="margin:6px 0 0">Se acabó el tiempo para este paso.</p></div>`);
        }
      }
      const lv = $('#leave'); if (lv) lv.onclick = () => { stopPlayer(); try { sessionStorage.removeItem('ds2session'); } catch (e) {} location.hash = '#inicio'; };
    }
    const sc = $('#pScore'); if (sc) sc.innerHTML = `<b style="color:var(--fg)">${player.me ? player.me.score || 0 : 0}</b> pts`;
    const rk = $('#pRank'); if (rk) { const sorted = player.players.slice().sort((x, y) => (y.score || 0) - (x.score || 0)); const pos = sorted.findIndex((p) => p.id === store.uid) + 1; rk.textContent = pos ? `Vas en el lugar ${pos} de ${sorted.length}` : 'Ranking'; }
  }
  async function submitAnswer(r, a, st, value, ansKey) {
    const elapsed = (Date.now() - (player.seenAt[ansKey] || Date.now())) / 1000;
    const frac = Math.min(1, elapsed / (r.duration || a.time));
    if (frac >= 1 && st.type === 'mcq') { toast('Se acabó el tiempo'); }
    const res = score(st, value, frac >= 1 ? 1 : frac);
    if (frac >= 1 && gradable(st)) res.points = 0;
    const rec = { value, correct: res.correct, points: res.points, frac: res.frac };
    player.answered[ansKey] = rec; ss.set('ds2answered', player.answered);
    const s = ss.get('ds2session', {});
    try {
      await store.set(`rooms/${player.code}/answers/${store.uid}__${a.id}__${r.stepIndex}`, { uid: store.uid, name: s.name, team: s.team, activityId: a.id, step: r.stepIndex, value, correct: res.correct, points: res.points, frac: res.frac, at: Date.now() });
      await store.incr(`rooms/${player.code}/players/${store.uid}`, { score: res.points });
      await store.incr(`stats/${a.id}__${r.stepIndex}`, gradable(st) ? { n: 1, correct: res.correct ? 1 : 0, fracSum: res.frac } : { n: 1 }, { activityId: a.id, step: r.stepIndex });
    } catch (e) { console.warn(e); toast('No se pudo enviar. Revisa tu conexión.'); }
    renderPlayer();
  }

  /* ---------- Docente ---------- */
  const host = { code: null, room: null, players: [], answers: [], unsub: [], key: null, tab: 'proj' };
  function stopHost() { host.unsub.forEach((u) => u && u()); host.unsub = []; }
  function joinURL(code) {
    try { if (/^https?:/.test(location.protocol)) { const u = new URL(location.href); u.hash = ''; u.search = '?sala=' + code; return u.href; } } catch (e) {}
    return 'Abre esta web y escribe el código';
  }
  async function createRoom() {
    const AL = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let tries = 0; tries < 6; tries++) { code = Array.from({ length: 5 }, () => AL[Math.floor(Math.random() * AL.length)]).join(''); if (!(await store.get('rooms/' + code))) break; }
    await store.set('rooms/' + code, { code, hostUid: store.uid, phase: 'lobby', activityId: null, stepIndex: 0, startedAt: 0, duration: 0, played: [], createdAt: Date.now() });
    ls.set('ds2host', code); openHost(code);
  }
  function openHost(code) {
    stopHost(); host.code = code; host.key = null;
    host.unsub.push(store.watchDoc('rooms/' + code, (r) => { host.room = r; renderHost(); }));
    host.unsub.push(store.watchCol(`rooms/${code}/players`, (l) => { host.players = l; renderHost(); }));
    host.unsub.push(store.watchCol(`rooms/${code}/answers`, (l) => { host.answers = l; renderHost(); }));
  }
  function startHost() {
    if (host.code) { renderHost(); return; }
    const el = $('#hostStage'); const last = ls.get('ds2host', null);
    el.innerHTML = `<p class="eyebrow">Consola del docente</p><h2>Crea una sala para esta sesión</h2>
      <p class="muted" style="max-width:62ch">La sala genera un código de 5 letras. Los estudiantes entran desde la página de inicio. Tú eliges qué dinámica lanzar; el tiempo corre solo y los resultados se revelan al terminar.</p>
      ${store.mode === 'local' ? '<p class="notice" style="max-width:62ch">Modo local: no hay Firebase configurado. La sala solo se comparte con otras pestañas de este navegador. Para usarla en clase, llena <code>firebase-config.js</code> (ver README).</p>' : ''}
      <div class="row" style="margin-top:20px"><button class="btn" id="newRoom">Crear sala nueva</button>${last ? `<button class="btn ghost" id="reopen">Reabrir sala ${esc(last)}</button>` : ''}</div>`;
    $('#newRoom').onclick = createRoom;
    const ro = $('#reopen'); if (ro) ro.onclick = async () => { const r = await store.get('rooms/' + last); if (!r || r.hostUid !== store.uid) { toast('Esa sala ya no está disponible'); return; } openHost(last); };
  }
  const updRoom = (patch) => store.set('rooms/' + host.code, patch, true);
  function launch(id) {
    const a = D.activity(id);
    const played = Array.from(new Set([...(host.room.played || []), id]));
    updRoom({ activityId: id, stepIndex: 0, phase: 'question', startedAt: Date.now(), duration: a.time, played });
  }
  function autoReveal(r) { const k = `${stepKey(r)}|${r.startedAt}`; if (host.revealedKey === k) return; host.revealedKey = k; updRoom({ phase: 'reveal' }); }
  const answersFor = (r) => host.answers.filter((x) => x.activityId === r.activityId && x.step === r.stepIndex);

  function renderHost() {
    const el = $('#hostStage'), r = host.room;
    if (!r) { el.innerHTML = '<p class="muted">Cargando sala…</p>'; return; }
    const key = `${host.tab}|${r.phase}|${stepKey(r)}`;
    if (key !== host.key) {
      host.key = key;
      const acts = D.SECTIONS.map((sec) => `<div class="seclabel" style="margin:16px 0 4px">${sec.n} · ${esc(sec.title)}</div>` +
        D.ACTIVITIES.filter((a) => a.section === sec.n).map((a) => `<button data-launch="${a.id}" class="${r.activityId === a.id ? 'cur' : ''}"><span>${esc(a.title)}<br><span class="small muted">${MOMENT[a.moment]} · ${a.steps.length} ${a.steps.length === 1 ? 'paso' : 'pasos'}</span></span><span class="mono small">${(r.played || []).includes(a.id) ? '✓' : '▶'}</span></button>`).join('')).join('');
      el.innerHTML = `<div class="ctop"><div><p class="eyebrow" style="margin:0">Consola del docente · sesión en curso</p><div class="row" style="gap:18px;margin-top:6px"><span class="bigcode" style="font-size:48px">${esc(host.code)}</span><span class="muted small" style="max-width:280px">Entren en <b class="mono" style="color:var(--fg);word-break:break-all">${esc(joinURL(host.code).replace(/^https?:\/\//, ''))}</b></span></div></div>
        <div class="row"><button class="btn ghost sm" data-tab="proj" ${host.tab === 'proj' ? 'style="border-color:var(--accent)"' : ''}>Proyección</button><button class="btn ghost sm" data-tab="res" ${host.tab === 'res' ? 'style="border-color:var(--accent)"' : ''}>Resultados</button><button class="btn ghost sm" id="hFull">Pantalla completa</button><button class="btn ghost sm" id="hClose">Cerrar sala</button></div></div>
        <div class="cgrid"><aside class="panel alist" style="max-height:72vh;overflow:auto"><h3>Dinámicas</h3>${acts}</aside><div class="panel proj" id="proj"></div></div>`;
      el.querySelectorAll('[data-launch]').forEach((b) => b.onclick = () => launch(b.dataset.launch));
      el.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { host.tab = b.dataset.tab; host.key = null; renderHost(); });
      $('#hFull').onclick = () => { try { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); else document.exitFullscreen(); } catch (e) {} };
      $('#hClose').onclick = () => {
        const b = $('#hClose');
        if (b.dataset.armed) { updRoom({ phase: 'end' }); stopHost(); host.code = null; host.room = null; try { localStorage.removeItem('ds2host'); } catch (e) {} startHost(); }
        else { b.dataset.armed = 1; b.textContent = '¿Seguro? Pulsa otra vez'; setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'Cerrar sala'; } }, 3000); }
      };
      buildProj();
    }
    updateProj();
  }

  function buildProj() {
    const p = $('#proj'), r = host.room;
    if (host.tab === 'res') { p.innerHTML = '<div id="resTable"></div>'; return; }
    if (r.phase === 'lobby' || !r.activityId) {
      p.innerHTML = `<div class="row" style="align-items:flex-start;gap:28px"><div class="qr" id="hQR"></div><div style="flex:1;min-width:220px"><p class="eyebrow">Código de la sala</p><div class="bigcode">${esc(host.code)}</div><p class="muted">Abre la web, escribe el código y elige tu equipo. Luego elige una dinámica en la lista.</p></div></div><h3 style="margin-top:24px"><span id="pCount">0</span> conectados</h3><div id="pChips" class="chips" style="margin-top:10px"></div>`;
      const q = $('#hQR'); if (window.QRCode && /^https?:/.test(joinURL(host.code))) { try { new QRCode(q, { text: joinURL(host.code), width: 134, height: 134 }); } catch (e) {} } else q.style.display = 'none';
      return;
    }
    if (r.phase === 'scores') { p.innerHTML = `<p class="eyebrow">Ranking de la sala</p><div class="grid g2"><div><h3>Individual</h3><div id="rkInd"></div></div><div><h3>Por equipo</h3><p class="small muted">Promedio por integrante</p><div id="rkTeam"></div></div></div><div class="row" style="margin-top:18px"><button class="btn" id="toLobby">Volver al lobby</button></div>`; $('#toLobby').onclick = () => updRoom({ phase: 'lobby', activityId: null }); return; }
    const a = D.activity(r.activityId), st = a.steps[r.stepIndex];
    const last = r.stepIndex === a.steps.length - 1;
    let body = '';
    if (r.phase === 'question') {
      if (st.type === 'mcq' || st.type === 'poll') body = (st.chart ? `<div style="max-width:420px">${miniChart(st.chart)}</div>` : '') + `<div class="opts" style="margin-top:14px">${st.options.map((o, i) => `<div class="opt o${i % 4}">${SHAPES[i % 4]}<span>${esc(o)}</span></div>`).join('')}</div>`;
      else if (st.type === 'poker') body = `<div class="cards">${st.options.map((o) => `<div class="pcard" style="display:grid;place-items:center">${esc(o)}</div>`).join('')}</div>`;
      else if (st.type === 'classify') body = `<div class="chips" style="margin-bottom:12px">${st.categories.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>` + st.items.map((it) => `<div class="citem" style="margin-bottom:6px;padding:8px 12px">${esc(it.text)}</div>`).join('');
      else body = seededOrder(st.items.length, 'host').map((i) => `<div class="oitem"><span class="t">${esc(st.items[i])}</span></div>`).join('');
      p.innerHTML = `<div class="qhead"><span>${esc(a.title)} · paso ${r.stepIndex + 1} de ${a.steps.length}</span><span><b id="aCount" style="color:var(--fg)">0</b> de <span id="pCount2">0</span> respondieron</span></div><div class="row" style="align-items:flex-start"><div class="prompt" style="flex:1">${esc(st.prompt)}</div><div class="ring" id="hRing">--</div></div><div class="timer"><i id="hTimer"></i></div><div style="margin-top:16px">${body}</div><div class="row" style="margin-top:18px"><button class="btn" id="revealBtn">Revelar ahora</button></div>`;
      $('#revealBtn').onclick = () => updRoom({ phase: 'reveal' });
    } else {
      p.innerHTML = `<div class="qhead"><span>${esc(a.title)} · paso ${r.stepIndex + 1} de ${a.steps.length} · resultados</span><span><b id="aCount" style="color:var(--fg)">0</b> respuestas</span></div><div class="prompt">${esc(st.prompt)}</div><div id="dist"></div>${last ? `<div class="feedback" style="margin-top:16px"><span class="muted small">Idea clave</span><p style="margin:4px 0 0">${esc(a.insight)}</p></div>` : ''}<div class="row" style="margin-top:18px">${last ? '<button class="btn" id="toScores">Ver ranking</button>' : '<button class="btn" id="nextStep">Siguiente paso</button>'}</div>`;
      const ns = $('#nextStep'); if (ns) ns.onclick = () => updRoom({ stepIndex: r.stepIndex + 1, phase: 'question', startedAt: Date.now() });
      const ts = $('#toScores'); if (ts) ts.onclick = () => updRoom({ phase: 'scores' });
    }
  }

  function bar(label, val, max, color, txt) {
    const w = max ? Math.round(val / max * 100) : 0;
    return `<div class="bar"><span class="lab">${label}</span><div class="track"><div class="fill" style="width:${w}%;background:${color}"></div></div><span class="val">${txt != null ? txt : val}</span></div>`;
  }
  function teamRows(list, scoreOf) {
    return D.TEAMS.map((t) => { const m = list.filter((p) => p.team === t.id); const avg = m.length ? m.reduce((s, p) => s + scoreOf(p), 0) / m.length : 0; return { t, n: m.length, avg }; }).filter((x) => x.n).sort((a, b) => b.avg - a.avg);
  }
  function updateProj() {
    const r = host.room; if (!r || !$('#proj')) return;
    const pc = $('#pCount'); if (pc) pc.textContent = host.players.length;
    const pc2 = $('#pCount2'); if (pc2) pc2.textContent = host.players.length;
    const chips = $('#pChips'); if (chips) chips.innerHTML = host.players.map((p) => `<span class="chip"><i>${esc(p.team)}</i>${esc(p.name)}</span>`).join('') || '<span class="muted">Todavía nadie. Comparte el código.</span>';
    if (host.tab === 'res') return renderResults();
    if (r.phase === 'scores') {
      const ind = host.players.slice().sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
      const mx = ind.length ? ind[0].score || 1 : 1;
      $('#rkInd').innerHTML = ind.map((p, i) => bar(`${i + 1}. ${esc(p.name)} · ${esc(p.team)}`, p.score || 0, mx, 'var(--accent)')).join('') || '<p class="muted">Sin jugadores.</p>';
      const tr = teamRows(host.players, (p) => p.score || 0); const tm = tr.length ? tr[0].avg || 1 : 1;
      $('#rkTeam').innerHTML = tr.map((x) => bar(`${esc(x.t.label)} · ${x.n}`, Math.round(x.avg), tm, 'var(--yellow)')).join('');
      return;
    }
    if (!r.activityId || r.phase === 'lobby') return;
    const a = D.activity(r.activityId), st = a.steps[r.stepIndex], ans = answersFor(r);
    const ac = $('#aCount'); if (ac) ac.textContent = ans.length;
    if (r.phase === 'question' && host.players.length && ans.length >= host.players.length) autoReveal(r);
    const dist = $('#dist'); if (!dist) return;
    if (st.type === 'mcq' || st.type === 'poll' || st.type === 'poker') {
      const counts = st.options.map((_, i) => ans.filter((x) => x.value === i).length); const mx = Math.max(1, ...counts);
      dist.innerHTML = (st.chart ? `<div style="max-width:420px">${miniChart(st.chart)}</div>` : '') + st.options.map((o, i) => {
        if (st.type === 'poker' && !counts[i]) return '';
        const color = st.type === 'poker' ? 'var(--purple)' : (st.type === 'mcq' ? (i === st.correct ? 'var(--green)' : 'var(--muted)') : `var(--opt${i % 4})`);
        return bar(`${st.type === 'mcq' && i === st.correct ? '✓ ' : ''}${esc(o)}`, counts[i], mx, color);
      }).join('');
      if (st.type === 'poker') {
        const nums = ans.map((x) => ({ v: parseFloat(st.options[x.value]), n: x.name })).filter((x) => !isNaN(x.v));
        if (nums.length) { const lo = Math.min(...nums.map((x) => x.v)), hi = Math.max(...nums.map((x) => x.v));
          dist.innerHTML += `<p style="margin-top:12px">Extremos: <b>${lo}</b> (${esc(nums.filter((x) => x.v === lo).map((x) => x.n).join(', '))}) y <b>${hi}</b> (${esc(nums.filter((x) => x.v === hi).map((x) => x.n).join(', '))}). ${hi / Math.max(lo, 1) >= 3 ? 'Dispersión grande: que expliquen y vuelvan a votar.' : 'Votos cercanos: hay consenso.'}</p>`; }
      }
    } else if (st.type === 'classify') {
      dist.innerHTML = `<p class="muted small">Aciertos por tarjeta · promedio ${ans.length ? Math.round(ans.reduce((s, x) => s + (x.frac || 0), 0) / ans.length * 100) : 0} %</p>` + st.items.map((it, i) => { const ok = ans.filter((x) => x.value && x.value[i] === it.cat).length; return bar(`${esc(it.text)} → ${esc(st.categories[it.cat])}`, ok, Math.max(1, ans.length), 'var(--green)', ans.length ? Math.round(ok / ans.length * 100) + ' %' : '–'); }).join('');
    } else if (st.type === 'order') {
      dist.innerHTML = `<p class="muted small">Orden correcto y % que lo puso en su lugar · promedio ${ans.length ? Math.round(ans.reduce((s, x) => s + (x.frac || 0), 0) / ans.length * 100) : 0} %</p>` + st.items.map((t, i) => { const ok = ans.filter((x) => x.value && x.value[i] === i).length; return bar(`${i + 1}. ${esc(t)}`, ok, Math.max(1, ans.length), 'var(--green)', ans.length ? Math.round(ok / ans.length * 100) + ' %' : '–'); }).join('');
    }
  }
  function renderResults() {
    const box = $('#resTable'); if (!box) return;
    const rows = [];
    D.ACTIVITIES.forEach((a) => a.steps.forEach((st, i) => {
      const ans = host.answers.filter((x) => x.activityId === a.id && x.step === i); if (!ans.length) return;
      const ok = gradable(st) ? ans.filter((x) => x.correct).length : null;
      const avg = gradable(st) ? Math.round(ans.reduce((s, x) => s + (x.frac || 0), 0) / ans.length * 100) : null;
      rows.push({ a, i, st, n: ans.length, ok, avg });
    }));
    const csv = ['dinamica,paso,pregunta,respuestas,correctas,promedio_pct'].concat(rows.map((x) => [x.a.id, x.i + 1, '"' + x.st.prompt.replace(/"/g, '""') + '"', x.n, x.ok == null ? '' : x.ok, x.avg == null ? '' : x.avg].join(','))).join('\n');
    box.innerHTML = `<div class="row"><h3>Resultados de esta sala</h3><span class="spacer"></span><button class="btn ghost sm" id="copyCsv">Copiar CSV</button></div><div class="tablewrap" style="margin-top:10px"><table class="t"><tr><th>Dinámica</th><th>Pregunta</th><th class="num">Resp.</th><th class="num">Correctas</th><th class="num">Acierto</th></tr>${rows.map((x) => `<tr><td class="mono small">${x.a.id} · ${x.i + 1}</td><td>${esc(x.st.prompt)}</td><td class="num">${x.n}</td><td class="num">${x.ok == null ? '—' : x.ok}</td><td class="num">${x.avg == null ? 'encuesta' : x.avg + ' %'}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Aún no hay respuestas.</td></tr>'}</table></div><h3 style="margin-top:22px">Jugadores</h3><div class="tablewrap"><table class="t"><tr><th>Nombre</th><th>Equipo</th><th class="num">Puntos</th></tr>${host.players.slice().sort((a, b) => (b.score || 0) - (a.score || 0)).map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.team)}</td><td class="num">${p.score || 0}</td></tr>`).join('')}</table></div>`;
    $('#copyCsv').onclick = () => { const done = () => toast('CSV copiado'); try { navigator.clipboard.writeText(csv).then(done, () => fallbackCopy(csv)); } catch (e) { fallbackCopy(csv); } };
  }
  function fallbackCopy(text) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('CSV copiado'); } catch (e) { toast('Selecciona y copia el texto manualmente'); } ta.remove(); }

  /* Reloj compartido: jugador y docente */
  setInterval(() => {
    const r = host.room;
    if (r && r.phase === 'question' && r.activityId && $('#hRing')) {
      const left = Math.max(0, (r.duration || 30) - (Date.now() - r.startedAt) / 1000);
      $('#hRing').textContent = Math.ceil(left);
      const t = $('#hTimer'); if (t) t.style.transform = `scaleX(${left / (r.duration || 30)})`;
      if (left <= 0) autoReveal(r);
    }
    const pr = player.room;
    if (pr && pr.phase === 'question' && $('#pTimer')) {
      const k = `${player.code}|${stepKey(pr)}`; const seen = player.seenAt[k] || Date.now();
      const left = Math.max(0, (pr.duration || 30) - (Date.now() - seen) / 1000);
      $('#pTimer').style.transform = `scaleX(${left / (pr.duration || 30)})`;
    }
  }, 250);

  /* ---------- Práctica ---------- */
  const practice = { act: null, i: 0, results: [], total: 0 };
  let allResults = [], allStats = [];
  function renderPracticeList() {
    const mine = {}; allResults.filter((x) => x.uid === store.uid).forEach((x) => mine[x.activityId] = x);
    $('#practiceList').innerHTML = D.SECTIONS.map((sec) => `<div class="seclabel">Sección ${sec.n} · ${esc(sec.title)}</div><div class="grid g3">` +
      D.ACTIVITIES.filter((a) => a.section === sec.n).map((a) => { const best = mine[a.id]; const max = a.steps.reduce((s, st) => s + maxPoints(st), 0);
        return `<button class="acard" data-play="${a.id}"><div class="meta"><span class="pill ${a.moment}">${MOMENT[a.moment]}</span><span>${a.steps.length} ${a.steps.length === 1 ? 'paso' : 'pasos'}</span><span>${a.id}</span></div><h3>${esc(a.title)}</h3><span class="muted small">${esc(a.lead)}</span><span class="best">${best ? `Tu mejor: ${best.score} / ${max}` : ''}</span></button>`; }).join('') + '</div>').join('');
    document.querySelectorAll('[data-play]').forEach((b) => b.onclick = () => {
      const name = $('#pName').value.trim(); if (!name) { $('#pName').focus(); toast('Escribe tu nombre para guardar tus puntos'); return; }
      saveProfile(name, $('#pTeam').value);
      practice.act = D.activity(b.dataset.play); practice.i = 0; practice.results = []; practice.total = 0; location.hash = '#jugar'; renderPracticeStep();
    });
  }
  function renderPracticeStep() {
    const a = practice.act, el = $('#practiceStage'); if (!a) return;
    if (practice.i >= a.steps.length) return finishPractice();
    const st = a.steps[practice.i];
    el.innerHTML = `<div class="qhead"><a href="#practica">← Práctica</a><span>${esc(a.title)} · paso ${practice.i + 1} de ${a.steps.length} · <b style="color:var(--fg)">${practice.total}</b> pts</span></div><div class="prompt">${esc(st.prompt)}</div><div id="prInput"></div><div id="prFb"></div>`;
    buildInput($('#prInput'), st, store.uid + a.id + practice.i, (value) => {
      const res = score(st, value, null);
      practice.results.push({ step: practice.i, value, res }); practice.total += res.points;
      let extra = '';
      if (st.type === 'poll' || st.type === 'poker') extra = '<p class="muted small" style="margin:8px 0 0">Las encuestas y el Planning Poker no tienen respuesta correcta: en clase se comparan los votos.</p>';
      $('#prFb').innerHTML = feedbackHTML(st, value, res, extra) + `<button class="btn block" id="prNext">${practice.i === a.steps.length - 1 ? 'Ver resultado' : 'Siguiente'}</button>`;
      $('#prNext').onclick = () => { practice.i++; renderPracticeStep(); };
      $('#prNext').focus();
      store.incr(`stats/${a.id}__${practice.i}`, gradable(st) ? { n: 1, correct: res.correct ? 1 : 0, fracSum: res.frac } : { n: 1 }, { activityId: a.id, step: practice.i }).catch(() => {});
    });
  }
  async function finishPractice() {
    const a = practice.act, el = $('#practiceStage');
    const max = a.steps.reduce((s, st) => s + maxPoints(st), 0);
    const g = practice.results.filter((x) => x.res.correct !== null), ok = g.filter((x) => x.res.correct).length;
    const id = `results/${store.uid}__${a.id}`; const prev = await store.get(id);
    const best = Math.max(practice.total, prev ? prev.score || 0 : 0);
    await store.set(id, { uid: store.uid, name: profile.name, team: profile.team, activityId: a.id, score: best, last: practice.total, max, correct: ok, total: g.length, at: Date.now() }).catch(() => {});
    el.innerHTML = `<div class="panel center" style="padding:36px 20px"><p class="eyebrow">${esc(a.title)}</p><div class="bigcode" style="font-size:64px;letter-spacing:0">${practice.total}<span class="muted" style="font-size:24px"> / ${max}</span></div><p>${g.length ? `${ok} de ${g.length} pasos completamente correctos.` : 'Gracias por participar.'} ${best > practice.total ? `Tu mejor puntaje sigue siendo ${best}.` : ''}</p><p class="muted" style="max-width:56ch;margin:10px auto 0">${esc(a.insight)}</p><div class="row" style="justify-content:center;margin-top:18px"><button class="btn" id="again">Repetir</button><a class="btn ghost" href="#practica">Otras dinámicas</a><a class="btn ghost" href="#ranking">Ver ranking</a></div></div>`;
    $('#again').onclick = () => { practice.i = 0; practice.results = []; practice.total = 0; renderPracticeStep(); };
  }

  /* ---------- Ranking ---------- */
  function renderRanking() {
    if (!$('#v-ranking').classList.contains('on')) return;
    const people = {};
    allResults.forEach((x) => { const p = people[x.uid] || (people[x.uid] = { name: x.name, team: x.team, total: 0, n: 0 }); p.total += x.score || 0; p.n++; p.name = x.name; p.team = x.team; });
    const list = Object.values(people).sort((a, b) => b.total - a.total);
    const mx = list.length ? list[0].total || 1 : 1;
    $('#rkPeople').innerHTML = list.slice(0, 15).map((p, i) => bar(`${i + 1}. ${esc(p.name)} · ${esc(p.team)} · ${p.n} din.`, p.total, mx, 'var(--accent)')).join('') || '<p class="muted">Todavía no hay resultados. Juega una dinámica en Práctica.</p>';
    const tr = teamRows(list, (p) => p.total); const tm = tr.length ? tr[0].avg || 1 : 1;
    $('#rkTeams').innerHTML = tr.map((x) => bar(`${esc(x.t.label)} · ${x.n} integrantes`, Math.round(x.avg), tm, 'var(--yellow)')).join('') || '<p class="muted">Sin datos todavía.</p>';
    const rows = [];
    D.ACTIVITIES.forEach((a) => a.steps.forEach((st, i) => { const s = allStats.find((x) => x.id === `${a.id}__${i}`); if (!s || !s.n) return; rows.push({ a, i, st, s }); }));
    $('#rkStats').innerHTML = `<table class="t"><tr><th>Dinámica</th><th>Pregunta</th><th class="num">Intentos</th><th class="num">Correctas</th><th class="num">Acierto</th></tr>${rows.map((x) => `<tr><td class="mono small">${esc(x.a.title)}</td><td>${esc(x.st.prompt)}</td><td class="num">${x.s.n}</td><td class="num">${gradable(x.st) ? x.s.correct || 0 : '—'}</td><td class="num">${gradable(x.st) ? Math.round((x.s.correct || 0) / x.s.n * 100) + ' %' : 'encuesta'}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Sin intentos todavía.</td></tr>'}</table>`;
  }

  /* ---------- Resumen ---------- */
  function renderResumen() {
    const el = $('#v-resumen'); if (el.dataset.done) return; el.dataset.done = 1;
    const L = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`;
    el.innerHTML = `<p class="eyebrow">Resumen · Semana 3</p><h2>Procesamiento del Backlog en cinco paradas</h2><p class="muted">Lo esencial de las dos sesiones, con el capstone Delivery System como ejemplo. La presentación completa está en ${L('slides.html', 'Presentación')}.</p>
    <h3>1 · Capstone Checkpoint</h3>
    <p>El análisis de requerimientos convierte la épica en piezas verificables: separa FUN, INT y RNF, identifica actores y dependencias, y compara lo pedido con el código existente. En users-module eso reveló tres brechas: falta el rol <code>MERCHANT</code>, no existe <code>UserService</code> y existe un <code>DeleteUserUseCase</code> aunque RF-1.11 prohíbe borrar usuarios.</p>
    <p>Trazabilidad: Épica → FUN/INT → Historia → Caso de uso (1 por FUN) → Issue → rama → Merge Request.</p>
    <div class="tablewrap"><table class="t"><tr><th>Talla</th><th>Significado</th><th>Esfuerzo</th><th class="num">≈ SP</th></tr><tr><td>XS</td><td>Cambio trivial</td><td>&lt; 2 h</td><td class="num">1</td></tr><tr><td>S</td><td>Tarea simple, una capa</td><td>2–4 h</td><td class="num">2–3</td></tr><tr><td>M</td><td>Caso de uso con persistencia</td><td>4–8 h</td><td class="num">5</td></tr><tr><td>L</td><td>Integración entre capas o módulos</td><td>1–2 días</td><td class="num">8</td></tr><tr><td>XL</td><td>Se debe dividir</td><td>&gt; 2 días</td><td class="num">13+</td></tr></table></div>
    <p>users-module suma 76 SP obligatorios en 17 historias. Plan: Sprint 1 (semanas 3–4, 24 SP) MERCHANT, UserService y usuarios de prueba; Sprint 2 sesión y perfil (26 SP); Sprint 3 permisos y administración (26 SP); semana 9 opcionales y v1.0.0.</p>
    <h3>2 · El Backlog</h3>
    <p>El Product Backlog es una lista emergente y ordenada de lo que se necesita para mejorar el producto; es la única fuente del trabajo del Scrum Team y su compromiso es el Objetivo del Producto. Cuatro equipos en el mismo producto comparten Product Owner, Product Backlog, Objetivo del Producto y Definición de Terminado. Un backlog sano es DEEP: detallado adecuadamente, estimado, emergente y priorizado. En GitLab: Epic de grupo, labels de feature, issues con Weight dentro de un Milestone (Sprint) y tareas como checklist.</p>
    <h3>3 · Refinamiento</h3>
    <p>Dividir y definir elementos agregando descripción, orden y tamaño, de forma continua (práctica común: ≈ 10 % de la capacidad). Los Developers dimensionan.</p>
    <p><b>DoR propuesta:</b> trazada a un FUN/INT · criterios Dado/Cuando/Entonces · dependencias con mock · estimada · ≤ 8 SP · se sabe cómo probarla. La DoR no está en la Guía Scrum: es una práctica opcional.</p>
    <div class="lettergrid">${[['I', 'Independiente'], ['N', 'Negociable'], ['V', 'Valiosa'], ['E', 'Estimable'], ['S', 'Pequeña'], ['T', 'Testeable']].map((x) => `<div class="letter"><b>${x[0]}</b>${x[1]}</div>`).join('')}</div>
    <p style="margin-top:14px"><b>Estimación.</b> Govil &amp; Sharma (2023) extienden un algoritmo de 14 a 36 factores de éxito en cinco dimensiones y suman la regresión por Sprint (11 pasos: BSP, UV, ESP, V, DV, EDT, TET, I, ERTE, TEE, TEC). En P1: TEE 256.31 SP y TEC $12,302.93. Aplicado a users-module: TEE 86.24 SP, 2.01 iteraciones (≈ 2.9 Sprints si se mide en horas). Adnan &amp; Afzal (2017) usan una ontología Scrum y cinco agentes; con 12 proyectos web midieron:</p>
    <div class="tablewrap"><table class="t"><tr><th>Método</th><th class="num">MMRE</th><th class="num">PRED(25)</th></tr><tr><td>Multiagente</td><td class="num">0.101</td><td class="num">0.91</td></tr><tr><td>Planning Poker</td><td class="num">0.120</td><td class="num">0.83</td></tr><tr><td>Delphi</td><td class="num">0.153</td><td class="num">0.75</td></tr></table></div>
    <p>MRE = |real − estimado| ÷ real; PRED(25) = proporción de estimaciones con MRE ≤ 0.25. Buen modelo: MMRE ≤ 0.25 y PRED(25) ≥ 0.75. En el capstone usamos story points con Planning Poker: votar en secreto, revelar, hablan los extremos y se vuelve a votar.</p>
    <h3>4 · Sprint Planning</h3>
    <p>Tres temas: por qué (Objetivo del Sprint), qué (elementos seleccionados por los Developers con el PO) y cómo (tareas de un día o menos). Máximo 8 h para un Sprint de un mes; proporcionalmente unas 4 h para 2 semanas. Capacidad = personas × días × horas de foco, menos refinamiento.</p>
    <p><b>SMART:</b> Específico, Medible, Alcanzable, Relevante/Realista y con Tiempo definido. Que el resultado sea SMART, no la lista de tareas.</p>
    <p><b>DoD común propuesta:</b> compila con <code>./mvnw clean install</code> · caso de uso probado en memoria · adaptador JPA probado con H2 y Flyway · FXML presentes · sin dependencias entre módulos de negocio · MR revisado · pipeline en verde. La tesis de Guðbjörnsson (2016) recomienda 5 a 7 elementos, revisión regular, y advierte que bajo presión es lo primero que se salta.</p>
    <div class="tablewrap"><table class="t"><tr><th></th><th>DoR</th><th>Criterios de aceptación</th><th>DoD</th></tr><tr><td>Pregunta</td><td>¿Puede entrar al Sprint?</td><td>¿Hace lo que se pidió?</td><td>¿Tiene la calidad del producto?</td></tr><tr><td>Alcance</td><td>Cada historia</td><td>Una historia</td><td>Todo el Increment</td></tr><tr><td>¿En la Guía?</td><td>No</td><td>No</td><td>Sí</td></tr></table></div>
    <h3>5 · Seguimiento</h3>
    <p>Transparencia, inspección y adaptación. Daily Scrum de 15 minutos centrada en el Objetivo del Sprint. El tablero de GitLab con labels <code>workflow::</code> se actualiza a diario. El burndown baja solo con historias terminadas; el burnup separa los cambios de alcance; la velocidad real reemplaza a la supuesta. La Guía advierte que estas gráficas no reemplazan el empirismo.</p>
    <h3>Fuentes y lecturas</h3>
    <ul class="small">
      <li>${L('https://www.agile-academy.com/es/scrum-master/que-es-la-definition-of-done-dod-en-agile/', 'Agile Academy · ¿Qué es la Definition of Done?')}</li>
      <li>${L('https://www.scrum.org/resources/blog/getting-started-definition-done-dod', 'Scrum.org · Getting started with Definition of Done')}</li>
      <li>${L('https://pm.stackexchange.com/questions/6223/what-smart-goals-can-i-set-for-myself-as-a-new-scrum-master', 'PM Stack Exchange · SMART goals para un Scrum Master')}</li>
      <li>${L('https://www.wibas.com/en/blog/articles-1/smart-goals-in-scrum-433', 'wibas · SMART goals in Scrum')}</li>
      <li>${L('https://www.scrum.org/resources/blog/when-are-smart-goals-not-so-smart', 'Scrum.org · When are SMART goals not so smart')}</li>
      <li>${L('https://www.scrummanager.com/blog/2023/03/smart-goals/', 'Scrum Manager · SMART goals')}</li>
      <li>${L('https://www.visual-paradigm.com/scrum/write-user-story-smart-goals/', 'Visual Paradigm · User stories y SMART')}</li>
      <li>${L('https://www.accomexico.com/blogs/como-definir-objetivos-smart-para-alcanzar-el-exito-en-tus-proyectos', 'ACCO México · Objetivos SMART')}</li>
      <li>${L('https://asana.com/es/resources/smart-goals', 'Asana · Objetivos SMART')}</li>
      <li>${L('https://www.visual-paradigm.com/scrum/3c-and-invest-guide/', 'Visual Paradigm · 3C e INVEST')}</li>
      <li>${L('https://www.boost.co.nz/blog/2021/10/invest-criteria/', 'Boost · INVEST criteria')}</li>
      <li>${L('https://www.scrummanager.com/blog/2024/10/el-metodo-invest-y-las-historias-de-usuario/', 'Scrum Manager · El método INVEST')}</li>
      <li>${L('https://scrum-master.org/en/creating-the-perfect-user-story-with-invest-criteria/', 'scrum-master.org · User stories con INVEST')}</li>
      <li>${L('https://www.agilisters.org/2023/06/product-backlog-refinement.html', 'Agilisters · Product Backlog Refinement')}</li>
      <li>${L('https://sites.google.com/a/scrumplop.org/published-patterns/value-stream/product-backlog/refined-product-backlog?authuser=0', 'ScrumPLoP · Refined Product Backlog')}</li>
      <li>${L('https://resources.scrumalliance.org/Article/product-backlog-refinement', 'Scrum Alliance · Product Backlog Refinement')}</li>
      <li>${L('https://guides.visual-paradigm.com/es/mastering-agile-development-a-comprehensive-guide-to-backlog-grooming/', 'Visual Paradigm · Backlog grooming')}</li>
      <li>${L('https://www.scrumio.com/blog/refinamiento-backlog', 'Scrumio · Refinamiento del backlog')}</li>
      <li>${L('https://www.scrum.org/resources/blog/que-es-el-refinamiento-del-backlog', 'Scrum.org · ¿Qué es el refinamiento del backlog?')}</li>
      <li>${L('https://donetonic.com/es/el-backlog-burndown/', 'DoneTonic · El backlog burndown')}</li>
      <li>${L('https://www.scrum-institute.org/The_Scrum_Product_Backlog.php', 'Scrum Institute · The Scrum Product Backlog')}</li>
      <li>${L('https://devits.io/que-es-el-backlog-y-como-ayuda-a-organizar-un-proyecto/', 'DevITs · ¿Qué es el backlog?')}</li>
      <li>${L('https://www.fracttal.com/es/mantenipedia/que-es-el-backlog-en-mantenimiento-y-como-calcularlo', 'Fracttal · Backlog en mantenimiento')}</li>
      <li>Schwaber y Sutherland (2020), <i>La Guía de Scrum</i> · Guðbjörnsson (2016), <i>Definition of Done in Practice</i> · Govil y Sharma (2023), <i>Iraqi Journal of Science</i> 64(12) · Adnan y Afzal (2017), <i>IEEE Access</i> 5 · CADA UDD, <i>Guía SMART</i>.</li>
    </ul>`;
  }

  /* ---------- Arranque ---------- */
  (async function boot() {
    store = await window.DSStore.init();
    $('#modeTag').textContent = store.mode === 'firebase' ? 'en línea · Firebase' : 'modo local';
    $('#modeTag').title = store.mode === 'firebase' ? 'Resultados compartidos con todo el curso' : 'Sin Firebase: los resultados solo se ven en este navegador';
    $('#practiceCount').textContent = `Las ${D.ACTIVITIES.length} dinámicas de la presentación, sin sala y a tu ritmo.`;
    store.watchCol('results', (l) => { allResults = l; if ($('#v-practica').classList.contains('on')) renderPracticeList(); renderRanking(); });
    store.watchCol('stats', (l) => { allStats = l; renderRanking(); });
    route();
  })();
})();
