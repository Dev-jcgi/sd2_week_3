/*
 * Capa de datos de la web.
 *  - Con firebase-config.js lleno: Firestore + autenticación anónima (todos los dispositivos sincronizados).
 *  - Sin configuración: modo local con localStorage + BroadcastChannel (solo pestañas del mismo navegador).
 * API común (rutas estilo Firestore "rooms/ABCDE/players/uid"):
 *   uid, mode, get(path), set(path, data, merge), incr(path, fields), watchDoc(path, cb), watchCol(path, cb)
 */
(function () {
  const FB_VERSION = '10.12.2';

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('No se pudo cargar ' + src));
      document.head.appendChild(s);
    });
  }

  async function firebaseImpl(cfg) {
    const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}/`;
    await loadScript(base + 'firebase-app-compat.js');
    await loadScript(base + 'firebase-auth-compat.js');
    await loadScript(base + 'firebase-firestore-compat.js');
    const app = firebase.initializeApp(cfg);
    const auth = app.auth();
    const db = app.firestore();
    const cred = auth.currentUser ? { user: auth.currentUser } : await auth.signInAnonymously();
    const uid = cred.user.uid;
    const snapDoc = (d) => (d.exists ? Object.assign({ id: d.id }, d.data()) : null);
    return {
      mode: 'firebase', uid,
      async get(path) { return snapDoc(await db.doc(path).get()); },
      async set(path, data, merge) { await db.doc(path).set(data, { merge: !!merge }); },
      async incr(path, fields, extra) {
        const inc = {};
        for (const k in fields) inc[k] = firebase.firestore.FieldValue.increment(fields[k]);
        await db.doc(path).set(Object.assign({}, extra || {}, inc), { merge: true });
      },
      watchDoc(path, cb) { return db.doc(path).onSnapshot((d) => cb(snapDoc(d)), (e) => console.warn(e)); },
      watchCol(path, cb) { return db.collection(path).onSnapshot((q) => cb(q.docs.map(snapDoc)), (e) => console.warn(e)); }
    };
  }

  function localImpl() {
    // Un documento por clave ("ds2:<ruta>") para que dos pestañas no se pisen al escribir.
    const P = 'ds2:';
    const mem = {};
    let canStore = true;
    try { localStorage.setItem(P + '_probe', '1'); localStorage.removeItem(P + '_probe'); } catch (e) { canStore = false; }
    const readDoc = (path) => { if (!canStore) return mem[path] || null; try { const v = localStorage.getItem(P + path); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
    const writeDoc = (path, d) => { if (!canStore) { mem[path] = d; return; } try { localStorage.setItem(P + path, JSON.stringify(d)); } catch (e) { mem[path] = d; } };
    const keys = () => { if (!canStore) return Object.keys(mem); const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(P)) out.push(k.slice(P.length)); } } catch (e) {} return out; };
    let uid = null;
    try { uid = sessionStorage.getItem('ds2uid'); } catch (e) {}
    if (!uid) { uid = 'local-' + Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('ds2uid', uid); } catch (e) {} }
    const listeners = new Set();
    let chan = null; try { chan = new BroadcastChannel('ds2db'); } catch (e) {}
    let queued = false;
    const notify = (remote) => {
      if (!remote && chan) chan.postMessage('change');
      if (queued) return; queued = true;
      setTimeout(() => { queued = false; listeners.forEach((fn) => fn()); }, 0);
    };
    if (chan) chan.onmessage = () => notify(true);
    window.addEventListener('storage', (e) => { if (e.key && e.key.startsWith(P)) notify(true); });
    const docsIn = (col) => keys()
      .filter((p) => p.startsWith(col + '/') && !p.slice(col.length + 1).includes('/'))
      .map((p) => Object.assign({ id: p.slice(col.length + 1) }, readDoc(p)));
    const watch = (fn) => { listeners.add(fn); fn(); return () => listeners.delete(fn); };
    return {
      mode: 'local', uid,
      async get(path) { const d = readDoc(path); return d ? Object.assign({ id: path.split('/').pop() }, d) : null; },
      async set(path, data, merge) { writeDoc(path, merge ? Object.assign({}, readDoc(path) || {}, data) : Object.assign({}, data)); notify(); },
      async incr(path, fields, extra) {
        const cur = Object.assign({}, readDoc(path) || {}, extra || {});
        for (const k in fields) cur[k] = (cur[k] || 0) + fields[k];
        writeDoc(path, cur); notify();
      },
      watchDoc(path, cb) { let last; return watch(() => { const d = readDoc(path); const s = JSON.stringify(d); if (s !== last) { last = s; cb(d ? Object.assign({ id: path.split('/').pop() }, d) : null); } }); },
      watchCol(path, cb) { let last; return watch(() => { const list = docsIn(path); const s = JSON.stringify(list); if (s !== last) { last = s; cb(list); } }); }
    };
  }

  window.DSStore = {
    async init() {
      const cfg = window.FIREBASE_CONFIG;
      if (cfg && cfg.apiKey && cfg.projectId) {
        try { return await firebaseImpl(cfg); }
        catch (e) { console.warn('Firebase no disponible, se usa el modo local.', e); }
      }
      return localImpl();
    }
  };
})();
