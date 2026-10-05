const SIMULATED_TODAY = "2026-10-03";

const data = {
  school: { name: "Academia Ji Do Kwan", owner: "Mariana Torres", fee: 850 },
  students: [
    { id: "ana", name: "Ana López", age: 14, minor: true, grade: "Cinta amarilla", status: "Activo", email: "responsable.ana@ejemplo.mx", primary: "Laura López · Madre · 664 100 2101", emergency: "Laura López · Madre · 664 100 2101", restrictions: "Asma leve. Lleva inhalador en su mochila.", groups: ["juvenil"], notes: ["nota-ana-1"] },
    { id: "mateo", name: "Mateo Ruiz García", age: 11, minor: true, grade: "Cinta blanca", status: "Activo", email: "familia.ruiz@ejemplo.mx", primary: "Carlos Ruiz · Padre · 664 100 2102", emergency: "Elena García · Madre · 664 100 2103", restrictions: "Sin restricciones registradas.", groups: ["infantil"], notes: ["nota-mateo-1"] },
    { id: "sofia", name: "Sofía Hernández", age: 27, minor: false, grade: "Cinta verde", status: "Activo", email: "sofia.h@ejemplo.mx", primary: "Sofía Hernández · Alumna · 664 100 2104", emergency: "Raúl Hernández · Hermano · 664 100 2105", restrictions: "Molestia ocasional en rodilla derecha; evitar impacto repetitivo.", groups: ["adultos"], notes: [] },
    { id: "diego", name: "Diego Castro Moreno", age: 16, minor: true, grade: "Cinta azul", status: "Activo", email: "diego.castro@ejemplo.mx", primary: "Mónica Moreno · Madre · 664 100 2106", emergency: "Mónica Moreno · Madre · 664 100 2106", restrictions: "Alergia al látex.", groups: ["juvenil", "competencia"], notes: ["nota-diego-1"] },
    { id: "valeria", name: "Valeria Soto Jiménez", age: 9, minor: true, grade: "Cinta blanca", status: "Activo", email: "familia.soto@ejemplo.mx", primary: "Javier Soto · Padre · 664 100 2107", emergency: "Patricia Jiménez · Madre · 664 100 2108", restrictions: "Sin restricciones registradas.", groups: ["infantil"], notes: [] },
    { id: "luis", name: "Luis Méndez", age: 34, minor: false, grade: "Cinta roja", status: "Inactivo", email: "luis.m@ejemplo.mx", primary: "Luis Méndez · Alumno · 664 100 2109", emergency: "Celia Méndez · Hermana · 664 100 2110", restrictions: "Sin restricciones registradas.", groups: [], notes: [] }
  ],
  notes: [
    { id: "nota-ana-1", studentId: "ana", date: "2026-10-01", topic: "Equilibrio", text: "Mejoró la estabilidad en patadas laterales; reforzar apoyo del pie base." },
    { id: "nota-mateo-1", studentId: "mateo", date: "2026-09-28", topic: "Forma básica", text: "Recuerda la secuencia completa con una indicación inicial." },
    { id: "nota-diego-1", studentId: "diego", date: "2026-10-03", topic: "Combate", text: "Buen control de distancia; trabajar recuperación de guardia." }
  ],
  groups: [
    { id: "infantil", name: "Infantil A", days: ["Lunes", "Miércoles"], time: "17:00–18:00", students: ["mateo", "valeria"] },
    { id: "juvenil", name: "Juvenil", days: ["Martes", "Jueves"], time: "18:00–19:15", students: ["ana", "diego"] },
    { id: "adultos", name: "Adultos", days: ["Lunes", "Miércoles", "Viernes"], time: "19:30–20:45", students: ["sofia"] },
    { id: "competencia", name: "Competencia", days: ["Sábado"], time: "09:00–11:00", students: ["diego", "ana", "sofia"] }
  ],
  sessions: [
    { id: "sesion-competencia", groupId: "competencia", date: "2026-10-03", time: "09:00–11:00", attendance: [
      { studentId: "diego", status: "Presente", observation: "Trabajo técnico previo al examen." },
      { studentId: "ana", status: "Falta justificada", observation: "Avisó su responsable." },
      { studentId: "sofia", status: "Sin registrar", observation: "" },
      { studentId: "mateo", status: "Ausente", observation: "Alumno invitado a esta sesión." }
    ]},
    { id: "sesion-infantil", groupId: "infantil", date: "2026-10-05", time: "17:00–18:00", attendance: [] },
    { id: "sesion-juvenil", groupId: "juvenil", date: "2026-10-06", time: "18:00–19:15", attendance: [] },
    { id: "sesion-adultos", groupId: "adultos", date: "2026-10-07", time: "18:30–19:45", attendance: [] },
    { id: "sesion-adultos-cancelada", groupId: "adultos", date: "2026-10-05", time: "19:30–20:45", status: "Cancelada", attendance: [] }
  ],
  charges: [
    { id: "c1", studentId: "ana", concept: "Mensualidad octubre", category: "Mensualidades", original: 850, discount: 0, total: 850, due: "2026-10-05" },
    { id: "c2", studentId: "sofia", concept: "Mensualidad septiembre", category: "Mensualidades", original: 850, discount: 0, total: 850, due: "2026-09-30" },
    { id: "c3", studentId: "mateo", concept: "Examen de octubre", category: "Exámenes", original: 1200, discount: 0, total: 1200, due: "2026-10-17" },
    { id: "c4", studentId: "ana", concept: "Examen de octubre", category: "Exámenes", original: 1200, discount: 0, total: 1200, due: "2026-10-17" },
    { id: "c5", studentId: "diego", concept: "Pedido P-104", category: "Pedidos", original: 2100, discount: 0, total: 2100, due: "2026-10-10" },
    { id: "c6", studentId: "valeria", concept: "Mensualidad octubre", category: "Mensualidades", original: 850, discount: 100, total: 750, due: "2026-10-02" },
    { id: "c7", studentId: "luis", concept: "Mensualidad octubre", category: "Mensualidades", original: 850, discount: 0, total: 850, due: "2026-10-01" },
    { id: "c8", studentId: "ana", concept: "Pedido P-105", category: "Pedidos", original: 250, discount: 0, total: 250, due: "2026-10-03" },
    { id: "c9", studentId: "mateo", concept: "Pedido P-103", category: "Pedidos", original: 1350, discount: 0, total: 1350, due: "2026-09-20" },
    { id: "c10", studentId: "diego", concept: "Examen de octubre", category: "Exámenes", original: 1200, discount: 0, total: 1200, due: "2026-10-17" }
  ],
  payments: [
    { id: "p1", studentId: "ana", chargeId: "c1", date: "2026-10-01", amount: 500, method: "Transferencia", valid: true },
    { id: "p2", studentId: "sofia", chargeId: "c2", date: "2026-09-28", amount: 850, method: "Efectivo", valid: true },
    { id: "p3", studentId: "mateo", chargeId: "c3", date: "2026-10-02", amount: 1200, method: "Tarjeta", valid: true },
    { id: "p4", studentId: "ana", chargeId: "c4", date: "2026-10-03", amount: 500, method: "Efectivo", valid: true },
    { id: "p5", studentId: "diego", chargeId: "c5", date: "2026-10-02", amount: 1800, method: "Transferencia", valid: true },
    { id: "p6", studentId: "valeria", chargeId: "c6", date: "2026-10-01", amount: 750, method: "Efectivo", valid: true },
    { id: "p7", studentId: "luis", chargeId: "c7", date: "2026-10-01", amount: 300, method: "Efectivo", valid: false, reason: "Registro duplicado" },
    { id: "p8", studentId: "ana", chargeId: "c8", date: "2026-10-03", amount: 250, method: "Efectivo", valid: true },
    { id: "p9", studentId: "mateo", chargeId: "c9", date: "2026-09-18", amount: 1350, method: "Transferencia", valid: true }
  ],
  orders: [
    { id: "P-104", studentId: "diego", items: [
      { name: "Dobok", size: "170", quantity: 1, received: 1, delivered: 0, price: 1600 },
      { name: "Protector de antebrazo", size: "M", quantity: 1, received: 0, delivered: 0, price: 500 }
    ], total: 2100, paid: 1800, status: "Recepción parcial" },
    { id: "P-103", studentId: "mateo", items: [
      { name: "Peto reversible", size: "2", quantity: 1, received: 1, delivered: 1, price: 1350 }
    ], total: 1350, paid: 1350, status: "Entregado" },
    { id: "P-105", studentId: "ana", items: [
      { name: "Cinta amarilla", size: "240 cm", quantity: 1, received: 1, delivered: 0, price: 250 }
    ], total: 250, paid: 250, status: "Pendiente de entrega" }
  ],
  exams: [
    { id: "ex-oct", name: "Examen de octubre", date: "2026-10-24", deadline: "2026-10-17", status: "Próximo", participants: [
      { studentId: "mateo", target: "Cinta amarilla", cost: 1200, paid: 1200, confirmed: true, result: "Sin resultado" },
      { studentId: "ana", target: "Cinta verde", cost: 1200, paid: 500, confirmed: false, result: "Sin resultado" },
      { studentId: "diego", target: "Cinta roja", cost: 1200, paid: 0, confirmed: false, result: "Sin resultado" }
    ]},
    { id: "ex-2026-1", name: "Examen 2026-1", date: "2026-03-21", deadline: "2026-03-14", status: "Historial", participants: [
      { studentId: "sofia", target: "Cinta verde", cost: 1100, paid: 1100, confirmed: true, result: "Aprobado" },
      { studentId: "diego", target: "Cinta azul", cost: 1100, paid: 1100, confirmed: true, result: "No aprobado" }
    ]},
    { id: "ex-2025-2", name: "Examen 2025-2", date: "2025-11-15", deadline: "2025-11-08", status: "Historial", participants: [
      { studentId: "luis", target: "Cinta roja", cost: 1000, paid: 1000, confirmed: true, result: "No asistió" }
    ]}
  ],
  calendarEvents: [
    { id: "cal-1", date: "2026-10-03", time: "09:00", title: "Competencia", type: "class", target: "sesion-competencia", label: "Clase" },
    { id: "cal-2", date: "2026-10-05", time: "17:00", title: "Infantil A", type: "class", target: "sesion-infantil", label: "Clase" },
    { id: "cal-3", date: "2026-10-05", time: "19:30", title: "Adultos", type: "cancelled", target: "sesion-adultos-cancelada", label: "Cancelada" },
    { id: "cal-4", date: "2026-10-06", time: "18:00", title: "Juvenil", type: "class", target: "sesion-juvenil", label: "Clase" },
    { id: "cal-5", date: "2026-10-07", time: "18:30", title: "Adultos", type: "class", target: "sesion-adultos", label: "Reprogramada" },
    { id: "cal-6", date: "2026-10-09", time: "18:00", title: "Práctica abierta", type: "activity", target: "", label: "Actividad" },
    { id: "cal-7", date: "2026-10-17", time: "23:59", title: "Límite · Examen de octubre", type: "exam", target: "ex-oct", label: "Fecha límite" },
    { id: "cal-8", date: "2026-10-24", time: "10:00", title: "Examen de octubre", type: "exam", target: "ex-oct", label: "Examen" }
  ]
};

