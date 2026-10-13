# Semana 3 · Procesamiento del Backlog

Material de la Semana 3 de **Desarrollo de Software 2** (Jala University), enfocado en el proyecto capstone *Delivery System*.

| Ruta | Qué es |
|------|--------|
| `site/slides.html` | Presentación de las dos sesiones (80 diapositivas, notas del presentador) |
| `site/index.html` | Web interactiva: sala en vivo, consola del docente, práctica, ranking y resumen |
| `site/activities.js` | Las 13 dinámicas. **Fuente única**: la usan la presentación y la web |
| `site/store.js` | Capa de datos: Firestore o modo local |
| `site/firebase-config.js` | Configuración web de tu proyecto de Firebase |
| `firestore.rules` | Reglas de seguridad de Firestore |
| `.github/workflows/pages.yml` | Publica `site/` en GitHub Pages en cada push a `main` |

## Contenido

**Sesión 1 (90 min):** 1 · Capstone Checkpoint (SDLC, casos de uso, tallas T-shirt, Gantt de users-module) · 2 · El Backlog · 3 · Refinamiento (DoR, INVEST, estimaciones: Govil & Sharma, Adnan & Afzal, story points y Planning Poker).

**Sesión 2 (90 min):** 4 · Sprint Planning (SMART, DoD común del capstone) · 5 · Seguimiento (tablero de GitLab, burndown, burnup, velocidad).

Cada sección abre y cierra con una dinámica que se juega desde el celular.

## Usar la presentación

Abre `slides.html` (en GitHub Pages o con un servidor local).

| Tecla | Acción |
|-------|--------|
| → / espacio | Siguiente paso o diapositiva |
| ← | Anterior |
| N | Mostrar u ocultar notas del presentador |
| P | Vista del presentador en otra ventana (sincronizada) con reloj y notas |
| M | Índice de diapositivas |
| F | Pantalla completa |

En las diapositivas de dinámica, pulsa → para revelar las respuestas cuando la sala muestre los resultados. La diapositiva "Capacidad del equipo" tiene una calculadora que funciona en vivo.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub y sube este contenido a la rama `main`.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Haz push. El workflow publica `site/` en `https://<usuario>.github.io/<repositorio>/`.
   - La web queda en `/` y la presentación en `/slides.html`.

## Configurar Firebase (para que la sala funcione entre celulares)

Sin Firebase la web funciona en **modo local**: solo se sincronizan las pestañas del mismo navegador. Sirve para probar, no para clase.

1. En la [consola de Firebase](https://console.firebase.google.com/) crea un proyecto.
2. **Build → Authentication → Sign-in method**: activa **Anónimo**.
3. **Authentication → Settings → Authorized domains**: agrega `<usuario>.github.io`.
4. **Build → Firestore Database**: crea la base (modo producción, región cercana).
5. **Firestore → Rules**: pega el contenido de `firestore.rules` y publica.
   - O con la CLI: `npm i -g firebase-tools && firebase login && firebase deploy --only firestore:rules --project <id>`.
6. **Configuración del proyecto → Tus apps → Web (</>)**: registra una app y copia el objeto `firebaseConfig`.
7. Pega ese objeto en `site/firebase-config.js` (`window.FIREBASE_CONFIG = { ... }`) y haz push.
   - Alternativa: guarda el objeto JSON como secreto `FIREBASE_CONFIG` en **Settings → Secrets and variables → Actions**; el workflow genera el archivo al publicar.

La etiqueta de la cabecera indica el modo: `en línea · Firebase` o `modo local`.

## Cómo se juega en clase

1. El docente abre la web → **Docente → Crear sala** y la proyecta (código de 5 letras y QR).
2. Los estudiantes abren la web, escriben el código, su nombre y su equipo (A · B · C · D).
3. El docente elige una dinámica de la lista. Cada paso tiene tiempo; se revela solo al terminar el tiempo o cuando todos respondieron.
4. Al final de cada dinámica: **Ver ranking** (individual y por equipo, con promedio por integrante).
5. La pestaña **Resultados** muestra cuántos acertaron cada pregunta y permite copiar un CSV.

Puntuación: quiz 500 + bono por rapidez (hasta 1000); clasificar y ordenar hasta 1000 según aciertos; encuesta y Planning Poker 100 por participar.

La sección **Práctica** permite jugar todas las dinámicas a tu ritmo; el mejor puntaje de cada una alimenta el **Ranking** global, por equipo, y la tabla de aciertos por pregunta.

## Editar las dinámicas

Todo está en `site/activities.js`. Tipos de paso: `mcq`, `poll`, `classify`, `order`, `poker` (ver comentario al inicio del archivo). Al cambiarlo, la presentación y la web se actualizan solas.

## Fuentes

Schwaber y Sutherland (2020), *La Guía de Scrum* · Guðbjörnsson (2016), *Definition of Done in Practice*, Reykjavik University · Govil y Sharma (2023), *Iraqi Journal of Science* 64(12), 6522–6533 · Adnan y Afzal (2017), *IEEE Access* 5, 25993–26005 · CADA UDD, *Guía SMART* · Requerimientos del Módulo de Usuarios y Agile Requirements Delivery System (Jala University). Lecturas complementarias enlazadas en la sección Resumen de la web.
