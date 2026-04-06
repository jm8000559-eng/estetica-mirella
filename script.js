// ==================== USUARIO LOGUEADO ====================
const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'login.html';

// ==================== DATOS POR ESPECIALISTA ====================
let citas = JSON.parse(localStorage.getItem('citas')) || [];
let ingresos = JSON.parse(localStorage.getItem('ingresos')) || [];

const especialistas = [
    { id: 1, nombre: "Manicura y Pedicura", telefono: "0414-7861415", rol: "especialista1" },
    { id: 2, nombre: "Cabello", telefono: "", rol: "especialista2" },
    { id: 3, nombre: "Cejas, Depilación y Pestañas", telefono: "0424-8525592", rol: "especialista3" }
];

function guardarDatos() {
    localStorage.setItem('citas', JSON.stringify(citas));
    localStorage.setItem('ingresos', JSON.stringify(ingresos));
}

// ==================== FILTRAR SEGÚN ROL ====================
function filtrarPorRol() {
    if (user.rol === 'admin') return { citas, ingresos };
    const especialista = especialistas.find(e => e.rol === user.rol);
    if (!especialista) return { citas: [], ingresos: [] };
    return {
        citas: citas.filter(c => c.especialistaId === especialista.id),
        ingresos: ingresos.filter(i => i.especialistaId === especialista.id)
    };
}

// ==================== MODAL DE DETALLE ====================
function mostrarDetalleCita(index) {
    const { citas: misCitas } = filtrarPorRol();
    const c = misCitas[index];
    const estadoColor = { 'Atendida': '🟢', 'Pendiente': '🟡', 'Cancelada': '🔴' };
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>📋 Detalle de Cita</h3>
            <p><strong>Cliente:</strong> ${c.cliente}</p>
            <p><strong>Servicio:</strong> ${c.servicio}</p>
            <p><strong>Especialista:</strong> ${especialistas.find(e => e.id === c.especialistaId).nombre}</p>
            <p><strong>Fecha:</strong> ${c.fecha}</p>
            <p><strong>Hora:</strong> ${c.hora}</p>
            <p><strong>Estado:</strong> ${estadoColor[c.estado]} ${c.estado}</p>
            <label><strong>Cambiar estado:</strong></label>
            <select id="nuevoEstado">
                <option value="Pendiente" ${c.estado === 'Pendiente' ? 'selected' : ''}>🟡 Pendiente</option>
                <option value="Atendida" ${c.estado === 'Atendida' ? 'selected' : ''}>🟢 Atendida</option>
                <option value="Cancelada" ${c.estado === 'Cancelada' ? 'selected' : ''}>🔴 Cancelada</option>
            </select>
            <div style="margin-top:20px; display:flex; gap:10px; justify-content:flex-end;">
                <button id="guardarEstado">Guardar cambios</button>
                <button id="cerrarModal">Cerrar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    document.getElementById('guardarEstado').onclick = () => {
        const nuevo = document.getElementById('nuevoEstado').value;
        const idxReal = citas.findIndex(cita => cita.cliente === c.cliente && cita.fecha === c.fecha && cita.hora === c.hora);
        if (idxReal !== -1) {
            citas[idxReal].estado = nuevo;
            if (nuevo === 'Atendida' && user.rol !== 'admin') {
                const monto = prompt("Ingrese el monto cobrado:", "0");
                if (monto && !isNaN(parseFloat(monto))) {
                    ingresos.push({ especialistaId: c.especialistaId, monto: parseFloat(monto), fecha: new Date().toISOString().split('T')[0], servicio: c.servicio, cliente: c.cliente });
                }
            }
            guardarDatos();
        }
        mostrarCitas();
        modal.remove();
    };
    document.getElementById('cerrarModal').onclick = () => modal.remove();
}