const navItems = [
  ["inicio", "Inicio"],
  ["alumnos", "Alumnos"],
  ["clases", "Clases"],
  ["pagos", "Pagos"],
  ["examenes", "Exámenes"],
  ["calendario", "Calendario"],
  ["reportes", "Reportes"],
  ["configuracion", "Configuración"]
];

const state = {
  section: "inicio",
  detail: null,
  studentSearch: "",
  studentStatus: "Todos",
  studentGrade: "Todos",
  classGroup: "Todos",
  classDay: "Todos",
  paymentsTab: "cobros",
  paymentsPeriod: "2026-10",
  examsTab: "proximos",
  examSearch: "",
  examYear: "Todos",
  reportPeriod: "2026-10",
  calendarDate: SIMULATED_TODAY,
  filtersOpen: false
};

const main = document.querySelector("#contenido-principal");
const nav = document.querySelector("#primary-nav");
const sidebar = document.querySelector("#sidebar");
const scrim = document.querySelector("#scrim");
const openMenuButton = document.querySelector("#open-menu");
const closeMenuButton = document.querySelector("#close-menu");
const liveRegion = document.querySelector("#live-region");
const workspace = document.querySelector(".workspace");

const formatMoney = amount => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(amount);
const parseDate = value => new Date(`${value}T12:00:00`);
const formatDate = value => new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(parseDate(value)).replace(".", "");
const getStudent = id => data.students.find(student => student.id === id);
const getGroup = id => data.groups.find(group => group.id === id);
const validPaymentsForCharge = chargeId => data.payments.filter(payment => payment.chargeId === chargeId && payment.valid);
const amountPaid = chargeId => validPaymentsForCharge(chargeId).reduce((sum, payment) => sum + payment.amount, 0);
const chargeBalance = charge => Math.max(0, charge.total - amountPaid(charge.id));
const chargeStatus = charge => chargeBalance(charge) === 0 ? "Pagado" : amountPaid(charge.id) > 0 ? "Pago parcial" : "Pendiente";
const periodLabel = period => new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(new Date(`${period}-02T12:00:00`));
const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

function announce(message) {
  liveRegion.textContent = "";
  window.setTimeout(() => { liveRegion.textContent = message; }, 30);
}

