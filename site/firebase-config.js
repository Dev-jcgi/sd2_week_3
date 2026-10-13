/*
 * Pega aquí la configuración web de tu proyecto de Firebase
 * (Consola de Firebase → Configuración del proyecto → Tus apps → SDK de Firebase, "Config").
 * Estos valores no son secretos: identifican el proyecto. La seguridad la dan firestore.rules.
 *
 * Si lo dejas en null, la web funciona en "modo local": las pestañas del mismo navegador
 * se sincronizan entre sí, útil para probar la consola del docente y un jugador a la vez.
 *
 * El workflow de GitHub Actions reescribe este archivo si defines el secreto FIREBASE_CONFIG.
 */
window.FIREBASE_CONFIG = null;
/* Ejemplo:
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "ds2-semana3.firebaseapp.com",
  projectId: "ds2-semana3",
  storageBucket: "ds2-semana3.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000"
};
*/
