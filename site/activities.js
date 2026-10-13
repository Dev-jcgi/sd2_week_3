/*
 * Dinámicas de la Semana 3 · Procesamiento del Backlog
 * Fuente única: la usan la presentación (slides.html) y la web (index.html).
 *
 * Tipos de paso (step.type):
 *   mcq      opción múltiple; `correct` es el índice correcto
 *   poll     encuesta sin respuesta correcta
 *   classify cada ítem va a una categoría; `items[i].cat` es el índice de categoría correcta
 *   order    ordenar; `items` viene en el orden correcto (la web lo baraja)
 *   poker    Planning Poker; sin respuesta correcta, se comparan los votos
 * Un paso mcq puede llevar `chart` (serie de un burndown) que se dibuja arriba de la pregunta.
 */
(function () {
  const COURSE = {
    name: 'Desarrollo de Software 2',
    week: 'Semana 3',
    topic: 'Procesamiento del Backlog',
    footer: 'Desarrollo de Software 2 · Semana 3 · Procesamiento del Backlog'
  };

  const SECTIONS = [
    { n: 1, id: 'checkpoint', title: 'Capstone Checkpoint', session: 1 },
    { n: 2, id: 'backlog', title: 'El Backlog', session: 1 },
    { n: 3, id: 'refinamiento', title: 'Refinamiento del Product Backlog', session: 1 },
    { n: 4, id: 'planning', title: 'Sprint Planning', session: 2 },
    { n: 5, id: 'seguimiento', title: 'Seguimiento del progreso', session: 2 }
  ];

  const TEAMS = [
    { id: 'A', module: 'delivery-module', label: 'Equipo A · Entregas' },
    { id: 'B', module: 'order-module', label: 'Equipo B · Pedidos' },
    { id: 'C', module: 'catalog-module', label: 'Equipo C · Catálogo' },
    { id: 'D', module: 'payment-module', label: 'Equipo D · Pagos' },
    { id: 'X', module: 'invitado', label: 'Docente / invitado' }
  ];

  const FIB = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

  const ACTIVITIES = [
    /* ---------------- Sección 1 · Capstone Checkpoint ---------------- */
    {
      id: 'a1', section: 1, moment: 'apertura', mode: 'Individual', time: 45,
      title: '¿En qué punto está tu equipo?',
      lead: 'Responde con honestidad: no hay respuesta correcta y nadie ve tu nombre en los resultados.',
      insight: 'Si la mayoría todavía no tiene issues estimados, esta semana es justo para eso: backlog, refinamiento y estimación.',
      notes: 'Encuesta de diagnóstico. Lanza la sala y deja 45 s por pregunta. Al revelar, comenta la distribución sin señalar equipos. Si dominan "nada todavía" o "solo la épica", anuncia que al final de la sesión 1 cada equipo saldrá con su backlog ordenado y al menos el Sprint 1 estimado.',
      steps: [
        { type: 'poll', prompt: '¿Qué tiene hoy tu equipo en GitLab?',
          options: ['Nada todavía', 'Solo la épica', 'Épica + issues sin estimar', 'Issues estimados, con labels y milestone'] },
        { type: 'poll', prompt: '¿Tu equipo ya identificó qué servicios de otros módulos necesita (UserService, CatalogService…)?',
          options: ['Sí, y ya pensamos en los mocks', 'Sí, pero sin mocks', 'Más o menos', 'No'] }
      ]
    },
    {
      id: 'a2', section: 1, moment: 'cierre', mode: 'Individual', time: 75,
      title: 'Del requerimiento al Merge Request',
      lead: 'Primero ordena la ruta de trazabilidad; después asigna una talla a cada trabajo de users-module.',
      insight: 'Un XL no se estima: se divide. Si tu issue no cabe en un par de días, todavía no está listo.',
      notes: 'Dos pasos. El orden refuerza la regla 1 FUN = 1 caso de uso. En las tallas, la discusión valiosa está en el XL: la recuperación de contraseña con correo y token es demasiado grande para un solo issue y se divide (generar token, enviar correo simulado, validar token, cambiar contraseña).',
      steps: [
        { type: 'order', prompt: 'Ordena la ruta de trazabilidad del capstone',
          items: ['Épica del módulo (MOD)', 'Requerimiento FUN / INT', 'Historia de Usuario', 'Caso de Uso (1 por FUN)', 'Issue + rama en GitLab', 'Merge Request revisado'] },
        { type: 'classify', prompt: '¿Qué talla T-shirt le das a cada trabajo?',
          categories: ['XS', 'S', 'M', 'L', 'XL'],
          items: [
            { text: 'Agregar MERCHANT al enum UserRole', cat: 0 },
            { text: 'Validar el formato del teléfono en el dominio', cat: 1 },
            { text: 'Caso de uso para inactivar una cuenta, con persistencia JPA y memoria', cat: 2 },
            { text: 'UserService consumido por catálogo, pedidos y entregas, con mocks', cat: 3 },
            { text: 'Recuperación de contraseña completa: token, correo y cambio, todo en un issue', cat: 4 }
          ] }
      ]
    },

    /* ---------------- Sección 2 · El Backlog ---------------- */
    {
      id: 'a3', section: 2, moment: 'apertura', mode: 'Individual', time: 25,
      title: 'Mitos del Product Backlog',
      lead: 'Verdadero o falso según la Guía Scrum 2020.',
      insight: 'Cuatro equipos, un solo producto: un Product Owner, un Product Backlog y un Objetivo del Producto.',
      notes: 'Cinco afirmaciones rápidas, 25 s cada una. La más discutida suele ser la segunda: la Guía dice que si varios Scrum Teams trabajan en el mismo producto comparten Objetivo del Producto, Product Backlog y Product Owner. En el capstone el docente actúa como Product Owner del Delivery System.',
      steps: [
        { type: 'mcq', prompt: 'El Product Backlog es una lista emergente y ordenada de lo que se necesita para mejorar el producto.', options: ['Verdadero', 'Falso'], correct: 0 },
        { type: 'mcq', prompt: 'Cada equipo del capstone puede tener su propio Product Owner y su propio Product Backlog.', options: ['Verdadero', 'Falso'], correct: 1 },
        { type: 'mcq', prompt: 'El Product Backlog debe estar completamente detallado antes de empezar el Sprint 1.', options: ['Verdadero', 'Falso'], correct: 1 },
        { type: 'mcq', prompt: 'Los Developers que harán el trabajo son responsables del dimensionamiento.', options: ['Verdadero', 'Falso'], correct: 0 },
        { type: 'mcq', prompt: 'El compromiso del Product Backlog es el Objetivo del Producto.', options: ['Verdadero', 'Falso'], correct: 0 }
      ]
    },
    {
      id: 'a4', section: 2, moment: 'cierre', mode: 'Individual', time: 75,
      title: 'Ordena el backlog de users-module',
      lead: 'El orden lo deciden el valor y las dependencias. Piensa en quién está esperando cada pieza.',
      insight: 'Arriba va lo que desbloquea a otros: MERCHANT y UserService frenan a tres equipos si llegan tarde.',
      notes: 'El orden correcto prioriza dependencias: sin MERCHANT, catálogo no puede validar comercios (INT-002); sin UserService, pedidos, entregas y pagos solo tienen mocks. Los usuarios de prueba (RF-1.23) van temprano por RNF-1.07. Lo opcional (bloqueo por intentos) va al fondo.',
      steps: [
        { type: 'order', prompt: 'Ordena de arriba (primero) a abajo (después)',
          items: [
            'Agregar el rol MERCHANT (RF-1.13)',
            'Exponer UserService para validar usuarios (RF-1.19 / RF-1.20)',
            'Usuarios de prueba, uno por rol (RF-1.23)',
            'Inicio de sesión (RF-1.02)',
            'Activar o inactivar una cuenta (RF-1.11)',
            'Bloqueo por intentos fallidos (RF-1.17, opcional)'
          ] },
        { type: 'mcq', prompt: '¿Por qué MERCHANT y UserService van arriba?',
          options: ['Son los más fáciles', 'Desbloquean a catálogo, pedidos, entregas y pagos', 'Lo pide la Guía Scrum', 'Tienen más story points'], correct: 1 }
      ]
    },

    /* ---------------- Sección 3 · Refinamiento ---------------- */
    {
      id: 'a5', section: 3, moment: 'apertura', mode: 'Individual', time: 25,
      title: '¿Quién refina y cuándo?',
      lead: 'Tres preguntas rápidas antes de entrar al refinamiento.',
      insight: 'El refinamiento es continuo y lo hace todo el Scrum Team; quienes harán el trabajo ponen el tamaño.',
      notes: 'La tercera pregunta abre el tema DoR: la Guía 2020 no la define. Habla de elementos "preparados para ser seleccionados" cuando pueden quedar Terminados dentro de un Sprint. La DoR es una práctica complementaria que el equipo puede adoptar.',
      steps: [
        { type: 'mcq', prompt: '¿Quién es responsable del dimensionamiento de los elementos del Product Backlog?', options: ['Product Owner', 'Scrum Master', 'Los Developers que harán el trabajo', 'El docente'], correct: 2 },
        { type: 'mcq', prompt: '¿Cuándo ocurre el refinamiento?', options: ['Solo en la Sprint Planning', 'Es una actividad continua', 'Al final del proyecto', 'En la Sprint Retrospective'], correct: 1 },
        { type: 'mcq', prompt: '¿La "Definición de Listo" (DoR) es un compromiso de la Guía Scrum 2020?', options: ['Sí, es el compromiso del Sprint Backlog', 'No, es una práctica complementaria', 'Sí, la define el Scrum Master', 'Sí, reemplaza a la DoD'], correct: 1 }
      ]
    },
    {
      id: 'a6', section: 3, moment: 'juego', mode: 'Individual', time: 90,
      title: '¿Qué letra de INVEST falla?',
      lead: 'Cada historia viola principalmente un criterio. Asígnale la letra.',
      insight: 'Una historia que falla INVEST no está lista: se reescribe, se divide o se habla con el Product Owner.',
      notes: 'Clasificación de seis historias. Discute las que generen dudas: "rápido y fácil de usar" falla T porque no se puede probar; "solo cuando Catálogo y Pagos estén en producción" falla I por dependencia; "exactamente con este SQL" falla N porque cierra la conversación.',
      steps: [
        { type: 'classify', prompt: 'Asigna la letra que falla en cada historia',
          categories: ['I', 'N', 'V', 'E', 'S', 'T'],
          items: [
            { text: 'Como cliente, quiero pagar mi pedido, pero solo cuando Catálogo y Pagos estén en producción', cat: 0 },
            { text: 'Implementar el login exactamente con este SQL y este diseño, sin cambios', cat: 1 },
            { text: 'Como desarrollador, quiero migrar a otro ORM porque me gusta más', cat: 2 },
            { text: 'Como comercio, quiero integrarme con un sistema externo que nadie conoce ni está documentado', cat: 3 },
            { text: 'Como equipo, queremos terminar todo el módulo de usuarios', cat: 4 },
            { text: 'Como administrador, quiero que el sistema sea rápido y fácil de usar', cat: 5 }
          ] }
      ]
    },
    {
      id: 'a7', section: 3, moment: 'juego', mode: 'Individual', time: 40,
      title: 'Planning Poker en vivo',
      lead: 'Vota en secreto con la escala de Fibonacci. Al revelar, hablan los extremos.',
      insight: 'El número importa menos que la conversación: los votos extremos muestran supuestos distintos.',
      notes: 'Dos historias reales de users-module. Al revelar, pide que explique quien votó más bajo y quien votó más alto. Si la dispersión es grande, vuelve a lanzar el mismo paso. Referencia usada en la clase: MERCHANT ≈ 5 puntos, inactivar cuenta ≈ 3 puntos.',
      steps: [
        { type: 'poker', prompt: 'HU: Como comercio, quiero registrarme con el rol MERCHANT para que Catálogo me reconozca al registrar productos.', options: FIB },
        { type: 'poker', prompt: 'HU: Como administrador, quiero inactivar una cuenta sin borrarla, para conservar su historial (reemplaza DeleteUser).', options: FIB }
      ]
    },
    {
      id: 'a8', section: 3, moment: 'cierre', mode: 'Individual', time: 40,
      title: 'Quiz de estimación',
      lead: 'Cinco preguntas sobre los modelos que acabamos de ver.',
      insight: 'Un modelo de estimación es útil si se mide contra la realidad: MMRE ≤ 0.25 y PRED(25) ≥ 0.75.',
      notes: 'Cierre de la sesión 1. La pregunta del MRE se resuelve en el pizarrón: |131 − 90| / 131 = 0.313.',
      steps: [
        { type: 'mcq', prompt: '¿Cuántos factores de éxito usa el algoritmo extendido de Govil & Sharma?', options: ['14', '24', '36', '5'], correct: 2 },
        { type: 'mcq', prompt: 'Proyecto P4 de Adnan & Afzal: estimado 90, real 131 persona-días. ¿Cuál es su MRE?', options: ['0.10', '0.31', '0.45', '0.69'], correct: 1 },
        { type: 'mcq', prompt: 'Un modelo de estimación se considera bueno cuando…', options: ['MMRE ≤ 0.25 y PRED(25) ≥ 0.75', 'MMRE ≥ 0.75', 'PRED(25) ≤ 0.25', 'El MRE es cero en todos los proyectos'], correct: 0 },
        { type: 'mcq', prompt: 'En el sistema multiagente, ¿qué agente calcula el esfuerzo final en persona-días?', options: ['Project agent', 'Phase agent', 'Lesson agent', 'Estimate agent'], correct: 3 },
        { type: 'mcq', prompt: 'En Planning Poker salen votos de 2 y de 13. ¿Qué se hace?', options: ['Se promedia: 7.5', 'Gana la mayoría', 'Explican los extremos y se vuelve a votar', 'Decide el Product Owner'], correct: 2 }
      ]
    },

    /* ---------------- Sección 4 · Sprint Planning ---------------- */
    {
      id: 'a9', section: 4, moment: 'apertura', mode: 'Individual', time: 25,
      title: 'Calentamiento de Sprint Planning',
      lead: 'Tres preguntas sobre la Guía Scrum 2020.',
      insight: 'La Sprint Planning responde por qué, qué y cómo. El resultado es el Sprint Backlog.',
      notes: 'Para un Sprint de 2 semanas la Guía no fija el tiempo exacto: el máximo es 8 h para un Sprint de un mes y "suele ser menor" para Sprints más cortos. Por proporción usamos como máximo unas 4 h.',
      steps: [
        { type: 'mcq', prompt: '¿Cuáles son los tres temas de la Sprint Planning?', options: ['Por qué, qué y cómo', 'Quién, cuándo y dónde', 'Pasado, presente y futuro', 'Diseño, código y pruebas'], correct: 0 },
        { type: 'mcq', prompt: 'Para un Sprint de 2 semanas, el timebox de la Sprint Planning es…', options: ['15 minutos', 'Como máximo unas 4 horas', 'Exactamente 8 horas', 'Sin límite'], correct: 1 },
        { type: 'mcq', prompt: '¿Quién selecciona los elementos del Product Backlog para el Sprint?', options: ['El Product Owner, solo', 'Los Developers, en conversación con el Product Owner', 'El Scrum Master', 'El docente'], correct: 1 }
      ]
    },
    {
      id: 'a10', section: 4, moment: 'juego', mode: 'Individual', time: 60,
      title: '¿Qué letra SMART falta?',
      lead: 'Cada objetivo falla principalmente en una letra. Encuéntrala.',
      insight: 'Un objetivo SMART se puede verificar el último día del Sprint sin discutir si se cumplió.',
      notes: 'El primer paso es clasificar; el segundo pide elegir la versión SMART. Resalta que "100 % de cobertura en todo el sistema antes del viernes" es medible y tiene plazo, pero no es alcanzable.',
      steps: [
        { type: 'classify', prompt: 'Asigna la letra que falta',
          categories: ['S', 'M', 'A', 'R', 'T'],
          items: [
            { text: 'Trabajar en cosas del backend durante el Sprint 1', cat: 0 },
            { text: 'Hacer que el catálogo quede mejor para el 23 de octubre', cat: 1 },
            { text: 'Tener 100 % de cobertura de pruebas en todo el sistema antes del viernes', cat: 2 },
            { text: 'Aprender Kotlin en el Sprint 1, aunque el capstone es Java', cat: 3 },
            { text: 'Implementar FUN-002 de pedidos con sus pruebas unitarias', cat: 4 }
          ] },
        { type: 'mcq', prompt: '¿Cuál es el objetivo SMART del Equipo C (catálogo)?',
          options: [
            'Avanzar con el catálogo lo más que se pueda',
            'Terminar el catálogo este mes',
            'Al 23 de octubre, FUN-001 y FUN-002 integrados en main, con pruebas contra el adaptador en memoria y el pipeline en verde',
            'Hacer el catálogo perfecto y sin bugs'
          ], correct: 2 }
      ]
    },
    {
      id: 'a11', section: 4, moment: 'cierre', mode: 'Individual', time: 90,
      title: 'DoR, DoD o criterio de aceptación',
      lead: 'Clasifica cada enunciado según dónde vive.',
      insight: 'La DoR entra al Sprint, los criterios de aceptación son de cada historia y la DoD aplica a todo el Increment.',
      notes: 'La confusión típica es poner un criterio de aceptación en la DoD. Pregunta: ¿aplica a todas las historias o solo a esta? Si es solo a esta, es criterio de aceptación.',
      steps: [
        { type: 'classify', prompt: 'Clasifica cada enunciado',
          categories: ['DoR', 'DoD', 'Criterio de aceptación'],
          items: [
            { text: 'La historia está trazada a un FUN y tiene estimación', cat: 0 },
            { text: './mvnw clean install pasa y el pipeline está en verde', cat: 1 },
            { text: 'Dado un correo ya registrado, cuando intento registrarme, entonces veo "correo en uso"', cat: 2 },
            { text: 'Los mocks de los servicios externos están identificados', cat: 0 },
            { text: 'Otro integrante revisó y aprobó el Merge Request', cat: 1 },
            { text: 'Un comercio Deshabilitado no aparece en el listado de productos', cat: 2 },
            { text: 'El caso de uso tiene prueba unitaria contra el adaptador en memoria', cat: 1 },
            { text: 'La historia cabe en un Sprint', cat: 0 }
          ] }
      ]
    },

    /* ---------------- Sección 5 · Seguimiento ---------------- */
    {
      id: 'a12', section: 5, moment: 'apertura', mode: 'Individual', time: 30,
      title: '¿Tu tablero dice la verdad?',
      lead: 'Una encuesta y una pregunta de la Guía.',
      insight: 'Si el tablero se actualiza solo antes de la clase, el burndown mide la clase, no el trabajo.',
      notes: 'La encuesta abre la conversación sobre transparencia. La segunda pregunta recuerda que la Daily Scrum es de 15 minutos y es de los Developers.',
      steps: [
        { type: 'poll', prompt: '¿Cada cuánto mueves tus issues en el tablero de GitLab?', options: ['Cada vez que cambian de estado', 'Una vez al día', 'Antes de la clase', 'Casi nunca'] },
        { type: 'mcq', prompt: 'La Daily Scrum es un evento de…', options: ['15 minutos para los Developers', '1 hora con todo el curso', '15 minutos solo con el Product Owner', 'Lo que haga falta'], correct: 0 }
      ]
    },
    {
      id: 'a13', section: 5, moment: 'cierre', mode: 'Individual', time: 45,
      title: 'Lee el burndown',
      lead: 'Mira la línea real contra la ideal y elige el diagnóstico.',
      insight: 'Un burndown no juzga al equipo: hace visible algo que hay que conversar en la Daily o en la Retrospective.',
      notes: 'Tres gráficas típicas. La línea punteada es la ideal. En la primera, el trabajo se marca Terminado solo al final. En la segunda sube el alcance a mitad del Sprint. En la tercera el equipo termina en el día 6.',
      steps: [
        { type: 'mcq', prompt: '¿Qué indica esta gráfica?', chart: [24, 24, 24, 24, 23, 23, 23, 22, 22, 12, 0],
          options: ['El equipo trabaja de forma constante', 'El trabajo se marca Terminado solo al final: historias grandes o tablero desactualizado', 'Se agregó alcance', 'El Sprint terminó antes'], correct: 1 },
        { type: 'mcq', prompt: '¿Qué indica esta gráfica?', chart: [24, 22, 19, 17, 15, 21, 18, 14, 9, 5, 2],
          options: ['Se agregó alcance a mitad del Sprint', 'El equipo dejó de trabajar', 'La estimación fue perfecta', 'Se canceló el Sprint'], correct: 0 },
        { type: 'mcq', prompt: '¿Qué indica esta gráfica?', chart: [24, 19, 14, 9, 5, 2, 0, 0, 0, 0, 0],
          options: ['El Sprint está en riesgo', 'Se sobreestimó: hay capacidad para tomar más o refinar mejor', 'Se agregó alcance', 'El Daily no se hizo'], correct: 1 },
        { type: 'mcq', prompt: '¿Qué muestra mejor un burnup que un burndown?', options: ['Los nombres de los responsables', 'Los cambios de alcance, separados del progreso', 'El código fuente', 'La calidad del código'], correct: 1 }
      ]
    }
  ];

  const root = typeof window !== 'undefined' ? window : globalThis;
  root.DS2 = { COURSE, SECTIONS, TEAMS, ACTIVITIES, FIB,
    activity: (id) => ACTIVITIES.find((a) => a.id === id) };
})();