function navIcon(id) {
  const paths = {
    inicio: '<path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-7H9v7H3.5a.5.5 0 0 1-.5-.5z"/>',
    alumnos: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20c.4-4 2.3-6 5.5-6s5.1 2 5.5 6M14 15c3.6-.8 6.1.9 6.5 4.5"/>',
    clases: '<path d="M4 5.5h16v14H4zM8 3v5M16 3v5M4 10h16"/>',
    pagos: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.8c-.8-.7-2-1.1-3.4-1.1-1.8 0-3.1.8-3.1 2.1 0 3.4 6.4 1.5 6.4 4.7 0 1.4-1.4 2.3-3.4 2.3-1.5 0-2.9-.5-3.8-1.3M12 5.5v13"/>',
    examenes: '<path d="M6 3.5h9l3 3V21H6zM9 9h6M9 13h6M9 17h4M15 3.5V7h3"/>',
    calendario: '<path d="M4 5.5h16v15H4zM8 3v5M16 3v5M4 10h16M8 14h2M13 14h3M8 17.5h2"/>',
    reportes: '<path d="M5 20V9M10 20V4M15 20v-7M20 20V7M3 20.5h19"/>',
    configuracion: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[id]}</svg>`;
}

function renderNav() {
  nav.innerHTML = navItems.map(([id, label]) => `
    <button class="nav-link" data-nav="${id}" ${state.section === id ? 'aria-current="page"' : ""}>
      <span class="nav-icon">${navIcon(id)}</span>
      <span>${label}</span>
    </button>
  `).join("");
}

function pageHeader(title, description, actions = "") {
  return `<header class="page-header">
    <div><h1>${title}</h1><p>${description}</p></div>
    ${actions ? `<div class="header-actions">${actions}</div>` : ""}
  </header>`;
}

function pendingButton(label) {
  return `<span class="pending-action"><button class="button" disabled>${label}<span class="sr-only">. Disponible en una etapa posterior</span></button><span class="pending-label" aria-hidden="true">Próximamente</span></span>`;
}

function filterButton(activeCount) {
  return `<button class="button secondary filter-trigger" data-open-filters aria-haspopup="dialog" aria-controls="filter-panel" aria-expanded="${state.filtersOpen}"><span aria-hidden="true">☷</span> Filtros${activeCount ? `<span class="filter-count">${activeCount}</span>` : ""}</button>`;
}

function activeFilters(items, clearAction) {
  if (!items.length) return "";
  return `<div class="active-filters" aria-label="Filtros activos">${items.map(item => `<span class="filter-chip">${item}</span>`).join("")}<button class="text-button small-text" data-action="${clearAction}">Limpiar</button></div>`;
}

function filterDrawer(title, fields, clearAction) {
  return `<div class="filter-scrim" data-close-filters hidden></div>
    <aside class="filter-drawer" id="filter-panel" role="dialog" aria-modal="true" aria-labelledby="filter-title" aria-hidden="${state.filtersOpen ? "false" : "true"}" ${state.filtersOpen ? "" : "inert"}>
      <div class="filter-drawer-head"><div><span class="eyebrow">Refinar resultados</span><h2 id="filter-title">${title}</h2></div><button class="icon-button" data-close-filters aria-label="Cerrar filtros">×</button></div>
      <div class="filter-drawer-body">${fields}</div>
      <div class="filter-drawer-footer"><button class="button ghost" data-action="${clearAction}">Limpiar filtros</button><button class="button" data-close-filters>Ver resultados</button></div>
    </aside>`;
}

function resultsMeta(count, noun) {
  return `<p class="results-meta" aria-live="polite"><strong>${count}</strong> ${noun}${count === 1 ? "" : "s"}</p>`;
}

function emptyState(title, text, clearAction = "") {
  return `<div class="empty-state"><strong>${title}</strong><p>${text}</p>${clearAction ? `<button class="button secondary" data-action="${clearAction}">Limpiar filtros</button>` : ""}</div>`;
}

function renderInicio() {
  const todayClasses = data.calendarEvents.filter(event => event.date === SIMULATED_TODAY && event.type === "class");
  const nextExam = data.exams.find(exam => exam.status === "Próximo");
  const unpaidParticipants = nextExam.participants.filter(person => person.cost - person.paid > 0);
  const dueCharges = data.charges.filter(charge => chargeBalance(charge) > 0 && ["Mensualidades"].includes(charge.category));
  const openOrders = data.orders.filter(order => order.status !== "Entregado");
  return `${pageHeader("Inicio", "Resumen de la operación de hoy y asuntos que requieren seguimiento.")}
    <section aria-labelledby="resumen-hoy">
      <div class="section-heading"><div><h2 id="resumen-hoy">Hoy en la escuela</h2><p>Sábado 3 de octubre de 2026</p></div></div>
      <div class="grid cols-3">
        <article class="card metric"><span class="metric-label">Clases de hoy</span><strong class="metric-value">${todayClasses.length}</strong><span class="metric-detail">${todayClasses.map(item => `${item.time} · ${item.title}`).join(" · ")}</span><button class="text-button" data-go="clases">Revisar clases</button></article>
        <article class="card metric"><span class="metric-label">Próximo examen</span><strong class="metric-value">24 oct</strong><span class="metric-detail">Pago límite ${formatDate(nextExam.deadline)}</span><button class="text-button" data-exam="${nextExam.id}">Abrir examen</button></article>
        <article class="card metric"><span class="metric-label">Participantes con saldo</span><strong class="metric-value">${unpaidParticipants.length}</strong><span class="metric-detail">${formatMoney(unpaidParticipants.reduce((sum, person) => sum + person.cost - person.paid, 0))} pendiente</span><button class="text-button" data-exam="${nextExam.id}">Revisar participantes</button></article>
      </div>
    </section>
    <div class="grid cols-2 spacer-top">
      <section class="card" aria-labelledby="mensualidades-inicio">
        <div class="card-header"><div><h2 id="mensualidades-inicio">Mensualidades por atender</h2><p>Próximas a pagar o vencidas</p></div><span class="badge">${dueCharges.length}</span></div>
        <ul class="list">${dueCharges.map(charge => {
          const overdue = charge.due < SIMULATED_TODAY;
          return `<li class="list-row"><div class="list-row-main"><strong>${getStudent(charge.studentId).name}</strong><span>${charge.concept} · vence ${formatDate(charge.due)}</span></div><div class="list-row-value"><strong>${formatMoney(chargeBalance(charge))}</strong><span>${overdue ? "Vencida" : "Próxima a pagar"}</span></div></li>`;
        }).join("")}</ul>
        <div class="card-footer"><button class="text-button" data-go="pagos" data-tab="saldos">Ver saldos pendientes</button></div>
      </section>
      <section class="card" aria-labelledby="pedidos-inicio">
        <div class="card-header"><div><h2 id="pedidos-inicio">Pedidos pendientes</h2><p>Recepción o entrega por completar</p></div><span class="badge">${openOrders.length}</span></div>
        <ul class="list">${openOrders.map(order => `<li class="list-row"><div class="list-row-main"><strong>${order.id} · ${getStudent(order.studentId).name}</strong><span>${order.items.map(item => item.name).join(", ")}</span></div><div class="list-row-value"><span class="badge light">${order.status}</span></div></li>`).join("")}</ul>
        <div class="card-footer"><button class="text-button" data-go="pagos" data-tab="pedidos">Revisar pedidos</button></div>
      </section>
    </div>`;
}

function studentRows(students) {
  return students.map(student => `<tr>
    <td class="primary-cell"><button class="text-button" data-student="${student.id}">${student.name}</button><span>${student.minor ? "Menor de edad" : "Persona adulta"}</span></td>
    <td>${student.grade}</td><td><span class="badge ${student.status === "Activo" ? "dark" : "light"}">${student.status}</span></td>
    <td class="num"><button class="button secondary small" data-student="${student.id}">Ver expediente</button></td>
  </tr>`).join("");
}

function studentCards(students) {
  return students.map(student => `<article class="mobile-card"><div class="mobile-card-head"><div><h3>${student.name}</h3><p>${student.minor ? "Menor de edad" : "Persona adulta"}</p></div><span class="badge ${student.status === "Activo" ? "dark" : "light"}">${student.status}</span></div><dl><div><dt>Grado</dt><dd>${student.grade}</dd></div><div><dt>Edad</dt><dd>${student.age} años</dd></div></dl><button class="text-button" data-student="${student.id}">Ver expediente</button></article>`).join("");
}

function renderAlumnos() {
  if (state.detail?.type === "student") return renderStudentDetail(state.detail.id);
  const grades = [...new Set(data.students.map(student => student.grade))].sort();
  const query = state.studentSearch.trim().toLocaleLowerCase("es");
  const filtered = data.students.filter(student => (!query || student.name.toLocaleLowerCase("es").includes(query)) && (state.studentStatus === "Todos" || student.status === state.studentStatus) && (state.studentGrade === "Todos" || student.grade === state.studentGrade));
  const activeItems = [state.studentStatus !== "Todos" ? `Estado: ${state.studentStatus}` : "", state.studentGrade !== "Todos" ? state.studentGrade : ""].filter(Boolean);
  return `${pageHeader("Alumnos", "Consulta alumnos activos e inactivos y abre su expediente base.", pendingButton("Registrar alumno"))}
    <div class="list-tools">
      <div class="field grow"><label for="student-search">Buscar por nombre</label><input id="student-search" type="search" value="${escapeHtml(state.studentSearch)}" placeholder="Ej. Ana López" autocomplete="off"></div>
      ${filterButton(activeItems.length)}
    </div>
    <div class="results-line">${resultsMeta(filtered.length, "alumno")}${activeFilters(activeItems, "clear-students")}</div>
    <div class="table-surface desktop-table"><div class="table-wrap"><table><thead><tr><th>Alumno</th><th>Grado actual</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>${studentRows(filtered)}</tbody></table></div>${filtered.length ? "" : emptyState("No hay coincidencias", "Prueba con otro nombre, estado o grado.", "clear-students")}</div>
    <div class="mobile-only mobile-list">${filtered.length ? studentCards(filtered) : emptyState("No hay coincidencias", "Prueba con otro nombre, estado o grado.", "clear-students")}</div>
    ${filterDrawer("Filtrar alumnos", `<div class="field"><label for="student-status">Estado</label><select id="student-status"><option>Todos</option><option ${state.studentStatus === "Activo" ? "selected" : ""}>Activo</option><option ${state.studentStatus === "Inactivo" ? "selected" : ""}>Inactivo</option></select></div><div class="field"><label for="student-grade">Grado</label><select id="student-grade"><option>Todos</option>${grades.map(grade => `<option ${state.studentGrade === grade ? "selected" : ""}>${grade}</option>`).join("")}</select></div>`, "clear-students")}`;
}

function renderStudentDetail(studentId) {
  const student = getStudent(studentId);
  const notes = data.notes.filter(note => note.studentId === studentId);
  const charges = data.charges.filter(charge => charge.studentId === studentId);
  const orders = data.orders.filter(order => order.studentId === studentId);
  const exams = data.exams.flatMap(exam => exam.participants.filter(person => person.studentId === studentId).map(person => ({ ...person, exam })));
  return `<div class="detail-bar"><button class="icon-button" data-back="alumnos" aria-label="Volver al listado de alumnos">←</button><span>Alumnos / Expediente</span></div>
    ${pageHeader(student.name, `${student.age} años · ${student.grade}`, `<span class="badge ${student.status === "Activo" ? "dark" : "light"}">${student.status}</span>`)}
    <div class="grid cols-2">
      <section class="card"><div class="card-header"><h2>Datos generales</h2></div><div class="card-body"><dl class="definition-grid"><div class="definition-item"><dt>Nombre</dt><dd>${student.name}</dd></div><div class="definition-item"><dt>Edad</dt><dd>${student.age} años</dd></div><div class="definition-item"><dt>Grado actual</dt><dd>${student.grade}</dd></div><div class="definition-item"><dt>Grupos habituales</dt><dd>${student.groups.length ? student.groups.map(id => getGroup(id).name).join(", ") : "Sin grupo asignado"}</dd></div></dl></div></section>
      <section class="card"><div class="card-header"><h2>Contactos</h2></div><div class="card-body"><dl class="stack"><div><dt class="muted">Contacto principal</dt><dd>${student.primary}</dd></div><div><dt class="muted">Contacto de emergencia</dt><dd>${student.emergency}</dd></div><div><dt class="muted">Correo</dt><dd>${student.email}</dd></div></dl></div></section>
    </div>
    <section class="card spacer-top"><div class="card-header"><div><h2>Restricciones relevantes</h2><p>Información visible para revisar la práctica del alumno.</p></div></div><div class="card-body"><div class="callout"><strong>Indicación vigente</strong><span>${student.restrictions}</span></div></div></section>
    <div class="grid cols-2 spacer-top">
      <section class="card"><div class="card-header"><div><h2>Notas de seguimiento</h2><p>Separadas de los resultados de examen</p></div></div>${notes.length ? `<ul class="list">${notes.map(note => `<li class="list-row"><div class="list-row-main"><strong>${note.topic}</strong><span>${note.text}</span></div><div class="list-row-value"><span>${formatDate(note.date)}</span></div></li>`).join("")}</ul>` : emptyState("Sin notas", "Todavía no hay notas de seguimiento para este alumno.")}</section>
      <section class="card"><div class="card-header"><div><h2>Historial relacionado</h2><p>Resumen del expediente</p></div></div><div class="card-body"><dl class="definition-grid"><div class="definition-item"><dt>Cobros</dt><dd>${charges.length} · ${formatMoney(charges.reduce((sum, charge) => sum + chargeBalance(charge), 0))} pendiente</dd></div><div class="definition-item"><dt>Pedidos</dt><dd>${orders.length}</dd></div><div class="definition-item"><dt>Exámenes</dt><dd>${exams.length}</dd></div><div class="definition-item"><dt>Notas</dt><dd>${notes.length}</dd></div></dl></div><div class="card-footer"><button class="text-button" data-go="pagos">Ir a pagos relacionados</button></div></section>
    </div>`;
}

function renderClases() {
  if (state.detail?.type === "session") return renderSessionDetail(state.detail.id);
  const filtered = data.groups.filter(group => (state.classGroup === "Todos" || group.id === state.classGroup) && (state.classDay === "Todos" || group.days.includes(state.classDay)));
  const activeItems = [state.classGroup !== "Todos" ? `Grupo: ${getGroup(state.classGroup).name}` : "", state.classDay !== "Todos" ? state.classDay : ""].filter(Boolean);
  return `${pageHeader("Clases", "Organiza grupos y consulta la sesión correspondiente a cada fecha.", pendingButton("Crear grupo"))}
    <div class="section-intro"><div><strong>Grupos y sesiones</strong><span>Un grupo define días, horario y alumnos habituales. Cada clase realizada se consulta como una sesión.</span></div>${filterButton(activeItems.length)}</div>
    <div class="results-line">${resultsMeta(filtered.length, "grupo")}${activeFilters(activeItems, "clear-classes")}</div>
    ${filtered.length ? `<div class="grid cols-3">${filtered.map(group => { const session = data.sessions.find(item => item.groupId === group.id && item.status !== "Cancelada"); return `<article class="card group-card"><div class="card-body"><div class="group-card-top"><div><span class="eyebrow">Grupo</span><h2>${group.name}</h2></div><span class="group-avatar" aria-hidden="true">${group.name.slice(0, 2).toUpperCase()}</span></div><div class="group-meta">${group.days.map(day => `<span class="badge light">${day}</span>`).join("")}</div><p class="group-time">${group.time}</p><div class="group-stats"><div><strong>${group.students.length}</strong><span>alumnos asignados</span></div><button class="button secondary small" data-session="sesion-${group.id}">Sesión · ${session ? formatDate(session.date).replace(" 2026", "") : "ejemplo"}</button></div></div></article>`; }).join("")}</div>` : emptyState("No hay grupos para estos filtros", "Cambia el grupo o el día para ver otras clases.", "clear-classes")}
    ${filterDrawer("Filtrar clases", `<div class="field"><label for="class-group">Grupo</label><select id="class-group"><option value="Todos">Todos los grupos</option>${data.groups.map(group => `<option value="${group.id}" ${state.classGroup === group.id ? "selected" : ""}>${group.name}</option>`).join("")}</select></div><div class="field"><label for="class-day">Día</label><select id="class-day"><option>Todos</option>${["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map(day => `<option ${state.classDay === day ? "selected" : ""}>${day}</option>`).join("")}</select></div>`, "clear-classes")}`;
}

function renderSessionDetail(sessionId) {
  const session = data.sessions.find(item => item.id === sessionId) || data.sessions[0];
  const group = getGroup(session.groupId);
  const attendance = session.attendance.length ? session.attendance : group.students.map(studentId => ({ studentId, status: "Sin registrar", observation: "" }));
  const relatedNotes = data.notes.filter(note => attendance.some(item => item.studentId === note.studentId) && note.date === session.date);
  return `<div class="detail-bar"><button class="icon-button" data-back="clases" aria-label="Volver al listado de clases">←</button><span>Clases / Sesión</span></div>
    ${pageHeader(group.name, `${formatDate(session.date)} · ${session.time}`, pendingButton("Agregar alumno a esta sesión"))}
    <div class="callout"><strong>${session.status === "Cancelada" ? "Sesión cancelada" : "Asistencia de la sesión"}</strong><span>${session.status === "Cancelada" ? "Esta sesión no se incluye en el conteo de faltas." : "“Sin registrar” se mantiene como estado independiente y no se convierte en falta."}</span></div>
    ${session.status === "Cancelada" ? `<section class="card spacer-top">${emptyState("No se registra asistencia", "La sesión fue cancelada y no genera faltas para el grupo.")}</section>` : `<section class="card spacer-top"><div class="table-wrap"><table><thead><tr><th>Alumno</th><th>Estado</th><th>Observación</th></tr></thead><tbody>${attendance.map(item => `<tr><td><button class="text-button" data-student="${item.studentId}">${getStudent(item.studentId).name}</button></td><td><span class="badge ${item.status === "Presente" ? "dark" : item.status === "Sin registrar" ? "dashed" : "light"}">${item.status}</span></td><td>${item.observation || '<span class="muted">Sin observación</span>'}</td></tr>`).join("")}</tbody></table></div></section>`}
    <section class="card spacer-top"><div class="card-header"><div><h2>Notas vinculadas</h2><p>Los mismos registros se muestran en el expediente del alumno.</p></div></div>${relatedNotes.length ? `<ul class="list">${relatedNotes.map(note => `<li class="list-row"><div class="list-row-main"><strong>${getStudent(note.studentId).name} · ${note.topic}</strong><span>${note.text}</span></div><div class="list-row-value"><span>${formatDate(note.date)}</span></div></li>`).join("")}</ul>` : emptyState("Sin notas en esta fecha", "Esta sesión aún no tiene notas de seguimiento vinculadas.")}</section>`;
}

function paymentTabs() {
  const tabs = [["cobros", "Cobros y pagos"], ["saldos", "Saldos pendientes"], ["pedidos", "Pedidos"]];
  return `<div class="tabs" role="tablist" aria-label="Secciones de pagos">${tabs.map(([id, label]) => `<button class="tab" id="payments-${id}-tab" role="tab" aria-selected="${state.paymentsTab === id}" aria-controls="payments-tabpanel" tabindex="${state.paymentsTab === id ? "0" : "-1"}" data-payments-tab="${id}">${label}</button>`).join("")}</div>`;
}

function renderPagos() {
  if (state.detail?.type === "order") return renderOrderDetail(state.detail.id);
  const periodPayments = data.payments.filter(payment => payment.date.startsWith(state.paymentsPeriod));
  const valid = periodPayments.filter(payment => payment.valid);
  const received = valid.reduce((sum, payment) => sum + payment.amount, 0);
  const periodCharges = data.charges.filter(charge => charge.due.startsWith(state.paymentsPeriod));
  let content = "";
  if (state.paymentsTab === "cobros") {
    content = `<div class="grid cols-3"><article class="card metric"><span class="metric-label">Dinero recibido</span><strong class="metric-value">${formatMoney(received)}</strong><span class="metric-detail">Pagos válidos de ${periodLabel(state.paymentsPeriod)}</span></article><article class="card metric"><span class="metric-label">Importe por cobrar</span><strong class="metric-value">${formatMoney(periodCharges.reduce((sum, charge) => sum + charge.total, 0))}</strong><span class="metric-detail">Conceptos con vencimiento en el periodo</span></article><article class="card metric"><span class="metric-label">Saldo pendiente</span><strong class="metric-value">${formatMoney(periodCharges.reduce((sum, charge) => sum + chargeBalance(charge), 0))}</strong><span class="metric-detail">No equivale a dinero recibido</span></article></div>
      <section class="card spacer-top"><div class="card-header"><div><h2>Conceptos por pagar</h2><p>Cobro asignado y pagos válidos relacionados</p></div></div><div class="table-wrap"><table><thead><tr><th>Alumno / concepto</th><th>Por cobrar</th><th>Recibido</th><th>Saldo</th><th>Estado</th></tr></thead><tbody>${periodCharges.map(charge => `<tr><td class="primary-cell"><strong>${getStudent(charge.studentId).name}</strong><span>${charge.concept} · vence ${formatDate(charge.due)}</span></td><td>${formatMoney(charge.total)}</td><td>${formatMoney(amountPaid(charge.id))}</td><td>${formatMoney(chargeBalance(charge))}</td><td><span class="badge ${chargeStatus(charge) === "Pagado" ? "dark" : "light"}">${chargeStatus(charge)}</span></td></tr>`).join("")}</tbody></table></div></section>
      <section class="card spacer-top"><div class="card-header"><div><h2>Pagos registrados</h2><p>Los pagos anulados no cuentan como ingreso vigente.</p></div></div><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Alumno</th><th>Forma</th><th>Estado</th><th class="num">Importe</th></tr></thead><tbody>${periodPayments.map(payment => `<tr><td>${formatDate(payment.date)}</td><td>${getStudent(payment.studentId).name}</td><td>${payment.method || "Sin especificar"}</td><td><span class="badge ${payment.valid ? "dark" : "dashed"}">${payment.valid ? "Vigente" : "Anulado"}</span>${payment.reason ? `<div class="muted">${payment.reason}</div>` : ""}</td><td class="num">${formatMoney(payment.amount)}</td></tr>`).join("")}</tbody></table></div></section>`;
  } else if (state.paymentsTab === "saldos") {
    const pending = data.charges.filter(charge => chargeBalance(charge) > 0);
    content = `<section class="card"><div class="table-wrap"><table><thead><tr><th>Alumno</th><th>Concepto</th><th>Vencimiento</th><th>Estado</th><th class="num">Importe pendiente</th></tr></thead><tbody>${pending.map(charge => `<tr><td><button class="text-button" data-student="${charge.studentId}">${getStudent(charge.studentId).name}</button></td><td>${charge.concept}</td><td>${formatDate(charge.due)}</td><td><span class="badge light">${charge.due < SIMULATED_TODAY ? "Vencido" : chargeStatus(charge)}</span></td><td class="num">${formatMoney(chargeBalance(charge))}</td></tr>`).join("")}</tbody></table></div></section>`;
  } else {
    content = `<section class="card"><div class="table-wrap"><table><thead><tr><th>Pedido / alumno</th><th>Artículos</th><th>Total</th><th>Saldo</th><th>Entrega</th><th></th></tr></thead><tbody>${data.orders.map(order => `<tr><td class="primary-cell"><strong>${order.id}</strong><span>${getStudent(order.studentId).name}</span></td><td>${order.items.map(item => `${item.quantity} × ${item.name}`).join(", ")}</td><td>${formatMoney(order.total)}</td><td>${formatMoney(order.total - order.paid)}</td><td><span class="badge ${order.status === "Entregado" ? "dark" : "light"}">${order.status}</span></td><td><button class="button secondary small" data-order="${order.id}">Ver detalle</button></td></tr>`).join("")}</tbody></table></div></section><div class="callout spacer-top"><strong>Pago y entrega son estados distintos</strong><span>Un pedido puede estar pagado por completo y continuar pendiente de entrega.</span></div>`;
  }
  return `${pageHeader("Pagos", "Consulta cobros, dinero recibido, saldos y pedidos sin mezclar sus estados.", state.paymentsTab === "pedidos" ? pendingButton("Registrar pedido") : pendingButton("Registrar pago"))}
    ${paymentTabs()}
    ${state.paymentsTab === "pedidos" ? `<div class="context-note"><strong>Todos los pedidos</strong><span>La entrega se consulta independientemente de la fecha del pago.</span></div>` : `<div class="period-bar"><div><span class="eyebrow">Periodo de consulta</span><strong>${periodLabel(state.paymentsPeriod)}</strong></div><div class="field compact"><label for="payments-period" class="sr-only">Cambiar periodo</label><select id="payments-period"><option value="2026-10" ${state.paymentsPeriod === "2026-10" ? "selected" : ""}>Octubre 2026</option><option value="2026-09" ${state.paymentsPeriod === "2026-09" ? "selected" : ""}>Septiembre 2026</option></select></div></div>`}
    <div id="payments-tabpanel" role="tabpanel" aria-labelledby="payments-${state.paymentsTab}-tab">${content}</div>`;
}

function renderOrderDetail(orderId) {
  const order = data.orders.find(item => item.id === orderId);
  return `<div class="detail-bar"><button class="icon-button" data-back="pagos" aria-label="Volver al listado de pedidos">←</button><span>Pagos / Pedidos / ${order.id}</span></div>
    ${pageHeader(`Pedido ${order.id}`, getStudent(order.studentId).name, `<span class="badge ${order.status === "Entregado" ? "dark" : "light"}">${order.status}</span>`)}
    <div class="grid cols-3"><article class="card metric"><span class="metric-label">Total del pedido</span><strong class="metric-value">${formatMoney(order.total)}</strong></article><article class="card metric"><span class="metric-label">Dinero recibido</span><strong class="metric-value">${formatMoney(order.paid)}</strong></article><article class="card metric"><span class="metric-label">Saldo pendiente</span><strong class="metric-value">${formatMoney(order.total - order.paid)}</strong></article></div>
    <section class="card spacer-top"><div class="card-header"><div><h2>Artículos</h2><p>Cantidades solicitadas, recibidas y entregadas</p></div></div><div class="table-wrap"><table><thead><tr><th>Artículo</th><th>Talla / medida</th><th>Solicitado</th><th>Recibido</th><th>Entregado</th><th>Subtotal</th></tr></thead><tbody>${order.items.map(item => `<tr><td>${item.name}</td><td>${item.size}</td><td>${item.quantity}</td><td>${item.received}</td><td>${item.delivered}</td><td>${formatMoney(item.price * item.quantity)}</td></tr>`).join("")}</tbody></table></div></section>
    <div class="callout spacer-top"><strong>Estado independiente del pago</strong><span>${order.paid === order.total ? "El pedido está pagado, pero su entrega conserva su propio avance." : `Faltan ${formatMoney(order.total - order.paid)} por cubrir; la recepción y entrega se consultan por artículo.`}</span></div>`;
}

function examTabs() {
  return `<div class="tabs" role="tablist" aria-label="Vistas de exámenes"><button class="tab" id="exams-proximos-tab" role="tab" aria-selected="${state.examsTab === "proximos"}" aria-controls="exams-tabpanel" tabindex="${state.examsTab === "proximos" ? "0" : "-1"}" data-exams-tab="proximos">Próximos</button><button class="tab" id="exams-historial-tab" role="tab" aria-selected="${state.examsTab === "historial"}" aria-controls="exams-tabpanel" tabindex="${state.examsTab === "historial" ? "0" : "-1"}" data-exams-tab="historial">Historial</button></div>`;
}

function renderExamenes() {
  if (state.detail?.type === "exam") return renderExamDetail(state.detail.id);
  const query = state.examSearch.trim().toLocaleLowerCase("es");
  const filtered = data.exams.filter(exam => (state.examsTab === "proximos" ? exam.status === "Próximo" : exam.status === "Historial") && (!query || exam.name.toLocaleLowerCase("es").includes(query)) && (state.examYear === "Todos" || exam.date.startsWith(state.examYear)));
  const activeItems = state.examYear !== "Todos" ? [`Año: ${state.examYear}`] : [];
  return `${pageHeader("Exámenes", "Consulta próximos eventos y resultados históricos sin confundir pago con aprobación.")}
    ${examTabs()}
    <div class="list-tools"><div class="field grow"><label for="exam-search">Buscar por nombre</label><input id="exam-search" type="search" value="${escapeHtml(state.examSearch)}" placeholder="Ej. Examen de octubre"></div>${filterButton(activeItems.length)}</div>
    <div class="results-line">${resultsMeta(filtered.length, "examen")}${activeFilters(activeItems, "clear-exams")}</div>
    <div id="exams-tabpanel" role="tabpanel" aria-labelledby="exams-${state.examsTab}-tab">${filtered.length ? `<div class="grid cols-2">${filtered.map(exam => { const confirmed = exam.participants.filter(person => person.confirmed).length; return `<article class="card"><div class="card-header"><div><span class="eyebrow">${exam.status}</span><h2>${exam.name}</h2><p>${formatDate(exam.date)}</p></div><span class="badge light">${confirmed}/${exam.participants.length} confirmados</span></div><div class="card-body"><dl class="definition-grid"><div class="definition-item"><dt>Fecha del examen</dt><dd>${formatDate(exam.date)}</dd></div><div class="definition-item"><dt>Límite de pago</dt><dd>${formatDate(exam.deadline)}</dd></div><div class="definition-item"><dt>Participantes previstos</dt><dd>${exam.participants.length}</dd></div><div class="definition-item"><dt>Confirmados</dt><dd>${confirmed}</dd></div></dl></div><div class="card-footer"><button class="text-button" data-exam="${exam.id}">Abrir detalle</button></div></article>`; }).join("")}</div>` : emptyState("No hay exámenes con estos filtros", "Cambia el nombre, el año o la pestaña para continuar.", "clear-exams")}</div>
    ${filterDrawer("Filtrar exámenes", `<div class="field"><label for="exam-year">Año</label><select id="exam-year"><option>Todos</option><option ${state.examYear === "2026" ? "selected" : ""}>2026</option><option ${state.examYear === "2025" ? "selected" : ""}>2025</option></select></div>`, "clear-exams")}`;
}

function renderExamDetail(examId) {
  const exam = data.exams.find(item => item.id === examId);
  return `<div class="detail-bar"><button class="icon-button" data-back="examenes" aria-label="Volver al listado de exámenes">←</button><span>Exámenes / ${exam.name}</span></div>
    ${pageHeader(exam.name, `${formatDate(exam.date)} · Pago límite ${formatDate(exam.deadline)}`, `<span class="badge ${exam.status === "Próximo" ? "dark" : "light"}">${exam.status}</span>`)}
    <div class="callout"><strong>Confirmación y resultado son decisiones separadas</strong><span>La participación requiere pago completo dentro del plazo. Un pago completo no registra automáticamente un resultado aprobado.</span></div>
    <section class="card spacer-top"><div class="table-wrap"><table><thead><tr><th>Participante</th><th>Grado objetivo</th><th>Costo</th><th>Pagado</th><th>Saldo</th><th>Participación</th><th>Resultado</th></tr></thead><tbody>${exam.participants.map(person => `<tr><td><button class="text-button" data-student="${person.studentId}">${getStudent(person.studentId).name}</button></td><td>${person.target}</td><td>${formatMoney(person.cost)}</td><td>${formatMoney(person.paid)}</td><td>${formatMoney(person.cost - person.paid)}</td><td><span class="badge ${person.confirmed ? "dark" : "light"}">${person.confirmed ? "Confirmado" : "No confirmado"}</span></td><td><span class="badge ${person.result === "Aprobado" ? "dark" : person.result === "Sin resultado" ? "dashed" : "light"}">${person.result}</span></td></tr>`).join("")}</tbody></table></div></section>`;
}

function startOfWeek(dateString) {
  const date = parseDate(dateString);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function isoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calendarEventMarkup(event) {
  const actionable = Boolean(event.target);
  const content = `<strong>${event.title}</strong><span>${event.time} · ${event.label}</span>`;
  const classes = `calendar-event ${event.type === "cancelled" ? "cancelled" : ""} ${event.type === "exam" ? "exam" : ""}`;
  return actionable
    ? `<button class="${classes}" data-calendar-target="${event.type === "exam" ? "exam" : "session"}:${event.target}">${content}</button>`
    : `<div class="${classes}" role="group" aria-label="${event.title}, ${event.time}, ${event.label}">${content}</div>`;
}

function renderCalendario() {
  const monday = startOfWeek(state.calendarDate);
  const days = Array.from({ length: 7 }, (_, index) => { const day = new Date(monday); day.setDate(monday.getDate() + index); return day; });
  const last = days[6];
  const title = `${days[0].getDate()}–${last.getDate()} de ${new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(last)}`;
  return `${pageHeader("Calendario", "Agenda semanal de clases, exámenes, fechas límite y actividades.")}
    <div class="calendar-toolbar"><h2 class="calendar-title">Semana del ${title}</h2><button class="button secondary small" data-calendar="prev">Anterior</button><button class="button secondary small" data-calendar="today">Hoy</button><button class="button secondary small" data-calendar="next">Siguiente</button></div>
    <section class="card calendar-desktop"><div class="table-wrap"><div class="calendar-grid">${days.map(day => { const date = isoDate(day); const events = data.calendarEvents.filter(event => event.date === date); return `<div class="calendar-day"><div class="calendar-day-head"><strong>${new Intl.DateTimeFormat("es-MX", { weekday: "short" }).format(day)}</strong><span>${day.getDate()} ${new Intl.DateTimeFormat("es-MX", { month: "short" }).format(day)}</span></div><div class="calendar-events">${events.length ? events.map(calendarEventMarkup).join("") : '<span class="muted">Sin actividades</span>'}</div></div>`; }).join("")}</div></div></section>
    <section class="calendar-mobile">${days.map(day => { const date = isoDate(day); const events = data.calendarEvents.filter(event => event.date === date); return `<article class="calendar-mobile-day"><h3>${new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "short" }).format(day)}</h3><div class="calendar-events">${events.length ? events.map(calendarEventMarkup).join("") : '<span class="muted">Sin actividades</span>'}</div></article>`; }).join("")}</section>
    <div class="callout spacer-top"><strong>Etiquetas visibles</strong><span>Las clases canceladas y reprogramadas se identifican con texto; no dependen solamente de un cambio visual.</span></div>`;
}

function reportFor(period) {
  const payments = data.payments.filter(payment => payment.valid && payment.date.startsWith(period));
  const totals = { Mensualidades: 0, Exámenes: 0, Pedidos: 0 };
  payments.forEach(payment => { const charge = data.charges.find(item => item.id === payment.chargeId); totals[charge.category] += payment.amount; });
  return { payments, totals, received: Object.values(totals).reduce((sum, amount) => sum + amount, 0) };
}

function renderReportes() {
  const report = reportFor(state.reportPeriod);
  const max = Math.max(...Object.values(report.totals), 1);
  const pending = data.charges.reduce((sum, charge) => sum + chargeBalance(charge), 0);
  return `${pageHeader("Reportes", "Resumen financiero basado en los pagos vigentes registrados.", `<span class="export-actions"><button class="button secondary" disabled>Excel</button><button class="button secondary" disabled>PDF</button><span class="pending-label">Próximamente</span></span>`)}
    <div class="period-bar"><div><span class="eyebrow">Resultados del periodo</span><strong>${periodLabel(state.reportPeriod)}</strong></div><div class="field compact"><label for="report-period" class="sr-only">Cambiar periodo del reporte</label><select id="report-period"><option value="2026-10" ${state.reportPeriod === "2026-10" ? "selected" : ""}>Octubre 2026</option><option value="2026-09" ${state.reportPeriod === "2026-09" ? "selected" : ""}>Septiembre 2026</option></select></div></div>
    <div class="grid cols-2"><article class="card metric"><span class="metric-label">Dinero recibido en el periodo</span><strong class="metric-value">${formatMoney(report.received)}</strong><span class="metric-detail">Solo pagos vigentes recibidos en ${periodLabel(state.reportPeriod)}</span></article><article class="card metric"><span class="metric-label">Pagos vigentes del periodo</span><strong class="metric-value">${report.payments.length}</strong><span class="metric-detail">Los pagos anulados están excluidos</span></article></div>
    <div class="grid cols-2 spacer-top"><section class="card"><div class="card-header"><div><h2>Desglose de ingresos</h2><p>${periodLabel(state.reportPeriod)}</p></div></div><div class="card-body bar-list">${Object.entries(report.totals).map(([label, value]) => `<div><div class="bar-row-head"><span>${label}</span><strong>${formatMoney(value)}</strong></div><div class="progress-track" role="img" aria-label="${label}: ${formatMoney(value)}"><div class="progress-bar" style="width:${Math.round(value / max * 100)}%"></div></div></div>`).join("")}</div></section><section class="card"><div class="card-header"><div><span class="eyebrow">Situación al 3 de octubre</span><h2>Saldos actuales</h2><p>${formatMoney(pending)} pendiente en todos los periodos</p></div></div><ul class="list">${["Mensualidades", "Exámenes", "Pedidos"].map(category => { const total = data.charges.filter(charge => charge.category === category).reduce((sum, charge) => sum + chargeBalance(charge), 0); return `<li class="list-row"><div class="list-row-main"><strong>${category}</strong><span>Cobros con saldo vigente</span></div><div class="list-row-value"><strong>${formatMoney(total)}</strong></div></li>`; }).join("")}</ul></section></div>`;
}

function renderConfiguracion() {
  return `${pageHeader("Configuración", "Datos de la escuela, cuenta, mensualidad general y grados.")}
    <div class="grid cols-2">
      <section class="card settings-card"><div class="card-body"><h2>Escuela</h2><dl class="definition-grid"><div class="definition-item"><dt>Nombre</dt><dd>${data.school.name}</dd></div><div class="definition-item"><dt>Cuenta</dt><dd>Una cuenta por escuela</dd></div></dl><div class="spacer-top">${pendingButton("Modificar perfil")}</div></div></section>
      <section class="card settings-card"><div class="card-body"><h2>Cuenta del propietario</h2><dl class="definition-grid"><div class="definition-item"><dt>Propietaria</dt><dd>${data.school.owner}</dd></div><div class="definition-item"><dt>Correo</dt><dd>mariana@ejemplo.mx</dd></div></dl><div class="spacer-top">${pendingButton("Cambiar contraseña")}</div></div></section>
      <section class="card settings-card"><div class="card-body"><h2>Mensualidad general</h2><p>Importe de referencia para los cobros futuros de alumnos activos.</p><strong class="metric-value">${formatMoney(data.school.fee)}</strong><div class="spacer-top">${pendingButton("Modificar mensualidad")}</div></div></section>
      <section class="card settings-card"><div class="card-body"><h2>Lista de grados</h2><div class="group-meta">${["Cinta blanca", "Cinta amarilla", "Cinta verde", "Cinta azul", "Cinta roja"].map(grade => `<span class="badge light">${grade}</span>`).join("")}</div><div class="spacer-top">${pendingButton("Gestionar grados")}</div></div></section>
    </div>
    <section class="card spacer-top"><div class="card-body"><h2>Cerrar sesión</h2><p class="muted">La autenticación real no forma parte de este prototipo.</p><span class="pending-action"><button class="button secondary" disabled>Cerrar sesión<span class="sr-only">. Disponible en una etapa posterior</span></button><span class="pending-label" aria-hidden="true">Próximamente</span></span></div></section>`;
}

const renderers = { inicio: renderInicio, alumnos: renderAlumnos, clases: renderClases, pagos: renderPagos, examenes: renderExamenes, calendario: renderCalendario, reportes: renderReportes, configuracion: renderConfiguracion };

function render(options = {}) {
  renderNav();
  main.innerHTML = renderers[state.section]();
  bindDynamicControls();
  if (state.filtersOpen) showFilterDrawer();
  if (options.focusMain) {
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function navigate(section, detail = null) {
  state.section = section;
  state.detail = detail;
  state.filtersOpen = false;
  closeMenu();
  render({ focusMain: true });
  announce(`Sección ${navItems.find(item => item[0] === section)[1]} abierta.`);
}

function bindDynamicControls() {
  document.querySelectorAll("[data-student]").forEach(button => button.addEventListener("click", () => navigate("alumnos", { type: "student", id: button.dataset.student })));
  document.querySelectorAll("[data-session]").forEach(button => button.addEventListener("click", () => navigate("clases", { type: "session", id: button.dataset.session })));
  document.querySelectorAll("[data-order]").forEach(button => button.addEventListener("click", () => { state.paymentsTab = "pedidos"; navigate("pagos", { type: "order", id: button.dataset.order }); }));
  document.querySelectorAll("[data-exam]").forEach(button => button.addEventListener("click", () => navigate("examenes", { type: "exam", id: button.dataset.exam })));
  document.querySelectorAll("[data-back]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.back)));
  document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => { if (button.dataset.tab) state.paymentsTab = button.dataset.tab; navigate(button.dataset.go); }));
  document.querySelectorAll("[data-payments-tab]").forEach(button => button.addEventListener("click", () => { state.paymentsTab = button.dataset.paymentsTab; state.detail = null; render(); announce(`Pestaña ${button.textContent} seleccionada.`); }));
  document.querySelectorAll("[data-exams-tab]").forEach(button => button.addEventListener("click", () => { state.examsTab = button.dataset.examsTab; state.detail = null; render(); announce(`Pestaña ${button.textContent} seleccionada.`); }));
  document.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => handleAction(button.dataset.action)));
  document.querySelectorAll("[data-calendar-target]").forEach(button => button.addEventListener("click", () => { const [type, id] = button.dataset.calendarTarget.split(":"); navigate(type === "exam" ? "examenes" : "clases", { type, id }); }));
  document.querySelectorAll("[data-calendar]").forEach(button => button.addEventListener("click", () => changeCalendar(button.dataset.calendar)));
  document.querySelectorAll("[data-open-filters]").forEach(button => button.addEventListener("click", openFilters));
  document.querySelectorAll("[data-close-filters]").forEach(button => button.addEventListener("click", closeFilters));
  document.querySelector(".filter-drawer")?.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')];
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.querySelectorAll('[role="tablist"]').forEach(tablist => tablist.addEventListener("keydown", event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const current = tabs.indexOf(document.activeElement);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    const target = tabs[nextIndex];
    const selector = target.dataset.paymentsTab ? `[data-payments-tab="${target.dataset.paymentsTab}"]` : `[data-exams-tab="${target.dataset.examsTab}"]`;
    target.click();
    window.setTimeout(() => document.querySelector(selector)?.focus(), 0);
  }));

  const studentSearch = document.querySelector("#student-search");
  if (studentSearch) studentSearch.addEventListener("input", event => { state.studentSearch = event.target.value; render(); document.querySelector("#student-search")?.focus(); });
  document.querySelector("#student-status")?.addEventListener("change", event => { state.studentStatus = event.target.value; render(); document.querySelector("#student-status")?.focus(); });
  document.querySelector("#student-grade")?.addEventListener("change", event => { state.studentGrade = event.target.value; render(); document.querySelector("#student-grade")?.focus(); });
  document.querySelector("#class-group")?.addEventListener("change", event => { state.classGroup = event.target.value; render(); document.querySelector("#class-group")?.focus(); });
  document.querySelector("#class-day")?.addEventListener("change", event => { state.classDay = event.target.value; render(); document.querySelector("#class-day")?.focus(); });
  document.querySelector("#payments-period")?.addEventListener("change", event => { state.paymentsPeriod = event.target.value; render(); announce(`Periodo ${periodLabel(state.paymentsPeriod)} seleccionado.`); });
  const examSearch = document.querySelector("#exam-search");
  if (examSearch) examSearch.addEventListener("input", event => { state.examSearch = event.target.value; render(); document.querySelector("#exam-search")?.focus(); });
  document.querySelector("#exam-year")?.addEventListener("change", event => { state.examYear = event.target.value; render(); document.querySelector("#exam-year")?.focus(); });
  document.querySelector("#report-period")?.addEventListener("change", event => { state.reportPeriod = event.target.value; render(); announce(`Reporte de ${periodLabel(state.reportPeriod)}.`); });
}

function showFilterDrawer() {
  const drawer = document.querySelector(".filter-drawer");
  const overlay = document.querySelector(".filter-scrim");
  if (!drawer || !overlay) return;
  overlay.hidden = false;
  drawer.classList.add("open");
  drawer.inert = false;
  drawer.setAttribute("aria-hidden", "false");
  document.querySelector("[data-open-filters]")?.setAttribute("aria-expanded", "true");
  sidebar.inert = true;
  document.querySelector(".topbar").inert = true;
  document.querySelectorAll("#contenido-principal > :not(.filter-drawer):not(.filter-scrim)").forEach(element => { element.inert = true; });
  document.body.style.overflow = "hidden";
}

function openFilters() {
  state.filtersOpen = true;
  showFilterDrawer();
  window.setTimeout(() => document.querySelector(".filter-drawer [data-close-filters]")?.focus(), 0);
}

function closeFilters() {
  const wasOpen = state.filtersOpen;
  state.filtersOpen = false;
  const drawer = document.querySelector(".filter-drawer");
  drawer?.classList.remove("open");
  if (drawer) { drawer.inert = true; drawer.setAttribute("aria-hidden", "true"); }
  document.querySelector("[data-open-filters]")?.setAttribute("aria-expanded", "false");
  const overlay = document.querySelector(".filter-scrim");
  if (overlay) overlay.hidden = true;
  sidebar.inert = false;
  document.querySelector(".topbar").inert = false;
  document.querySelectorAll("#contenido-principal > :not(.filter-drawer):not(.filter-scrim)").forEach(element => { element.inert = false; });
  document.body.style.overflow = "";
  if (wasOpen) document.querySelector("[data-open-filters]")?.focus();
}

function handleAction(action) {
  if (action === "clear-students") { state.studentSearch = ""; state.studentStatus = "Todos"; state.studentGrade = "Todos"; }
  if (action === "clear-classes") { state.classGroup = "Todos"; state.classDay = "Todos"; }
  if (action === "clear-exams") { state.examSearch = ""; state.examYear = "Todos"; }
  render();
  announce("Filtros limpiados.");
}

function changeCalendar(action) {
  if (action === "today") state.calendarDate = SIMULATED_TODAY;
  else {
    const date = parseDate(state.calendarDate);
    date.setDate(date.getDate() + (action === "next" ? 7 : -7));
    state.calendarDate = isoDate(date);
  }
  render();
  announce("Semana del calendario actualizada.");
}

function openMenu() {
  sidebar.classList.add("open");
  scrim.hidden = false;
  openMenuButton.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
  workspace.inert = true;
  closeMenuButton.focus();
}

function closeMenu() {
  const wasOpen = sidebar.classList.contains("open");
  sidebar.classList.remove("open");
  scrim.hidden = true;
  openMenuButton.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  workspace.inert = false;
  if (wasOpen && window.innerWidth <= 760) openMenuButton.focus();
}

nav.addEventListener("click", event => {
  const button = event.target.closest("[data-nav]");
  if (button) navigate(button.dataset.nav);
});
openMenuButton.addEventListener("click", openMenu);
closeMenuButton.addEventListener("click", closeMenu);
scrim.addEventListener("click", closeMenu);
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (state.filtersOpen) closeFilters();
  else if (sidebar.classList.contains("open")) closeMenu();
});
window.addEventListener("resize", () => { if (window.innerWidth > 760 && sidebar.classList.contains("open")) closeMenu(); });

render();