// ==================== RENDERIZADO ====================
function mostrarCitas() {
    const { citas: misCitas } = filtrarPorRol();
    const main = document.getElementById('mainView');
    main.innerHTML = `
        <div class="card-especialista" style="margin-bottom:20px;">
            <h3>📅 Nueva Cita</h3>
            <button id="btnNuevaCita" class="btn-gold">+ Agendar Cita</button>
        </div>
        <div id="calendario"></div>
        <div style="margin-top:30px;">
            <h3>📋 Listado de Citas</h3>
            <table id="tablaCitas">
                <thead><tr><th>Cliente</th><th>Servicio</th><th>Especialista</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody id="listaCitas"></tbody>
            </table>
        </div>
    `;
    renderizarCalendario(misCitas);
    const tbody = document.getElementById('listaCitas');
    tbody.innerHTML = '';
    misCitas.forEach((c, idx) => {
        const esp = especialistas.find(e => e.id === c.especialistaId);
        let estadoIcon = { 'Atendida': '🟢', 'Pendiente': '🟡', 'Cancelada': '🔴' }[c.estado] || '⚪';
        tbody.innerHTML += `
            <tr>
                <td>${c.cliente}</td>
                <td>${c.servicio}</td>
                <td>${esp.nombre}</td>
                <td>${c.fecha}</td>
                <td>${c.hora}</td>
                <td>${estadoIcon} ${c.estado}</td>
                <td><button onclick="mostrarDetalleCita(${idx})">📋 Ver</button>
                    <button onclick="eliminarCita(${idx})">🗑️</button>
                </td>
            </tr>
        `;
    });
    document.getElementById('btnNuevaCita').onclick = mostrarModalCita;
}

function renderizarCalendario(misCitas) {
    const calendarEl = document.getElementById('calendario');
    new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        events: misCitas.map(c => ({ title: `${c.cliente} - ${c.servicio}`, start: `${c.fecha}T${c.hora}` }))
    }).render();
}

function mostrarModalCita() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>➕ Nueva Cita</h3>
            <input id="cliente" placeholder="Nombre del cliente">
            <input id="servicio" placeholder="Servicio">
            <select id="especialistaId">
                ${especialistas.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
            </select>
            <input type="date" id="fecha">
            <input type="time" id="hora">
            <button id="guardarCita">Guardar</button>
            <button id="cerrarModal">Cancelar</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    document.getElementById('guardarCita').onclick = () => {
        const nueva = {
            cliente: document.getElementById('cliente').value,
            servicio: document.getElementById('servicio').value,
            especialistaId: parseInt(document.getElementById('especialistaId').value),
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            estado: 'Pendiente'
        };
        if (!nueva.cliente || !nueva.servicio || !nueva.fecha || !nueva.hora) return alert("Complete todos los campos");
        citas.push(nueva);
        guardarDatos();
        mostrarCitas();
        modal.remove();
    };
    document.getElementById('cerrarModal').onclick = () => modal.remove();
}

function eliminarCita(idx) {
    const { citas: misCitas } = filtrarPorRol();
    const c = misCitas[idx];
    const realIdx = citas.findIndex(cita => cita.cliente === c.cliente && cita.fecha === c.fecha && cita.hora === c.hora);
    if (realIdx !== -1 && confirm("¿Eliminar cita?")) {
        citas.splice(realIdx, 1);
        guardarDatos();
        mostrarCitas();
    }
}

function mostrarIngresos() {
    const { ingresos: misIngresos } = filtrarPorRol();
    const main = document.getElementById('mainView');
    main.innerHTML = `<h2>💰 Reporte de Ingresos</h2>`;
    const grupos = user.rol === 'admin' ? especialistas : especialistas.filter(e => e.rol === user.rol);
    grupos.forEach(esp => {
        const filtrados = misIngresos.filter(i => i.especialistaId === esp.id);
        const semanal = filtrados.filter(i => (new Date() - new Date(i.fecha)) / (1000*60*60*24) <= 7).reduce((a,b) => a + b.monto, 0);
        const mensual = filtrados.filter(i => new Date(i.fecha).getMonth() === new Date().getMonth()).reduce((a,b) => a + b.monto, 0);
        main.innerHTML += `<div class="card-especialista"><h3>${esp.nombre}</h3><p>💰 Semana: ${semanal.toFixed(2)} $</p><p>📆 Mes: ${mensual.toFixed(2)} $</p></div>`;
    });
}

function mostrarEspecialistas() {
    if (user.rol !== 'admin') {
        alert("Solo el administrador puede ver esta sección.");
        return;
    }
    const main = document.getElementById('mainView');
    main.innerHTML = `<h2>👥 Gestión de Especialistas</h2>`;
    especialistas.forEach(esp => {
        main.innerHTML += `<div class="card-especialista"><h3>${esp.nombre}</h3><p>📞 ${esp.telefono || 'No registrado'}</p><button onclick="alert('Editar especialista no implementado aún')">✏️ Editar</button></div>`;
    });
}

function cambiarVista(vista) {
    if (vista === 'citas') mostrarCitas();
    else if (vista === 'ingresos') mostrarIngresos();
    else if (vista === 'especialistas') mostrarEspecialistas();
}

document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        cambiarVista(link.getAttribute('data-view'));
        document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
    });
});

cambiarVista('citas');
