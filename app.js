/* ======================================================
   MediCitas — App Logic
   Sistema de Gestión de Citas Médicas
   Persistencia: localStorage (cliente)
   ====================================================== */

(function () {
  'use strict';

  // ---------- USUARIOS DEL SISTEMA (RF-008) ----------
  const USERS = {
    admin:    { pass: 'admin123', name: 'Administrador',           role: 'admin'      },
    medico:   { pass: 'medico123', name: 'Dr. Médico',             role: 'medico'     },
    recepcion:{ pass: 'recep123',  name: 'Recepción',              role: 'recepcion'  }
  };

  // ---------- ALMACENAMIENTO ----------
  const KEYS = {
    session:   'mc_session',
    pacientes: 'mc_pacientes',
    medicos:   'mc_medicos',
    citas:     'mc_citas'
  };

  const store = {
    get(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };

  // ---------- DATOS INICIALES (seed) ----------
  function seed() {
    if (!store.get(KEYS.medicos)) {
      store.set(KEYS.medicos, [
        { id: id(), nombre: 'Dra. Laura Méndez',     especialidad: 'Medicina General', telefono: '601-555-0101', horario: '08:00-17:00' },
        { id: id(), nombre: 'Dr. Andrés Castaño',    especialidad: 'Cardiología',      telefono: '601-555-0102', horario: '09:00-18:00' },
        { id: id(), nombre: 'Dra. Camila Rojas',     especialidad: 'Pediatría',        telefono: '601-555-0103', horario: '07:00-15:00' },
        { id: id(), nombre: 'Dr. Felipe Beltrán',    especialidad: 'Dermatología',     telefono: '601-555-0104', horario: '10:00-19:00' }
      ]);
    }
    if (!store.get(KEYS.pacientes)) {
      store.set(KEYS.pacientes, [
        { id: id(), documento: '1010234567', nombre: 'María Fernanda Gómez', telefono: '300-1234567', email: 'mariafg@correo.co', nacimiento: '1990-04-12' },
        { id: id(), documento: '1020987654', nombre: 'Juan Esteban Romero',  telefono: '301-7654321', email: 'jromero@correo.co', nacimiento: '1985-08-22' },
        { id: id(), documento: '1030456789', nombre: 'Ana Lucía Pérez',      telefono: '302-9876543', email: 'aperez@correo.co',  nacimiento: '2001-12-03' }
      ]);
    }
    if (!store.get(KEYS.citas)) {
      const today = new Date();
      const fmt = (d) => d.toISOString().split('T')[0];
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const pacientes = store.get(KEYS.pacientes);
      const medicos = store.get(KEYS.medicos);
      store.set(KEYS.citas, [
        { id: id(), pacienteId: pacientes[0].id, medicoId: medicos[0].id, fecha: fmt(today),    hora: '09:00', motivo: 'Control general', estado: 'Programada' },
        { id: id(), pacienteId: pacientes[1].id, medicoId: medicos[1].id, fecha: fmt(today),    hora: '10:30', motivo: 'Chequeo cardiovascular', estado: 'Programada' },
        { id: id(), pacienteId: pacientes[2].id, medicoId: medicos[2].id, fecha: fmt(tomorrow), hora: '08:00', motivo: 'Consulta pediátrica', estado: 'Programada' }
      ]);
    }
  }

  function id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  // ---------- SHORTHANDS ----------
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // ---------- ESTADO ACTUAL ----------
  let currentUser = null;

  // ======================================================
  // LOGIN (RF-008)
  // ======================================================
  function initLogin() {
    const session = store.get(KEYS.session);
    if (session && USERS[session.user]) {
      currentUser = { user: session.user, ...USERS[session.user] };
      showApp();
      return;
    }

    $('#loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const u = $('#loginUser').value.trim().toLowerCase();
      const p = $('#loginPass').value;
      if (USERS[u] && USERS[u].pass === p) {
        currentUser = { user: u, ...USERS[u] };
        store.set(KEYS.session, { user: u });
        $('#loginError').hidden = true;
        showApp();
      } else {
        $('#loginError').hidden = false;
      }
    });
  }

  function showApp() {
    $('#loginScreen').hidden = true;
    $('#app').hidden = false;
    $('#userName').textContent = currentUser.name;
    $('#userRole').textContent = currentUser.role;
    $('#userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    initApp();
  }

  function logout() {
    localStorage.removeItem(KEYS.session);
    location.reload();
  }

  // ======================================================
  // APP INIT
  // ======================================================
  function initApp() {
    // Navegación lateral
    $$('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Atajos a vistas desde botones secundarios
    $$('[data-view]').forEach(el => {
      if (!el.classList.contains('nav-item')) {
        el.addEventListener('click', (e) => {
          if (e.currentTarget.dataset.view) switchView(e.currentTarget.dataset.view);
        });
      }
    });

    // Logout
    $('#logoutBtn').addEventListener('click', logout);

    // Botones de acciones globales
    $$('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a === 'nuevaCita')     openCitaModal();
        if (a === 'nuevoPaciente') openPacienteModal();
        if (a === 'nuevoMedico')   openMedicoModal();
      });
    });

    // Filtros
    $('#filtroCitas').addEventListener('input', renderCitas);
    $('#filtroEstado').addEventListener('change', renderCitas);
    $('#filtroPacientes').addEventListener('input', renderPacientes);

    // Agenda
    $('#agendaMedico').addEventListener('change', renderAgenda);
    $('#agendaFecha').addEventListener('change', renderAgenda);

    // Reportes
    $('#reporteFecha').addEventListener('change', renderReporte);
    $('#exportCSV').addEventListener('click', exportarCSV);

    // Modal cierre
    $$('[data-close]').forEach(el => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // Defaults de fecha
    const hoy = new Date().toISOString().split('T')[0];
    $('#agendaFecha').value = hoy;
    $('#reporteFecha').value = hoy;

    // Render inicial
    renderTodos();
    renderDashboard();
  }

  function switchView(view) {
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === view));
    if (view === 'dashboard') renderDashboard();
    if (view === 'citas')     renderCitas();
    if (view === 'pacientes') renderPacientes();
    if (view === 'medicos')   renderMedicos();
    if (view === 'agenda')    { populateAgendaMedicos(); renderAgenda(); }
    if (view === 'reportes')  renderReporte();
  }

  function renderTodos() {
    renderCitas(); renderPacientes(); renderMedicos();
    populateAgendaMedicos();
  }

  // ======================================================
  // DASHBOARD
  // ======================================================
  function renderDashboard() {
    const citas = store.get(KEYS.citas, []);
    const pacientes = store.get(KEYS.pacientes, []);
    const medicos = store.get(KEYS.medicos, []);
    const hoy = new Date().toISOString().split('T')[0];

    const citasHoy = citas.filter(c => c.fecha === hoy && c.estado === 'Programada');
    $('#statCitasHoy').textContent = citasHoy.length;
    $('#statPacientes').textContent = pacientes.length;
    $('#statMedicos').textContent = medicos.length;

    // Esta semana
    const ahora = new Date(); ahora.setHours(0, 0, 0, 0);
    const en7 = new Date(ahora); en7.setDate(en7.getDate() + 7);
    const semana = citas.filter(c => {
      const f = new Date(c.fecha + 'T00:00:00');
      return f >= ahora && f < en7;
    });
    $('#statSemana').textContent = semana.length;

    // Etiqueta del día (es-CO)
    const hoyDate = new Date();
    $('#todayLabel').textContent = hoyDate.toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Próximas citas
    const proximas = citas
      .filter(c => c.estado === 'Programada')
      .filter(c => {
        const dt = new Date(c.fecha + 'T' + c.hora);
        return dt >= new Date(Date.now() - 60 * 60 * 1000);
      })
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
      .slice(0, 5);

    const cont = $('#proximasCitas');
    if (!proximas.length) {
      cont.innerHTML = '<div class="upcoming-empty">No hay citas próximas. Programa una nueva.</div>';
    } else {
      cont.innerHTML = proximas.map(c => {
        const p = pacientes.find(x => x.id === c.pacienteId);
        const m = medicos.find(x => x.id === c.medicoId);
        const f = new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
        return `
          <div class="upcoming-item">
            <div class="upcoming-time">${c.hora}</div>
            <div class="upcoming-info">
              <strong>${p ? p.nombre : 'Paciente eliminado'}</strong>
              <span>${m ? m.nombre : '—'} · ${f}</span>
            </div>
            <span class="badge ${c.estado.toLowerCase()}">${c.estado}</span>
          </div>`;
      }).join('');
    }

    // Distribución por estado
    const total = citas.length || 1;
    const prog = citas.filter(c => c.estado === 'Programada').length;
    const canc = citas.filter(c => c.estado === 'Cancelada').length;
    const comp = citas.filter(c => c.estado === 'Completada').length;
    $('#estadoDist').innerHTML = `
      ${distRow('Programadas', prog, total, 'prog')}
      ${distRow('Completadas', comp, total, 'comp')}
      ${distRow('Canceladas',  canc, total, 'canc')}
    `;
  }

  function distRow(label, val, total, cls) {
    const pct = Math.round((val / total) * 100);
    return `
      <div class="dist-row">
        <div class="dist-row-label"><span>${label}</span><strong>${val} · ${pct}%</strong></div>
        <div class="dist-bar"><div class="dist-bar-fill fill-${cls}" style="width:${pct}%"></div></div>
      </div>`;
  }

  // ======================================================
  // CITAS (RF-001, RF-002, RF-003, RF-005, RF-006, RF-009)
  // ======================================================
  function renderCitas() {
    const citas = store.get(KEYS.citas, []);
    const pacientes = store.get(KEYS.pacientes, []);
    const medicos = store.get(KEYS.medicos, []);

    const q = ($('#filtroCitas').value || '').toLowerCase();
    const estado = $('#filtroEstado').value;

    const sorted = [...citas].sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));

    const filtered = sorted.filter(c => {
      const p = pacientes.find(x => x.id === c.pacienteId);
      const m = medicos.find(x => x.id === c.medicoId);
      const txt = `${p?.nombre || ''} ${m?.nombre || ''} ${c.fecha} ${c.hora} ${c.motivo}`.toLowerCase();
      const matchQ = !q || txt.includes(q);
      const matchE = !estado || c.estado === estado;
      return matchQ && matchE;
    });

    const body = $('#citasBody');
    $('#citasEmpty').hidden = filtered.length > 0;

    body.innerHTML = filtered.map(c => {
      const p = pacientes.find(x => x.id === c.pacienteId);
      const m = medicos.find(x => x.id === c.medicoId);
      const fecha = new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
      return `
        <tr>
          <td>${fecha}</td>
          <td><strong>${c.hora}</strong></td>
          <td>${p ? p.nombre : '—'}</td>
          <td>${m ? m.nombre : '—'}</td>
          <td>${c.motivo || '—'}</td>
          <td><span class="badge ${c.estado.toLowerCase()}">${c.estado}</span></td>
          <td class="row-actions">
            ${c.estado === 'Programada' ? `
              <button class="icon-btn" data-edit="${c.id}" title="Reprogramar">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="icon-btn" data-complete="${c.id}" title="Marcar completada">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
              </button>
              <button class="icon-btn danger" data-cancel="${c.id}" title="Cancelar cita">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            ` : `
              <button class="icon-btn danger" data-delete="${c.id}" title="Eliminar">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            `}
          </td>
        </tr>`;
    }).join('');

    // Listeners
    $$('[data-edit]', body).forEach(b => b.addEventListener('click', () => openCitaModal(b.dataset.edit)));
    $$('[data-cancel]', body).forEach(b => b.addEventListener('click', () => cancelarCita(b.dataset.cancel)));
    $$('[data-complete]', body).forEach(b => b.addEventListener('click', () => completarCita(b.dataset.complete)));
    $$('[data-delete]', body).forEach(b => b.addEventListener('click', () => eliminarCita(b.dataset.delete)));
  }

  function openCitaModal(citaId) {
    const pacientes = store.get(KEYS.pacientes, []);
    const medicos = store.get(KEYS.medicos, []);
    if (!pacientes.length) { toast('Primero registra un paciente.', 'error'); return; }
    if (!medicos.length)   { toast('Primero registra un médico.', 'error');   return; }

    const cita = citaId ? store.get(KEYS.citas, []).find(c => c.id === citaId) : null;
    const isEdit = !!cita;

    $('#modalTitle').textContent = isEdit ? 'Reprogramar cita' : 'Nueva cita médica';
    $('#modalBody').innerHTML = `
      <form id="citaForm" class="form-grid">
        <label class="field full">
          <span class="field-label">Paciente</span>
          <select id="cPaciente" class="select" required>
            <option value="">Selecciona un paciente…</option>
            ${pacientes.map(p => `<option value="${p.id}" ${cita?.pacienteId === p.id ? 'selected' : ''}>${p.nombre} — ${p.documento}</option>`).join('')}
          </select>
        </label>
        <label class="field full">
          <span class="field-label">Médico</span>
          <select id="cMedico" class="select" required>
            <option value="">Selecciona un médico…</option>
            ${medicos.map(m => `<option value="${m.id}" ${cita?.medicoId === m.id ? 'selected' : ''}>${m.nombre} — ${m.especialidad}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span class="field-label">Fecha</span>
          <input type="date" id="cFecha" class="input" value="${cita?.fecha || new Date().toISOString().split('T')[0]}" required>
        </label>
        <label class="field">
          <span class="field-label">Hora</span>
          <input type="time" id="cHora" class="input" value="${cita?.hora || '09:00'}" step="1800" required>
        </label>
        <label class="field full">
          <span class="field-label">Motivo de la consulta</span>
          <textarea id="cMotivo" placeholder="Ej: control general, dolor abdominal, chequeo de rutina…">${cita?.motivo || ''}</textarea>
        </label>
        <div class="form-actions full">
          <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar cambios' : 'Crear cita'}</button>
        </div>
      </form>`;

    openModal();

    $('#citaForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        pacienteId: $('#cPaciente').value,
        medicoId:   $('#cMedico').value,
        fecha:      $('#cFecha').value,
        hora:       $('#cHora').value,
        motivo:     $('#cMotivo').value.trim()
      };

      // RF-002: Validar que no exista otra cita con mismo médico, fecha y hora
      const citas = store.get(KEYS.citas, []);
      const conflicto = citas.find(c =>
        c.medicoId === data.medicoId &&
        c.fecha === data.fecha &&
        c.hora === data.hora &&
        c.estado === 'Programada' &&
        c.id !== citaId
      );
      if (conflicto) {
        toast('Ya existe una cita con ese médico en ese horario.', 'error');
        return;
      }

      if (isEdit) {
        const idx = citas.findIndex(c => c.id === citaId);
        citas[idx] = { ...citas[idx], ...data };
        store.set(KEYS.citas, citas);
        toast('Cita reprogramada correctamente.', 'success');
      } else {
        citas.push({ id: id(), estado: 'Programada', ...data });
        store.set(KEYS.citas, citas);
        toast('Cita creada correctamente.', 'success');
      }

      closeModal();
      renderCitas();
      renderDashboard();
    });

    $$('[data-close]', $('#modalBody')).forEach(b => b.addEventListener('click', closeModal));
  }

  function cancelarCita(citaId) {
    if (!confirm('¿Confirmas la cancelación de esta cita?')) return;
    const citas = store.get(KEYS.citas, []);
    const idx = citas.findIndex(c => c.id === citaId);
    if (idx >= 0) {
      citas[idx].estado = 'Cancelada';
      store.set(KEYS.citas, citas);
      toast('Cita cancelada.', 'success');
      renderCitas(); renderDashboard();
    }
  }

  function completarCita(citaId) {
    const citas = store.get(KEYS.citas, []);
    const idx = citas.findIndex(c => c.id === citaId);
    if (idx >= 0) {
      citas[idx].estado = 'Completada';
      store.set(KEYS.citas, citas);
      toast('Cita marcada como completada.', 'success');
      renderCitas(); renderDashboard();
    }
  }

  function eliminarCita(citaId) {
    if (!confirm('¿Eliminar este registro permanentemente?')) return;
    const citas = store.get(KEYS.citas, []).filter(c => c.id !== citaId);
    store.set(KEYS.citas, citas);
    toast('Registro eliminado.', 'success');
    renderCitas(); renderDashboard();
  }

  // ======================================================
  // PACIENTES (RF-007)
  // ======================================================
  function renderPacientes() {
    const pacientes = store.get(KEYS.pacientes, []);
    const q = ($('#filtroPacientes').value || '').toLowerCase();
    const filtered = pacientes.filter(p =>
      !q || `${p.nombre} ${p.documento} ${p.telefono} ${p.email}`.toLowerCase().includes(q)
    );

    const body = $('#pacientesBody');
    $('#pacientesEmpty').hidden = filtered.length > 0;

    body.innerHTML = filtered.map(p => `
      <tr>
        <td><strong>${p.documento}</strong></td>
        <td>${p.nombre}</td>
        <td>${p.telefono || '—'}</td>
        <td>${p.email || '—'}</td>
        <td>${p.nacimiento ? new Date(p.nacimiento + 'T00:00:00').toLocaleDateString('es-CO') : '—'}</td>
        <td class="row-actions">
          <button class="icon-btn" data-edit="${p.id}" title="Editar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn danger" data-delete="${p.id}" title="Eliminar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </td>
      </tr>
    `).join('');

    $$('[data-edit]', body).forEach(b => b.addEventListener('click', () => openPacienteModal(b.dataset.edit)));
    $$('[data-delete]', body).forEach(b => b.addEventListener('click', () => eliminarPaciente(b.dataset.delete)));
  }

  function openPacienteModal(pacienteId) {
    const paciente = pacienteId ? store.get(KEYS.pacientes, []).find(p => p.id === pacienteId) : null;
    const isEdit = !!paciente;

    $('#modalTitle').textContent = isEdit ? 'Editar paciente' : 'Nuevo paciente';
    $('#modalBody').innerHTML = `
      <form id="pacienteForm" class="form-grid">
        <label class="field">
          <span class="field-label">Documento</span>
          <input type="text" id="pDoc" class="input" value="${paciente?.documento || ''}" required>
        </label>
        <label class="field">
          <span class="field-label">Fecha nacimiento</span>
          <input type="date" id="pNac" class="input" value="${paciente?.nacimiento || ''}">
        </label>
        <label class="field full">
          <span class="field-label">Nombre completo</span>
          <input type="text" id="pNombre" class="input" value="${paciente?.nombre || ''}" required>
        </label>
        <label class="field">
          <span class="field-label">Teléfono</span>
          <input type="tel" id="pTel" class="input" value="${paciente?.telefono || ''}">
        </label>
        <label class="field">
          <span class="field-label">Email</span>
          <input type="email" id="pEmail" class="input" value="${paciente?.email || ''}">
        </label>
        <div class="form-actions full">
          <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar' : 'Registrar'}</button>
        </div>
      </form>`;
    openModal();

    $('#pacienteForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        documento: $('#pDoc').value.trim(),
        nombre: $('#pNombre').value.trim(),
        telefono: $('#pTel').value.trim(),
        email: $('#pEmail').value.trim(),
        nacimiento: $('#pNac').value
      };
      const pacientes = store.get(KEYS.pacientes, []);
      // Validar duplicado de documento
      const dup = pacientes.find(p => p.documento === data.documento && p.id !== pacienteId);
      if (dup) { toast('Ya existe un paciente con ese documento.', 'error'); return; }

      if (isEdit) {
        const idx = pacientes.findIndex(p => p.id === pacienteId);
        pacientes[idx] = { ...pacientes[idx], ...data };
        toast('Paciente actualizado.', 'success');
      } else {
        pacientes.push({ id: id(), ...data });
        toast('Paciente registrado.', 'success');
      }
      store.set(KEYS.pacientes, pacientes);
      closeModal();
      renderPacientes();
      renderDashboard();
    });

    $$('[data-close]', $('#modalBody')).forEach(b => b.addEventListener('click', closeModal));
  }

  function eliminarPaciente(pacienteId) {
    const citas = store.get(KEYS.citas, []);
    if (citas.some(c => c.pacienteId === pacienteId && c.estado === 'Programada')) {
      toast('El paciente tiene citas programadas. Cancélalas primero.', 'error');
      return;
    }
    if (!confirm('¿Eliminar este paciente?')) return;
    const pacientes = store.get(KEYS.pacientes, []).filter(p => p.id !== pacienteId);
    store.set(KEYS.pacientes, pacientes);
    toast('Paciente eliminado.', 'success');
    renderPacientes(); renderDashboard();
  }

  // ======================================================
  // MÉDICOS
  // ======================================================
  function renderMedicos() {
    const medicos = store.get(KEYS.medicos, []);
    const citas = store.get(KEYS.citas, []);
    const grid = $('#medicosGrid');
    $('#medicosEmpty').hidden = medicos.length > 0;

    grid.innerHTML = medicos.map(m => {
      const total = citas.filter(c => c.medicoId === m.id).length;
      const inicial = m.nombre.replace(/^Dra?\.\s*/i, '').charAt(0);
      return `
        <article class="medico-card">
          <div class="medico-head">
            <div class="medico-avatar">${inicial}</div>
            <div>
              <div class="medico-name">${m.nombre}</div>
              <div class="medico-spec">${m.especialidad}</div>
            </div>
          </div>
          <div class="medico-info">
            <div class="medico-info-row"><span>Horario</span><span>${m.horario}</span></div>
            <div class="medico-info-row"><span>Teléfono</span><span>${m.telefono || '—'}</span></div>
            <div class="medico-info-row"><span>Citas registradas</span><span>${total}</span></div>
          </div>
          <div class="medico-actions">
            <button class="btn btn-ghost" data-edit="${m.id}">Editar</button>
            <button class="btn btn-ghost" data-delete="${m.id}">Eliminar</button>
          </div>
        </article>`;
    }).join('');

    $$('[data-edit]', grid).forEach(b => b.addEventListener('click', () => openMedicoModal(b.dataset.edit)));
    $$('[data-delete]', grid).forEach(b => b.addEventListener('click', () => eliminarMedico(b.dataset.delete)));
  }

  function openMedicoModal(medicoId) {
    const medico = medicoId ? store.get(KEYS.medicos, []).find(m => m.id === medicoId) : null;
    const isEdit = !!medico;

    $('#modalTitle').textContent = isEdit ? 'Editar médico' : 'Nuevo médico';
    $('#modalBody').innerHTML = `
      <form id="medicoForm" class="form-grid">
        <label class="field full">
          <span class="field-label">Nombre completo</span>
          <input type="text" id="mNombre" class="input" placeholder="Dr. / Dra." value="${medico?.nombre || ''}" required>
        </label>
        <label class="field">
          <span class="field-label">Especialidad</span>
          <input type="text" id="mEsp" class="input" value="${medico?.especialidad || ''}" required>
        </label>
        <label class="field">
          <span class="field-label">Teléfono</span>
          <input type="tel" id="mTel" class="input" value="${medico?.telefono || ''}">
        </label>
        <label class="field full">
          <span class="field-label">Horario de atención</span>
          <input type="text" id="mHorario" class="input" placeholder="Ej: 08:00-17:00" value="${medico?.horario || '08:00-17:00'}" required>
        </label>
        <div class="form-actions full">
          <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar' : 'Registrar'}</button>
        </div>
      </form>`;
    openModal();

    $('#medicoForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        nombre: $('#mNombre').value.trim(),
        especialidad: $('#mEsp').value.trim(),
        telefono: $('#mTel').value.trim(),
        horario: $('#mHorario').value.trim()
      };
      const medicos = store.get(KEYS.medicos, []);
      if (isEdit) {
        const idx = medicos.findIndex(m => m.id === medicoId);
        medicos[idx] = { ...medicos[idx], ...data };
        toast('Médico actualizado.', 'success');
      } else {
        medicos.push({ id: id(), ...data });
        toast('Médico registrado.', 'success');
      }
      store.set(KEYS.medicos, medicos);
      closeModal();
      renderMedicos();
      populateAgendaMedicos();
      renderDashboard();
    });

    $$('[data-close]', $('#modalBody')).forEach(b => b.addEventListener('click', closeModal));
  }

  function eliminarMedico(medicoId) {
    const citas = store.get(KEYS.citas, []);
    if (citas.some(c => c.medicoId === medicoId && c.estado === 'Programada')) {
      toast('El médico tiene citas programadas. Cancélalas primero.', 'error');
      return;
    }
    if (!confirm('¿Eliminar este médico?')) return;
    const medicos = store.get(KEYS.medicos, []).filter(m => m.id !== medicoId);
    store.set(KEYS.medicos, medicos);
    toast('Médico eliminado.', 'success');
    renderMedicos(); populateAgendaMedicos(); renderDashboard();
  }

  // ======================================================
  // AGENDA (RF-004)
  // ======================================================
  function populateAgendaMedicos() {
    const medicos = store.get(KEYS.medicos, []);
    const sel = $('#agendaMedico');
    const prev = sel.value;
    sel.innerHTML = '<option value="">Selecciona un médico…</option>' +
      medicos.map(m => `<option value="${m.id}">${m.nombre} — ${m.especialidad}</option>`).join('');
    if (prev && medicos.find(m => m.id === prev)) sel.value = prev;
  }

  function renderAgenda() {
    const medicoId = $('#agendaMedico').value;
    const fecha = $('#agendaFecha').value;
    const cont = $('#agendaSlots');

    if (!medicoId || !fecha) {
      cont.innerHTML = '';
      $('#agendaEmpty').hidden = false;
      return;
    }
    $('#agendaEmpty').hidden = true;

    const medico = store.get(KEYS.medicos, []).find(m => m.id === medicoId);
    if (!medico) { cont.innerHTML = ''; return; }

    // Generar slots cada 30 min según horario del médico
    const [ini, fin] = (medico.horario || '08:00-17:00').split('-');
    const slots = generarSlots(ini, fin);

    const citas = store.get(KEYS.citas, []).filter(c =>
      c.medicoId === medicoId && c.fecha === fecha && c.estado === 'Programada'
    );

    cont.innerHTML = slots.map(hora => {
      const ocupada = citas.find(c => c.hora === hora);
      return `
        <div class="slot ${ocupada ? 'ocupada' : 'libre'}" data-hora="${hora}" ${ocupada ? '' : 'data-libre="1"'}>
          <span class="slot-time">${hora}</span>
          <span class="slot-status">${ocupada ? 'Ocupada' : 'Disponible'}</span>
        </div>`;
    }).join('');

    $$('[data-libre]', cont).forEach(s => {
      s.addEventListener('click', () => {
        // Pre-llenar el modal con esta hora
        openCitaModal();
        setTimeout(() => {
          $('#cMedico').value = medicoId;
          $('#cFecha').value = fecha;
          $('#cHora').value = s.dataset.hora;
        }, 30);
      });
    });
  }

  function generarSlots(ini, fin) {
    const out = [];
    const [hi, mi] = ini.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    let h = hi, m = mi;
    while (h < hf || (h === hf && m < mf)) {
      out.push(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
      m += 30;
      if (m >= 60) { m = 0; h++; }
    }
    return out;
  }

  // ======================================================
  // REPORTES (RF-010)
  // ======================================================
  function renderReporte() {
    const fecha = $('#reporteFecha').value;
    if (!fecha) return;

    const citas = store.get(KEYS.citas, []).filter(c => c.fecha === fecha);
    const pacientes = store.get(KEYS.pacientes, []);
    const medicos = store.get(KEYS.medicos, []);

    // Resumen
    const prog = citas.filter(c => c.estado === 'Programada').length;
    const canc = citas.filter(c => c.estado === 'Cancelada').length;
    const comp = citas.filter(c => c.estado === 'Completada').length;
    $('#reporteSummary').innerHTML = `
      <div class="summary-card"><div class="summary-label">Total</div><div class="summary-value">${citas.length}</div></div>
      <div class="summary-card"><div class="summary-label">Programadas</div><div class="summary-value">${prog}</div></div>
      <div class="summary-card"><div class="summary-label">Completadas</div><div class="summary-value">${comp}</div></div>
      <div class="summary-card"><div class="summary-label">Canceladas</div><div class="summary-value">${canc}</div></div>
    `;

    const sorted = [...citas].sort((a, b) => a.hora.localeCompare(b.hora));
    $('#reporteEmpty').hidden = sorted.length > 0;
    $('#reporteBody').innerHTML = sorted.map(c => {
      const p = pacientes.find(x => x.id === c.pacienteId);
      const m = medicos.find(x => x.id === c.medicoId);
      return `
        <tr>
          <td><strong>${c.hora}</strong></td>
          <td>${p ? p.nombre : '—'}</td>
          <td>${m ? m.nombre : '—'}</td>
          <td>${c.motivo || '—'}</td>
          <td><span class="badge ${c.estado.toLowerCase()}">${c.estado}</span></td>
        </tr>`;
    }).join('');
  }

  function exportarCSV() {
    const fecha = $('#reporteFecha').value;
    if (!fecha) return;
    const citas = store.get(KEYS.citas, []).filter(c => c.fecha === fecha);
    if (!citas.length) { toast('No hay datos para exportar.', 'error'); return; }
    const pacientes = store.get(KEYS.pacientes, []);
    const medicos = store.get(KEYS.medicos, []);

    const headers = ['Fecha', 'Hora', 'Paciente', 'Documento', 'Médico', 'Especialidad', 'Motivo', 'Estado'];
    const rows = citas.map(c => {
      const p = pacientes.find(x => x.id === c.pacienteId);
      const m = medicos.find(x => x.id === c.medicoId);
      return [
        c.fecha, c.hora,
        p?.nombre || '', p?.documento || '',
        m?.nombre || '', m?.especialidad || '',
        c.motivo || '', c.estado
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-citas-${fecha}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Reporte exportado.', 'success');
  }

  // ======================================================
  // MODAL / TOAST
  // ======================================================
  function openModal() { $('#modal').hidden = false; }
  function closeModal() { $('#modal').hidden = true; $('#modalBody').innerHTML = ''; }

  function toast(msg, type = '') {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast' + (type ? ' ' + type : '');
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2800);
  }

  // ======================================================
  // BOOT
  // ======================================================
  // Garantizar estado inicial limpio del modal y toast
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const toast = document.getElementById('toast');
    if (modal) { modal.hidden = true; document.getElementById('modalBody').innerHTML = ''; }
    if (toast) { toast.hidden = true; }
  });

  seed();
  initLogin();

})();
